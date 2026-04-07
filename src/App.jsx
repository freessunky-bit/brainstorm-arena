import { useState, useEffect, createContext, useContext, useCallback, useRef, useMemo, Fragment } from "react";
import ReactDOM from "react-dom";
import L from "leaflet";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";
// import "leaflet/dist/leaflet.css"; // Moved to index.html to avoid build issues

// ─── Module Imports ───
import { LOG } from "./logger.js";
import {
  PROVIDERS, DEFAULT_PERSONAS, MODES, SCAMPER_AXES, PERSONA_HOME_HINT,
  PERSONAS_STORAGE_KEY, SETTINGS_STORAGE_KEY, ONBOARDING_KEY, OB_HINTS,
  HISTORY_STORAGE_KEY, HISTORY_MAX,
  CREDIT_DEFAULT, CREDIT_COSTS, CREDIT_PACKAGES, CREDIT_STORAGE_KEY, MIX_ITEM_H,
  ANTHROPIC_MESSAGES_URL,
  mergePersonasWithDefaults, loadPersonasFromStorage, loadSettings,
  withResolvedApiKey, pickUsablePersona, formatOptionalDirectionFb, safeJsonClone,
  clipTitle, formatHistoryTime, formatIdeaContext, formatTargetForPrompt,
  fisherYatesShuffle,
  loadHistory, persistHistory,
  loadArchive, saveArchive, loadArchiveGroups, saveArchiveGroups,
  loadCredits, saveCredits,
  loadIdeaStack, saveIdeaStack, addToIdeaStack, addLinesToIdeaStack, removeFromIdeaStack,
  loadContextStack, saveContextStack, addToContextStack, removeFromContextStack,
  loadFeedbackStack, saveFeedbackStack, addToFeedbackStack, removeFromFeedbackStack,
  clearBrainstormAppDataForTesting,
  resolveTotPersona, resolveUtilPersona, resolveMixPersona,
  ARCHIVE_KEY, ARCHIVE_GROUPS_KEY,
  COUNTRY_FLAG, COUNTRY_KO, getCountryNameKo,
  REGIONS, GENDERS, AGE_RANGES,
} from "./constants.js";
import {
  callAI, callAIStream, showAppToast, useAppToasts,
  parseDocumentFile, fileToBase64, processImageWithVision,
  extractYouTubeVideoId, extractYouTubeVideoInfo, fetchViaProxy, extractWebArticle, safeParseJsonText,
  generateReportSection, generateReportSectionStream,
  parseIdeasLinesFromText, safeParseIdeasJson, generateTournamentSlotIdeas,
} from "./api.js";
import {
  UTIL_ROLE,
  DNA_MAP_SYSTEM,
  TOURNAMENT_FILL_SYSTEM,
  TOURNAMENT_MATCH_SYSTEM,
  TOT_SYSTEM,
  HYPERNICHE_SYSTEM,
  MIX_WHEEL_SYSTEM,
  MIX_REPORT_SYSTEM,
  MULTI_ANALYSIS_SUFFIX,
  REPORT_ADDON_PROMPTS,
  BRAND_VIRAL_PROMPTS,
  REPORT_CHAT_SYSTEM,
  QUANTUM_SIMULATOR_SYSTEM,
  FACT_CHECK_SYSTEM,
  REFINE_COPILOT_SYSTEM,
  PROTOTYPER_SYNTH_SYSTEM,
  PROTOTYPER_SKINS,
  PROTOTYPER_PROJECT_GUIDE_TEMPLATE,
} from "./prompts.js";
import { STYLES } from "./styles.js";

// ─── 앱 업데이트 시점 (코드 수정 시 반드시 갱신) ───
const LAST_UPDATED = "2026-04-06 16:39 KST";

const MODE_TAGLINES = {
  tournament: [
    "Y Combinator(실리콘밸리 최고 액셀러레이터, Airbnb·Stripe 배출) 배치 선발에서 활용하는 아이디어 검증 토너먼트 방식",
    "Sequoia Capital(세쿼이아, Apple·Google·WhatsApp 초기 투자) 파트너들이 투자 판단 시 사용하는 비교 평가 프레임워크",
    "500 Global(전 세계 2,800개 스타트업 투자) 포트폴리오 기업들이 피봇 결정 시 활용한 아이디어 대결 방법론",
  ],
  tot: [
    "OpenAI(GPT·ChatGPT 개발사) 연구팀이 발표한 Tree of Thoughts 기법 — 복잡한 문제 해결 정확도 74% 향상 달성",
    "Google DeepMind(알파고·제미나이 개발, 세계 최고 AI 연구소)가 추론 성능 향상에 채택한 사고 트리 프레임워크",
    "Princeton·Google Brain 공동 연구 — 기존 Chain-of-Thought 대비 다차원 탐색으로 전략적 의사결정 품질 극대화",
  ],
  analyze: [
    "Andreessen Horowitz(a16z, 실리콘밸리 톱3 VC, Facebook·GitHub 투자) 파트너급 멀티 관점 투자 심사 프레임워크",
    "Sequoia Capital(세쿼이아, 누적 $85B 이상 투자 성과) 딜 미팅에서 사용하는 전문가 패널 교차 검증 방법론",
    "Tiger Global(타이거 글로벌, $95B AUM)·SoftBank Vision Fund가 유니콘 발굴에 활용한 다면 분석 프로세스",
  ],
  devil: [
    "Amazon(세계 1위 이커머스, $1.6T 시가총액) 'Working Backwards' Pre-mortem — 신사업 실패 확률 30%+ 사전 감소",
    "Intel(세계 최대 반도체 기업) 전설적 CEO 앤디 그로브의 'Constructive Confrontation' 의사결정 프레임워크",
    "Bridgewater Associates(세계 최대 헤지펀드, $150B AUM) 레이 달리오의 'Radical Transparency' 극한 검증 문화",
  ],
  scamper: [
    "IDEO(세계 최고 디자인 컨설팅, Apple 최초 마우스 설계) 디자인 씽킹에서 채택한 SCAMPER 혁신 프레임워크",
    "Apple(시가총액 $3T, 세계 1위 기업) 디자인 팀이 iPod→iPhone 진화 과정에서 활용한 체계적 아이디어 확장 기법",
    "P&G(세계 최대 소비재 기업, 연매출 $82B) Innovation Works에서 신제품 기획 시 필수 적용하는 창의 발상법",
  ],
  dna: [
    "BCG Henderson Institute(보스턴컨설팅그룹 전략연구소, Fortune 500 80% 자문) 포트폴리오 DNA 분석 방법론",
    "McKinsey & Company(세계 1위 전략 컨설팅, 연매출 $15B+) 전략 그룹이 블루오션 시장 발굴에 활용",
    "김위찬·르네 마보안 교수 INSEAD 블루오션 전략 — 삼성·닌텐도·시르크뒤솔레이유 등이 적용한 시장 재정의 기법",
  ],
  market: [
    "CB Insights(스타트업 데이터 플랫폼, NASDAQ 상장 기업) 분석 방법론 기반 시장 검증 프레임워크",
    "PitchBook(모닝스타 자회사, VC/PE 데이터 글로벌 1위) 데이터 기반 TAM/SAM/SOM 시장 규모 산출",
    "Gartner(세계 최대 IT 리서치, 연매출 $5.9B) Magic Quadrant 수준의 구조화된 시장 분석 방법론 적용",
  ],
  compete: [
    "Crunchbase(실리콘밸리 기업 데이터베이스, 전 세계 10만+ 투자자 사용) 경쟁 매핑 방법론 적용",
    "Uber(라이드헤일링 세계 1위)·Airbnb(숙박 공유 세계 1위)가 시드 라운드에서 수행한 초기 경쟁 환경 스캔",
    "Porter's Five Forces — 하버드 경영대학원 마이클 포터 교수의 산업 경쟁 구조 분석 프레임워크 적용",
  ],
  refhub: [
    "a16z(실리콘밸리 톱 VC, $35B AUM) 리서치 팀이 투자 판단 전 수행하는 레퍼런스 리서치 방법론",
    "First Round Capital(초기 단계 VC, Uber·Square 초기 투자) 리서치 프로세스 — 커뮤니티·콘텐츠 360도 스캔",
    "Product Hunt(신제품 발견 플랫폼, 월 500만 방문)·Reddit(4억 DAU) 등 글로벌 커뮤니티 인사이트 발굴",
  ],
  hyperniche: [
    "Peter Thiel(PayPal 공동창업, Palantir 창업, $10B+ 투자) 'Zero to One' — 경쟁이 없는 독점 시장을 만드는 초니치 전략",
    "Y Combinator(실리콘밸리 최고 액셀러레이터, 10,000+ 스타트업 심사) 배치에서 '이상하게 좁은 시장'이 대성공하는 패턴 발견",
    "a16z(실리콘밸리 톱 VC, $35B AUM) 'Start with a wedge' — 극도로 좁은 진입점에서 플랫폼으로 확장하는 유니콘 빌딩 전략",
  ],
  mixroulette: [
    "IDEO(세계 최고 디자인 컨설팅, Apple 최초 마우스 설계) 'Creative Collisions' — 이질적 요소의 강제 결합에서 혁신적 아이디어가 탄생하는 원리",
    "MIT Media Lab(미디어 랩) 'Serendipity Engine' — 예측 불가능한 조합이 $1B+ 아이디어를 만든 사례 다수",
    "LEGO Serious Play(레고 시리어스 플레이) — Fortune 500 기업이 전략 수립에 활용하는 강제 결합 창의 워크숍",
  ],
  archive: null,
};

function useMenuOnboarding(menuId) {
  const [visible, setVisible] = useState(() => {
    if (!menuId || !OB_HINTS[menuId]) return false;
    return !localStorage.getItem(ONBOARDING_KEY + menuId);
  });
  const dismiss = useCallback(() => {
    if (!visible) return;
    localStorage.setItem(ONBOARDING_KEY + menuId, "1");
    setVisible(false);
  }, [visible, menuId]);
  return { visible, dismiss };
}

function ObHint({ menuId, onDismiss }) {
  const cfg = OB_HINTS[menuId];
  const [out, setOut] = useState(false);
  const dismissed = useRef(false);

  const go = useCallback(() => {
    if (dismissed.current) return;
    dismissed.current = true;
    setOut(true);
    setTimeout(() => onDismiss(), 420);
  }, [onDismiss]);

  useEffect(() => {
    const t = setTimeout(() => go(), 7000);
    return () => clearTimeout(t);
  }, [go]);

  if (!cfg) return null;

  const words = cfg.text.split(/(\s+)/);
  let di = 0;

  return ReactDOM.createPortal(
    <div className={`ob-toast-backdrop${out ? " ob-out" : ""}`} onClick={go}>
      <div className={`ob-toast${out ? " ob-out" : ""}`} onClick={(e) => { e.stopPropagation(); go(); }}>
        <div className="ob-toast-icon">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="8.5" stroke="#3b82f6" strokeWidth="1.3" fill="rgba(59,130,246,0.08)"/>
            <path d="M10 6v5" stroke="#3b82f6" strokeWidth="1.4" strokeLinecap="round"/>
            <circle cx="10" cy="14" r="0.8" fill="#3b82f6"/>
          </svg>
        </div>
        <div className="ob-toast-text">
          {words.map((w, i) => {
            const d = 0.15 + di * 0.03;
            if (w.trim()) di++;
            return <span key={i} className="ob-word" style={{ animationDelay: `${d}s` }}>{w === " " ? "\u00A0" : w}</span>;
          })}
        </div>
        <button className="ob-toast-close" onClick={(e) => { e.stopPropagation(); go(); }} aria-label="닫기">✕</button>
      </div>
    </div>,
    document.body
  );
}

function ModeTaglineRoller({ lines }) {
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);
  const fadeTimeoutRef = useRef(null);

  useEffect(() => {
    if (lines.length <= 1) return undefined;
    const iv = setInterval(() => {
      setFade(false);
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = setTimeout(() => {
        setIdx((i) => (i + 1) % lines.length);
        setFade(true);
      }, 350);
    }, 6000);
    return () => {
      clearInterval(iv);
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    };
  }, [lines.length]);

  return (
    <div className="mode-tagline" style={{ opacity: fade ? 1 : 0, transition: "opacity 0.35s ease" }}>
      {lines[idx]}
    </div>
  );
}

const QUOTES = [ 
  "\"세상을 바꾸는 건 미친 사람들이다.\" — Steve Jobs",
  "\"실패는 성공의 어머니다.\" — Thomas Edison",
  "\"빠르게 움직이고, 깨뜨려라.\" — Mark Zuckerberg",
  "\"아이디어는 실행 없이는 환상에 불과하다.\" — Peter Drucker",
  "\"고객이 원하는 걸 만들어라.\" — Y Combinator",
  "\"단순함이 궁극의 정교함이다.\" — Leonardo da Vinci",
  "\"미래를 예측하는 최선의 방법은 미래를 만드는 것이다.\" — Alan Kay",
  "\"10배 더 좋지 않으면 시작하지 마라.\" — Peter Thiel",
  "\"완벽한 계획보다 실행이 먼저다.\" — Reid Hoffman",
  "\"혁신은 리더와 추종자를 구분짓는다.\" — Steve Jobs",
  "\"사용자의 문제에 사랑에 빠져라, 해결책이 아니라.\" — Uri Levine",
  "\"모든 대기업도 한때는 스타트업이었다.\" — Jeff Bezos",
  "\"시장이 팀을 이긴다.\" — Marc Andreessen",
  "\"No라고 말할 용기가 핵심이다.\" — Warren Buffett",
  "\"1%의 개선이 모이면 혁신이 된다.\" — James Clear",
  "\"타이밍이 아이디어보다 중요하다.\" — Bill Gross",
  "\"불편함에서 기회가 태어난다.\" — Drew Houston",
  "\"먼저 사람들이 원하는 걸 만들어라.\" — Paul Graham",
  "\"데이터가 의견을 이긴다.\" — W. Edwards Deming",
  "\"좋은 아이디어는 처음엔 나쁜 아이디어처럼 보인다.\" — Paul Graham",
  "\"규모가 작을 때의 장점을 활용하라.\" — Sam Altman",
  "\"경쟁하지 말고, 독점하라.\" — Peter Thiel",
  "\"위대한 제품은 스스로 말한다.\" — Elon Musk",
  "\"문제가 클수록 기회도 크다.\" — Vinod Khosla",
  "\"속도는 전략이다.\" — Jeff Bezos",
  "\"사용자 한 명을 열광시켜라.\" — Paul Buchheit",
  "\"최고의 마케팅은 훌륭한 제품이다.\" — Seth Godin",
  "\"실패를 빠르게, 값싸게 하라.\" — Eric Ries",
  "\"관성은 혁신의 적이다.\" — Clayton Christensen",
  "\"가장 위험한 건 리스크를 안 취하는 것이다.\" — Mark Zuckerberg",
  "\"넓게 퍼지기 전에 깊게 파라.\" — Peter Thiel",
  "\"복잡한 문제에 단순한 해결책을 찾아라.\" — Occam's Razor",
  "\"고객과 대화하라. 답은 거기 있다.\" — Steve Blank",
  "\"기술이 아니라 사람의 문제를 풀어라.\" — IDEO",
  "\"첫 100명의 팬이 100만보다 중요하다.\" — Kevin Kelly",
  "\"자원이 아니라 자원활용력이다.\" — Tony Hsieh",
  "\"제품-시장 핏이 전부다.\" — Marc Andreessen",
  "\"남들이 탐욕스러울 때 두려워하라.\" — Warren Buffett",
  "\"매일 1% 성장하면 1년 뒤 37배가 된다.\" — James Clear",
  "\"사용자는 더 빠른 말을 원했다.\" — Henry Ford",
  "\"될 때까지 된 척 하라.\" — Reid Hoffman",
  "\"지금 출발하기엔 늦지 않았다.\" — 무명",
  "\"큰 생각을 하되, 작게 시작하라.\" — Jeff Bezos",
  "\"차별화가 없으면 가격 경쟁뿐이다.\" — Michael Porter",
  "\"문화가 전략을 아침으로 먹는다.\" — Peter Drucker",
  "\"내일의 유니콘은 오늘의 이단아다.\" — 무명",
  "\"가설을 세우고, 검증하고, 반복하라.\" — Lean Startup",
  "\"10명이 사랑하는 게 100명이 좋아하는 것보다 낫다.\" — Paul Graham",
  "\"네트워크 효과가 진정한 해자다.\" — Reid Hoffman",
  "\"플랫폼을 만들어라, 제품이 아니라.\" — Sangeet Choudary",
  "\"측정할 수 없으면 개선할 수 없다.\" — Peter Drucker",
  "\"나쁜 계획이라도 계획 없는 것보다 낫다.\" — Winston Churchill",
  "\"파괴적 혁신은 하단에서 시작된다.\" — Clayton Christensen",
  "\"스타트업은 반복 가능한 비즈니스 모델을 찾는 조직이다.\" — Steve Blank",
  "\"고객 획득 비용이 평생 가치를 넘으면 죽는다.\" — David Skok",
  "\"하루 만에 만든 것이 1년보다 좋을 수 있다.\" — Naval Ravikant",
  "\"좋은 디자인은 보이지 않는다.\" — Dieter Rams",
  "\"필요는 발명의 어머니다.\" — Plato",
  "\"운은 준비된 자에게 온다.\" — Louis Pasteur",
  "\"처음부터 완벽할 필요 없다. 시작만 하면 된다.\" — 무명",
  "\"생존이 먼저, 성장은 그 다음이다.\" — Andy Grove",
  "\"사용자 경험이 곧 브랜드다.\" — Jakob Nielsen",
  "\"돈을 쫓지 말고, 가치를 쫓아라.\" — Guy Kawasaki",
  "\"시간은 스타트업의 유일한 자산이다.\" — Sam Altman",
  "\"기존 시장을 재정의하라.\" — Blue Ocean Strategy",
  "\"MVP는 부끄러울 정도로 작아야 한다.\" — Reid Hoffman",
  "\"기회비용을 항상 생각하라.\" — Charlie Munger",
  "\"문제의 80%는 20%의 원인에서 온다.\" — Pareto",
  "\"피봇은 실패가 아니라 진화다.\" — Eric Ries",
  "\"세상에서 가장 강력한 힘은 복리다.\" — Albert Einstein",
  "\"무한한 게임에서 이기는 법은 계속 플레이하는 것이다.\" — Simon Sinek",
  "\"모방하되, 더 나은 버전을 만들어라.\" — Sam Walton",
  "\"결정을 미루는 것이 가장 비싼 결정이다.\" — Jeff Bezos",
  "\"아이디어는 1%, 실행이 99%다.\" — Thomas Edison",
  "\"고객의 행동을 바꾸는 것이 가장 어렵다.\" — Nir Eyal",
  "\"당장 돈이 안 되더라도 가치를 만들어라.\" — Brian Chesky",
  "\"기술은 수단이고, 목적은 고객의 삶 개선이다.\" — Tim Cook",
  "\"남들이 안 하는 이유가 있을 수 있다. 하지만 틀릴 수도 있다.\" — Elon Musk",
  "\"질문의 질이 답의 질을 결정한다.\" — Tony Robbins",
  "\"팀이 전부다. 아이디어는 바뀌지만 팀은 남는다.\" — Sequoia Capital",
  "\"습관이 되는 제품을 만들어라.\" — Nir Eyal",
  "\"포기할 이유가 100가지여도 하나의 이유로 충분하다.\" — 무명",
  "\"글로벌 시장을 처음부터 노려라.\" — 무명",
  "\"프로토타입은 천 마디 말보다 낫다.\" — IDEO",
  "\"첫 번째 버전은 당신이 원하는 것의 반도 안 된다. 그래도 출시하라.\" — 무명",
  "\"고통을 해결하는 사업이 쾌락을 주는 사업보다 강하다.\" — 무명",
  "\"오늘 시작하지 않으면 영원히 시작하지 않는다.\" — 무명",
  "\"큰 꿈은 작은 단계로 이루어진다.\" — Lao Tzu",
  "\"반복과 개선이 천재성을 이긴다.\" — Angela Duckworth",
  "\"가장 좋은 시간은 지금이다.\" — 무명",
  "\"비전 없이는 방향이 없다.\" — Simon Sinek",
  "\"리스크를 감수하지 않으면 리턴도 없다.\" — 무명",
  "\"변화를 두려워하지 말고, 변하지 않는 것을 두려워하라.\" — Jeff Bezos",
  "\"단순한 것이 확장 가능한 것이다.\" — Jack Dorsey",
  "\"시장 크기 × 실행력 = 성공 확률\" — 무명",
  "\"건물을 짓기 전에 기초를 다져라.\" — 무명",
  "\"최고의 아이디어는 불만에서 탄생한다.\" — 무명",
  "\"배우기를 멈추면 성장도 멈춘다.\" — 무명",
];

function QuoteRoller() {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * QUOTES.length));
  const [fade, setFade] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const fadeTimeoutRef = useRef(null);

  useEffect(() => {
    const iv = setInterval(() => {
      setFade(false);
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = setTimeout(() => {
        setIdx(Math.floor(Math.random() * QUOTES.length));
        setFade(true);
      }, 400);
    }, 5000);
    return () => {
      clearInterval(iv);
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setShowGuide(true), 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div>
      {showGuide && (
        <div className="bg-task-guide">
          <div className="bg-task-guide-icon-wrap">
            <span className="bg-task-guide-icon">💡</span>
          </div>
          <div>
            <div className="bg-task-guide-title">
              <span className="bg-task-pulse" />
              백그라운드 분석 진행 중
            </div>
            <div className="bg-task-guide-desc">다른 메뉴를 자유롭게 이용하셔도 됩니다. 완료 시 토스트 알림으로 안내해 드릴게요.</div>
          </div>
        </div>
      )}
      <div style={{ textAlign: "center", padding: "12px 16px", fontSize: 12, color: "var(--text-muted)", fontStyle: "italic", lineHeight: 1.6, opacity: fade ? 1 : 0, transition: "opacity 0.4s ease", minHeight: 40, display: "flex", alignItems: "center", justifyContent: "center", letterSpacing: "-0.01em" }}>
        {QUOTES[idx]}
      </div>
    </div>
  );
}

const TargetContext = createContext({ region: "local", gender: "all", age: "전체", localCountry: "", countryCode: "", localGeoReady: false });
function useTarget() { return useContext(TargetContext); }

function TargetBar() {
  const { region, setRegion, gender, setGender, age, setAge, localCountry, countryCode, localGeoReady } = useContext(TargetContext);
  const koName = getCountryNameKo(countryCode, localCountry);
  const localLabel = koName ? `${COUNTRY_FLAG(countryCode)} ${koName}` : (localGeoReady ? "🌐 이 기기 (국가 미확인)" : "🌐 국가 확인 중…");
  return (
    <div className="target-bar">
      <div className="target-chip-group">
        <span className="target-chip-label">마켓</span>
        {REGIONS.map(r => (
          <button key={r.id} type="button" className={`target-chip${region === r.id ? " active" : ""}`}
            onClick={() => setRegion(r.id)}>
            {r.id === "local" ? localLabel : r.label}
          </button>
        ))}
      </div>
      <div className="target-chip-group">
        <span className="target-chip-label">성별</span>
        {GENDERS.map(g => (
          <button key={g.id} type="button" className={`target-chip${gender === g.id ? " active" : ""}`}
            onClick={() => setGender(g.id)}>{g.label}</button>
        ))}
        <select className="target-age-sel" value={age} onChange={e => setAge(e.target.value)}>
          {AGE_RANGES.map(a => <option key={a} value={a}>{a === "전체" ? "연령 전체" : a}</option>)}
        </select>
      </div>
    </div>
  );
}

const ArchiveContext = createContext({ save: () => {} });
function useArchive() { return useContext(ArchiveContext); }

// ─── Viewport / Responsive Hook ───
const ViewportContext = createContext({ isDesktop: false, isMobile: true, width: 375 });
function useViewport() { return useContext(ViewportContext); }
function ViewportProvider({ children }) {
  const [state, setState] = useState(() => {
    const w = typeof window !== "undefined" ? window.innerWidth : 375;
    return { isDesktop: w >= 1024, isMobile: w < 640, width: w };
  });
  useEffect(() => {
    let raf;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const w = window.innerWidth;
        setState(prev => {
          const isDesktop = w >= 1024, isMobile = w < 640;
          if (prev.isDesktop === isDesktop && prev.isMobile === isMobile && prev.width === w) return prev;
          return { isDesktop, isMobile, width: w };
        });
      });
    };
    window.addEventListener("resize", update);
    return () => { window.removeEventListener("resize", update); cancelAnimationFrame(raf); };
  }, []);
  return <ViewportContext.Provider value={state}>{children}</ViewportContext.Provider>;
}

// ─── Addon/FactCheck result cache (persists across views within session) ───
const _addonCache = {};
function setAddonCache(idea, results) { if (idea) _addonCache[idea] = { ...(_addonCache[idea] || {}), ...results }; }
function getAddonCache(idea) { return _addonCache[idea] || {}; }

function SaveToArchiveBtn({ modeId, title, payload }) {
  const { save } = useArchive();
  const meta = MODES.find(m => m.id === modeId);
  const handleSave = () => {
    const idea = payload?.idea || payload?.input || payload?.ideasText || payload?.combined_concept || title || "";
    const cached = getAddonCache(idea);
    const enriched = (cached && Object.keys(cached).length > 0) ? { ...payload, _addons: cached } : payload;
    save({ modeId, modeName: meta?.name || "분석", modeIcon: meta?.icon || "📌", title, payload: enriched });
  };
  return (
    <button type="button" className="idea-stack-btn" style={{ padding: "8px 14px", fontSize: 12, marginTop: 12 }}
      onClick={handleSave}>
      📦 아카이브 저장
    </button>
  );
}

function IdeaInput({ value, onChange, placeholder, style, rows, minHeight, context, onContextChange, personas, globalKey, utilProvider, utilModel, utilApiKey }) {
  const [pop, setPop] = useState(false);
  const [ctxOpen, setCtxOpen] = useState(false);
  const stackCount = loadIdeaStack().length;
  const hasCtx = !!onContextChange;
  return (
    <div className="idea-input-wrap" style={style}>
      <div className="idea-input-toolbar">
        <span className="idea-input-toolbar-meta">{stackCount > 0 ? `${stackCount}개 저장됨` : "아이디어 히스토리"}</span>
        <div style={{ position: "relative" }}>
          <button type="button" className="idea-input-load-btn" onClick={() => setPop(!pop)}>
            불러오기{stackCount > 0 ? <span className="idea-input-load-count">{stackCount}</span> : null}
          </button>
          {pop && <IdeaStackPopover onSelect={t => { onChange(t); setPop(false); }} onClose={() => setPop(false)} personas={personas} globalKey={globalKey} utilProvider={utilProvider} utilModel={utilModel} utilApiKey={utilApiKey} />}
        </div>
      </div>
      <textarea className="idea-input-field" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{ ...(minHeight ? { minHeight } : {}) }} />
      {hasCtx && (
        <div style={{ marginTop: 4 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button type="button" className="idea-context-toggle" onClick={() => setCtxOpen(!ctxOpen)}>
              <span className={`toggle-arrow${ctxOpen ? " open" : ""}`}>▸</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              <span>상황 보강</span>
              {context?.trim() && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-primary)", flexShrink: 0 }} />}
            </button>
            {ctxOpen && <ContextStackBtn onSelect={(t) => { onContextChange(t); }} />}
          </div>
          {ctxOpen && (
            <textarea
              className="idea-context-field"
              value={context || ""}
              onChange={(e) => onContextChange(e.target.value)}
              onBlur={(e) => { if (e.target.value.trim()) addToContextStack(e.target.value); }}
              placeholder="예: 모바일 보드게임에 넣을 이벤트 아이디어야 / B2B SaaS 스타트업 / 20대 여성 타겟 뷰티 서비스..."
              rows={2}
            />
          )}
        </div>
      )}
    </div>
  );
}

const RecordHistoryContext = createContext(null);
function useRecordHistory() { return useContext(RecordHistoryContext); }

const TaskManagerContext = createContext({ startTask: () => {}, completeTask: () => {}, clearTask: () => {} });
function useTaskManager() { return useContext(TaskManagerContext); }
function useTaskNotify(modeId) {
  const { startTask, completeTask } = useTaskManager();
  return {
    notifyStart: () => startTask(modeId),
    notifyDone: (title) => completeTask(modeId, title),
  };
}

const CreditContext = createContext({ credits: CREDIT_DEFAULT, spend: () => true, recharge: () => {} });
function useCredits() { return useContext(CreditContext); }

function CreditBadge({ onClick }) {
  const { credits } = useCredits();
  const formatted = credits >= 10000
    ? `${(credits / 1000).toFixed(2).replace(/\.?0+$/, "")}K`
    : credits >= 1000
      ? `${(credits / 1000).toFixed(1).replace(/\.0$/, "")}K`
      : String(credits);
  return (
    <button type="button" className="credit-badge" onClick={onClick} title="크레딧 충전">
      <svg className="credit-diamond" width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M6 3h12l5 8-11 12L1 11z" fill="url(#cg)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
        <path d="M1 11h22M6 3l6 20M18 3l-6 20M6 3l5 8M18 3l-5 8" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" />
        <defs><linearGradient id="cg" x1="0" y1="0" x2="24" y2="24"><stop offset="0%" stopColor="#60a5fa" /><stop offset="50%" stopColor="#a78bfa" /><stop offset="100%" stopColor="#c084fc" /></linearGradient></defs>
      </svg>
      <span className="credit-count">{formatted}</span>
    </button>
  );
}

function CreditCostTag({ costKey }) {
  const info = CREDIT_COSTS[costKey];
  if (!info) return null;
  return <span className="credit-cost-tag">💎 {info.cost}</span>;
}

function CreditChargeModal({ onClose, onCharge }) {
  const { credits } = useCredits();
  const [charged, setCharged] = useState(null);
  const handleCharge = (pkg) => {
    const total = pkg.credits + (pkg.bonus || 0);
    onCharge(total);
    setCharged(pkg.id);
    setTimeout(() => setCharged(null), 2000);
  };
  return (
    <div className="credit-modal-overlay" onClick={onClose}>
      <div className="credit-modal" onClick={e => e.stopPropagation()}>
        <div className="cm-head">
          <div className="cm-head-title">크레딧 충전</div>
          <button type="button" className="cm-head-close" onClick={onClose}>✕</button>
        </div>

        <div className="cm-balance">
          <div className="cm-bal-diamond">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M6 3h12l5 8-11 12L1 11z" fill="url(#cbd)" />
              <path d="M1 11h22M6 3l6 20M18 3l-6 20" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" />
              <defs><linearGradient id="cbd" x1="0" y1="0" x2="24" y2="24"><stop offset="0%" stopColor="#93c5fd" /><stop offset="100%" stopColor="#a78bfa" /></linearGradient></defs>
            </svg>
          </div>
          <div className="cm-bal-info">
            <div className="cm-bal-label">현재 잔액</div>
            <div className="cm-bal-amount">{credits.toLocaleString()}</div>
            <div className="cm-bal-usd">≈ ${(credits / 100).toFixed(2)} USD</div>
          </div>
        </div>

        <div className="cm-section-title">패키지 선택</div>
        <div className="cm-grid">
          {CREDIT_PACKAGES.map(pkg => (
            <div key={pkg.id} className={`cm-card${pkg.hot ? " hot" : ""}${charged === pkg.id ? " charged" : ""}`}>
              {pkg.hot && <span className="cm-card-hot-tag">BEST</span>}
              <div className="cm-card-diamond">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M6 3h12l5 8-11 12L1 11z" fill="url(#cd)" />
                  <defs><linearGradient id="cd" x1="0" y1="0" x2="24" y2="24"><stop offset="0%" stopColor="#60a5fa" /><stop offset="100%" stopColor="#818cf8" /></linearGradient></defs>
                </svg>
                <span className="cm-card-credits">{pkg.credits.toLocaleString()}</span>
              </div>
              {pkg.bonus > 0 ? (
                <div className="cm-card-bonus">+{pkg.bonus.toLocaleString()} bonus</div>
              ) : (
                <div className="cm-card-bonus" style={{ visibility: "hidden" }}>-</div>
              )}
              <div className="cm-card-bottom">
                <span className="cm-card-price">{pkg.price}</span>
                <button type="button" className="cm-card-buy" onClick={() => handleCharge(pkg)}>
                  {charged === pkg.id ? "✓" : "충전"}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="cm-footer-bar">
          <div className="cm-footer-txt">충전 즉시 잔액에 반영 · 모든 AI 기능에 사용 가능</div>
        </div>
      </div>
    </div>
  );
}

function RichText({ text }) {
  if (!text) return null;
  return (
    <div style={{ fontSize: 14, lineHeight: 1.75, letterSpacing: "-0.02em", color: "var(--text-secondary)" }}>
      {text.split("\n").map((line, i) => {
        if (line.startsWith("### ")) return <h4 key={i} style={{ color: "var(--text-primary)", margin: "16px 0 6px", fontSize: 14, fontWeight: 700 }}>{line.slice(4)}</h4>;
        if (line.startsWith("## ")) return <h3 key={i} style={{ color: "var(--text-primary)", margin: "18px 0 8px", fontSize: 16, fontWeight: 800, letterSpacing: "-0.03em" }}>{line.slice(3)}</h3>;
        if (line.startsWith("# ")) return <h2 key={i} style={{ color: "var(--text-primary)", margin: "20px 0 10px", fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em" }}>{line.slice(2)}</h2>;
        if (line.startsWith("- ") || line.startsWith("* ")) return <div key={i} style={{ paddingLeft: 14, margin: "3px 0", position: "relative" }}><span style={{ position: "absolute", left: 0, color: "var(--text-muted)" }}>·</span>{rndr(line.slice(2))}</div>;
        if (/^\d+\.\s/.test(line)) return <div key={i} style={{ paddingLeft: 18, margin: "3px 0" }}>{rndr(line)}</div>;
        if (line.trim() === "") return <div key={i} style={{ height: 6 }} />;
        return <p key={i} style={{ margin: "3px 0" }}>{rndr(line)}</p>;
      })}
    </div>
  );
}
function rndr(t) {
  return t.split(/(\*\*[^*]+\*\*)/).map((s, i) =>
    s.startsWith("**") && s.endsWith("**") ? <strong key={i} style={{ color: "var(--text-primary)", fontWeight: 600 }}>{s.slice(2, -2)}</strong> : s
  );
}

// maxHeight: "card" min(520,60vh) | "synth" min(600,60vh) | "compact" min(360,48vh) | "addon" 없음(부모가 관리) | "chat" min(320,42vh) | "tot" min(540,60vh)
const STREAM_HEIGHTS = { card: "min(520px, 60vh)", synth: "min(600px, 60vh)", compact: "min(360px, 48vh)", chat: "min(320px, 42vh)", tot: "min(540px, 60vh)" };

function StreamingRichText({ text, isStreaming, variant = "card" }) {
  const scrollRef = useRef(null);
  const userScrolledRef = useRef(false);

  useEffect(() => {
    if (!isStreaming) { userScrolledRef.current = false; return; }
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 56;
      userScrolledRef.current = !atBottom;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [isStreaming]);

  useEffect(() => {
    if (!isStreaming || userScrolledRef.current) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [text, isStreaming]);

  if (!text) return null;

  const maxPx = STREAM_HEIGHTS[variant];
  const scrollStyle = maxPx ? {
    maxHeight: maxPx,
    overflowY: "auto",
    overflowX: "hidden",
    scrollbarWidth: "thin",
    scrollbarColor: "rgba(0,0,0,0.10) transparent",
    paddingRight: 6,
  } : {};

  const lines = text.split("\n");
  const content = lines.map((line, i) => {
    const isLast = i === lines.length - 1;
    const cursor = isStreaming && isLast ? <span className="stream-cursor" /> : null;
    if (line.startsWith("### ")) return <h4 key={i} className="srt-h4">{rndr(line.slice(4))}{cursor}</h4>;
    if (line.startsWith("## ")) return <h3 key={i} className="srt-h3">{rndr(line.slice(3))}{cursor}</h3>;
    if (line.startsWith("# ")) return <h2 key={i} className="srt-h2">{rndr(line.slice(2))}{cursor}</h2>;
    if (line.startsWith("- ") || line.startsWith("* ")) return <div key={i} className="s-list-item"><span className="s-list-dot">·</span>{rndr(line.slice(2))}{cursor}</div>;
    if (/^\d+\.\s/.test(line)) return <div key={i} className="s-ol-item">{rndr(line)}{cursor}</div>;
    if (line.trim() === "") return <div key={i} className="s-spacer" />;
    return <p key={i} className="srt-p">{rndr(line)}{cursor}</p>;
  });

  return (
    <div ref={scrollRef} className="srt-scroll" style={scrollStyle}>
      <div className="streaming-richtext">{content}</div>
    </div>
  );
}

function HistoryDetailBody({ entry, personas }) {
  const { modeId, payload } = entry;
  const resolvePersona = (id) => payload.personaLabels?.find((x) => x.id === id) || personas.find((p) => p.id === id);

  if (modeId === "analyze") {
    const { idea, fb, results = {}, synthesis } = payload;
    return (
      <div>
        <div className="s-label">아이디어</div>
        <div className="r-card" style={{ marginBottom: 14 }}><RichText text={idea || ""} /></div>
        {fb ? (<><div className="s-label">원하는 피드백 방향</div><div className="r-card" style={{ marginBottom: 14 }}><RichText text={fb} /></div></>) : null}
        {Object.entries(results).map(([id, result]) => {
          const p = resolvePersona(id) || { name: id, icon: "📌", provider: "claude", model: "" };
          const pc = PROVIDERS[p.provider]?.color || "#888";
          return (
            <div className="r-card" key={id}>
              <div className="r-card-header">
                <span className="r-card-icon">{p.icon}</span>
                <span className="r-card-title">{p.name}</span>
                <span className="r-card-badge" style={{ background: `${pc}10`, color: pc, border: `1px solid ${pc}20` }}>{PROVIDERS[p.provider]?.name} · {p.model}</span>
              </div>
              {String(result).startsWith("오류:") ? <div className="err-msg">{result}</div> : <RichText text={result} />}
            </div>
          );
        })}
        {synthesis ? (<div className="synth-card"><h3>종합 분석 리포트</h3><RichText text={synthesis} /></div>) : null}
        {payload.deepSteps?.length > 0 && (<>
          <div className="s-label" style={{ marginTop: 16 }}>심화 분석</div>
          {payload.deepSteps.map((r, i) => (
            <div className="r-card" key={`ds-${i}`} style={{ marginTop: 10, borderLeft: `3px solid ${["#7c3aed", "#dc2626", "#059669", "#3182f6"][i] || "var(--accent-primary)"}` }}>
              <div className="r-card-header">
                <span className="r-card-icon">{r.icon}</span>
                <span className="r-card-title">{r.name}</span>
                <span className="r-card-badge" style={{ background: "rgba(124,58,237,0.08)", color: "#7c3aed", border: "1px solid rgba(124,58,237,0.15)", fontSize: 10 }}>심화</span>
              </div>
              {String(r.content).startsWith("오류:") ? <div className="err-msg">{r.content}</div> : <RichText text={r.content} />}
            </div>
          ))}
        </>)}
      </div>
    );
  }

  if (modeId === "tot") {
    const { idea, context: totCtx, branches = [], evaluation: ev, solution } = payload;
    const totDims = ["시장성", "실현가능성", "혁신성", "리스크", "임팩트"];
    return (
      <div>
        <div className="s-label">아이디어</div>
        <div className="r-card" style={{ marginBottom: 14 }}><RichText text={idea || ""} /></div>
        {totCtx && (<><div className="s-label">원하는 피드백 방향</div><div className="r-card" style={{ marginBottom: 14 }}><RichText text={totCtx} /></div></>)}
        {branches.length > 0 && (<>
          <div className="s-label">사고 방향 ({branches.length}개)</div>
          {branches.map(b => {
            const sc = ev?.scores?.find(s => s.id === b.id);
            const isWin = b.id === ev?.winner;
            return (
              <div key={b.id} className="r-card" style={{ marginBottom: 8, borderLeft: `3px solid ${isWin ? "var(--accent-success)" : "var(--accent-warning)"}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <span style={{ fontWeight: 800, fontSize: 12, color: isWin ? "var(--accent-success)" : "var(--text-muted)" }}>Branch {b.id}</span>
                  {isWin && <span style={{ fontSize: 10, fontWeight: 800, color: "var(--accent-success)", background: "rgba(5,150,105,0.08)", padding: "2px 6px", borderRadius: 5 }}>WINNER</span>}
                  {!isWin && <span style={{ fontSize: 10, fontWeight: 700, color: "var(--accent-warning)", background: "rgba(217,119,6,0.08)", padding: "2px 6px", borderRadius: 5 }}>PRUNED</span>}
                </div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{b.title}</div>
                <div style={{ fontSize: 12, color: "var(--accent-primary)", fontWeight: 600, marginBottom: 6 }}>{b.angle}</div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 6 }}>{b.reasoning}</div>
                {sc && <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{totDims.map(d => <span key={d} style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 5, background: "var(--bg-surface-2)", color: "var(--text-muted)" }}>{d} {sc[d] || 0}</span>)}<span style={{ fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 5, background: isWin ? "rgba(5,150,105,0.08)" : "var(--bg-surface-2)", color: isWin ? "var(--accent-success)" : "var(--text-muted)" }}>총 {sc.total || 0}</span></div>}
              </div>
            );
          })}
        </>)}
        {ev?.reasoning && (
          <div style={{ margin: "12px 0", padding: "12px 14px", background: "var(--bg-surface-2)", borderRadius: 10, borderLeft: "3px solid var(--accent-primary)", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            <div style={{ fontWeight: 700, color: "var(--accent-primary)", fontSize: 11, marginBottom: 4 }}>선택 근거</div>
            {ev.reasoning}
          </div>
        )}
        {ev?.pruned?.length > 0 && (<>
          <div className="s-label" style={{ marginTop: 12 }}>가지치기 사유</div>
          {ev.pruned.map(pr => {
            const b = branches.find(x => x.id === pr.id);
            return (
              <div key={pr.id} className="tot-pruned-reason" style={{ marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: "var(--text-secondary)", marginBottom: 4, fontStyle: "normal" }}>Branch {pr.id}: {b?.title || ""}</div>
                {pr.reason}
              </div>
            );
          })}
        </>)}
        {solution && (<div className="synth-card" style={{ marginTop: 14 }}><h3>🎯 최적 솔루션</h3><RichText text={solution} /></div>)}
      </div>
    );
  }

  if (modeId === "tournament") {
    const { ctx, fb, seedIdeas = [], aiIdeas = [], rounds = [], finalTop = [], finalReport } = payload;
    const medals = ["🥇", "🥈", "🥉"];
    const [expandedHistMatch, setExpandedHistMatch] = useState(null);
    const toggleHistMatch = (key) => setExpandedHistMatch((prev) => (prev === key ? null : key));
    const histDims = ["시장성", "실현가능성", "수익모델", "차별화", "임팩트"];
    const rc_ = ["#6b7280", "#3182f6", "#7c3aed", "#d97706", "#dc2626"];
    return (
      <div>
        {ctx ? (<><div className="s-label">컨텍스트</div><div className="r-card" style={{ marginBottom: 14 }}>{ctx}</div></>) : null}
        {fb ? (<><div className="s-label">원하는 피드백 방향</div><div className="r-card" style={{ marginBottom: 14 }}><RichText text={fb} /></div></>) : null}
        {seedIdeas.length > 0 && (<><div className="s-label">시작 아이디어 ({seedIdeas.length}개)</div><div className="r-card" style={{ marginBottom: 14 }}>{seedIdeas.map((x, i) => <div key={i} style={{ fontSize: 13, padding: "3px 0", color: "var(--text-secondary)" }}><span style={{ fontWeight: 700, color: "var(--text-muted)", fontSize: 11, marginRight: 6 }}>#{String(i + 1).padStart(2, "0")}</span>{x}</div>)}</div></>)}
        {aiIdeas.length > 0 && (<><div className="s-label">AI 보충 ({aiIdeas.length}개)</div><div className="r-card" style={{ marginBottom: 14 }}>{aiIdeas.map((t, i) => <div key={i} style={{ fontSize: 13, padding: "3px 0", color: "#7c3aed" }}><span style={{ fontWeight: 700, fontSize: 11, marginRight: 6 }}>AI</span>{t}</div>)}</div></>)}
        {rounds.length > 0 && (<>
          <div className="s-label">라운드별 대진 · 판정</div>
          {rounds.map((round, ri) => {
            const roundColor = rc_[ri] || "#3182f6";
            return (
              <div key={ri} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: roundColor, marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: roundColor, display: "inline-block" }} />
                  {round.name}
                </div>
                {round.matches.map((m, mi) => {
                  const mKey = `${ri}-${mi}`;
                  const isOpen = expandedHistMatch === mKey;
                  const sa = m.scores?.A, sb = m.scores?.B;
                  const tA = sa ? histDims.reduce((s, d) => s + (sa[d] || 0), 0) : 0;
                  const tB = sb ? histDims.reduce((s, d) => s + (sb[d] || 0), 0) : 0;
                  return (
                    <div key={mi} style={{ background: "var(--bg-surface-2)", border: "1px solid var(--glass-border)", borderRadius: 10, marginBottom: 6, overflow: "hidden" }}>
                      <button type="button" onClick={() => toggleHistMatch(mKey)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 0, padding: 0, border: "none", background: "transparent", cursor: "pointer", fontFamily: "var(--font-sans)", textAlign: "left" }}>
                        <div style={{ width: 3, alignSelf: "stretch", flexShrink: 0, background: m.winner === m.a ? "var(--accent-success)" : roundColor, borderRadius: "10px 0 0 10px" }} />
                        <div style={{ flex: 1, padding: "10px 12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                            <span style={{ fontSize: 12, fontWeight: m.winner === m.a ? 800 : 400, color: m.winner === m.a ? "var(--accent-success)" : "var(--text-primary)", letterSpacing: "-0.02em" }}>{m.a}</span>
                            {tA > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: m.winner === m.a ? "var(--accent-success)" : "var(--text-muted)" }}>{tA}pt</span>}
                            {m.winner === m.a && <span style={{ fontSize: 9, background: "rgba(5,150,105,0.12)", color: "var(--accent-success)", padding: "1px 5px", borderRadius: 5, fontWeight: 800 }}>WIN</span>}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 12, fontWeight: m.winner === m.b ? 800 : 400, color: m.winner === m.b ? "var(--accent-success)" : "var(--text-primary)", letterSpacing: "-0.02em" }}>{m.b}</span>
                            {tB > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: m.winner === m.b ? "var(--accent-success)" : "var(--text-muted)" }}>{tB}pt</span>}
                            {m.winner === m.b && <span style={{ fontSize: 9, background: "rgba(5,150,105,0.12)", color: "var(--accent-success)", padding: "1px 5px", borderRadius: 5, fontWeight: 800 }}>WIN</span>}
                          </div>
                        </div>
                        <span style={{ fontSize: 12, color: "var(--text-muted)", paddingRight: 12, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
                      </button>
                      {isOpen && (
                        <div style={{ padding: "0 12px 12px", borderTop: "1px solid var(--glass-border)" }}>
                          {sa && sb && (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4, margin: "10px 0 8px" }}>
                              {histDims.map((d) => {
                                const va = sa[d] || 0, vb = sb[d] || 0;
                                return (
                                  <div key={d} style={{ textAlign: "center" }}>
                                    <div style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 600, marginBottom: 3 }}>{d}</div>
                                    <div style={{ display: "flex", justifyContent: "center", gap: 3 }}>
                                      <span style={{ fontSize: 10, fontWeight: 700, color: va >= vb ? "var(--accent-success)" : "var(--text-muted)" }}>{va}</span>
                                      <span style={{ fontSize: 9, color: "var(--text-muted)" }}>:</span>
                                      <span style={{ fontSize: 10, fontWeight: 700, color: vb >= va ? "var(--accent-success)" : "var(--text-muted)" }}>{vb}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          <div style={{ padding: "8px 10px", background: "var(--bg-surface-1)", borderRadius: 8, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, borderLeft: `3px solid ${roundColor}` }}>
                            <div style={{ fontWeight: 700, color: roundColor, fontSize: 10, marginBottom: 3 }}>판정 근거</div>
                            {m.reason || "AI 판정"}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </>)}
        {finalTop.length > 0 && (<><div className="s-label">최종 순위</div>{finalTop.map((txt, i) => (<div className="final-rank" key={i}><span className="rank-medal">{medals[i] || "🏅"}</span><div><span className="rank-title">{txt}</span></div></div>))}</>)}
        {finalReport ? (<div className="synth-card" style={{ marginTop: 14 }}><h3>AI 최종 분석</h3><RichText text={finalReport} /></div>) : null}
      </div>
    );
  }

  if (modeId === "devil") {
    const { idea, fb, result } = payload;
    return (
      <div>
        <div className="s-label">아이디어</div>
        <div className="r-card" style={{ marginBottom: 14 }}><RichText text={idea || ""} /></div>
        {fb ? (<><div className="s-label">원하는 피드백 방향</div><div className="r-card" style={{ marginBottom: 14 }}><RichText text={fb} /></div></>) : null}
        <div className="r-card" style={{ borderLeft: "3px solid var(--accent-error)" }}><div className="r-card-header"><span className="r-card-icon">💀</span><span className="r-card-title">Pre-mortem</span></div>{String(result).startsWith("오류:") ? <div className="err-msg">{result}</div> : <RichText text={result} />}</div>
      </div>
    );
  }

  if (modeId === "scamper") {
    const { idea, fb, results = {} } = payload;
    const scamperAxColors = ["#3182f6", "#7c3aed", "#059669", "#d97706", "#ec4899", "#dc2626", "#0891b2"];
    const scamperHeader = (
      <>
        <div className="s-label">원본 아이디어</div>
        <div className="r-card" style={{ marginBottom: 14 }}><RichText text={idea || ""} /></div>
        {fb ? (<><div className="s-label">원하는 피드백 방향</div><div className="r-card" style={{ marginBottom: 14 }}><RichText text={fb} /></div></>) : null}
      </>
    );
    if (results.__full) {
      return (
        <div>
          {scamperHeader}
          <div className="r-card" style={{ borderLeft: "4px solid var(--accent-primary)" }}><div className="r-card-header"><span className="r-card-icon">💡</span><span className="r-card-title">SCAMPER 전체 응답</span></div><RichText text={results.__full} /></div>
        </div>
      );
    }
    return (
      <div>
        {scamperHeader}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <span style={{ fontSize: 22 }}>💡</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>SCAMPER 확장 결과</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>7개 혁신 축 × 실전 비즈니스 전략</div>
          </div>
        </div>
        {SCAMPER_AXES.map((a, idx) => {
          const c = scamperAxColors[idx];
          const text = results[a.key] || "";
          if (!text.trim()) return null;
          return (
            <div key={a.key} className="r-card" style={{ marginBottom: 14, borderLeft: `4px solid ${c}`, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, right: 0, width: 90, height: 90, background: `radial-gradient(circle at 100% 0%, ${c}10, transparent 70%)`, pointerEvents: "none" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{ width: 36, height: 36, borderRadius: 10, background: `${c}12`, border: `1px solid ${c}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{a.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#fff", background: c, padding: "2px 10px", borderRadius: 8, letterSpacing: "0.03em" }}>{a.key}</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>{a.name}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{a.desc}</div>
                </div>
              </div>
              <div style={{ padding: "12px 14px", borderRadius: 10, background: "var(--bg-surface-2)", border: "1px solid var(--glass-border)" }}>
                <RichText text={text} />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (modeId === "dna") {
    const { ideasText, fb, analysis } = payload;
    const cc = ["#3182f6", "#f59e0b", "#7c3aed", "#059669", "#dc2626", "#ec4899"];
    if (!analysis) return <p style={{ color: "var(--text-muted)" }}>데이터 없음</p>;
    if (analysis.error) return <div className="err-msg">오류: {analysis.error}</div>;
    if (analysis.text) {
      return (
        <div>
          <div className="s-label">입력 목록</div>
          <div className="r-card" style={{ marginBottom: 14 }}><RichText text={ideasText || ""} /></div>
          {fb ? (<><div className="s-label">원하는 피드백 방향</div><div className="r-card" style={{ marginBottom: 14 }}><RichText text={fb} /></div></>) : null}
          <div className="r-card"><RichText text={analysis.text} /></div>
        </div>
      );
    }
    return (
      <div>
        <div className="s-label">입력 목록</div>
        <div className="r-card" style={{ marginBottom: 16 }}><RichText text={ideasText || ""} /></div>
        {fb ? (<><div className="s-label">원하는 피드백 방향</div><div className="r-card" style={{ marginBottom: 14 }}><RichText text={fb} /></div></>) : null}
        <div className="s-label">클러스터</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
          {analysis.clusters?.map((cl, ci) => (
            <div key={ci} style={{ background: `${cl.color || cc[ci]}08`, border: `1px solid ${cl.color || cc[ci]}20`, borderRadius: 10, padding: 16, flex: "1 1 240px", minWidth: 180 }}>
              <div style={{ fontWeight: 800, marginBottom: 6, fontSize: 14, color: cl.color || cc[ci] }}>{cl.name}</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>{cl.keywords?.map((kw, ki) => <span key={ki} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: `${cl.color || cc[ci]}15`, color: cl.color || cc[ci] }}>#{kw}</span>)}</div>
              {cl.ideas?.map((x, ii) => <div key={ii} style={{ fontSize: 13, padding: "3px 0" }}>· {x}</div>)}
            </div>
          ))}
        </div>
        {analysis.blueOceans?.length > 0 && (<><div className="s-label">블루오션</div>{analysis.blueOceans.map((bo, i) => (<div className="r-card" key={i} style={{ borderLeft: "3px solid var(--accent-primary)" }}><div style={{ fontWeight: 700, color: "var(--accent-primary)", marginBottom: 4 }}>{bo.area}</div><div style={{ marginBottom: 4 }}>💡 {bo.suggestion}</div><div style={{ fontSize: 12, color: "var(--text-muted)" }}>{bo.reason}</div></div>))}</>)}
        {analysis.synergies?.length > 0 && (<><div className="s-label" style={{ marginTop: 12 }}>시너지</div>{analysis.synergies.map((syn, i) => (<div className="synth-card" key={i} style={{ marginBottom: 8 }}><div style={{ fontWeight: 700, marginBottom: 6 }}>→ {syn.combined}</div><div style={{ fontSize: 13 }}>{syn.power}</div></div>))}</>)}
      </div>
    );
  }

  if (modeId === "market") {
    const { idea, fb, result } = payload;
    return (
      <div>
        <div className="s-label">아이디어</div>
        <div className="r-card" style={{ marginBottom: 14 }}><RichText text={idea || ""} /></div>
        {fb ? (<><div className="s-label">원하는 피드백 방향</div><div className="r-card" style={{ marginBottom: 14 }}><RichText text={fb} /></div></>) : null}
        <div className="r-card" style={{ borderLeft: "3px solid var(--accent-success)" }}><div className="r-card-header"><span className="r-card-icon">🔍</span><span className="r-card-title">시장 검증</span></div>{String(result).startsWith("오류:") ? <div className="err-msg">{result}</div> : <RichText text={result} />}</div>
      </div>
    );
  }

  if (modeId === "compete") {
    const { idea, fb, result } = payload;
    return (
      <div>
        <div className="s-label">아이디어</div>
        <div className="r-card" style={{ marginBottom: 14 }}><RichText text={idea || ""} /></div>
        {fb ? (<><div className="s-label">원하는 피드백 방향</div><div className="r-card" style={{ marginBottom: 14 }}><RichText text={fb} /></div></>) : null}
        <div className="r-card" style={{ borderLeft: "3px solid #f59e0b" }}><div className="r-card-header"><span className="r-card-icon">🎯</span><span className="r-card-title">경쟁 환경 분석</span></div>{String(result).startsWith("오류:") ? <div className="err-msg">{result}</div> : <RichText text={result} />}</div>
      </div>
    );
  }

  if (modeId === "refhub") {
    const { idea, fb, results: refs = [] } = payload;
    const catIcons = { website: "🌐", community: "💬", youtube: "🎬", research: "📊" };
    return (
      <div>
        <div className="s-label">아이디어</div>
        <div className="r-card" style={{ marginBottom: 14 }}><RichText text={idea || ""} /></div>
        {fb ? (<><div className="s-label">원하는 피드백 방향</div><div className="r-card" style={{ marginBottom: 14 }}><RichText text={fb} /></div></>) : null}
        <div className="s-label">레퍼런스 ({refs.length}개)</div>
        {refs.map((r, i) => (
          <div className="r-card" key={i} style={{ marginBottom: 6, cursor: r.url ? "pointer" : "default" }} onClick={() => r.url && window.open(r.url, "_blank")}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{catIcons[r.category] || "📌"} {r.title}</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>{r.desc}</div>
            {r.url && <div style={{ fontSize: 11, color: "var(--accent-primary)", marginTop: 4 }}>{r.url}</div>}
          </div>
        ))}
      </div>
    );
  }

  if (modeId === "hyperniche") {
    const { input, fb, ideas: hIdeas = [], rawFallback } = payload;
    const hColors = ["#a855f7", "#ec4899", "#f59e0b"];
    return (
      <div>
        <div className="s-label">관심 산업 / 방향</div>
        <div className="r-card" style={{ marginBottom: 14 }}><RichText text={input || ""} /></div>
        {fb ? (<><div className="s-label">원하는 피드백 방향</div><div className="r-card" style={{ marginBottom: 14 }}><RichText text={fb} /></div></>) : null}
        {hIdeas && hIdeas.length > 0 && hIdeas.map((idea, idx) => {
          const c = hColors[idx % hColors.length];
          return (
            <div className="r-card" key={idx} style={{ marginBottom: 14, borderLeft: `4px solid ${c}` }}>
              <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 8, color: "var(--text-primary)" }}>🦄 {idea.idea_name}</div>
              <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8, padding: "3px 10px", display: "inline-block", borderRadius: 8, background: `${c}10`, color: c }}>🎯 {idea.micro_target}</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 10 }}>{idea.concept_description}</div>
              <div style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(168,85,247,0.04)", marginBottom: 6 }}><span style={{ fontSize: 10, fontWeight: 800, color: "#a855f7" }}>🏰 해자: </span><span style={{ fontSize: 12, fontWeight: 600 }}>{idea.moat_strategy}</span></div>
              <div style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(236,72,153,0.04)", marginBottom: 6 }}><span style={{ fontSize: 10, fontWeight: 800, color: "#ec4899" }}>🔥 미친 포인트: </span><span style={{ fontSize: 12, fontWeight: 600 }}>{idea.virality_factor}</span></div>
              <div style={{ padding: "10px 12px", borderRadius: 8, background: "var(--bg-surface-2)" }}><span style={{ fontSize: 10, fontWeight: 800, color: "var(--accent-success)" }}>🚀 MVP: </span><span style={{ fontSize: 12 }}>{idea.first_step}</span></div>
            </div>
          );
        })}
        {rawFallback && <div className="r-card"><RichText text={rawFallback} /></div>}
      </div>
    );
  }

  if (modeId === "prototyper") {
    const { idea, skinKey, skinName, result, sourceTitle } = payload;
    return (
      <div>
        {sourceTitle && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, padding: "10px 14px", background: "rgba(99,102,241,0.06)", borderRadius: 10, border: "1px solid rgba(99,102,241,0.12)" }}>
            <span style={{ fontSize: 14 }}>📦</span>
            <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>원본 아카이브: <strong style={{ color: "var(--text-primary)" }}>{sourceTitle}</strong></span>
          </div>
        )}
        <div className="s-label">아이디어</div>
        <div className="r-card" style={{ marginBottom: 14 }}><RichText text={idea || ""} /></div>
        <div className="r-card" style={{ borderLeft: "4px solid #6366f1", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, background: "radial-gradient(circle at 100% 0%, rgba(99,102,241,0.08), transparent 70%)", pointerEvents: "none" }} />
          <div className="r-card-header">
            <span className="r-card-icon">✨</span>
            <span className="r-card-title">웹앱 마스터 프롬프트</span>
            {skinName && <span className="r-card-badge" style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.2)" }}>📐 {skinName}</span>}
          </div>
          <div style={{ padding: "12px 14px", borderRadius: 10, background: "var(--bg-surface-2)", border: "1px solid var(--glass-border)" }}>
            <RichText text={result || ""} />
          </div>
        </div>
      </div>
    );
  }

  if (modeId === "pipeline") {
    const { idea, results: steps = [] } = payload;
    return (
      <div>
        <div className="s-label">아이디어</div>
        <div className="r-card" style={{ marginBottom: 16 }}><RichText text={idea || ""} /></div>
        {steps.map((r, i) => (
          <div className="r-card" key={i} style={{ marginTop: 12 }}>
            <div className="r-card-header"><span className="r-card-icon">{r.icon}</span><span className="r-card-title">Step {r.step + 1}. {r.name}</span></div>
            {String(r.content).startsWith("오류:") ? <div className="err-msg">{r.content}</div> : <RichText text={r.content} />}
          </div>
        ))}
      </div>
    );
  }

  if (modeId === "mixroulette") {
    const { leftItems: mLefts = [], selectedLeft: mSL, selectedRight: mSR, report: mRep } = payload;
    return (
      <div>
        <div className="s-label">아이디어 파츠</div>
        <div className="r-card" style={{ marginBottom: 14 }}>
          {mLefts.map((item, i) => <div key={i} style={{ fontSize: 13, padding: "3px 0", color: "var(--text-secondary)" }}><span style={{ fontWeight: 700, color: "var(--text-muted)", fontSize: 11, marginRight: 6 }}>#{i + 1}</span>{item}</div>)}
        </div>
        {mSL && mSR && (
          <div className="mix-match-display" style={{ marginBottom: 14 }}>
            <div className="mix-match-left">{mSL}</div>
            <span className="mix-match-x">×</span>
            <div className="mix-match-right">{mSR}</div>
          </div>
        )}
        {mRep && (
          <>
            <div className="r-card" style={{ marginBottom: 10, borderLeft: "3px solid #f59e0b" }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#f59e0b", marginBottom: 6, letterSpacing: "0.04em" }}>💡 결합 컨셉</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>{mRep.combined_concept}</div>
            </div>
            <div className="r-card" style={{ marginBottom: 10, borderLeft: "3px solid var(--accent-primary)" }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "var(--accent-primary)", marginBottom: 6 }}>🎯 가치 제안</div>
              <RichText text={mRep.value_proposition || ""} />
            </div>
            <div className="r-card" style={{ borderLeft: "3px solid var(--accent-success)" }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "var(--accent-success)", marginBottom: 6 }}>🚀 실행 전략</div>
              <RichText text={mRep.execution_strategy || ""} />
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="r-card">
      <pre style={{ fontSize: 12, overflow: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{JSON.stringify(payload, null, 2)}</pre>
    </div>
  );
}

function SavedAddonsDisplay({ payload }) {
  const addons = payload?._addons;
  if (!addons || typeof addons !== "object" || Object.keys(addons).length === 0) return null;
  const addonMeta = {};
  (typeof REPORT_ADDONS !== "undefined" ? REPORT_ADDONS : []).forEach(a => { addonMeta[a.key] = a; });
  return (
    <div style={{ marginTop: 16 }}>
      <div className="s-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 12 }}>📎</span> 저장된 추가 분석 결과
      </div>
      {Object.entries(addons).map(([key, text]) => {
        if (!text || typeof text !== "string" || text.startsWith("오류:")) return null;
        const meta = addonMeta[key];
        return (
          <div key={key} className="r-card" style={{ marginTop: 8, borderLeft: "3px solid var(--accent-primary)" }}>
            <div className="r-card-header">
              <span className="r-card-icon">{meta?.icon || "📄"}</span>
              <span className="r-card-title">{meta?.label || key}</span>
            </div>
            <RichText text={text} />
          </div>
        );
      })}
    </div>
  );
}

function HistoryDrawer({ open, onClose, entries, onPick, onDelete, onClear }) {
  if (!open) return null;
  return (
    <div className="history-overlay" onClick={onClose} role="presentation">
      <aside className="history-drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="분석 히스토리">
        <div className="history-drawer-head">
          <div>
            <h2>분석 히스토리</h2>
            <p>완료된 분석은 이 기기 브라우저에 저장됩니다. 최대 {HISTORY_MAX}건.</p>
          </div>
          <div className="history-drawer-actions">
            {entries.length > 0 && (
              <button type="button" className="btn-ghost" style={{ padding: "8px 12px", fontSize: 12 }} onClick={() => { if (confirm("히스토리를 모두 삭제할까요?")) onClear(); }}>전체 삭제</button>
            )}
            <button type="button" className="modal-close" style={{ width: 36, height: 36 }} onClick={onClose} aria-label="닫기">✕</button>
          </div>
        </div>
        <div className="history-list-wrap">
          {entries.length === 0 ? (
            <div className="history-empty">아직 저장된 분석이 없습니다.<br />각 모드에서 분석을 완료하면 자동으로 쌓입니다.</div>
          ) : (
            entries.map((e) => (
              <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <button type="button" className="history-row" style={{ flex: 1 }} onClick={() => onPick(e)}>
                  <span className="history-row-icon">{e.modeIcon}</span>
                  <span className="history-row-body">
                    <span className="history-row-title">{e.title}</span>
                    <span className="history-row-meta">{e.modeName} · {formatHistoryTime(e.ts)}</span>
                  </span>
                </button>
                <button type="button" className="history-row-del" title="이 항목만 삭제" onClick={(ev) => { ev.stopPropagation(); onDelete(e.id); }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                </button>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}

function copyHistoryAsRichText(entry, personas) {
  const { modeId, payload } = entry;
  let md = `# ${entry.modeIcon} ${entry.modeName}\n\n📅 ${new Date(entry.ts).toLocaleString("ko-KR")}\n\n`;
  if (modeId === "analyze") {
    md += `## 아이디어\n${payload.idea || ""}\n\n`;
    if (payload.fb) md += `## 원하는 피드백 방향\n${payload.fb}\n\n`;
    const plist = payload.personaLabels || personas;
    Object.entries(payload.results || {}).forEach(([id, result]) => {
      const p = plist.find(x => x.id === id) || { name: id, icon: "📌" };
      md += `---\n### ${p.icon} ${p.name}\n\n${result}\n\n`;
    });
    if (payload.synthesis) md += `---\n### ⚡ 종합 분석 리포트\n\n${payload.synthesis}\n\n`;
    if (payload.deepSteps?.length) payload.deepSteps.forEach(r => { md += `---\n### ${r.icon} ${r.name} (심화)\n\n${r.content}\n\n`; });
  } else if (modeId === "tournament") {
    md += `## 컨텍스트\n${payload.ctx || "없음"}\n\n`;
    if (payload.fb) md += `## 원하는 피드백 방향\n${payload.fb}\n\n`;
    if (payload.finalTop?.length) { md += `## 🏆 최종 순위\n`; payload.finalTop.forEach((t, i) => { md += `${["🥇","🥈","🥉"][i] || `${i+1}.`} ${t.idea || t}\n`; }); md += "\n"; }
    if (payload.finalReport) md += `## 📊 최종 리포트\n\n${payload.finalReport}\n\n`;
    (payload.rounds || []).forEach((rd, ri) => {
      md += `---\n### 라운드 ${ri + 1}\n\n`;
      rd.forEach(m => { md += `- **${m.a}** vs **${m.b || "BYE"}** → 승: **${m.winner}**\n  사유: ${m.reason || "AI 판정"}\n`; });
      md += "\n";
    });
  } else if (modeId === "tot") {
    md += `## 아이디어\n${payload.idea || ""}\n\n`;
    if (payload.context) md += `## 원하는 피드백 방향\n${payload.context}\n\n`;
    if (payload.solution) md += `## 🎯 최종 솔루션\n\n${payload.solution}\n\n`;
    (payload.branches || []).forEach(b => { md += `### 방향 ${b.id}: ${b.title}\n${b.reasoning || ""}\n\n`; });
  } else if (modeId === "devil") {
    md += `## 아이디어\n${payload.idea || ""}\n\n`;
    if (payload.fb) md += `## 원하는 피드백 방향\n${payload.fb}\n\n`;
    md += `## Pre-mortem 분석\n\n${payload.result || ""}\n`;
  } else if (modeId === "scamper") {
    md += `## 아이디어\n${payload.idea || ""}\n\n`;
    if (payload.fb) md += `## 원하는 피드백 방향\n${payload.fb}\n\n`;
    Object.entries(payload.results || {}).forEach(([k, v]) => { if (k !== "error" && k !== "__full") md += `### ${k}\n${v}\n\n`; });
    if (payload.results?.__full) md += payload.results.__full;
  } else if (modeId === "market") {
    md += `## 아이디어\n${payload.idea || ""}\n\n`;
    if (payload.fb) md += `## 원하는 피드백 방향\n${payload.fb}\n\n`;
    md += `## 시장 검증 리포트\n\n${payload.result || ""}\n`;
  } else if (modeId === "dna") {
    md += `## 아이디어 목록\n${payload.ideasText || ""}\n\n`;
    if (payload.fb) md += `## 원하는 피드백 방향\n${payload.fb}\n\n`;
    if (payload.analysis?.clusters) { payload.analysis.clusters.forEach(cl => { md += `### 🔬 ${cl.name}\n키워드: ${(cl.keywords || []).join(", ")}\n아이디어: ${(cl.ideas || []).join(", ")}\n\n`; }); }
    if (payload.analysis?.recommendations) { md += `## 💡 추천\n`; payload.analysis.recommendations.forEach(r => { md += `- **${r.name}**: ${r.reason || ""}\n`; }); }
  } else if (modeId === "compete") {
    md += `## 아이디어\n${payload.idea || ""}\n\n`;
    if (payload.fb) md += `## 원하는 피드백 방향\n${payload.fb}\n\n`;
    md += `## 경쟁 환경 분석\n\n${payload.result || ""}\n`;
  } else if (modeId === "refhub") {
    md += `## 아이디어\n${payload.idea || ""}\n\n`;
    if (payload.fb) md += `## 원하는 피드백 방향\n${payload.fb}\n\n`;
    md += `## 레퍼런스 목록\n\n`;
    (payload.results || []).forEach(r => { md += `- **${r.title}** (${r.category || ""})\n  ${r.desc || ""}\n  ${r.url || ""}\n\n`; });
  } else if (modeId === "hyperniche") {
    md += `## 관심 산업\n${payload.input || ""}\n\n`;
    if (payload.fb) md += `## 원하는 피드백 방향\n${payload.fb}\n\n`;
    if (payload.ideas?.length) {
      payload.ideas.forEach((idea, i) => {
        md += `---\n### 🦄 IDEA ${i + 1}: ${idea.idea_name}\n`;
        md += `**🎯 타겟:** ${idea.micro_target}\n\n`;
        md += `${idea.concept_description}\n\n`;
        md += `**🏰 해자:** ${idea.moat_strategy}\n\n`;
        md += `**🔥 미친 포인트:** ${idea.virality_factor}\n\n`;
        md += `**🚀 MVP:** ${idea.first_step}\n\n`;
      });
    }
    if (payload.rawFallback) md += `## 응답\n\n${payload.rawFallback}\n`;
  } else if (modeId === "mixroulette") {
    md += `## 아이디어 파츠\n${(payload.leftItems || []).map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\n`;
    md += `## 매칭\n**${payload.selectedLeft}** × **${payload.selectedRight}**\n\n`;
    if (payload.report) {
      md += `## 💡 결합 컨셉\n${payload.report.combined_concept}\n\n`;
      md += `## 🎯 가치 제안\n${payload.report.value_proposition}\n\n`;
      md += `## 🚀 실행 전략\n${payload.report.execution_strategy}\n\n`;
    }
  } else {
    md += JSON.stringify(payload, null, 2);
  }
  return md;
}

function extractIdeaFromPayload(entry) {
  const p = entry?.payload;
  return p?.idea || p?.input || p?.ideasText || p?.combined_concept || entry?.title || "";
}
function extractReportFromPayload(entry) {
  const p = entry?.payload;
  if (entry?.modeId === "prototyper") return p?.result || "";
  return p?.synthesis || p?.result || p?.solution || p?.finalReport || p?.rawFallback || (typeof p === "string" ? p : JSON.stringify(p || {}));
}

function HistoryDetailModal({ entry, onClose, personas, globalKey }) {
  const [copied, setCopied] = useState(false);
  const { save: saveToArchive } = useArchive();
  useEffect(() => {
    if (!entry) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [entry]);
  if (!entry) return null;
  const handleCopy = () => {
    const md = copyHistoryAsRichText(entry, personas);
    const html = md.replace(/\n/g, "<br>");
    if (navigator.clipboard?.write) {
      const blob = new Blob([html], { type: "text/html" });
      const blobText = new Blob([md], { type: "text/plain" });
      navigator.clipboard.write([new ClipboardItem({ "text/html": blob, "text/plain": blobText })]).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => {
        navigator.clipboard.writeText(md).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
      });
    } else {
      navigator.clipboard.writeText(md).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
    }
  };
  return ReactDOM.createPortal(
    <div className="history-detail-overlay" onClick={onClose} role="presentation">
      <div className="history-detail-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {/* 모바일 바텀시트 드래그 핸들 */}
        <div className="history-detail-handle" aria-hidden="true" />
        <div className="history-detail-head">
          <div style={{ minWidth: 0 }}>
            <h3>{entry.modeIcon} {entry.modeName}</h3>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{new Date(entry.ts).toLocaleString("ko-KR")}</p>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
            <button type="button" className="idea-stack-btn" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => saveToArchive({ modeId: entry.modeId, modeName: entry.modeName, modeIcon: entry.modeIcon, title: entry.title, payload: entry.payload })}>
              📦 아카이브
            </button>
            <button type="button" className="idea-stack-btn" style={{ padding: "6px 12px", fontSize: 12 }} onClick={handleCopy}>
              {copied ? "✓ 복사됨" : "📋 복사"}
            </button>
            <button type="button" className="modal-close" onClick={onClose} aria-label="닫기">✕</button>
          </div>
        </div>
        {/* 콘텐츠 스크롤 영역: flex: 1 1 0 으로 남은 공간 전부 차지 */}
        <div className="history-detail-scroll">
          <HistoryDetailBody entry={entry} personas={personas} />
          <SavedAddonsDisplay payload={entry.payload} />
        </div>
        {/* 도구 영역: flex: 0 0 auto 로 항상 하단 고정 */}
        <div className="history-detail-footer">
          <div className="history-detail-footer-grab" aria-hidden="true" />
          <div className="history-detail-footer-inner">
            <ReportExportBar entryForExport={{ modeId: entry.modeId, title: entry.title, payload: entry.payload }} />
            <DeepAnalysisPanel idea={extractIdeaFromPayload(entry)} context={entry.payload?.fb || entry.payload?.context || ""} existingReport={extractReportFromPayload(entry)} personas={personas} globalKey={globalKey} />
            <ReportTools reportText={extractReportFromPayload(entry)} personas={personas} globalKey={globalKey} />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}





/** 테스트용: localStorage에 쌓인 앱 데이터 전부 제거 (스택·온보딩 포함). 호출 후 reload 권장. */

// ─── Settings Modal ───
function SettingsModal({ personas, setPersonas, onClose, globalKey, setGlobalKey, totProvider, setTotProvider, totModel, setTotModel, totApiKey, setTotApiKey, mixProvider, setMixProvider, mixModel, setMixModel, mixApiKey, setMixApiKey, utilProvider, setUtilProvider, utilModel, setUtilModel, utilApiKey, setUtilApiKey }) {
  const [lp, setLp] = useState(personas);
  const [gk, setGk] = useState(globalKey);
  const [tProv, setTProv] = useState(totProvider || "claude");
  const [tModel, setTModel] = useState(totModel || PROVIDERS[totProvider || "claude"]?.models[0] || "");
  const [totAk, setTotAk] = useState(totApiKey);
  const [mProv, setMProv] = useState(mixProvider || "claude");
  const [mModel, setMModel] = useState(mixModel || PROVIDERS[mixProvider || "claude"]?.models[0] || "");
  const [mixAk, setMixAk] = useState(mixApiKey);
  const [uProv, setUProv] = useState(utilProvider || "openai");
  const [uModel, setUModel] = useState(utilModel || PROVIDERS[utilProvider || "openai"]?.models[0] || "");
  const [utilAk, setUtilAk] = useState(utilApiKey);
  const [batchProv, setBatchProv] = useState("openai");
  const [batchModel, setBatchModel] = useState(PROVIDERS.openai.models[0]);
  const [batchKey, setBatchKey] = useState("");
  useEffect(() => {
    setLp(mergePersonasWithDefaults(personas));
    setGk(globalKey);
    setTProv(totProvider || "claude");
    setTModel(totModel || PROVIDERS[totProvider || "claude"]?.models[0] || "");
    setTotAk(totApiKey);
    setMProv(mixProvider || "claude");
    setMModel(mixModel || PROVIDERS[mixProvider || "claude"]?.models[0] || "");
    setMixAk(mixApiKey);
    setUProv(utilProvider || "openai");
    setUModel(utilModel || PROVIDERS[utilProvider || "openai"]?.models[0] || "");
    setUtilAk(utilApiKey);
  }, [personas, globalKey, totProvider, totModel, totApiKey, mixProvider, mixModel, mixApiKey, utilProvider, utilModel, utilApiKey]);
  const upd = (i, f, v) => { const c = [...lp]; c[i] = { ...c[i], [f]: v }; if (f === "provider") c[i].model = PROVIDERS[v]?.models[0] || ""; setLp(c); };
  const save = () => { setPersonas(lp); setGlobalKey(gk); setTotProvider(tProv); setTotModel(tModel); setTotApiKey(totAk); setMixProvider(mProv); setMixModel(mModel); setMixApiKey(mixAk); setUtilProvider(uProv); setUtilModel(uModel); setUtilApiKey(utilAk); onClose(); };
  const applyBatch = () => {
    const m = batchModel || PROVIDERS[batchProv]?.models[0] || "";
    const next = lp.map(p => ({ ...p, provider: batchProv, model: m, apiKey: batchKey }));
    const gkVal = batchProv === "claude" ? (batchKey || gk) : gk;
    setPersonas(next); setGlobalKey(gkVal);
    setTotProvider(batchProv); setTotModel(m); setTotApiKey(batchKey);
    setMixProvider(batchProv); setMixModel(m); setMixApiKey(batchKey);
    setUtilProvider(batchProv); setUtilModel(m); setUtilApiKey(batchKey);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle"><div /></div>
        <div className="modal-title"><span>설정</span><button className="modal-close" onClick={onClose}>✕</button></div>

        <div style={{ marginBottom: 18, padding: 14, background: "linear-gradient(135deg, rgba(49,130,246,0.06), rgba(124,58,237,0.04))", border: "1px solid rgba(49,130,246,0.14)", borderRadius: 12 }}>
          <div className="s-label" style={{ marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
            <span>⚡</span> 전체 일괄 변경
          </div>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 10 }}>
            아래 모든 항목(페르소나 + ToT + 믹스업)을 한번에 설정합니다
          </p>
          <div className="persona-cfg-row" style={{ marginBottom: 8 }}>
            <select value={batchProv} onChange={e => { setBatchProv(e.target.value); setBatchModel(PROVIDERS[e.target.value]?.models[0] || ""); }}>{Object.entries(PROVIDERS).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}</select>
            <select value={batchModel} onChange={e => setBatchModel(e.target.value)}>{(PROVIDERS[batchProv]?.models || []).map(m => <option key={m} value={m}>{m}</option>)}</select>
          </div>
          <input type="password" value={batchKey} onChange={e => setBatchKey(e.target.value)} placeholder="API Key 입력" style={{ marginBottom: 10 }} />
          <button className="btn-cta" style={{ width: "100%", padding: "10px", fontSize: 13 }} onClick={applyBatch}>⚡ 전체 적용 및 저장</button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div className="s-label">글로벌 Claude API 키</div>
          <input type="password" value={gk} onChange={e => setGk(e.target.value)} placeholder="sk-ant-... (선택사항)" />
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.45 }}>개별 키가 없는 Claude 페르소나에 적용됩니다</p>
        </div>

        <div className="s-label" style={{ marginTop: 10 }}>개별 설정</div>
        {lp.map((p, i) => (
          <div className="persona-cfg" key={p.id}>
            <div className="persona-cfg-head"><span className="persona-cfg-icon">{p.icon}</span><span className="persona-cfg-name">{p.name}</span></div>
            {PERSONA_HOME_HINT[p.id] ? <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.45, margin: "0 0 8px 2px" }}>{PERSONA_HOME_HINT[p.id]}</p> : null}
            <div className="persona-cfg-row">
              <select value={p.provider} onChange={e => upd(i, "provider", e.target.value)}>{Object.entries(PROVIDERS).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}</select>
              <select value={p.model} onChange={e => upd(i, "model", e.target.value)}>{PROVIDERS[p.provider]?.models.map(m => <option key={m} value={m}>{m}</option>)}</select>
              <input type="password" value={p.apiKey} onChange={e => upd(i, "apiKey", e.target.value)} placeholder={p.provider === "claude" ? "글로벌 키 사용" : "API Key (필수)"} />
            </div>
          </div>
        ))}
        <div className="persona-cfg" key="tot">
          <div className="persona-cfg-head"><span className="persona-cfg-icon">🌳</span><span className="persona-cfg-name">ToT 딥 다이브</span></div>
          <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.45, margin: "0 0 8px 2px" }}>홈 「ToT 딥 다이브」전용 (멀티 관점 패널과 별도)</p>
          <div className="persona-cfg-row">
            <select value={tProv} onChange={e => { setTProv(e.target.value); setTModel(PROVIDERS[e.target.value]?.models[0] || ""); }}>{Object.entries(PROVIDERS).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}</select>
            <select value={tModel} onChange={e => setTModel(e.target.value)}>{(PROVIDERS[tProv]?.models || []).map(m => <option key={m} value={m}>{m}</option>)}</select>
            <input type="password" value={totAk} onChange={e => setTotAk(e.target.value)} placeholder={tProv === "claude" ? "글로벌 키 사용" : "API Key (필수)"} />
          </div>
        </div>
        <div className="persona-cfg" key="mix">
          <div className="persona-cfg-head"><span className="persona-cfg-icon">🎰</span><span className="persona-cfg-name">믹스업 룰렛</span></div>
          <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.45, margin: "0 0 8px 2px" }}>홈 「믹스업 룰렛」전용 (트렌드 생성 + 리포트)</p>
          <div className="persona-cfg-row">
            <select value={mProv} onChange={e => { setMProv(e.target.value); setMModel(PROVIDERS[e.target.value]?.models[0] || ""); }}>{Object.entries(PROVIDERS).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}</select>
            <select value={mModel} onChange={e => setMModel(e.target.value)}>{(PROVIDERS[mProv]?.models || []).map(m => <option key={m} value={m}>{m}</option>)}</select>
            <input type="password" value={mixAk} onChange={e => setMixAk(e.target.value)} placeholder={mProv === "claude" ? "글로벌 키 사용" : "API Key (필수)"} />
          </div>
        </div>
        <div className="persona-cfg" key="util" style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.03), rgba(49,130,246,0.03))", border: "1px solid rgba(245,158,11,0.12)" }}>
          <div className="persona-cfg-head"><span className="persona-cfg-icon">🔧</span><span className="persona-cfg-name">유틸리티 (문서·이미지·영상 분석)</span></div>
          <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.45, margin: "0 0 8px 2px" }}>PDF/PPT/이미지/영상 링크 분석, 비전 AI 등 유틸리티 기능 전용. 미설정 시 개별 페르소나 키에서 자동 탐색합니다.</p>
          <div className="persona-cfg-row">
            <select value={uProv} onChange={e => { setUProv(e.target.value); setUModel(PROVIDERS[e.target.value]?.models[0] || ""); }}>{Object.entries(PROVIDERS).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}</select>
            <select value={uModel} onChange={e => setUModel(e.target.value)}>{(PROVIDERS[uProv]?.models || []).map(m => <option key={m} value={m}>{m}</option>)}</select>
            <input type="password" value={utilAk} onChange={e => setUtilAk(e.target.value)} placeholder="API Key (문서·이미지·영상 분석용)" />
          </div>
        </div>
        <div style={{ marginTop: 22, padding: 14, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12 }}>
          <div className="s-label" style={{ marginBottom: 6, color: "var(--text-primary)" }}>테스트</div>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 10 }}>
            페르소나·API 설정·히스토리·아카이브·크레딧·아이디어/컨텍스트 스택·온보딩 기록 등 브라우저 저장 데이터를 모두 지웁니다. 이 브라우저에서만 적용됩니다.
          </p>
          <button
            type="button"
            className="btn-ghost"
            style={{ width: "100%", borderColor: "rgba(239,68,68,0.35)", color: "#dc2626" }}
            onClick={() => {
              if (!window.confirm("앱에 저장된 데이터를 모두 삭제하고 페이지를 새로고침합니다. 계속할까요?")) return;
              clearBrainstormAppDataForTesting();
              window.location.reload();
            }}
          >
            앱 초기화 (테스트)
          </button>
        </div>
        <div style={{ marginTop: 20, paddingTop: 14, borderTop: "1px solid var(--glass-border)", textAlign: "center" }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>최종 업데이트 {LAST_UPDATED}</span>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>취소</button>
          <button className="btn-cta" style={{ flex: 2 }} onClick={save}>설정 저장</button>
        </div>
      </div>
    </div>
  );
}

// ─── Feature 1: Multi-Perspective (+ Deep Analysis pipeline) ───
const DEEP_STEPS = [
  { key: "scamper", name: "SCAMPER 확장", icon: "💡" },
  { key: "devil", name: "약점 검증", icon: "😈" },
  { key: "market", name: "시장 검증", icon: "🔍" },
  { key: "action", name: "액션 플랜", icon: "📋" },
];

function MultiPerspective({ personas, globalKey, utilProvider, utilModel, utilApiKey }) {
  const recordHistory = useRecordHistory();
  const target = useTarget();
  const { notifyStart, notifyDone } = useTaskNotify("analyze");
  const { spend } = useCredits();
  const [idea, setIdea] = useState(""); const [fb, setFb] = useState(""); const [results, setResults] = useState({}); const [synthesis, setSynthesis] = useState(""); const [status, setStatus] = useState({}); const [running, setRunning] = useState(false);
  const [streamingIds, setStreamingIds] = useState(new Set());
  const [synthStreaming, setSynthStreaming] = useState(false);
  const [sel, setSel] = useState(() => personas.slice(0, 3).map((p) => p.id));
  const toggle = (id) => setSel((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  useEffect(() => {
    const validIds = new Set(personas.map((p) => p.id));
    setSel((s) => {
      const next = s.filter((id) => validIds.has(id));
      if (next.length) return next;
      return personas.slice(0, Math.min(3, personas.length)).map((p) => p.id);
    });
  }, [personas]);
  const [deep, setDeep] = useState(false);
  const [deepStep, setDeepStep] = useState(-1);
  const [deepResults, setDeepResults] = useState([]);
  const [ideaContext, setIdeaContext] = useState("");

  const run = async () => {
    if (!idea.trim()) return;
    addLinesToIdeaStack(idea);
    if (!spend("analyze")) return; notifyStart(); addToFeedbackStack(fb); setRunning(true); setResults({}); setSynthesis(""); setDeepStep(-1); setDeepResults([]); setStreamingIds(new Set()); setSynthStreaming(false);
    const tInfo = formatTargetForPrompt(target);
    const ns = {}; const active = personas.filter(p => sel.includes(p.id)); active.forEach(p => { ns[p.id] = "loading"; }); setStatus({ ...ns });
    const prompt = `다음 아이디어를 당신의 전문 분야 관점에서 **세계 최고 수준으로** 분석해주세요.\n\n**아이디어:** ${idea}${formatOptionalDirectionFb(fb)}${formatIdeaContext(ideaContext)}${tInfo}\n\n아래 구조를 반드시 따르세요:\n\n## 1. Executive Summary\n한 문단으로 핵심 판정 (Go/No-Go/Pivot 추천 + 핵심 근거)\n\n## 2. 기회 분석 (Why Now?)\n시장 타이밍, 기술 성숙도, 사회적 변화, 규제 환경이 왜 지금 이 아이디어에 유리한지\n\n## 3. 강점 · 차별적 우위\n경쟁 대비 10x 개선 포인트, 방어 가능한 moat, 네트워크 효과 가능성\n\n## 4. 리스크 · 약점 (Kill Zone 포함)\n빅테크 진입 위험, 규제 리스크, 기술 리스크, 시장 채택 장벽을 구체적으로\n\n## 5. 성공을 위한 핵심 조건 (Must-Have)\n이 아이디어가 성공하려면 반드시 충족해야 할 3가지 전제 조건\n\n## 6. 실행 제안\n즉시 검증해야 할 가설 TOP 3 + 최소 MVP 정의 + 초기 타깃 고객 프로필\n\n${MULTI_ANALYSIS_SUFFIX}`;
    const ar = {};
    await Promise.all(active.map(async persona => {
      try {
        const p = withResolvedApiKey(persona, globalKey);
        setStreamingIds(prev => new Set([...prev, persona.id]));
        const r = await callAIStream(p, [{ role: "user", content: prompt }], undefined, (_chunk, full) => {
          setResults(prev => ({ ...prev, [persona.id]: full }));
        });
        ar[persona.id] = r; setResults(prev => ({ ...prev, [persona.id]: r })); setStatus(prev => ({ ...prev, [persona.id]: "done" }));
        setStreamingIds(prev => { const n = new Set(prev); n.delete(persona.id); return n; });
      }
      catch (err) { ar[persona.id] = `오류: ${err.message}`; setResults(prev => ({ ...prev, [persona.id]: `오류: ${err.message}` })); setStatus(prev => ({ ...prev, [persona.id]: "error" })); setStreamingIds(prev => { const n = new Set(prev); n.delete(persona.id); return n; }); }
    }));
    let synthesisText = "";
    try {
      const sp = `아래는 세계 최고 수준의 전문가 패널이 각자 관점에서 분석한 결과입니다.\n\n${Object.entries(ar).map(([id, r]) => { const p = personas.find(x => x.id === id); return `=== ${p?.name} ===\n${r}`; }).join("\n\n")}\n\n위 전문가 의견을 종합하여 아래 프레임워크로 **최종 투자 심사 리포트**를 작성하세요:\n\n## 1. 종합 판정 (Go / No-Go / Pivot)\n확신도(0-100%)와 함께 근거 2-3줄\n\n## 2. 전문가 합의 인사이트 TOP 5\n모든 전문가가 공통으로 지적한 기회와 리스크\n\n## 3. 전문가 간 의견 충돌\n서로 엇갈린 포인트 + 어느 쪽이 더 타당한지 판정\n\n## 4. 검증 로드맵 (30일/90일/180일)\n즉시 실행할 가설 검증, MVP 실험, 시장 테스트 단계\n\n## 5. 리소스 · 팀 구성\n필요 핵심 인력, 초기 자금 규모, 기술 스택\n\n## 6. 최대 리스크와 대응 전략\n이 아이디어를 죽일 수 있는 시나리오 3가지 + 각 대응\n\n한국어로 작성하세요.`;
      const sp2 = pickUsablePersona(personas, globalKey);
      setSynthStreaming(true);
      synthesisText = await callAIStream(sp2, [{ role: "user", content: sp }], undefined, (_chunk, full) => {
        setSynthesis(full);
      });
      setSynthesis(synthesisText);
      setSynthStreaming(false);
    } catch (err) {
      synthesisText = `종합 분석 오류: ${err.message}`;
      setSynthesis(synthesisText);
      setSynthStreaming(false);
    }

    const deepArr = [];
    if (deep) {
      const prevAll = `멀티 관점 종합:\n${synthesisText}`;
      const deepPrompts = [
        `원본 아이디어: "${idea}"\n이전 분석:\n${prevAll}${formatOptionalDirectionFb(fb)}${formatIdeaContext(ideaContext)}\n\nSCAMPER 7축으로 **실행 가능한 파생 비즈니스**를 생성하세요.\n\n각 축마다:\n- 파생 아이디어 2-3개 (구체적 제품/서비스명 수준)\n- 각 아이디어의 타깃 고객과 예상 TAM\n- 실제 성공 레퍼런스 (유사하게 SCAMPER를 적용한 기업)\n\n축: Substitute(대체), Combine(결합), Adapt(적용), Modify(변형), Put to other uses(전용), Eliminate(제거), Reverse(역전)\n한국어로.`,
        `원본 아이디어: "${idea}"\n이전 분석:\n${prevAll}${formatOptionalDirectionFb(fb)}${formatIdeaContext(ideaContext)}\n\n**구조화된 Pre-mortem 분석**을 수행하세요:\n\n## 사망 선고서\n이 스타트업이 2년 후 문을 닫았습니다. 부검 결과를 작성하세요.\n\n## 치명적 실패 원인 TOP 5\n각 원인별: 발생 확률(%), 임팩트(상/중/하), 발생 시점(개월), 조기 경고 신호\n\n## Kill Zone 분석\nFAANG·국내 빅테크가 이 영역에 진입할 가능성과 대응 전략\n\n## 규제·법률 지뢰\n개인정보보호, 산업규제, 지적재산권 리스크\n\n## 생존 처방전\n각 실패 원인별 구체적 대응 전략 + 피봇 옵션\n\n한국어로.`,
        `원본 아이디어: "${idea}"\n이전 분석:\n${prevAll}${formatOptionalDirectionFb(fb)}${formatIdeaContext(ideaContext)}\n\n**투자급 시장 검증 리포트**를 작성하세요:\n\n## TAM → SAM → SOM (보텀업)\n구체적 수치와 산출 근거. 유사 시장 벤치마크 3개 이상\n\n## 경쟁 매핑\n직접 경쟁 3개, 간접 경쟁 3개, 잠재 진입자 2개. 각 사의 약점=우리의 기회\n\n## 차별화 매트릭스\n경쟁사 대비 10x 개선 포인트를 구체적 수치로\n\n## GTM 전략\n초기 Beachhead 시장 → 확장 경로. 채널별 CAC 추정. 바이럴 루프 설계\n\n## 가격 전략\n가격 책정 모델, 비교 가격 분석, 마진 구조\n\n한국어로.`,
        `원본 아이디어: "${idea}"\n전체 분석:\n${prevAll}\n${deepArr.map(d => `\n=== ${d.name} ===\n${d.content}`).join("")}${formatOptionalDirectionFb(fb)}${formatIdeaContext(ideaContext)}\n\n**VC 투자 심사 수준의 최종 액션 플랜**을 작성하세요:\n\n## 최종 판정 (Go / No-Go / Pivot)\n확신도(0-100%) + 핵심 근거 + 비교 가능한 성공 사례\n\n## 핵심 인사이트 TOP 5\n전체 분석에서 도출된 가장 중요한 발견\n\n## 30일 스프린트\n즉시 검증할 핵심 가설 3개 + 검증 방법 + 성공 기준(KPI)\n\n## 90일 로드맵\nMVP 정의, 초기 유저 확보 전략, 핵심 메트릭\n\n## 180일 마일스톤\n제품-시장 적합성 증명, 시리즈A 준비 조건\n\n## 팀 구성 · 자금\n필요 핵심 인력 (직무/연차), 초기 자금 규모, 번 레이트\n\n## 최대 리스크와 대응\n프로젝트를 죽일 수 있는 시나리오 3개 + 각 대응 전략\n\n한국어로.`,
      ];
      for (let i = 0; i < DEEP_STEPS.length; i++) {
        setDeepStep(i);
        const actualPrompt = i === 3
          ? `원본 아이디어: "${idea}"\n전체 분석:\n${prevAll}\n${deepArr.map(d => `\n=== ${d.name} ===\n${d.content}`).join("")}${formatOptionalDirectionFb(fb)}${formatIdeaContext(ideaContext)}\n\n**VC 투자 심사 수준의 최종 액션 플랜**을 작성하세요:\n\n## 최종 판정 (Go / No-Go / Pivot)\n확신도(0-100%) + 핵심 근거 + 비교 가능한 성공 사례\n\n## 핵심 인사이트 TOP 5\n## 30일 스프린트\n즉시 검증할 핵심 가설 3개 + 검증 방법 + 성공 기준\n\n## 90일 로드맵\nMVP 정의, 초기 유저 확보, 핵심 메트릭\n\n## 180일 마일스톤\n## 팀 구성 · 자금\n## 최대 리스크와 대응\n\n한국어로.`
          : deepPrompts[i];
        try {
          const p = pickUsablePersona(personas, globalKey);
          const entry = { step: i, key: DEEP_STEPS[i].key, name: DEEP_STEPS[i].name, icon: DEEP_STEPS[i].icon, content: "", _streaming: true };
          deepArr.push(entry);
          setDeepResults([...deepArr]);
          const r = await callAIStream(p, [{ role: "user", content: actualPrompt }], undefined, (_chunk, full) => {
            entry.content = full;
            setDeepResults([...deepArr]);
          });
          entry.content = r;
          entry._streaming = false;
        } catch (err) {
          deepArr[deepArr.length - 1].content = `오류: ${err.message}`;
          deepArr[deepArr.length - 1]._streaming = false;
        }
        setDeepResults([...deepArr]);
      }
      setDeepStep(DEEP_STEPS.length);
    }

    setRunning(false);
    notifyDone(clipTitle(idea));
    recordHistory?.({
      modeId: "analyze",
      title: clipTitle(idea),
      payload: {
        idea,
        fb,
        results: { ...ar },
        synthesis: synthesisText,
        personaLabels: active.map((p) => ({ id: p.id, name: p.name, icon: p.icon, provider: p.provider, model: p.model })),
        ...(deep && deepArr.length > 0 ? { deepSteps: safeJsonClone(deepArr, []) } : {}),
      },
    });
  };

  const progress = Object.keys(status).length > 0 ? Object.values(status).filter(s => s === "done" || s === "error").length / Object.keys(status).length * 100 : 0;
  const totalSteps = deep ? (Object.keys(status).length + 1 + DEEP_STEPS.length) : (Object.keys(status).length + 1);
  const doneCount = Object.values(status).filter(s => s === "done" || s === "error").length + (synthesis ? 1 : 0) + deepResults.length;
  const fullProgress = totalSteps > 0 ? (doneCount / totalSteps) * 100 : 0;

  return (
    <div>
      <div className="s-label">아이디어 입력</div>
      <IdeaInput value={idea} onChange={setIdea} placeholder="분석받고 싶은 아이디어, 컨셉, 비즈니스 모델을 자유롭게 입력하세요..." style={{ marginBottom: 14 }} context={ideaContext} onContextChange={setIdeaContext} personas={personas} globalKey={globalKey} utilProvider={utilProvider} utilModel={utilModel} utilApiKey={utilApiKey} />
      <FeedbackField value={fb} onChange={setFb} placeholder="예: 수익 모델 중심으로, B2B 관점에서…" style={{ marginBottom: 18 }} />
      <div className="s-label">분석 페르소나 선택</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {personas.map(p => (<button key={p.id} className={`chip ${sel.includes(p.id) ? "active" : ""}`} onClick={() => toggle(p.id)}>{p.icon} {p.name}<span style={{ fontSize: 10, opacity: 0.6 }}>({PROVIDERS[p.provider]?.name})</span></button>))}
      </div>
      <button
        type="button"
        onClick={() => setDeep(d => !d)}
        style={{
          display: "flex", alignItems: "center", gap: 10, width: "100%",
          padding: "12px 16px", marginBottom: 18, borderRadius: 10, cursor: "pointer",
          background: deep ? "linear-gradient(135deg, rgba(49,130,246,0.06), rgba(124,58,237,0.04))" : "var(--bg-surface-2)",
          border: `1px solid ${deep ? "rgba(49,130,246,0.2)" : "var(--glass-border)"}`,
          transition: "all 0.2s ease",
        }}
      >
        <span style={{
          width: 36, height: 20, borderRadius: 10, position: "relative",
          background: deep ? "var(--accent-primary)" : "var(--bg-surface-3)",
          transition: "background 0.2s ease", flexShrink: 0,
        }}>
          <span style={{
            position: "absolute", top: 2, left: deep ? 18 : 2,
            width: 16, height: 16, borderRadius: "50%", background: "#fff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.15)", transition: "left 0.2s ease",
          }} />
        </span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: deep ? "var(--accent-primary)" : "var(--text-secondary)", letterSpacing: "-0.02em" }}>
            심화 분석 모드
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
            종합 후 SCAMPER 확장 → 약점 검증 → 시장 분석 → 액션 플랜까지 자동 순환
          </div>
        </div>
      </button>
      <button className="btn-cta" onClick={run} disabled={running || !idea.trim() || sel.length === 0}>
        {running ? <><span className="spinner" /> {deepStep >= 0 ? <>{DEEP_STEPS[deepStep]?.name || "마무리"} 진행 중<span className="loading-dots" /></> : <>멀티 분석 중<span className="loading-dots" /></>}</> : <>{deep ? "심화 분석 시작" : "멀티 관점 분석 시작"}<CreditCostTag costKey="analyze" /></>}
      </button>
      {running && deep && (
        <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap", marginTop: 12 }}>
          {[{ name: "멀티 분석", icon: "🧠" }, { name: "종합", icon: "⚡" }, ...DEEP_STEPS].map((s, i) => {
            const isDone = i === 0 ? Object.values(status).some(v => v === "done") : i === 1 ? !!synthesis : deepResults.length > (i - 2);
            const isActive = i === 0 ? (!synthesis && Object.values(status).some(v => v === "loading")) : i === 1 ? (Object.values(status).every(v => v === "done" || v === "error") && !synthesis) : deepStep === (i - 2);
            return (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <span className="pipe-step" style={{
                  background: isDone ? "rgba(5,150,105,0.08)" : isActive ? "var(--accent-primary-glow)" : "var(--bg-surface-2)",
                  color: isDone ? "var(--accent-success)" : isActive ? "var(--accent-primary)" : "var(--text-muted)",
                  border: `1px solid ${isDone ? "rgba(5,150,105,0.2)" : isActive ? "rgba(49,130,246,0.2)" : "var(--glass-border)"}`,
                }}>{isDone ? "✓" : s.icon} {s.name}</span>
                {i < 5 && <span style={{ color: "var(--text-muted)", fontSize: 10 }}>→</span>}
              </span>
            );
          })}
        </div>
      )}
      {Object.keys(status).length > 0 && (<><div className="prog-bar-bg" style={{ marginTop: 10 }}><div className="prog-bar-fill" style={{ width: `${deep ? fullProgress : progress}%` }} /><span style={{ position: "absolute", right: 0, top: -18, fontSize: 11, fontWeight: 700, color: "var(--accent-primary)", fontVariantNumeric: "tabular-nums" }}>{Math.round(deep ? fullProgress : progress)}%</span></div><div className="prog-chips">{personas.filter(p => sel.includes(p.id)).map(p => (<span key={p.id} className={`prog-chip ${status[p.id] || "pending"}`}>{status[p.id] === "loading" && <span className="spinner" />}{status[p.id] === "done" && "✓"}{status[p.id] === "error" && "✗"}{p.icon} {p.name}</span>))}</div></>)}
      {running && <QuoteRoller />}
      {Object.entries(results).map(([id, result]) => { const p = personas.find(x => x.id === id); if (!p) return null; const pc = PROVIDERS[p.provider]?.color || "#888"; return (<div className="r-card" key={id}><div className="r-card-header"><span className="r-card-icon">{p.icon}</span><span className="r-card-title">{p.name}</span><span className="r-card-badge" style={{ background: `${pc}10`, color: pc, border: `1px solid ${pc}20` }}>{PROVIDERS[p.provider]?.name} · {p.model}</span></div>{result.startsWith("오류:") ? <div className="err-msg">{result}</div> : <StreamingRichText text={result} isStreaming={streamingIds.has(id)} />}</div>); })}
      {synthesis && (<div className="synth-card"><h3>⚡ 종합 분석 리포트</h3><StreamingRichText text={synthesis} isStreaming={synthStreaming} variant="synth" /></div>)}
      {deepResults.length > 0 && deepResults.map((r, i) => (
        <div className="r-card" key={`deep-${i}`} style={{ marginTop: 12, borderLeft: `3px solid ${["#7c3aed", "#dc2626", "#059669", "#3182f6"][i] || "var(--accent-primary)"}` }}>
          <div className="r-card-header">
            <span className="r-card-icon">{r.icon}</span>
            <span className="r-card-title">{r.name}</span>
            <span className="r-card-badge" style={{ background: "rgba(124,58,237,0.08)", color: "#7c3aed", border: "1px solid rgba(124,58,237,0.15)", fontSize: 10 }}>심화</span>
          </div>
          {String(r.content).startsWith("오류:") ? <div className="err-msg">{r.content}</div> : <StreamingRichText text={r.content} isStreaming={!!r._streaming} />}
        </div>
      ))}
      {(synthesis || Object.keys(results).length > 0) && !running && (
        <>
          <div className="report-sticky-actions">
            <div className="report-sticky-inner">
              <div style={{ marginTop: 10 }}>
                <ReportExportBar entryForExport={{ modeId: "analyze", title: clipTitle(idea), payload: { idea, fb, results, synthesis, deepSteps: deepResults } }} />
              </div>
              <DeepAnalysisPanel idea={idea} context={ideaContext} existingReport={synthesis || Object.values(results).join("\n\n")} personas={personas} globalKey={globalKey} />
              <ReportTools reportText={synthesis || Object.values(results).join("\n\n")} personas={personas} globalKey={globalKey} />
              <SaveToArchiveBtn modeId="analyze" title={clipTitle(idea)} payload={{ idea, fb, results, synthesis, deepSteps: deepResults }} />
            </div>
          </div>
          <ReportChat idea={idea} reportSummary={synthesis || Object.values(results).slice(0, 2).join("\n\n")} personas={personas} globalKey={globalKey} />
        </>
      )}
    </div>
  );
}

// ─── Feature 2: Tournament ───
function buildRoundLabels(totalRounds) {
  const labels = []; const colors = []; const emojis = [];
  const colorPalette = ["#6b7280", "#3182f6", "#7c3aed", "#d97706", "#dc2626", "#059669", "#e11d48"];
  const emojiPalette = ["⚔️", "🔥", "💎", "🌟", "👑"];
  for (let i = 0; i < totalRounds; i++) {
    const left = totalRounds - i;
    if (left === 1) { labels.push("결승"); emojis.push("👑"); }
    else if (left === 2) { labels.push("준결승"); emojis.push("🌟"); }
    else { labels.push(`${Math.pow(2, left)}강`); emojis.push(emojiPalette[Math.min(i, emojiPalette.length - 1)]); }
    colors.push(colorPalette[Math.min(i, colorPalette.length - 1)]);
  }
  return { labels, colors, emojis };
}
const ROUND_LABELS = ["32강", "16강", "8강", "준결승", "결승"];
const ROUND_COLORS = ["#6b7280", "#3182f6", "#7c3aed", "#d97706", "#dc2626"];
const ROUND_EMOJIS = ["⚔️", "🔥", "💎", "🌟", "👑"];
const DIMS = ["시장성", "실현가능성", "수익모델", "차별화", "임팩트"];

const FighterRow = ({ name, isWinner, total, side, byeWalkover }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
    background: isWinner ? "rgba(5,150,105,0.04)" : "transparent",
    borderLeft: isWinner ? "3px solid var(--accent-success)" : "3px solid transparent",
    transition: "all 0.2s",
  }}>
    <span style={{
      fontSize: 9, fontWeight: 800, width: 20, height: 20, borderRadius: 6,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      background: isWinner ? "var(--accent-success)" : "var(--bg-surface-2)",
      color: isWinner ? "#fff" : "var(--text-muted)",
    }}>{side}</span>
    <span style={{
      flex: 1, fontSize: 13, fontWeight: 500, minWidth: 0,
      color: isWinner ? "var(--text-primary)" : "var(--text-muted)",
      letterSpacing: "-0.02em", lineHeight: 1.4,
      opacity: isWinner ? 1 : 0.65,
    }}>{name}</span>
    {total > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: isWinner ? "var(--accent-success)" : "var(--text-muted)", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{total}pt</span>}
    <span style={{
      fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 6, flexShrink: 0,
      background: byeWalkover ? "rgba(5,150,105,0.12)" : isWinner ? "rgba(5,150,105,0.1)" : "rgba(220,38,38,0.06)",
      color: byeWalkover || isWinner ? "var(--accent-success)" : "#dc2626",
    }}>{byeWalkover ? "부전승" : isWinner ? "WIN" : "LOSE"}</span>
  </div>
);

function MatchCard({ m, roundIdx, matchIdx, expanded, onToggle, roundColor }) {
  const sa = m.scores?.A, sb = m.scores?.B;
  const totalA = sa ? DIMS.reduce((s, d) => s + (sa[d] || 0), 0) : 0;
  const totalB = sb ? DIMS.reduce((s, d) => s + (sb[d] || 0), 0) : 0;
  const rc = roundColor || "#3182f6";
  const isBye = m.b === "BYE";
  const aWin = m.winner === m.a;
  const bWin = m.winner === m.b;
  const { save } = useArchive();

  const archiveIdea = (e, name, isWinner, scores, total) => {
    e.stopPropagation();
    save({
      modeId: "tournament",
      modeName: "아이디어 토너먼트",
      modeIcon: "🏆",
      title: name,
      payload: { idea: name, isWinner, scores, total, reason: m.reason, matchIdx, roundIdx },
    });
  };

  return (
    <div style={{ background: "var(--bg-surface-1)", border: "1px solid var(--glass-border)", borderRadius: 12, marginBottom: 10, overflow: "hidden", boxShadow: "var(--shadow-xs)", animation: "fiu 0.4s cubic-bezier(0.33,1,0.68,1)", animationDelay: `${matchIdx * 0.04}s`, animationFillMode: "both" }}>
      <div onClick={() => { if (!isBye) onToggle?.(); }} style={{ cursor: isBye ? "default" : "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 12px 0", gap: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: rc, background: `${rc}18`, padding: "2px 8px", borderRadius: 6 }}>MATCH {matchIdx + 1}</span>
          {!isBye && <span style={{ fontSize: 12, color: "var(--text-muted)", flexShrink: 0, transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>}
        </div>
        <FighterRow name={m.a} isWinner={aWin} total={totalA} side="A" byeWalkover={isBye && aWin} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 12px" }}>
          <div style={{ flex: 1, height: 1, background: "var(--glass-border)" }} />
          <span style={{ fontSize: 10, fontWeight: 800, color: rc, letterSpacing: "0.05em" }}>VS</span>
          <div style={{ flex: 1, height: 1, background: "var(--glass-border)" }} />
        </div>
        <FighterRow name={isBye ? "BYE" : m.b} isWinner={bWin} total={totalB} side="B" byeWalkover={isBye && bWin} />
      </div>
      {expanded && !isBye && (
        <div style={{ padding: "10px 14px 14px", borderTop: "1px solid var(--glass-border)" }}>
          {sa && sb && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6, margin: "4px 0 10px" }}>
              {DIMS.map((d) => {
                const va = sa[d] || 0, vb = sb[d] || 0;
                return (
                  <div key={d} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>{d}</div>
                    <div style={{ position: "relative", height: 56, display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 3 }}>
                      <div style={{ width: 14, height: `${Math.round(va * 0.55)}px`, background: aWin ? "var(--accent-success)" : "#cbd5e1", borderRadius: "3px 3px 0 0", transition: "height 0.5s ease" }} />
                      <div style={{ width: 14, height: `${Math.round(vb * 0.55)}px`, background: bWin ? "var(--accent-success)" : "#cbd5e1", borderRadius: "3px 3px 0 0", transition: "height 0.5s ease" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 2 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: aWin ? "var(--accent-success)" : "var(--text-muted)" }}>{va}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: bWin ? "var(--accent-success)" : "var(--text-muted)" }}>{vb}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ padding: "10px 12px", background: "var(--bg-surface-2)", borderRadius: 10, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.65, borderLeft: `3px solid ${rc}` }}>
            <div style={{ fontWeight: 700, color: rc, fontSize: 11, marginBottom: 4 }}>📋 판정 근거</div>
            {m.reason || "AI 판정"}
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
            <button type="button" className="idea-stack-btn" style={{ flex: 1, fontSize: 11, padding: "6px 10px", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
              onClick={(e) => archiveIdea(e, m.a, aWin, sa, totalA)}>
              📦 {aWin && "🏆 "}A 아카이브 저장
            </button>
            <button type="button" className="idea-stack-btn" style={{ flex: 1, fontSize: 11, padding: "6px 10px", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
              onClick={(e) => archiveIdea(e, m.b, bWin, sb, totalB)}>
              📦 {bWin && "🏆 "}B 아카이브 저장
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** 한 줄 또는 여러 줄 입력에서 공백이 아닌 줄만 골라 중복 검사 후 스택 앞에 추가 */

// ─── Context Stack (상황 보강) ───

// ─── Feedback Stack (원하는 피드백 방향) ───

// ─── Mini Stack Popover (Context & Feedback) ───
function MiniStackPopover({ stack, onSelect, onRemove, onClose, emptyText }) {
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  return (
    <div className="mini-stack-popover" ref={ref}>
      <div className="mini-stack-list">
        {stack.length === 0
          ? <div className="mini-stack-empty">{emptyText || "저장된 항목이 없습니다"}</div>
          : stack.map((s, i) => (
            <div className="mini-stack-item" key={i} onClick={() => { onSelect(s); onClose(); }}>
              <span>{s}</span>
              <button onClick={(e) => { e.stopPropagation(); onRemove(s); }} title="삭제">✕</button>
            </div>
          ))
        }
      </div>
    </div>
  );
}

function ContextStackBtn({ onSelect }) {
  const [open, setOpen] = useState(false);
  const [stack, setStack] = useState(loadContextStack);
  const handleRemove = (t) => setStack(removeFromContextStack(t));
  return (
    <div className="mini-stack-wrap">
      <button type="button" className="mini-stack-btn" onClick={() => { setStack(loadContextStack()); setOpen(o => !o); }}>
        📂 불러오기{stack.length > 0 && <span style={{ background: "var(--accent-primary)", color: "#fff", borderRadius: 99, padding: "1px 5px", fontSize: 10 }}>{stack.length}</span>}
      </button>
      {open && (
        <MiniStackPopover
          stack={stack}
          onSelect={onSelect}
          onRemove={handleRemove}
          onClose={() => setOpen(false)}
          emptyText="사용한 상황 보강이 없습니다"
        />
      )}
    </div>
  );
}

function FeedbackStackBtn({ onSelect }) {
  const [open, setOpen] = useState(false);
  const [stack, setStack] = useState(loadFeedbackStack);
  const handleRemove = (t) => setStack(removeFromFeedbackStack(t));
  return (
    <div className="mini-stack-wrap">
      <button type="button" className="mini-stack-btn" onClick={() => { setStack(loadFeedbackStack()); setOpen(o => !o); }}>
        📂 불러오기{stack.length > 0 && <span style={{ background: "var(--accent-primary)", color: "#fff", borderRadius: 99, padding: "1px 5px", fontSize: 10 }}>{stack.length}</span>}
      </button>
      {open && (
        <MiniStackPopover
          stack={stack}
          onSelect={onSelect}
          onRemove={handleRemove}
          onClose={() => setOpen(false)}
          emptyText="사용한 피드백 방향이 없습니다"
        />
      )}
    </div>
  );
}

/** 피드백 방향 textarea + 불러오기 버튼 통합 컴포넌트 */
function FeedbackField({ value, onChange, placeholder, style }) {
  return (
    <div className="feedback-field-wrap" style={style}>
      <div className="feedback-field-header">
        <div className="s-label">원하는 피드백 방향 (선택)</div>
        <FeedbackStackBtn onSelect={onChange} />
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "예: 수익 모델 중심으로, B2B 관점에서…"}
        rows={1}
        style={{ marginBottom: 0, width: "100%", resize: "none", minHeight: "unset", height: "auto", padding: "12px 14px", fontFamily: "var(--font-sans)", fontSize: 15, letterSpacing: "-0.02em", borderRadius: 8, border: "1px solid var(--glass-border)", background: "var(--bg-surface-2)", lineHeight: 1.5, overflowY: "hidden" }}
      />
    </div>
  );
}

function IdeaStackPopover({ onSelect, onClose, personas, globalKey, utilProvider, utilModel, utilApiKey }) {
  const [stack, setStack] = useState(loadIdeaStack);
  const [q, setQ] = useState("");
  const [uploading, setUploading] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoStatus, setVideoStatus] = useState("");
  const [webUrl, setWebUrl] = useState("");
  const [webLoading, setWebLoading] = useState(false);
  const [webStatus, setWebStatus] = useState("");
  const ref = useRef(null);
  const docInputRef = useRef(null);
  const imgInputRef = useRef(null);

  const DOCUMENT_ACCEPT = "*/*";
  const IMAGE_ACCEPT = "image/png,image/jpeg,image/webp,image/gif";

  const openDocPicker = () => docInputRef.current?.click();
  const openImagePicker = () => imgInputRef.current?.click();

  const isImageFile = (file) => file && (file.type?.startsWith("image/") || /\.(jpe?g|png|gif|webp|bmp|tiff)$/i.test(file.name));

  const videoLoadingRef = useRef(false);
  useEffect(() => { videoLoadingRef.current = videoLoading; }, [videoLoading]);
  useEffect(() => {
    const h = (e) => {
      if (videoLoadingRef.current) return;
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  const filtered = q.trim() ? stack.filter(s => s.toLowerCase().includes(q.toLowerCase())) : stack;
  const del = (t) => { const ns = removeFromIdeaStack(t); setStack(ns); };

  const getPersona = () => {
    const u = resolveUtilPersona(globalKey, utilProvider, utilModel, utilApiKey, personas);
    return u.hasKey ? u : null;
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    const persona = getPersona();
    const filename = file.name || "파일";

    if (isImageFile(file)) {
      if (!persona?.apiKey) { showAppToast("🔑 이미지 분석을 위해 API 키가 필요합니다. ⚙️ 설정에서 API 키를 입력해 주세요.", "error", 5000); return; }
      setUploading(`🖼️ ${filename} 분석 중...`);
      try {
        const result = await processImageWithVision(file, persona);
        onSelect(result);
      } catch (err) {
        alert(`이미지 처리 실패: ${err.message}`);
      }
      setUploading("");
      return;
    }

    const ext = (filename.split(".").pop() || "").toLowerCase();
    setUploading(`📄 ${filename} 파싱 중...`);
    try {
      const rawText = await parseDocumentFile(file);
      if (!rawText.trim()) { setUploading(""); alert("문서에서 텍스트를 추출할 수 없습니다."); return; }
      if (persona?.apiKey) {
        setUploading(`🤖 AI로 아이디어 요약 중...`);
        const summary = await callAI(persona, [{ role: "user", content: `아래는 업로드된 ${ext?.toUpperCase()} 문서의 텍스트입니다. 이 내용에서 핵심 비즈니스 아이디어, 컨셉, 기획 요소를 추출하여 한국어로 간결하게 정리해 주세요. 아이디어 입력에 바로 사용할 수 있는 형태로.\n\n---\n${rawText.slice(0, 8000)}` }]);
        onSelect(summary);
      } else {
        showAppToast("🔑 API 키가 없어 AI 요약 없이 원문 텍스트로 가져옵니다. ⚙️ 설정에서 API 키를 입력하면 AI 요약이 가능합니다.", "warn", 5000);
        onSelect(rawText.slice(0, 2000));
      }
    } catch (err) {
      alert(`문서 처리 실패: ${err.message}`);
    }
    setUploading("");
  };

  const ALLOWED_DOC_EXTS = ["pdf", "ppt", "pptx", "xls", "xlsx", "csv"];
  const handleDocUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const ext = (file.name || "").split(".").pop()?.toLowerCase();
    if (isImageFile(file)) { handleFileUpload(file); return; }
    if (!ext || !ALLOWED_DOC_EXTS.includes(ext)) {
      alert(`지원하지 않는 파일 형식입니다.\n지원: ${ALLOWED_DOC_EXTS.map(e => `.${e}`).join(", ")}, 이미지`);
      return;
    }
    handleFileUpload(file);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    handleFileUpload(file);
  };

  const handleVideoLink = async () => {
    const url = videoUrl.trim();
    if (!url) return;
    const persona = getPersona();
    if (!persona?.apiKey) { showAppToast("🔑 영상 분석을 위해 API 키가 필요합니다. ⚙️ 설정 → 유틸리티 API 키를 입력해 주세요.", "error", 5000); return; }
    setVideoLoading(true);
    setVideoStatus("🎬 영상 정보 수집 중… (Invidious → Piped → YouTube 순)");
    try {
      const info = await extractYouTubeVideoInfo(url);
      const hasCaption = info.captionText && info.captionText.length > 50;
      const hasDesc = info.description && info.description.length > 20;
      const hasMeta = info.title || hasDesc;
      if (!hasMeta && !hasCaption) throw new Error("영상 정보를 수집할 수 없습니다. URL을 확인해 주세요.");

      const layerLabel = hasCaption ? "자막+메타데이터" : hasDesc ? "설명 기반" : "제목 기반";
      setVideoStatus(`🤖 ${layerLabel} AI 분석 중...`);

      const contextParts = [];
      if (info.title) contextParts.push(`제목: ${info.title}`);
      if (info.author) contextParts.push(`채널: ${info.author}`);
      if (info.keywords) contextParts.push(`태그: ${info.keywords}`);
      if (info.description) contextParts.push(`설명:\n${info.description}`);
      if (hasCaption) contextParts.push(`\n--- 자막 전문 (음성 기반, ${(info.captionText.length / 1000).toFixed(1)}k자) ---\n${info.captionText}`);

      const prompt = hasCaption
        ? `아래는 YouTube 영상에서 추출한 **자막 전문**(음성 텍스트)과 메타데이터입니다.\n\n${contextParts.join("\n")}\n\n위 영상의 **핵심 내용을 3~5문장으로 요약**하고, 이 영상에서 영감을 받아 만들 수 있는 **실행 가능한 비즈니스 아이디어를 8개 이상** 한국어로 정리해 주세요.\n각 아이디어는 ① 구체적 서비스/제품 형태 ② 타겟 고객 ③ 수익 모델을 한 줄에 포함하세요.`
        : hasDesc
        ? `아래는 YouTube 영상의 제목·설명·태그 정보입니다.\n\n${contextParts.join("\n")}\n\n이 영상의 **주제와 핵심 메시지를 분석**하고, 관련 **실행 가능한 비즈니스 아이디어를 8개 이상** 한국어로 정리해 주세요.\n각 아이디어는 ① 구체적 서비스/제품 형태 ② 타겟 고객 ③ 수익 모델을 한 줄에 포함하세요.`
        : `아래는 YouTube 영상의 기본 정보입니다.\n\n${contextParts.join("\n")}\n\n이 영상의 주제를 바탕으로, 관련 **비즈니스 아이디어를 8개 이상** 한국어로 정리해 주세요.\n각 아이디어는 구체적으로 한 줄씩 작성하세요.`;

      const result = await callAI(persona, [{ role: "user", content: prompt }]);
      const srcLabel = hasCaption ? `자막 기반 · ${(info.captionText.length / 1000).toFixed(1)}k자 분석` : hasDesc ? "설명 기반 분석" : "메타데이터 기반";
      const header = `[📹 ${info.title || url}${info.author ? ` · ${info.author}` : ""}]\n(${srcLabel} · ${info.layers.join("+")})\n\n`;
      onSelect(header + result);
      setVideoUrl("");
    } catch (err) {
      showAppToast(`영상 분석 실패: ${err.message}`, "error", 5000);
    } finally {
      setVideoStatus("");
      setVideoLoading(false);
    }
  };

  const handleWebUrl = async () => {
    const url = webUrl.trim();
    if (!url) return;
    const persona = getPersona();
    if (!persona?.apiKey) { showAppToast("🔑 웹 분석을 위해 API 키가 필요합니다. ⚙️ 설정에서 API 키를 입력해 주세요.", "error", 5000); return; }
    setWebLoading(true);
    setWebStatus("🌐 웹 본문 추출 중… (Jina Reader → Microlink → Readability)");
    try {
      const article = await extractWebArticle(url);
      const hasContent = article.textContent && article.textContent.length >= 50;
      const hasTitle = !!article.title;

      if (!hasContent && !hasTitle) throw new Error("웹 페이지에서 텍스트를 추출할 수 없습니다. URL을 확인해 주세요.");

      const charK = (article.length / 1000).toFixed(1);
      setWebStatus(`🤖 본문 ${charK}k자 AI 분석 중...`);

      const contextParts = [];
      if (article.title) contextParts.push(`제목: ${article.title}`);
      if (article.siteName) contextParts.push(`사이트: ${article.siteName}`);
      if (article.byline) contextParts.push(`작성자: ${article.byline}`);
      if (article.excerpt) contextParts.push(`요약: ${article.excerpt}`);
      if (hasContent) contextParts.push(`\n--- 본문 텍스트 (${charK}k자) ---\n${article.textContent}`);

      const prompt = hasContent
        ? `아래는 웹 페이지에서 추출한 **본문 텍스트**입니다.\n\n${contextParts.join("\n")}\n\nURL: ${url}\n\n위 글의 **핵심 내용을 3~5문장으로 요약**하고, 이 내용에서 영감을 받아 만들 수 있는 **실행 가능한 비즈니스 아이디어를 8개 이상** 한국어로 정리해 주세요.\n각 아이디어는 ① 구체적 서비스/제품 형태 ② 타겟 고객 ③ 수익 모델을 한 줄에 포함하세요.`
        : `아래는 웹 페이지의 기본 정보입니다.\n\n${contextParts.join("\n")}\n\nURL: ${url}\n\n위 정보를 바탕으로 관련 **비즈니스 아이디어를 8개 이상** 한국어로 정리해 주세요.\n각 아이디어는 구체적으로 한 줄씩 작성하세요.`;

      const result = await callAI(persona, [{ role: "user", content: prompt }]);
      const srcLabel = hasContent ? `본문 ${charK}k자 추출` : "메타데이터 기반";
      const header = `[🌐 ${article.title || url}${article.siteName ? ` · ${article.siteName}` : ""}]\n(${srcLabel} · ${article.layers.join("+")})\n\n`;
      onSelect(header + result);
      setWebUrl("");
    } catch (err) {
      showAppToast(`웹 페이지 분석 실패: ${err.message}`, "error", 5000);
    } finally {
      setWebStatus("");
      setWebLoading(false);
    }
  };

  return (
    <div className="idea-stack-popover" ref={ref}>
      <div className="isp-header">
        <span className="isp-header-title">불러오기</span>
        <span className="isp-header-badge">{stack.length}</span>
      </div>
      <input className="idea-stack-search" value={q} onChange={e => setQ(e.target.value)} placeholder="아이디어 검색..." />
      <div className="idea-stack-list">
        {filtered.length === 0 && <div className="idea-stack-empty">{stack.length === 0 ? "저장된 아이디어가 없습니다" : "검색 결과 없음"}</div>}
        {filtered.map((s, i) => (
          <div className="idea-stack-item" key={i} onClick={() => { onSelect(s); onClose(); }}>
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", fontWeight: 500, letterSpacing: "-0.01em" }}>{s}</span>
            <button className="idea-stack-item-del" onClick={(e) => { e.stopPropagation(); del(s); }} title="삭제">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            </button>
          </div>
        ))}
      </div>
      <div className="upload-section">
        <div className="upload-section-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          문서에서 아이디어 추출
        </div>
        <div className="upload-grid">
          <button type="button" className={`upload-chip${uploading ? " processing" : ""}`} onClick={openDocPicker}>
            <span className="upload-chip-icon" style={{ background: "rgba(239,68,68,0.08)" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </span>
            문서 업로드 (PDF/PPTX/XLSX/CSV)
          </button>
          <button type="button" className={`upload-chip${uploading ? " processing" : ""}`} onClick={openImagePicker}>
            <span className="upload-chip-icon" style={{ background: "rgba(139,92,246,0.08)" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </span>
            이미지 업로드
          </button>
          <input ref={docInputRef} type="file" accept={DOCUMENT_ACCEPT} onChange={handleDocUpload} style={{ display: "none" }} />
          <input ref={imgInputRef} type="file" accept={IMAGE_ACCEPT} onChange={handleImageUpload} style={{ display: "none" }} />
        </div>
        {uploading && <div className="upload-progress"><span className="spinner" style={{ width: 14, height: 14 }} />{uploading}</div>}
        <div style={{ marginTop: 12 }}>
          <div className="upload-section-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
            영상 링크
            <span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-muted)", marginLeft: 2 }}>최대 1시간</span>
          </div>
          <div className="video-link-row">
            <input
              className="video-link-input"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleVideoLink(); }}
              placeholder="YouTube URL을 입력하세요"
              disabled={videoLoading}
            />
            <button className="video-link-btn" onClick={handleVideoLink} disabled={videoLoading || !videoUrl.trim()}>
              {videoLoading ? <span className="spinner" style={{ width: 12, height: 12 }} /> : "분석 시작"}
            </button>
          </div>
          {videoStatus && <div className="upload-progress"><span className="spinner" style={{ width: 14, height: 14 }} />{videoStatus}</div>}
        </div>
        <div style={{ marginTop: 12 }}>
          <div className="upload-section-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
            웹 URL
            <span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-muted)", marginLeft: 2 }}>블로그·노션·레딧 등</span>
          </div>
          <div className="video-link-row">
            <input
              className="video-link-input"
              value={webUrl}
              onChange={(e) => setWebUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleWebUrl(); }}
              placeholder="웹 페이지 URL을 입력하세요"
              disabled={webLoading}
            />
            <button className="video-link-btn" onClick={handleWebUrl} disabled={webLoading || !webUrl.trim()}>
              {webLoading ? <span className="spinner" style={{ width: 12, height: 12 }} /> : "분석 시작"}
            </button>
          </div>
          {webStatus && <div className="upload-progress"><span className="spinner" style={{ width: 14, height: 14 }} />{webStatus}</div>}
        </div>
      </div>
    </div>
  );
}

function Tournament({ personas, globalKey, utilProvider, utilModel, utilApiKey, onOpenSettings }) {
  const recordHistory = useRecordHistory();
  const { notifyStart, notifyDone } = useTaskNotify("tournament");
  const { spend } = useCredits();
  const [ctx, setCtx] = useState("");
  const [fb, setFb] = useState("");
  const [ideas, setIdeas] = useState(Array(4).fill(""));
  const [sc, setSc] = useState(4);
  const [mode, setMode] = useState("mine");
  const [aiIdeas, setAiIdeas] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [phase, setPhase] = useState("input");
  const [running, setRunning] = useState(false);
  const [cr, setCr] = useState("");
  const [ft, setFt] = useState([]);
  const [sr, setSr] = useState("");
  const [srStreaming, setSrStreaming] = useState(false);
  const [activeRound, setActiveRound] = useState(0);
  const [expandedMatch, setExpandedMatch] = useState(null);
  const [dynLabels, setDynLabels] = useState({ labels: ROUND_LABELS, colors: ROUND_COLORS, emojis: ROUND_EMOJIS });
  const [pendingMatches, setPendingMatches] = useState([]);
  const [roundSummary, setRoundSummary] = useState(null);
  const [totalEntries, setTotalEntries] = useState(0);
  const [popSlot, setPopSlot] = useState(-1);
  const [stackCount, setStackCount] = useState(() => loadIdeaStack().length);
  const [conceptCount, setConceptCount] = useState(8);
  const [ideaContext, setIdeaContext] = useState("");
  const [ctxOpen, setCtxOpen] = useState(false);
  const [keyHint, setKeyHint] = useState("");
  const target = useTarget();
  const ui = (i, v) => { const c = [...ideas]; c[i] = v; setIdeas(c); };
  const adj = (n) => { const nc = Math.max(2, Math.min(32, n)); setSc(nc); const ni = [...ideas]; while (ni.length < nc) ni.push(""); setIdeas(ni.slice(0, nc)); };
  const uids = ideas.filter((x) => x.trim());
  const medals = ["🥇", "🥈", "🥉"];

  const go = async () => {
    if (mode !== "concept" && uids.length < 2) return;
    if (mode === "concept" && !ctx.trim()) return;
    if (mode !== "concept") { const ns = addToIdeaStack(uids); setStackCount(ns.length); }
    const mainPersona = pickUsablePersona(personas, globalKey);
    LOG.info(`Tournament start mode=${mode} ideas=${uids.length} persona=${mainPersona.provider}/${mainPersona.model} hasKey=${!!mainPersona.apiKey}`);
    if (!mainPersona?.apiKey) {
      setKeyHint(`AI 심판을 위해 API 키가 필요합니다. 설정에서 ${mainPersona?.provider === "openai" ? "OpenAI" : mainPersona?.provider === "gemini" ? "Gemini" : "Claude"} API 키를 입력해 주세요.`);
      return;
    }
    setKeyHint("");
    if (!spend("tournament")) return; notifyStart(); addToFeedbackStack(fb); setRunning(true);
    let aiFill = [];
    let all = [...uids];

    if (mode === "concept") {
      setPhase("filling");
      aiFill = await generateTournamentSlotIdeas(mainPersona, globalKey, [ctx, fb].filter((x) => x && String(x).trim()).join(" · ") || ctx, [], conceptCount);
      setAiIdeas(aiFill);
      all = [...aiFill];
      if (all.length < 2) { setRunning(false); setPhase("input"); return; }
    } else if (mode === "full32") {
      setPhase("filling");
      const tf = 32 - all.length;
      if (tf > 0) {
        aiFill = await generateTournamentSlotIdeas(mainPersona, globalKey, [ctx, fb].filter((x) => x && String(x).trim()).join(" · ") || ctx, uids, tf);
        setAiIdeas(aiFill);
        all = [...all, ...aiFill];
      }
      while (all.length < 32) all.push(`보조 #${all.length + 1}`);
      all = all.slice(0, 32);
    } else {
      setAiIdeas([]);
    }

    all = fisherYatesShuffle(all);
    setTotalEntries(all.length);

    const totalRounds = Math.ceil(Math.log2(all.length));
    const dl = buildRoundLabels(totalRounds);
    setDynLabels(dl);

    setPhase("bracket");
    let rem = [...all];
    const ar = [];
    let rn = 0;
    while (rem.length > 1) {
      const name = dl.labels[rn] || `R${rn + 1}`;
      setCr(`${dl.emojis[rn] || "⚔️"} ${name} 진행 중`);
      const matches = [];
      for (let i = 0; i < rem.length; i += 2) {
        if (i + 1 < rem.length) matches.push([rem[i], rem[i + 1]]);
        else matches.push([rem[i], null]);
      }
      const realMatches = matches.filter(([, b]) => b !== null);
      const byeWinners = matches.filter(([, b]) => b === null).map(([a]) => a);
      setPendingMatches(realMatches.map(([a, b], i) => ({ idx: i + 1, a, b })));

      try {
        const p = mainPersona;
        let jsonResults = [];
        if (realMatches.length > 0) {
          const tInfo = formatTargetForPrompt(target);
          const matchPrompt = `토너먼트 라운드: **${name}**\n컨텍스트: ${ctx || "성공 확률이 가장 높은 아이디어 선별"}${formatOptionalDirectionFb(fb)}${tInfo}\n\n${realMatches.map(([a, b], i) => `Match ${i + 1}:\nA: ${a}\nB: ${b}`).join("\n\n")}\n\n위 ${realMatches.length}개 대결 각각에 대해 system 지침대로 JSON 한 줄씩 출력하세요. 총 ${realMatches.length}줄.`;
          const r = await callAI(p, [{ role: "user", content: matchPrompt }], TOURNAMENT_MATCH_SYSTEM);
          const allLines = r.split("\n").map((l) => l.trim()).filter(Boolean);
          const tryParseJson = (s) => { try { return JSON.parse(s); } catch { const i2 = s.indexOf("{"); const j2 = s.lastIndexOf("}"); if (i2 >= 0 && j2 > i2) try { return JSON.parse(s.slice(i2, j2 + 1)); } catch {} return null; } };
          jsonResults = allLines.map(tryParseJson).filter(Boolean);
        }
        const winners = [];
        const rd = [];
        realMatches.forEach(([a, b], i) => {
          const jr = jsonResults.find((j) => j.match === i + 1) || jsonResults[i] || null;
          let w = a, lo = b, reason = "AI 판정", scores = null;
          if (jr) {
            reason = jr.reasoning || "AI 판정";
            if (jr.scores) {
              scores = jr.scores;
              const sa = jr.scores.A || {}, sb = jr.scores.B || {};
              const sumA = DIMS.reduce((s, d) => s + (sa[d] || 0), 0);
              const sumB = DIMS.reduce((s, d) => s + (sb[d] || 0), 0);
              w = sumB > sumA ? b : a;
              lo = w === a ? b : a;
              LOG.info(`Match ${i+1}: scoreA=${sumA} scoreB=${sumB} → winner=${w === a ? "A" : "B"} (AI said ${jr.winner || "?"})`);
            } else {
              const pick = String(jr.winner || "A").toUpperCase();
              w = pick === "B" ? b : a;
              lo = w === a ? b : a;
            }
          }
          winners.push(w);
          rd.push({ a, b, winner: w, loser: lo, reason, scores });
        });
        byeWinners.forEach(w => {
          rd.push({ a: w, b: "BYE", winner: w, loser: "BYE", reason: "부전승", scores: null });
          winners.push(w);
        });
        setPendingMatches([]);
        ar.push({ name, matches: rd });
        setRounds([...ar]);
        setActiveRound(ar.length - 1);
        rem = winners;
      } catch (err) {
        const errMsg = err?.message || "알 수 없는 오류";
        const w = [...realMatches.map(([a]) => a), ...byeWinners];
        const rd = [
          ...realMatches.map(([a, b]) => ({ a, b, winner: a, loser: b, reason: `오류로 A 자동 선택: ${errMsg}`, scores: null })),
          ...byeWinners.map(a => ({ a, b: "BYE", winner: a, loser: "BYE", reason: "부전승", scores: null })),
        ];
        setPendingMatches([]);
        ar.push({ name, matches: rd });
        setRounds([...ar]);
        setActiveRound(ar.length - 1);
        rem = w;
      }
      if (rem.length > 1) {
        const nextRn = rn + 1;
        const nextName = dl.labels[nextRn] || `R${nextRn + 1}`;
        setRoundSummary({
          roundName: name,
          winners,
          nextRoundName: nextName,
          emoji: dl.emojis[rn] || "⚔️",
          color: dl.colors[rn] || "#3182f6",
          nextEmoji: dl.emojis[nextRn] || "⚔️",
          nextColor: dl.colors[nextRn] || "#3182f6",
        });
        await new Promise((r) => setTimeout(r, 2800));
        setRoundSummary(null);
        await new Promise((r) => setTimeout(r, 200));
      }
      rn++;
    }
    setPendingMatches([]);
    setCr("📝 최종 리포트 작성 중");
    const top3 = [rem[0]];
    const sf = ar[ar.length - 1];
    const f2 = ar.length >= 2 ? ar[ar.length - 2] : null;
    if (sf?.matches[0]?.loser) top3.push(sf.matches[0].loser);
    if (f2) f2.matches.forEach((m) => { if (m.loser && !top3.includes(m.loser)) top3.push(m.loser); });
    let finalReport = "";
    setFt(top3.slice(0, 3).map((x, i) => ({ rank: i + 1, idea: x })));
    setPhase("result");
    setActiveRound(-1);
    try {
      const p = mainPersona;
      setSrStreaming(true);
      finalReport = await callAIStream(p, [{ role: "user", content: `**토너먼트 최종 투자 심사 리포트**\n컨텍스트: ${ctx || "성공 확률이 가장 높은 아이디어"}${formatOptionalDirectionFb(fb)}\n\n${top3.slice(0, 3).map((x, i) => `${i + 1}위: ${x}`).join("\n")}\n\n## 1. 순위 판정 근거\n각 아이디어가 해당 순위를 받은 핵심 이유. 5개 평가 축별 결정적 차이.\n\n## 2. 🥇 1위 아이디어 — 투자 제안서\n### Why Now?\n시장 타이밍, 기술 성숙도, 규제 환경이 왜 지금 유리한지\n### 실행 로드맵\n- 30일: 핵심 가설 검증 (실험 방법 + 성공 기준)\n- 90일: MVP + 초기 사용자 100명 확보\n- 180일: PMF 증명 + 시리즈A 준비\n- 12개월: 스케일링 전략\n### 유닛 이코노믹스\nLTV:CAC 비율, 페이백 기간, 그로스 마진 추정\n### 팀 구성 · 초기 자금\n핵심 인력(직무/연차), 필요 시드 자금, 번 레이트\n### Kill Risk & 대응\n이 아이디어를 죽일 수 있는 시나리오 3가지 + 대응\n\n## 3. 🥈🥉 차순위 아이디어 활용\n피봇 가능성, 1위와의 시너지, 독립 추진 시 조건\n\n## 4. GTM 전략\nBeachhead 시장 → 확장 경로. 채널별 예상 CAC.\n\n실제 유니콘·상장사 레퍼런스를 반드시 포함하세요.\n한국어로 작성.` }], undefined, (_chunk, full) => {
        setSr(full);
      });
      setSr(finalReport);
      setSrStreaming(false);
    } catch (e) { LOG.error(`Final report failed: ${e?.message}`); setSr(""); setSrStreaming(false); }
    setRunning(false);
    notifyDone(clipTitle(ctx || uids[0] || "토너먼트"));
    try {
      recordHistory?.({
        modeId: "tournament",
        title: clipTitle(ctx || uids[0] || "토너먼트"),
        payload: {
          ctx,
          fb,
          seedIdeas: [...uids],
          aiIdeas: aiFill,
          rounds: safeJsonClone(ar, []),
          finalTop: top3.slice(0, 3),
          finalReport,
        },
      });
      LOG.info("Tournament history saved");
    } catch (e) { LOG.error(`History save failed: ${e?.message}`); }
  };

  const reset = () => { setPhase("input"); setRounds([]); setAiIdeas([]); setFt([]); setSr(""); setActiveRound(0); setExpandedMatch(null); setPendingMatches([]); setTotalEntries(0); };

  return (
    <div>
      {phase === "input" && (
        <>
          <div className="s-label">토너먼트 컨텍스트 <span className="t-info-tip" data-tip="분석 방향을 설정하는 핵심 키워드입니다">?</span></div>
          <input type="text" value={ctx} onChange={(e) => setCtx(e.target.value)} placeholder="예: 모바일 게임 신규 컨셉, B2B SaaS 아이디어..." style={{ marginBottom: 14 }} />
          <FeedbackField value={fb} onChange={setFb} placeholder="예: 수익 모델·기술 실현성 위주로 판정해 달라…" style={{ marginBottom: 14 }} />
          <div style={{ marginBottom: 14 }}>
            <button type="button" className="idea-context-toggle" onClick={() => setCtxOpen(!ctxOpen)}>
              <span className={`toggle-arrow${ctxOpen ? " open" : ""}`}>▸</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              <span>상황 보강</span>
              {ideaContext?.trim() && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-primary)", flexShrink: 0 }} />}
            </button>
            {ctxOpen && (
              <textarea
                className="idea-context-field"
                value={ideaContext}
                onChange={(e) => setIdeaContext(e.target.value)}
                placeholder="예: 모바일 보드게임에 넣을 이벤트 아이디어야 / B2B SaaS 스타트업 / 20대 여성 타겟 뷰티 서비스..."
                rows={2}
              />
            )}
          </div>
          <div className="s-label">토너먼트 방식 <span className="t-info-tip" data-tip="아이디어 입력 방식을 선택하세요">?</span></div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {[
              { id: "mine", icon: "🎯", title: "내 아이디어만", desc: "입력한 것만으로 대결" },
              { id: "full32", icon: "🤖", title: "32강 채우기", desc: "AI가 나머지를 보충" },
              { id: "concept", icon: "⚡", title: "컨셉만 제공", desc: "AI가 자동 생성 + 자동 매칭" },
            ].map((m) => (
              <button key={m.id} type="button" onClick={() => setMode(m.id)}
                className={`t-mode-card${mode === m.id ? " active" : ""}`}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{m.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: mode === m.id ? "var(--accent-primary)" : "var(--text-primary)", letterSpacing: "-0.01em" }}>{m.title}</div>
                <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 3, lineHeight: 1.4 }}>{m.desc}</div>
              </button>
            ))}
          </div>
          {mode === "concept" ? (
            <>
              <div style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.06), rgba(49,130,246,0.04))", border: "1px solid rgba(124,58,237,0.12)", borderRadius: 12, padding: "16px", marginBottom: 14 }}>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  <strong style={{ color: "var(--text-primary)" }}>⚡ 컨셉만 제공 모드</strong>
                  <span style={{ color: "var(--text-muted)", margin: "0 6px" }}>·</span>
                  컨셉을 입력하면 AI가 아이디어를 자동 생성하고 토너먼트를 진행합니다
                </div>
              </div>
              <div className="s-label">생성할 아이디어 수</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                {[4, 8, 16, 32].map((n) => (
                  <button key={n} type="button"
                    className={`t-mode-card${conceptCount === n ? " active" : ""}`}
                    style={{ flex: "0 0 auto", padding: "8px 18px", minWidth: "auto" }}
                    onClick={() => setConceptCount(n)}
                  >{n}개</button>
                ))}
              </div>
              <div style={{ position: "sticky", bottom: 0, paddingTop: 12, paddingBottom: 8, background: "linear-gradient(0deg, var(--bg-surface-1) 60%, transparent)", zIndex: 5 }}>
                {keyHint && (
                  <div className="err-msg" style={{ marginBottom: 10 }}>
                    🔑 {keyHint}
                    {onOpenSettings && <button type="button" className="btn-cta" style={{ marginTop: 8, width: "100%", fontSize: 13 }} onClick={() => { setKeyHint(""); onOpenSettings(); }}>⚙️ 설정 열기</button>}
                  </div>
                )}
                <button type="button" className="btn-cta" onClick={go} disabled={!ctx.trim()} style={{ background: "linear-gradient(135deg, #6366f1, #2563eb)", opacity: ctx.trim() ? 1 : 0.5 }}>
                  ⚡ AI 자동 생성 & 토너먼트 시작 ({conceptCount}개)<CreditCostTag costKey="tournament" />
                </button>
                {!ctx.trim() && <div style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>컨텍스트를 입력해야 시작할 수 있습니다</div>}
              </div>
            </>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span className="s-label" style={{ margin: 0 }}>내 아이디어</span>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <button type="button" className="btn-ghost" style={{ padding: "4px 10px", fontSize: 14, minWidth: 32 }} onClick={() => adj(sc - 1)}>−</button>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--accent-primary)", minWidth: 28, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{sc}</span>
                  <button type="button" className="btn-ghost" style={{ padding: "4px 10px", fontSize: 14, minWidth: 32 }} onClick={() => adj(sc + 1)}>+</button>
                </div>
                {mode === "full32" && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>+ AI {Math.max(0, 32 - uids.length)}개</span>}
                {mode === "mine" && uids.length % 2 === 1 && uids.length >= 2 && <span style={{ fontSize: 11, color: "var(--accent-primary)", fontWeight: 600 }}>홀수 → 1팀 부전승</span>}
              </div>
              <div className="idea-stack-toolbar">
                <div style={{ fontSize: 12, color: "var(--accent-primary)", fontWeight: 600, display: "flex", alignItems: "center", gap: 5, flex: 1 }}>
                  <span>↓</span> 아이디어를 입력하세요 (최소 2개)
                </div>
                {stackCount > 0 && (
                  <button type="button" className="idea-stack-btn" onClick={() => {
                    const stack = loadIdeaStack();
                    const ni = [...ideas];
                    let filled = 0;
                    for (let si = 0; si < stack.length && filled < sc; si++) {
                      const emptyIdx = ni.findIndex((v, idx) => idx < sc && !v.trim());
                      if (emptyIdx === -1) break;
                      ni[emptyIdx] = stack[si];
                      filled++;
                    }
                    setIdeas(ni);
                  }}>📋 전체 불러오기 ({stackCount})</button>
                )}
              </div>
              <div className="tournament-slot-grid">
                {ideas.slice(0, sc).map((idea, i) => (
                  <div className={`tournament-slot-card${idea.trim() ? " has-value" : ""}`} key={i} style={{ position: "relative" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span className="tournament-slot-badge">#{String(i + 1).padStart(2, "0")}</span>
                      {idea.trim() && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                      <div style={{ flex: 1 }} />
                      <button type="button" className="idea-stack-btn" onClick={() => setPopSlot(popSlot === i ? -1 : i)} style={{ fontSize: 10.5, padding: "3px 7px" }}>불러오기</button>
                    </div>
                    <textarea
                      className="tournament-slot-textarea"
                      value={idea}
                      onChange={(e) => ui(i, e.target.value)}
                      placeholder={i === 0 ? "예: AI 기반 맞춤형 식단 추천 서비스" : `아이디어 ${i + 1}`}
                      rows={2}
                      spellCheck
                      aria-label={`아이디어 슬롯 ${i + 1}`}
                      autoComplete="off"
                    />
                    {popSlot === i && <IdeaStackPopover onSelect={(t) => ui(i, t)} onClose={() => setPopSlot(-1)} personas={personas} globalKey={globalKey} utilProvider={utilProvider} utilModel={utilModel} utilApiKey={utilApiKey} />}
                  </div>
                ))}
              </div>
              <div style={{ position: "sticky", bottom: 0, paddingTop: 12, paddingBottom: 8, background: "linear-gradient(0deg, var(--bg-surface-1) 60%, transparent)", zIndex: 5 }}>
                {keyHint && (
                  <div className="err-msg" style={{ marginBottom: 10 }}>
                    🔑 {keyHint}
                    {onOpenSettings && <button type="button" className="btn-cta" style={{ marginTop: 8, width: "100%", fontSize: 13 }} onClick={() => { setKeyHint(""); onOpenSettings(); }}>⚙️ 설정 열기</button>}
                  </div>
                )}
                <button type="button" className="btn-cta" onClick={go} disabled={uids.length < 2} style={{ opacity: uids.length < 2 ? 0.5 : 1, pointerEvents: uids.length < 2 ? "none" : "auto" }}>
                  🏆 토너먼트 시작 ({uids.length}개{mode === "full32" ? " → 32강" : mode === "mine" && uids.length % 2 === 1 ? " · 부전승 포함" : ""})<CreditCostTag costKey="tournament" />
                </button>
                {uids.length < 2 && <div style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>최소 2개의 아이디어를 입력해야 시작할 수 있습니다</div>}
              </div>
            </>
          )}
        </>
      )}

      {phase === "filling" && (() => {
        const targetN = mode === "full32" ? 32 : mode === "concept" ? conceptCount : uids.length;
        const roundName = targetN >= 32 ? "32강" : targetN >= 16 ? "16강" : targetN >= 8 ? "8강" : targetN >= 4 ? "4강" : "토너먼트";
        return (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 52, marginBottom: 16, animation: "fiu 0.6s cubic-bezier(0.33,1,0.68,1)" }}>🤖</div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 8 }}>AI가 아이디어를 {mode === "concept" ? "생성" : "보충"}하고 있어요</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>
              {mode === "concept"
                ? <>{targetN}개 생성 → <strong>{roundName}</strong> 토너먼트</>
                : <>{uids.length}개 → {targetN}개 확보 후 <strong>{roundName} 랜덤 셔플</strong></>
              }
            </div>
            <div style={{ marginTop: 24 }}><span className="spinner" style={{ width: 26, height: 26, borderTopColor: "var(--accent-primary)", borderWidth: 3 }} /></div>
            <QuoteRoller />
          </div>
        );
      })()}

      {(phase === "bracket" || phase === "result") && (
        <>
          {running && (
            <div style={{ animation: "fiu 0.3s ease-out" }}>
              <div style={{ textAlign: "center", padding: "12px 0 8px" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 18px", background: "var(--accent-primary-glow)", borderRadius: 20, fontSize: 13, fontWeight: 700, color: "var(--accent-primary)", border: "1px solid rgba(49,130,246,0.12)" }}>
                  <span className="spinner" style={{ width: 14, height: 14 }} /> {cr}<span className="rolling-dots"><span>.</span><span>.</span><span>.</span></span>
                </div>
              </div>
              {pendingMatches.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  {pendingMatches.map((pm) => (
                    <div key={pm.idx} style={{ background: "var(--bg-surface-1)", border: "1px solid var(--glass-border)", borderRadius: 12, marginBottom: 8, overflow: "hidden", opacity: 0.7 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 12px 0", gap: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", background: "var(--bg-surface-2)", padding: "2px 8px", borderRadius: 6 }}>MATCH {pm.idx}</span>
                        <span className="spinner" style={{ width: 12, height: 12 }} />
                      </div>
                      <div style={{ padding: "8px 12px", fontSize: 13, color: "var(--text-secondary)", letterSpacing: "-0.02em" }}>{pm.a}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 12px" }}>
                        <div style={{ flex: 1, height: 1, background: "var(--glass-border)" }} />
                        <span style={{ fontSize: 10, fontWeight: 800, color: "var(--text-muted)", letterSpacing: "0.05em" }}>VS</span>
                        <div style={{ flex: 1, height: 1, background: "var(--glass-border)" }} />
                      </div>
                      <div style={{ padding: "8px 12px", fontSize: 13, color: "var(--text-secondary)", letterSpacing: "-0.02em" }}>{pm.b}</div>
                    </div>
                  ))}
                </div>
              )}
              <QuoteRoller />
            </div>
          )}

          {aiIdeas.length > 0 && (
            <details style={{ marginBottom: 18 }}>
              <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--text-muted)", padding: "8px 0" }}>AI 생성 아이디어 ({aiIdeas.length}개) 펼치기</summary>
              <div className="idea-grid" style={{ marginTop: 8 }}>{aiIdeas.map((idea, i) => (<div className="idea-slot ai-filled" key={`ai-${i}`}><span className="slot-num">AI</span><span style={{ fontSize: 13, color: "#7c3aed", padding: "10px 0" }}>{idea}</span></div>))}</div>
            </details>
          )}

          {rounds.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", gap: 0, marginBottom: 16, background: "var(--bg-surface-2)", borderRadius: 10, padding: 3, overflow: "hidden" }}>
                {rounds.map((round, ri) => {
                  const isActive = ri === activeRound;
                  const rc = dynLabels.colors[ri] || "#3182f6";
                  const emoji = dynLabels.emojis[ri] || "⚔️";
                  const survivors = round.matches.length;
                  return (
                    <button type="button" key={ri} onClick={() => { setActiveRound(ri); setExpandedMatch(null); }}
                      style={{
                        flex: 1, padding: "10px 4px", border: "none", borderRadius: 8, cursor: "pointer",
                        fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: isActive ? 800 : 500,
                        background: isActive ? "var(--bg-surface-1)" : "transparent",
                        color: isActive ? rc : "var(--text-muted)",
                        boxShadow: isActive ? "var(--shadow-sm)" : "none",
                        transition: "all 0.2s cubic-bezier(0.33,1,0.68,1)",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                      }}>
                      <span style={{ fontSize: 16 }}>{emoji}</span>
                      <span>{round.name}</span>
                      <span style={{ fontSize: 9, fontWeight: 600, color: "var(--accent-success)" }}>✓</span>
                    </button>
                  );
                })}
                {phase === "result" && (
                  <button type="button" onClick={() => { setActiveRound(-1); setExpandedMatch(null); }}
                    style={{
                      flex: 1, padding: "10px 4px", border: "none", borderRadius: 8, cursor: "pointer",
                      fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: activeRound === -1 ? 800 : 500,
                      background: activeRound === -1 ? "var(--bg-surface-1)" : "transparent",
                      color: activeRound === -1 ? "#d97706" : "var(--text-muted)",
                      boxShadow: activeRound === -1 ? "var(--shadow-sm)" : "none",
                      transition: "all 0.2s cubic-bezier(0.33,1,0.68,1)",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                    }}>
                    <span style={{ fontSize: 16 }}>🏆</span>
                    <span>결과</span>
                  </button>
                )}
              </div>

              {activeRound >= 0 && activeRound < rounds.length && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 22 }}>{dynLabels.emojis[activeRound] || "⚔️"}</span>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: dynLabels.colors[activeRound] || "#3182f6", letterSpacing: "-0.03em" }}>{rounds[activeRound].name}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{rounds[activeRound].matches.length}개 매치 · 승자 {rounds[activeRound].matches.length}명 진출</div>
                      </div>
                    </div>
                    <button type="button" className="btn-ghost" style={{ padding: "6px 12px", fontSize: 11 }}
                      onClick={() => setExpandedMatch(expandedMatch === "all" ? null : "all")}>
                      {expandedMatch === "all" ? "모두 접기" : "모두 펼치기"}
                    </button>
                  </div>
                  {rounds[activeRound].matches.map((m, mi) => (
                    <MatchCard key={mi} m={m} roundIdx={activeRound} matchIdx={mi}
                      roundColor={dynLabels.colors[activeRound]}
                      expanded={expandedMatch === "all" || expandedMatch === mi}
                      onToggle={() => setExpandedMatch(expandedMatch === mi ? null : mi)} />
                  ))}
                </div>
              )}

              {activeRound === -1 && phase === "result" && ft.length > 0 && (
                <div style={{ animation: "fiu 0.5s cubic-bezier(0.33,1,0.68,1)" }}>
                  <div style={{ textAlign: "center", marginBottom: 24 }}>
                    <div style={{ fontSize: 56, marginBottom: 8 }}>🏆</div>
                    <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 4 }}>토너먼트 완료</div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{totalEntries}개 아이디어 중 성공 확률 TOP {Math.min(3, ft.length)}</div>
                  </div>
                  {ft.map((item, i) => (
                    <div className="final-rank" key={i} style={{
                      borderLeft: i === 0 ? "4px solid #f59e0b" : i === 1 ? "4px solid #94a3b8" : "4px solid #b45309",
                      background: i === 0 ? "rgba(245,158,11,0.04)" : "var(--bg-surface-1)",
                      padding: i === 0 ? "24px 20px" : "16px 20px",
                    }}>
                      <span className="rank-medal" style={{ fontSize: i === 0 ? 48 : 36 }}>{medals[i] || "🏅"}</span>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: i === 0 ? "#f59e0b" : "var(--text-muted)", marginBottom: 2 }}>{i + 1}위</div>
                        <span className="rank-title" style={{ fontSize: i === 0 ? 18 : 15 }}>{item.idea}</span>
                      </div>
                    </div>
                  ))}
                  {sr && (
                    <div className="synth-card" style={{ marginTop: 20 }}>
                      <h3>⚡ 최종 분석 리포트</h3>
                      <StreamingRichText text={sr} isStreaming={srStreaming} variant="synth" />
                    </div>
                  )}
                  <div className="report-sticky-actions">
                    <div className="report-sticky-inner">
                      <div style={{ marginTop: 10 }}>
                        <ReportExportBar entryForExport={{ modeId: "tournament", title: clipTitle(ctx || uids[0] || "토너먼트"), payload: { ctx, fb, seedIdeas: [...uids], aiIdeas, rounds, finalTop: ft, finalReport: sr } }} />
                      </div>
                      <DeepAnalysisPanel idea={ctx || uids[0] || "토너먼트"} context={ideaContext} existingReport={sr} personas={personas} globalKey={globalKey} />
                      <ReportTools reportText={sr} personas={personas} globalKey={globalKey} />
                      <SaveToArchiveBtn modeId="tournament" title={clipTitle(ctx || uids[0] || "토너먼트")} payload={{ ctx, fb, seedIdeas: [...uids], aiIdeas, rounds, finalTop: ft, finalReport: sr }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap" }}>
                    <button type="button" className="btn-cta" onClick={reset} style={{ flex: 1, background: "var(--text-primary)" }}>🔄 새 토너먼트 시작</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
      {roundSummary && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
          animation: "fiu 0.25s ease-out",
        }}>
          <div style={{
            background: "var(--bg-surface-1)", borderRadius: 20,
            padding: "28px 24px", maxWidth: 400, width: "90%",
            border: `1px solid ${roundSummary.color}35`,
            boxShadow: `0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px ${roundSummary.color}12`,
            animation: "fiu 0.35s cubic-bezier(0.33,1,0.68,1)",
          }}>
            <div style={{ textAlign: "center", marginBottom: 18 }}>
              <div style={{ fontSize: 38, marginBottom: 6 }}>{roundSummary.emoji}</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: roundSummary.color, letterSpacing: "-0.03em" }}>
                {roundSummary.roundName} 완료
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>
                {roundSummary.winners.length}명 진출
              </div>
            </div>
            <div style={{ marginBottom: 16, maxHeight: 220, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
              {roundSummary.winners.map((w, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 12px",
                  background: `${roundSummary.color}08`,
                  border: `1px solid ${roundSummary.color}18`,
                  borderRadius: 10, fontSize: 13,
                  animation: `fiu 0.3s ease-out ${Math.min(i * 0.07, 0.5)}s both`,
                }}>
                  <span style={{ fontSize: 13, color: roundSummary.color, fontWeight: 800, flexShrink: 0 }}>✓</span>
                  <span style={{ color: "var(--text-primary)", fontWeight: 600, lineHeight: 1.4 }}>{w}</span>
                </div>
              ))}
            </div>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              padding: "11px 14px",
              background: `${roundSummary.nextColor}08`,
              border: `1px solid ${roundSummary.nextColor}25`,
              borderRadius: 12,
            }}>
              <span style={{ fontSize: 20 }}>{roundSummary.nextEmoji}</span>
              <div style={{ fontSize: 13, fontWeight: 800, color: roundSummary.nextColor }}>
                {roundSummary.nextRoundName} 진행
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Feature 3: Devil's Advocate ───
function DevilsAdvocate({ personas, globalKey, utilProvider, utilModel, utilApiKey }) {
  const recordHistory = useRecordHistory();
  const target = useTarget();
  const { notifyStart, notifyDone } = useTaskNotify("devil");
  const { spend } = useCredits();
  const [idea, setIdea] = useState(""); const [fb, setFb] = useState(""); const [result, setResult] = useState(""); const [running, setRunning] = useState(false);
  const [resultStreaming, setResultStreaming] = useState(false);
  const [ideaContext, setIdeaContext] = useState("");
  const run = async () => {
    if (!idea.trim()) return;
    addLinesToIdeaStack(idea);
    if (!spend("devil")) return; notifyStart(); addToFeedbackStack(fb); setRunning(true); setResult(""); setResultStreaming(true);
    const tInfo = formatTargetForPrompt(target);
    let out = "";
    try {
      const d = personas.find(p => p.id === "devil") || personas[0]; const p = withResolvedApiKey(d, globalKey);
      out = await callAIStream(p, [{ role: "user", content: `당신은 1,000개 이상의 스타트업 실패를 분석한 Pre-mortem 전문가입니다.\n이 아이디어는 **이미 실패했습니다.** 부검을 수행하세요.\n\n**아이디어:** ${idea}${formatOptionalDirectionFb(fb)}${formatIdeaContext(ideaContext)}${tInfo}\n\n## 💀 사망 선고서\n실패 일시, 누적 투자금, 최대 도달 사용자 수를 가정하고 실패 경위를 서술하세요.\n\n## ⚠️ 치명적 실패 원인 TOP 5\n각 원인별: 발생 확률(%), 시점(개월 후), 조기 경고 신호, 유사 실패 기업 사례\n\n## 🏢 Kill Zone 분석\nGoogle, Apple, Meta, Amazon, 네이버, 카카오가 동일 영역 진입 시 시나리오. 방어 가능성 0-100%.\n\n## 🔥 최악의 시나리오 3가지\n각각: 트리거 이벤트 → 연쇄 반응 → 최종 결과\n\n## ⚖️ 규제 · 법률 지뢰밭\n개인정보, 산업규제, 라이선스, 지적재산권, 국경간 규제 리스크\n\n## 🛡️ 생존 필수 조건\n이 아이디어가 살아남으려면 **반드시** 충족해야 할 5가지 전제 조건\n\n## 💊 처방전 + 피봇 옵션\n각 실패 원인별 구체적 대응 전략. 원래 아이디어가 안 되면 가능한 피봇 방향 2가지.\n\n실제 실패한 기업 사례(CB Insights 스타트업 실패 사유 데이터 참조)를 반드시 포함.\n한국어로.` }], undefined, (_chunk, full) => { setResult(full); });
      setResult(out);
    } catch (err) { out = `오류: ${err.message}`; setResult(out); }
    setResultStreaming(false); setRunning(false);
    notifyDone(clipTitle(idea));
    recordHistory?.({ modeId: "devil", title: clipTitle(idea), payload: { idea, fb, result: out } });
  };
  return (<div>
    <div className="s-label">검증할 아이디어</div>
    <IdeaInput value={idea} onChange={setIdea} placeholder="극한 검증할 아이디어를 입력하세요. 살아남으면 진짜입니다..." style={{ marginBottom: 16 }} context={ideaContext} onContextChange={setIdeaContext} personas={personas} globalKey={globalKey} utilProvider={utilProvider} utilModel={utilModel} utilApiKey={utilApiKey} />
    <FeedbackField value={fb} onChange={setFb} placeholder="예: 규제 리스크·팀 역량 위주로 파고들어 달라…" style={{ marginBottom: 16 }} />
    <button className="btn-cta" onClick={run} disabled={running || !idea.trim()}>{running ? <><span className="spinner" /> Pre-mortem 진행 중<span className="loading-dots" /></> : <>Pre-mortem 시작<CreditCostTag costKey="devil" /></>}</button>
    {running && <QuoteRoller />}
    {result && (<><div className="r-card" style={{ marginTop: 20, borderLeft: "3px solid var(--accent-error)" }}><div className="r-card-header"><span className="r-card-icon">💀</span><span className="r-card-title">Pre-mortem 분석 리포트</span></div>{result.startsWith("오류:") ? <div className="err-msg">{result}</div> : <StreamingRichText text={result} isStreaming={resultStreaming} />}</div><div className="report-sticky-actions"><div className="report-sticky-inner"><div style={{ marginTop: 10 }}><ReportExportBar entryForExport={{ modeId: "devil", title: clipTitle(idea), payload: { idea, fb, result } }} /></div><DeepAnalysisPanel idea={idea} context={ideaContext} existingReport={result} personas={personas} globalKey={globalKey} /><ReportTools reportText={result} personas={personas} globalKey={globalKey} /><SaveToArchiveBtn modeId="devil" title={clipTitle(idea)} payload={{ idea, fb, result }} /></div></div></>)}
  </div>);
}

// SCAMPER 응답에서 S/C/A/M/P/E/R 섹션 추출 (모델별 마크다운 차이 흡수)
function parseScamperResponse(raw) {
  const r = raw.replace(/\r\n/g, "\n");
  const init = () => Object.fromEntries(SCAMPER_AXES.map(a => [a.key, ""]));
  const validKeys = new Set(SCAMPER_AXES.map(a => a.key));

  const tryLineScan = () => {
    const parsed = init();
    const header =
      /^(#{0,6}\s*)?(\*{0,3}\s*)?([SCAMPER])(?:\s*\*{0,2})?\s*[-–—:：．]\s*(.*)$/i;
    let current = null;
    for (const line of r.split("\n")) {
      const m = line.match(header);
      if (m) {
        const letter = m[3].toUpperCase();
        if (validKeys.has(letter)) {
          current = letter;
          const tail = (m[4] || "").trim();
          parsed[current] = tail ? `${tail}\n` : "";
          continue;
        }
      }
      if (current) parsed[current] += `${line}\n`;
    }
    return parsed;
  };

  const tryOrderSplit = (text) => {
    const parsed = init();
    const headerRe =
      /(?:^|\n)(\s*(?:#{1,6}\s*|\*{1,2}\s*)?([SCAMPER])\s*(?:\*{1,2}\s*)?[-–—:：．]\s*)/gi;
    const hits = [];
    let m;
    while ((m = headerRe.exec(text)) !== null) {
      hits.push({ key: m[2].toUpperCase(), headerStart: m.index, headerEnd: m.index + m[0].length });
    }
    for (let i = 0; i < hits.length; i++) {
      const { key, headerEnd } = hits[i];
      if (!validKeys.has(key)) continue;
      const to = i + 1 < hits.length ? hits[i + 1].headerStart : text.length;
      const chunk = text.slice(headerEnd, to).trim();
      parsed[key] = chunk ? `${chunk}\n` : "";
    }
    return parsed;
  };

  const countFilled = (p) => SCAMPER_AXES.filter(a => p[a.key]?.trim()).length;

  let parsed = tryLineScan();
  if (countFilled(parsed) < 2) {
    const alt = tryOrderSplit(r);
    if (countFilled(alt) > countFilled(parsed)) parsed = alt;
  }

  if (countFilled(parsed) < 2) {
    const legacy = {};
    let ck = null;
    r.split("\n").forEach((l) => {
      const m = l.match(/^\*?\*?([SCAMPER])\s*[-–—]\s/i);
      if (m) {
        ck = m[1].toUpperCase();
        legacy[ck] = "";
      } else if (ck) legacy[ck] += `${l}\n`;
    });
    if (countFilled(legacy) > countFilled(parsed)) parsed = legacy;
  }

  if (countFilled(parsed) < 2) {
    const s = r.split(/\*{1,2}\s*([SCAMPER])\s*[-–—]/i);
    if (s.length > 3) {
      const merged = init();
      for (let i = 1; i < s.length; i += 2) {
        const key = s[i]?.toUpperCase();
        if (validKeys.has(key)) merged[key] = (s[i + 1] || "").trim();
      }
      if (countFilled(merged) > countFilled(parsed)) parsed = merged;
    }
  }

  const filled = countFilled(parsed);
  if (filled === 0 && r.trim()) return { __full: r.trim() };

  const nr = {};
  SCAMPER_AXES.forEach((a) => {
    nr[a.key] = parsed[a.key]?.trim() || "";
  });
  return nr;
}

// ─── Feature 4: SCAMPER ───
function ScamperMode({ personas, globalKey, utilProvider, utilModel, utilApiKey }) {
  const recordHistory = useRecordHistory();
  const target = useTarget();
  const { notifyStart, notifyDone } = useTaskNotify("scamper");
  const { spend } = useCredits();
  const [idea, setIdea] = useState(""); const [fb, setFb] = useState(""); const [results, setResults] = useState({}); const [running, setRunning] = useState(false);
  const [ideaContext, setIdeaContext] = useState("");
  const [streamText, setStreamText] = useState("");
  const run = async () => {
    if (!idea.trim()) return;
    addLinesToIdeaStack(idea);
    if (!spend("scamper")) return; notifyStart(); addToFeedbackStack(fb); setRunning(true); setResults({}); setStreamText("");
    const tInfo = formatTargetForPrompt(target);
    let snapshot = {};
    try {
      const p = pickUsablePersona(personas, globalKey);
      const prompt =
        `아이디어: "${idea}"${formatOptionalDirectionFb(fb)}${formatIdeaContext(ideaContext)}${tInfo}\n\nSCAMPER 기법을 **실전 비즈니스 전략** 수준으로 적용하세요.\n\n` +
        `각 축마다:\n1. **파생 아이디어 2-3개** — 단순 변형이 아닌, 실제 론칭 가능한 제품/서비스 수준으로 구체적으로\n` +
        `2. **벤치마크** — 해당 SCAMPER를 실제로 적용해 성공한 기업 사례 (있다면)\n` +
        `3. **예상 타깃 · 시장 규모** — 각 파생 아이디어의 초기 타깃 고객층과 TAM 추정\n\n` +
        `반드시 아래 7개 축을 빠짐없이 쓰고, 각 축은 새 줄에서 다음 중 하나 형태로 시작하세요 (대문자 한 글자 S,C,A,M,P,E,R 만):\n` +
        `예: **S - 대체:** 또는 ### S - Substitute\n\n` +
        `${SCAMPER_AXES.map((a) => `### ${a.key} - ${a.name} (${a.desc})`).join("\n")}\n\n한국어로 답하세요.`;
      const r = await callAIStream(p, [{ role: "user", content: prompt }], undefined, (_chunk, full) => {
        setStreamText(full);
      }, { maxTokens: 8000 });
      setStreamText("");
      const parsed = parseScamperResponse(r);
      if (parsed.__full) {
        snapshot = { __full: parsed.__full };
        setResults(snapshot);
      } else {
        const nr = {};
        SCAMPER_AXES.forEach((a) => { nr[a.key] = parsed[a.key]?.trim() || "분석 결과 없음"; });
        snapshot = nr;
        setResults(nr);
      }
    } catch (err) {
      snapshot = { error: err.message };
      setResults(snapshot);
    }
    setRunning(false);
    notifyDone(clipTitle(idea));
    if (!snapshot.error) recordHistory?.({ modeId: "scamper", title: clipTitle(idea), payload: { idea, fb, results: snapshot } });
  };
  return (<div>
    <div className="s-label">원본 아이디어</div>
    <IdeaInput value={idea} onChange={setIdea} placeholder="SCAMPER 기법으로 확장할 아이디어를 입력하세요..." style={{ marginBottom: 16 }} minHeight={80} context={ideaContext} onContextChange={setIdeaContext} personas={personas} globalKey={globalKey} utilProvider={utilProvider} utilModel={utilModel} utilApiKey={utilApiKey} />
    <FeedbackField value={fb} onChange={setFb} placeholder="예: B2B 시나리오·구독 모델 위주로 확장해 달라…" style={{ marginBottom: 16 }} />
    <button className="btn-cta" onClick={run} disabled={running || !idea.trim()}>{running ? <><span className="spinner" /> SCAMPER 분석 중<span className="loading-dots" /></> : <>SCAMPER 확장 시작<CreditCostTag costKey="scamper" /></>}</button>
    {running && streamText && <div style={{ marginTop: 16 }}><StreamingRichText text={streamText} isStreaming={true} variant="synth" /></div>}
    {running && !streamText && <QuoteRoller />}
    {Object.keys(results).length > 0 && !results.error && !results.__full && (() => {
      const axisColors = ["#3182f6", "#7c3aed", "#059669", "#d97706", "#ec4899", "#dc2626", "#0891b2"];
      return (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <span style={{ fontSize: 22 }}>💡</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>SCAMPER 확장 결과</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>7개 혁신 축 × 실전 비즈니스 전략</div>
            </div>
          </div>
          {SCAMPER_AXES.map((a, idx) => {
            const c = axisColors[idx];
            const text = results[a.key] || "";
            if (!text.trim()) return null;
            return (
              <div key={a.key} className="r-card" style={{ marginBottom: 14, borderLeft: `4px solid ${c}`, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, right: 0, width: 90, height: 90, background: `radial-gradient(circle at 100% 0%, ${c}10, transparent 70%)`, pointerEvents: "none" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span style={{ width: 36, height: 36, borderRadius: 10, background: `${c}12`, border: `1px solid ${c}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{a.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#fff", background: c, padding: "2px 10px", borderRadius: 8, letterSpacing: "0.03em" }}>{a.key}</span>
                      <span style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>{a.name}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{a.desc}</div>
                  </div>
                </div>
                <div style={{ padding: "12px 14px", borderRadius: 10, background: "var(--bg-surface-2)", border: "1px solid var(--glass-border)" }}>
                  <RichText text={text} />
                </div>
              </div>
            );
          })}
        </div>
      );
    })()}
    {results.__full && (<div className="r-card" style={{ marginTop: 20, borderLeft: "4px solid var(--accent-primary)" }}><div className="r-card-header"><span className="r-card-icon">💡</span><span className="r-card-title">SCAMPER 전체 응답</span></div><RichText text={results.__full} /></div>)}
    {results.error && <div className="err-msg" style={{ marginTop: 16 }}>오류: {results.error}</div>}
    {(Object.keys(results).length > 0 && !results.error) && !running && <><div className="report-sticky-actions"><div className="report-sticky-inner"><div style={{ marginTop: 10 }}><ReportExportBar entryForExport={{ modeId: "scamper", title: clipTitle(idea), payload: { idea, fb, results } }} /></div><DeepAnalysisPanel idea={idea} context={ideaContext} existingReport={Object.values(results).join("\n\n")} personas={personas} globalKey={globalKey} /><ReportTools reportText={Object.values(results).join("\n\n")} personas={personas} globalKey={globalKey} /><SaveToArchiveBtn modeId="scamper" title={clipTitle(idea)} payload={{ idea, fb, results }} /></div></div></>}
  </div>);
}

// ─── Feature 5: DNA Map ───
function DNAMap({ personas, globalKey, utilProvider, utilModel, utilApiKey }) {
  const recordHistory = useRecordHistory();
  const target = useTarget();
  const { notifyStart, notifyDone } = useTaskNotify("dna");
  const { spend } = useCredits();
  const [ideas, setIdeas] = useState(""); const [fb, setFb] = useState(""); const [analysis, setAnalysis] = useState(null); const [running, setRunning] = useState(false);
  const [ideaContext, setIdeaContext] = useState("");
  const cc = ["#3182f6", "#f59e0b", "#7c3aed", "#059669", "#dc2626", "#ec4899"];
  const run = async () => {
    if (!ideas.trim()) return;
    addLinesToIdeaStack(ideas);
    if (!spend("dna")) return; notifyStart(); addToFeedbackStack(fb); setRunning(true); setAnalysis(null);
    const tInfo = formatTargetForPrompt(target);
    let snapshot = null;
    try {
      const p = pickUsablePersona(personas, globalKey);
      const dnaUser = `아래 아이디어 목록을 분석합니다.${formatOptionalDirectionFb(fb)}${formatIdeaContext(ideaContext)}${tInfo}

[목록]
${ideas}

다음을 수행하세요.
1) 의미가 비슷한 아이디어를 3~5개 클러스터로 묶기
2) 클러스터별 키워드
3) 블루오션(틈새) 후보 3개 이상
4) 시너지가 나는 조합 2~3개

출력: **JSON 한 덩어리만** (앞뒤 설명·코드펜스 금지).
스키마의 **영문 키**는 그대로 두고, **모든 문자열 값**(name, ideas 배열 원소, keywords, area, suggestion, reason, synergies의 ideas·combined·power)은 **반드시 한국어**로만 채우세요. 영어 문장을 넣지 마세요.

{"clusters":[{"name":"한국어 클러스터명","color":"#3182f6","ideas":["한국어"],"keywords":["한국어"]}],"blueOceans":[{"area":"한국어","suggestion":"한국어","reason":"한국어"}],"synergies":[{"ideas":["한국어","한국어"],"combined":"한국어","power":"한국어"}]}`;
      const r = await callAI(p, [{ role: "user", content: dnaUser }], DNA_MAP_SYSTEM);
      snapshot = safeParseJsonText(r);
      if (!snapshot) throw new Error("DNA 맵 JSON 파싱 실패");
      setAnalysis(snapshot);
    } catch {
      try {
        const p2 = pickUsablePersona(personas, globalKey);
        const t = await callAI(
          p2,
          [{ role: "user", content: `아래 아이디어에 대해 클러스터·블루오션·시너지를 분석하세요. 제목·본문·불릿 **전부 한국어**만 사용하세요. 영어 단락이나 영어 소제목을 쓰지 마세요.${formatOptionalDirectionFb(fb)}${formatIdeaContext(ideaContext)}\n\n${ideas}` }],
          DNA_MAP_SYSTEM
        );
        snapshot = { text: t };
        setAnalysis(snapshot);
      } catch (e2) {
        snapshot = { error: e2.message };
        setAnalysis(snapshot);
      }
    }
    setRunning(false);
    notifyDone(clipTitle(ideas.split("\n").find((l) => l.trim()) || ideas));
    if (snapshot) recordHistory?.({ modeId: "dna", title: clipTitle(ideas.split("\n").find((l) => l.trim()) || ideas), payload: { ideasText: ideas, fb, analysis: safeJsonClone(snapshot, null) } });
  };
  return (<div>
    <div className="s-label">아이디어 목록 (한 줄에 하나씩)</div>
    <IdeaInput value={ideas} onChange={setIdeas} placeholder={"예:\nAI 기반 맞춤형 운동 코치 앱\n실시간 번역 화상회의 플랫폼\n구독형 로컬 식재료 배송"} style={{ marginBottom: 16 }} minHeight={130} context={ideaContext} onContextChange={setIdeaContext} personas={personas} globalKey={globalKey} utilProvider={utilProvider} utilModel={utilModel} utilApiKey={utilApiKey} />
    <FeedbackField value={fb} onChange={setFb} placeholder="예: 시너지 조합·블루오션 후보를 하드웨어 쪽으로…" style={{ marginBottom: 16 }} />
    <button className="btn-cta" onClick={run} disabled={running || !ideas.trim()}>{running ? <><span className="spinner" /> DNA 분석 중<span className="loading-dots" /></> : <>아이디어 DNA 분석<CreditCostTag costKey="dna" /></>}</button>
    {running && <QuoteRoller />}
    {analysis && !analysis.error && !analysis.text && (<div style={{ marginTop: 20 }}>
      <div className="s-label">🔬 클러스터 맵</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
        {analysis.clusters?.map((cl, ci) => (<div key={ci} style={{ background: `${cl.color || cc[ci]}08`, border: `1px solid ${cl.color || cc[ci]}20`, borderRadius: 10, padding: 16, flex: "1 1 250px", minWidth: 200 }}>
          <div style={{ fontWeight: 800, marginBottom: 6, fontSize: 14, letterSpacing: "-0.02em", color: cl.color || cc[ci] }}>{cl.name}</div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>{cl.keywords?.map((kw, ki) => <span key={ki} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: `${cl.color || cc[ci]}15`, color: cl.color || cc[ci] }}>#{kw}</span>)}</div>
          {cl.ideas?.map((idea, ii) => <div key={ii} style={{ fontSize: 13, padding: "3px 0", color: "var(--text-primary)" }}>· {idea}</div>)}
        </div>))}
      </div>
      {analysis.blueOceans?.length > 0 && (<><div className="s-label">🌊 블루오션 제안</div>{analysis.blueOceans.map((bo, i) => (<div className="r-card" key={i} style={{ borderLeft: "3px solid var(--accent-primary)" }}><div style={{ fontWeight: 700, color: "var(--accent-primary)", marginBottom: 4, fontSize: 14 }}>{bo.area}</div><div style={{ color: "var(--text-primary)", marginBottom: 3, fontSize: 14 }}>💡 {bo.suggestion}</div><div style={{ fontSize: 12, color: "var(--text-muted)" }}>{bo.reason}</div></div>))}</>)}
      {analysis.synergies?.length > 0 && (<><div className="s-label" style={{ marginTop: 16 }}>⚡ 시너지 조합</div>{analysis.synergies.map((syn, i) => (<div className="synth-card" key={i} style={{ marginBottom: 10 }}><div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>{syn.ideas?.map((idea, ii) => (<span key={ii}><span className="chip active" style={{ cursor: "default", fontSize: 12 }}>{idea}</span>{ii < syn.ideas.length - 1 && <span style={{ margin: "0 2px", color: "var(--text-muted)", fontSize: 12 }}>+</span>}</span>))}</div><div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 3, fontSize: 14 }}>→ {syn.combined}</div><div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{syn.power}</div></div>))}</>)}
    </div>)}
    {analysis?.text && <div className="r-card" style={{ marginTop: 20 }}><RichText text={analysis.text} /></div>}
    {analysis?.error && <div className="err-msg" style={{ marginTop: 16 }}>오류: {analysis.error}</div>}
    {analysis && !analysis.error && !running && <><div className="report-sticky-actions"><div className="report-sticky-inner"><div style={{ marginTop: 10 }}><ReportExportBar entryForExport={{ modeId: "dna", title: clipTitle(ideas.split("\n").find(l => l.trim()) || ideas), payload: { ideasText: ideas, fb, analysis } }} /></div><DeepAnalysisPanel idea={ideas} context={ideaContext} existingReport={JSON.stringify(analysis)} personas={personas} globalKey={globalKey} /><ReportTools reportText={JSON.stringify(analysis)} personas={personas} globalKey={globalKey} /><SaveToArchiveBtn modeId="dna" title={clipTitle(ideas.split("\n").find(l => l.trim()) || ideas)} payload={{ ideasText: ideas, fb, analysis }} /></div></div></>}
  </div>);
}

// ─── Feature 6: Market Validation ───
function MarketValidation({ personas, globalKey, utilProvider, utilModel, utilApiKey }) {
  const recordHistory = useRecordHistory();
  const target = useTarget();
  const { notifyStart, notifyDone } = useTaskNotify("market");
  const { spend } = useCredits();
  const [idea, setIdea] = useState(""); const [fb, setFb] = useState(""); const [result, setResult] = useState(""); const [running, setRunning] = useState(false);
  const [resultStreaming, setResultStreaming] = useState(false);
  const [ideaContext, setIdeaContext] = useState("");
  const run = async () => {
    if (!idea.trim()) return;
    addLinesToIdeaStack(idea);
    if (!spend("market")) return; notifyStart(); addToFeedbackStack(fb); setRunning(true); setResult(""); setResultStreaming(true);
    const tInfo = formatTargetForPrompt(target);
    let out = "";
    const marketPrompt = `**투자 심사급 시장 검증 리포트**를 작성하세요.\n\n**아이디어:** ${idea}${formatOptionalDirectionFb(fb)}${formatIdeaContext(ideaContext)}${tInfo}\n\n웹 검색을 최대한 활용하여 아래 구조로 분석하세요:\n\n## 1. 시장 규모 (TAM → SAM → SOM)\n보텀업 산출 방식으로 구체적 수치. 출처 명시. CAGR 포함.\n\n## 2. 경쟁 환경 매핑\n직접 경쟁 3-5개(각 사의 펀딩/매출/사용자 수), 간접 경쟁 3개, 잠재 빅테크 진입 가능성\n\n## 3. 최신 산업 트렌드 (2024-2025)\n이 시장에 영향을 미치는 기술·규제·소비자 행동 변화\n\n## 4. 성공 · 실패 사례 분석\n유사 분야 성공 기업의 핵심 성공 요인 + 실패 기업의 사망 원인\n\n## 5. 차별화 기회\n기존 경쟁사가 놓치고 있는 Unmet Need, 가치 곡선 분석\n\n## 6. Go-to-Market 전략\nBeachhead 시장 선정 → 채널 전략 → CAC 추정 → 확장 경로\n\n## 7. 투자 매력도\n이 시장에 VC가 투자하는 이유/하지 않는 이유. 최근 관련 펀딩 딜.\n\n한국어로.`;
    try {
      const investorPersona = personas.find((pp) => pp.id === "investor") || personas.find((pp) => pp.provider === "claude") || personas[0];
      const ak = withResolvedApiKey(investorPersona, globalKey).apiKey;
      if (!ak) throw new Error("Claude 웹검색 불가 → 폴백");
      const res = await fetch(ANTHROPIC_MESSAGES_URL, { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": ak, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 16000, stream: true, tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }], messages: [{ role: "user", content: marketPrompt }] }) });
      if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") continue;
          try {
            const ev = JSON.parse(json);
            if (ev.type === "content_block_delta" && ev.delta?.text) { out += ev.delta.text; setResult(out); }
          } catch {}
        }
      }
      if (!out) throw new Error("웹검색 응답에 텍스트 없음 → 폴백");
      setResult(out);
    } catch (e1) {
      LOG.warn?.("시장검증 웹검색 실패, 폴백:", e1?.message);
      out = "";
      try {
        const p = pickUsablePersona(personas, globalKey);
        if (!p?.apiKey) throw new Error("API 키가 설정되지 않았습니다. 설정(⚙️)에서 API 키를 입력해 주세요.");
        out = await callAIStream(p, [{ role: "user", content: `**투자 심사급 시장 분석** (지식 기반):\n\n아이디어: ${idea}${formatOptionalDirectionFb(fb)}${formatIdeaContext(ideaContext)}${tInfo}\n\n## 1. TAM/SAM/SOM (보텀업 추정)\n## 2. 경쟁 매핑 (직접 3개 + 간접 3개 + 빅테크 진입 가능성)\n## 3. 차별화 기회 (Unmet Need, 가치 곡선)\n## 4. 리스크 (시장/기술/규제/경쟁)\n## 5. GTM 전략 (Beachhead → 확장 경로)\n## 6. 투자 매력도 판정\n\n실제 기업·시장 레퍼런스를 반드시 포함하세요. 한국어로.` }], undefined, (_chunk, full) => { setResult(full); });
        if (!out || !out.trim()) throw new Error("AI 응답이 비어있습니다. 잠시 후 다시 시도해 주세요.");
        setResult(out);
      } catch (e2) { out = `오류: ${e2.message}`; setResult(out); }
    }
    setResultStreaming(false); setRunning(false);
    notifyDone(clipTitle(idea));
    recordHistory?.({ modeId: "market", title: clipTitle(idea), payload: { idea, fb, result: out } });
  };
  return (<div>
    <div className="s-label">검증할 아이디어</div>
    <IdeaInput value={idea} onChange={setIdea} placeholder="시장 검증할 아이디어를 입력하세요..." style={{ marginBottom: 16 }} context={ideaContext} onContextChange={setIdeaContext} personas={personas} globalKey={globalKey} utilProvider={utilProvider} utilModel={utilModel} utilApiKey={utilApiKey} />
    <FeedbackField value={fb} onChange={setFb} placeholder="예: 경쟁사 펀딩·최근 뉴스 위주로…" style={{ marginBottom: 16 }} />
    <button className="btn-cta" onClick={run} disabled={running || !idea.trim()}>{running ? <><span className="spinner" /> 시장 조사 중<span className="loading-dots" /></> : <>시장 검증 시작<CreditCostTag costKey="market" /></>}</button>
    {running && <QuoteRoller />}
    {result && (<><div className="r-card" style={{ marginTop: 20, borderLeft: "3px solid var(--accent-success)" }}><div className="r-card-header"><span className="r-card-icon">🔍</span><span className="r-card-title">시장 검증 리포트</span></div>{result.startsWith("오류:") ? <div className="err-msg">{result}</div> : <StreamingRichText text={result} isStreaming={resultStreaming} />}</div><div className="report-sticky-actions"><div className="report-sticky-inner"><div style={{ marginTop: 10 }}><ReportExportBar entryForExport={{ modeId: "market", title: clipTitle(idea), payload: { idea, fb, result } }} /></div><DeepAnalysisPanel idea={idea} context={ideaContext} existingReport={result} personas={personas} globalKey={globalKey} /><ReportTools reportText={result} personas={personas} globalKey={globalKey} /><SaveToArchiveBtn modeId="market" title={clipTitle(idea)} payload={{ idea, fb, result }} /></div></div></>)}
  </div>);
}

// ─── Feature: 경쟁 환경 스캐너 ───
function CompeteScan({ personas, globalKey, utilProvider, utilModel, utilApiKey }) {
  const recordHistory = useRecordHistory();
  const target = useTarget();
  const { notifyStart, notifyDone } = useTaskNotify("compete");
  const { spend } = useCredits();
  const [idea, setIdea] = useState(""); const [fb, setFb] = useState(""); const [result, setResult] = useState(""); const [running, setRunning] = useState(false);
  const [resultStreaming, setResultStreaming] = useState(false);
  const [ideaContext, setIdeaContext] = useState("");
  const run = async () => {
    if (!idea.trim()) return;
    addLinesToIdeaStack(idea);
    if (!spend("compete")) return; notifyStart(); addToFeedbackStack(fb); setRunning(true); setResult(""); setResultStreaming(true);
    const tInfo = formatTargetForPrompt(target);
    let out = "";
    try {
      const base = personas.find(pp => pp.id === "compete") || personas[0];
      const p = withResolvedApiKey(base, globalKey);
      out = await callAIStream(p, [{ role: "user", content: `당신은 CB Insights·Crunchbase·PitchBook 데이터를 기반으로 경쟁 환경을 분석하는 전문 애널리스트입니다.\n\n**아이디어:** ${idea}${formatOptionalDirectionFb(fb)}${formatIdeaContext(ideaContext)}${tInfo}\n\n아래 구조로 **유사 제품·서비스·플랫폼**을 빠짐없이 탐색하세요:\n\n## 1. 직접 경쟁사 (5~10개)\n각 서비스별:\n- **이름** · 웹사이트 URL\n- 한 줄 설명\n- 펀딩 규모 / 추정 매출 / 사용자 수\n- 핵심 차별점\n- 약점 (우리가 공략 가능한 포인트)\n\n## 2. 간접 경쟁사 (3~5개)\n유사한 니즈를 다른 방식으로 해결하는 서비스\n\n## 3. 글로벌 벤치마크\n해외에서 성공한 유사 모델 (특히 미국·중국·유럽)\n\n## 4. 최근 진입자 & 트렌드\n최근 1-2년 내 신규 진입한 경쟁자, 시장 트렌드 변화\n\n## 5. 빅테크 위협 분석\nGoogle/Apple/Meta/Amazon/네이버/카카오의 동일 영역 진출 가능성\n\n## 6. 경쟁 우위 전략 제안\n이 경쟁 환경에서 차별화할 수 있는 구체적 전략 3가지\n\n실제 존재하는 기업·서비스명을 사용하세요. 한국어로 답변.` }], undefined, (_chunk, full) => { setResult(full); });
      setResult(out);
    } catch (err) { out = `오류: ${err.message}`; setResult(out); }
    setResultStreaming(false); setRunning(false);
    notifyDone(clipTitle(idea));
    recordHistory?.({ modeId: "compete", title: clipTitle(idea), payload: { idea, fb, result: out } });
  };
  return (<div>
    <div className="s-label">탐색할 아이디어</div>
    <IdeaInput value={idea} onChange={setIdea} placeholder="유사 제품·서비스를 탐색할 아이디어를 입력하세요..." style={{ marginBottom: 12 }} context={ideaContext} onContextChange={setIdeaContext} personas={personas} globalKey={globalKey} utilProvider={utilProvider} utilModel={utilModel} utilApiKey={utilApiKey} />
    <FeedbackField value={fb} onChange={setFb} placeholder="예: 국내 스타트업·해외 직접 경쟁사 위주로…" style={{ marginBottom: 12 }} />
    <button className="btn-cta" onClick={run} disabled={running || !idea.trim()}>{running ? <><span className="spinner" /> 경쟁 환경 스캔 중<span className="loading-dots" /></> : <>🎯 경쟁 환경 스캔<CreditCostTag costKey="compete" /></>}</button>
    {running && <QuoteRoller />}
    {result && (<><div className="r-card" style={{ marginTop: 20, borderLeft: "3px solid #f59e0b" }}><div className="r-card-header"><span className="r-card-icon">🎯</span><span className="r-card-title">경쟁 환경 분석 리포트</span></div>{result.startsWith("오류:") ? <div className="err-msg">{result}</div> : <StreamingRichText text={result} isStreaming={resultStreaming} />}</div><div className="report-sticky-actions"><div className="report-sticky-inner"><div style={{ marginTop: 10 }}><ReportExportBar entryForExport={{ modeId: "compete", title: clipTitle(idea), payload: { idea, fb, result } }} /></div><DeepAnalysisPanel idea={idea} context={ideaContext} existingReport={result} personas={personas} globalKey={globalKey} /><ReportTools reportText={result} personas={personas} globalKey={globalKey} /><SaveToArchiveBtn modeId="compete" title={clipTitle(idea)} payload={{ idea, fb, result }} /></div></div></>)}
  </div>);
}

// ─── Feature: 레퍼런스 허브 ───
function ReferenceHub({ personas, globalKey, utilProvider, utilModel, utilApiKey }) {
  const recordHistory = useRecordHistory();
  const target = useTarget();
  const { notifyStart, notifyDone } = useTaskNotify("refhub");
  const { spend } = useCredits();
  const [idea, setIdea] = useState(""); const [fb, setFb] = useState(""); const [results, setResults] = useState([]); const [running, setRunning] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [ideaContext, setIdeaContext] = useState("");

  const search = async (isMore = false) => {
    if (!idea.trim()) return;
    if (!isMore) addLinesToIdeaStack(idea);
    if (!isMore) { if (!spend("refhub")) return; notifyStart(); addToFeedbackStack(fb); }
    if (isMore) setLoadingMore(true); else { setRunning(true); setResults([]); }
    const tInfo = formatTargetForPrompt(target);
    const existing = isMore ? results.map(r => r.title || r.name).join(", ") : "";
    let mergedForHistory = [];
    try {
      const base = personas.find(pp => pp.id === "refhub") || personas[0];
      const p = withResolvedApiKey(base, globalKey);
      const prompt = isMore
        ? `이전에 추천한 레퍼런스: ${existing}\n\n아이디어: "${idea}"${formatOptionalDirectionFb(fb)}${formatIdeaContext(ideaContext)}${tInfo}\n\n위 목록과 **중복되지 않는** 새로운 레퍼런스 20개를 추가로 발굴하세요. 이전과 같은 JSON 배열 형식으로만 응답.`
        : `당신은 세계 최고의 리서치 애널리스트입니다. 퍼플렉시티 수준의 깊이로 관련 레퍼런스를 발굴하세요.\n\n**아이디어:** ${idea}${formatOptionalDirectionFb(fb)}${formatIdeaContext(ideaContext)}${tInfo}\n\n아래 카테고리별로 **총 20개** 레퍼런스를 찾아주세요:\n\n1. **관련 웹사이트·블로그** (5개) - 핵심 인사이트를 제공하는 사이트\n2. **커뮤니티** (5개) - Reddit, X(Twitter), 디시코드, Product Hunt, 네이버 카페, 오픈채팅 등\n3. **유튜브·팟캐스트** (5개) - 관련 콘텐츠 크리에이터, 채널\n4. **리서치·보고서** (5개) - 시장 리포트, 학술 자료, 뉴스레터\n\n각 항목:\n- title: 이름/제목\n- url: 가능한 실제 URL (모르면 검색 URL)\n- category: website/community/youtube/research 중 하나\n- desc: 왜 이 리소스가 유용한지 1-2줄\n- subscribers: 구독자/회원 수 (추정)\n\nJSON 배열로만 응답: [{title,url,category,desc,subscribers}]`;
      const r = await callAI(p, [{ role: "user", content: prompt }]);
      const cleaned = r.replace(/```json|```/g, "").trim();
      let parsed = [];
      try { parsed = JSON.parse(cleaned); } catch {
        const i = cleaned.indexOf("["); const j = cleaned.lastIndexOf("]");
        if (i >= 0 && j > i) try { parsed = JSON.parse(cleaned.slice(i, j + 1)); } catch {}
      }
      if (Array.isArray(parsed) && parsed.length) {
        mergedForHistory = isMore ? [...results, ...parsed] : parsed;
        if (isMore) setResults((prev) => [...prev, ...parsed]);
        else setResults(parsed);
      } else {
        mergedForHistory = isMore ? results : [{ title: "전체 응답", desc: r, category: "website", url: "" }];
        setResults(isMore ? results : mergedForHistory);
      }
    } catch (err) {
      mergedForHistory = [{ title: `오류: ${err.message}`, desc: "", category: "website", url: "" }];
      if (!isMore) setResults(mergedForHistory);
    }
    if (isMore) setLoadingMore(false); else setRunning(false);
    if (!isMore) notifyDone(clipTitle(idea));
    if (!isMore) recordHistory?.({ modeId: "refhub", title: clipTitle(idea), payload: { idea, fb, results: mergedForHistory } });
  };

  const catIcons = { website: "🌐", community: "💬", youtube: "🎬", research: "📊" };
  const catNames = { website: "웹사이트", community: "커뮤니티", youtube: "유튜브", research: "리서치" };
  const grouped = {};
  results.forEach(r => { const c = r.category || "website"; if (!grouped[c]) grouped[c] = []; grouped[c].push(r); });

  return (<div>
    <div className="s-label">탐색할 아이디어</div>
    <IdeaInput value={idea} onChange={setIdea} placeholder="관련 레퍼런스를 탐색할 아이디어를 입력하세요..." style={{ marginBottom: 12 }} context={ideaContext} onContextChange={setIdeaContext} personas={personas} globalKey={globalKey} utilProvider={utilProvider} utilModel={utilModel} utilApiKey={utilApiKey} />
    <FeedbackField value={fb} onChange={setFb} placeholder="예: 유튜브·커뮤니티 위주, 한국어 콘텐츠 우선…" style={{ marginBottom: 12 }} />
    <button className="btn-cta" onClick={() => search(false)} disabled={running || !idea.trim()}>{running ? <><span className="spinner" /> 레퍼런스 탐색 중<span className="loading-dots" /></> : <>📚 레퍼런스 탐색<CreditCostTag costKey="refhub" /></>}</button>
    {running && <QuoteRoller />}
    {Object.keys(grouped).length > 0 && (
      <div style={{ marginTop: 20 }}>
        {["website", "community", "youtube", "research"].filter(c => grouped[c]).map(cat => (
          <div key={cat} style={{ marginBottom: 20 }}>
            <div className="s-label">{catIcons[cat]} {catNames[cat]} ({grouped[cat].length})</div>
            {grouped[cat].map((r, i) => (
              <div className="r-card" key={i} style={{ marginBottom: 8, cursor: r.url ? "pointer" : "default" }} onClick={() => r.url && window.open(r.url, "_blank")}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{catIcons[cat]}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, letterSpacing: "-0.02em" }}>{r.title}</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 4 }}>{r.desc}</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      {r.url && <span style={{ fontSize: 11, color: "var(--accent-primary)", textDecoration: "underline", wordBreak: "break-all" }}>{r.url.length > 50 ? r.url.slice(0, 50) + "…" : r.url}</span>}
                      {r.subscribers && <span style={{ fontSize: 10, padding: "2px 6px", background: "var(--bg-surface-2)", borderRadius: 6, color: "var(--text-muted)" }}>{r.subscribers}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          <button className="btn-ghost" onClick={() => search(true)} disabled={loadingMore} style={{ flex: 1 }}>
            {loadingMore ? <><span className="spinner" /> 추가 탐색 중<span className="loading-dots" /></> : `🔄 추가 탐색 (+20개)`}
          </button>
          <SaveToArchiveBtn modeId="refhub" title={clipTitle(idea)} payload={{ idea, fb, results }} />
        </div>
      </div>
    )}
  </div>);
}

// ─── Feature: Hyper-Niche Explorer ───
// HYPERNICHE_SYSTEM은 prompts.js에서 import

function HyperNicheExplorer({ personas, globalKey, utilProvider, utilModel, utilApiKey }) {
  const recordHistory = useRecordHistory();
  const target = useTarget();
  const { notifyStart, notifyDone } = useTaskNotify("hyperniche");
  const { spend } = useCredits();
  const [input, setInput] = useState("");
  const [fb, setFb] = useState("");
  const [ideas, setIdeas] = useState([]);
  const [running, setRunning] = useState(false);
  const [rawFallback, setRawFallback] = useState("");
  const [ideaContext, setIdeaContext] = useState("");

  const run = async () => {
    if (!input.trim()) return;
    addLinesToIdeaStack(input);
    if (!spend("hyperniche")) return; notifyStart(); addToFeedbackStack(fb); setRunning(true); setIdeas([]); setRawFallback("");
    const tInfo = formatTargetForPrompt(target);
    const p = (() => {
      const hn = personas.find((pp) => pp.id === "hyperniche");
      if (hn) { const r = withResolvedApiKey(hn, globalKey); if (r.apiKey) return r; }
      return pickUsablePersona(personas, globalKey);
    })();
    const userMsg = `관심 산업/방향: "${input}"${formatOptionalDirectionFb(fb)}${formatIdeaContext(ideaContext)}${tInfo}

위 지시에 따라 JSON 배열 3개를 반환하세요.`;
    let parsed = [];
    let fallbackText = null;
    try {
      const raw = await callAI(p, [{ role: "user", content: userMsg }], HYPERNICHE_SYSTEM);
      const maybeParsed = safeParseJsonText(raw, { allowObject: false, allowArray: true });
      if (Array.isArray(maybeParsed) && maybeParsed.length > 0) {
        parsed = maybeParsed;
        setIdeas(parsed);
      } else {
        fallbackText = raw;
        setRawFallback(raw);
      }
    } catch (err) {
      fallbackText = `오류: ${err.message}`;
      setRawFallback(fallbackText);
    }
    setRunning(false);
    notifyDone(clipTitle(input));
    recordHistory?.({
      modeId: "hyperniche",
      title: clipTitle(input),
      payload: { input, fb, ideas: parsed.length ? safeJsonClone(parsed, []) : null, rawFallback: parsed.length ? null : fallbackText },
    });
  };

  const cardColors = ["#a855f7", "#ec4899", "#f59e0b"];

  return (
    <div>
      <div style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.06), rgba(236,72,153,0.04))", border: "1px solid rgba(168,85,247,0.14)", borderRadius: 12, padding: "14px 16px", marginBottom: 18, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 26, flexShrink: 0 }}>🦄</span>
        <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, letterSpacing: "-0.02em" }}>
          <strong style={{ color: "var(--text-primary)", fontWeight: 800 }}>하이퍼 니치 익스플로러</strong>
          <span style={{ color: "var(--text-muted)", margin: "0 6px" }}>·</span>
          초니치 시장 × 글로벌 밈 × 서브컬처 결합 → 복제 불가능한 블루오션 아이디어 3개
        </div>
      </div>
      <div className="s-label">관심 산업 / 사업 방향</div>
      <IdeaInput value={input} onChange={setInput} placeholder="예: 반려동물 산업, 실버 세대 피트니스, 1인 가구 푸드테크…" style={{ marginBottom: 14 }} context={ideaContext} onContextChange={setIdeaContext} personas={personas} globalKey={globalKey} utilProvider={utilProvider} utilModel={utilModel} utilApiKey={utilApiKey} />
      <FeedbackField value={fb} onChange={setFb} placeholder="예: Z세대 커뮤니티·밈 위주, 하드웨어 연계…" style={{ marginBottom: 16 }} />
      <button className="btn-cta" onClick={run} disabled={running || !input.trim()} style={{ background: "linear-gradient(135deg, #a855f7, #ec4899)" }}>
        {running ? <><span className="spinner" /> 블루오션 발굴 중<span className="loading-dots" /></> : <>🦄 하이퍼 니치 탐색 시작<CreditCostTag costKey="hyperniche" /></>}
      </button>
      {running && <QuoteRoller />}

      {ideas.length > 0 && (
        <div style={{ marginTop: 24 }}>
          {ideas.map((idea, idx) => {
            const c = cardColors[idx % cardColors.length];
            return (
              <div key={idx} className="r-card" style={{ marginBottom: 16, borderLeft: `4px solid ${c}`, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, background: `radial-gradient(circle at 100% 0%, ${c}12, transparent 70%)`, pointerEvents: "none" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#fff", background: c, padding: "3px 10px", borderRadius: 8, letterSpacing: "0.02em" }}>IDEA {idx + 1}</span>
                  <span style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>{idea.idea_name}</span>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 8, background: `${c}10`, color: c, border: `1px solid ${c}20` }}>🎯 {idea.micro_target}</span>
                </div>
                <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 14 }}>
                  {idea.concept_description}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(168,85,247,0.04)", border: "1px solid rgba(168,85,247,0.1)" }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#a855f7", marginBottom: 4, letterSpacing: "0.04em" }}>🏰 해자 전략 (MOAT)</div>
                    <div style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.6, fontWeight: 600 }}>{idea.moat_strategy}</div>
                  </div>
                  <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(236,72,153,0.04)", border: "1px solid rgba(236,72,153,0.1)" }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#ec4899", marginBottom: 4, letterSpacing: "0.04em" }}>🔥 핵심 미친 포인트</div>
                    <div style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.6, fontWeight: 600 }}>{idea.virality_factor}</div>
                  </div>
                </div>
                <div style={{ padding: "10px 14px", borderRadius: 10, background: "var(--bg-surface-2)", border: "1px solid var(--glass-border)" }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "var(--accent-success)", marginBottom: 4, letterSpacing: "0.04em" }}>🚀 내일 바로 시작할 MVP</div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{idea.first_step}</div>
                </div>
              </div>
            );
          })}
          <div className="report-sticky-actions">
            <div className="report-sticky-inner">
              <div style={{ marginTop: 10 }}>
                <ReportExportBar entryForExport={{ modeId: "hyperniche", title: clipTitle(input), payload: { input, fb, ideas } }} />
              </div>
              <DeepAnalysisPanel idea={input} context={ideaContext} existingReport={JSON.stringify(ideas)} personas={personas} globalKey={globalKey} />
              <ReportTools reportText={JSON.stringify(ideas)} personas={personas} globalKey={globalKey} />
              <SaveToArchiveBtn modeId="hyperniche" title={clipTitle(input)} payload={{ input, fb, ideas }} />
            </div>
          </div>
        </div>
      )}

      {rawFallback && !ideas.length && (
        <div className="r-card" style={{ marginTop: 20 }}>
          <div className="r-card-header"><span className="r-card-icon">🦄</span><span className="r-card-title">응답</span></div>
          {rawFallback.startsWith("오류:") ? <div className="err-msg">{rawFallback}</div> : <RichText text={rawFallback} />}
          <div className="report-sticky-actions">
            <div className="report-sticky-inner">
              <div style={{ marginTop: 10 }}>
                <ReportExportBar entryForExport={{ modeId: "hyperniche", title: clipTitle(input), payload: { input, fb, rawFallback } }} />
              </div>
              <DeepAnalysisPanel idea={input} context={ideaContext} existingReport={rawFallback} personas={personas} globalKey={globalKey} />
              <ReportTools reportText={rawFallback} personas={personas} globalKey={globalKey} />
              <SaveToArchiveBtn modeId="hyperniche" title={clipTitle(input)} payload={{ input, fb, rawFallback }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Feature: Mix-up Roulette ───
// MIX_WHEEL_SYSTEM, MIX_REPORT_SYSTEM은 prompts.js에서 import

function useMixDrag(scrollRef, itemH) {
  const st = useRef({ on: false, sy: 0, ss: 0, v: 0, ly: 0, lt: 0, raf: 0 });
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const down = (e) => {
      if (e.target.closest && e.target.closest("input,textarea")) return;
      cancelAnimationFrame(st.current.raf);
      const y = e.touches ? e.touches[0].clientY : e.clientY;
      st.current = { on: true, sy: y, ss: el.scrollTop, v: 0, ly: y, lt: performance.now(), raf: 0 };
      el.style.scrollBehavior = "auto";
    };
    const move = (e) => {
      if (!st.current.on) return;
      if (e.cancelable) e.preventDefault();
      const y = e.touches ? e.touches[0].clientY : e.clientY;
      el.scrollTop = st.current.ss + (st.current.sy - y);
      const now = performance.now();
      const dt = now - st.current.lt;
      if (dt > 0) { st.current.v = (st.current.ly - y) / dt; st.current.ly = y; st.current.lt = now; }
    };
    const up = () => {
      if (!st.current.on) return;
      st.current.on = false;
      let v = st.current.v * 16;
      const coast = () => {
        if (Math.abs(v) < 0.5) {
          const idx = Math.round(el.scrollTop / itemH);
          el.style.scrollBehavior = "smooth";
          el.scrollTop = idx * itemH;
          return;
        }
        el.scrollTop += v;
        v *= 0.94;
        st.current.raf = requestAnimationFrame(coast);
      };
      coast();
    };
    el.addEventListener("mousedown", down);
    el.addEventListener("touchstart", down, { passive: true });
    window.addEventListener("mousemove", move, { passive: false });
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("mouseup", up);
    window.addEventListener("touchend", up);
    return () => {
      el.removeEventListener("mousedown", down);
      el.removeEventListener("touchstart", down);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchend", up);
      cancelAnimationFrame(st.current.raf);
    };
  }, [scrollRef, itemH]);
}

function MixWheel({ items, renderItem, scrollRef, emptyMsg, onScroll, activeIndex = -1, onNavigate }) {
  useMixDrag(scrollRef, MIX_ITEM_H);
  const scrollTo = (idx) => {
    if (!scrollRef.current || items.length === 0) return;
    const clamped = Math.max(0, Math.min(idx, items.length - 1));
    scrollRef.current.style.scrollBehavior = "smooth";
    scrollRef.current.scrollTop = clamped * MIX_ITEM_H;
    setTimeout(() => { if (scrollRef.current) scrollRef.current.style.scrollBehavior = "auto"; }, 300);
  };
  return (
    <div className="mix-wheel">
      {items.length > 1 && (
        <button
          type="button"
          className="mix-wheel-nav mix-wheel-nav-up"
          onClick={() => {
            onNavigate?.("up");
            scrollTo(activeIndex - 1);
          }}
          disabled={activeIndex <= 0}
          aria-label="이전"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 10l4-4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      )}
      <div className="mix-wheel-highlight" />
      <div className="mix-wheel-mask mix-wheel-mask-top" />
      <div className="mix-wheel-mask mix-wheel-mask-bottom" />
      {items.length === 0 ? (
        <div className="mix-wheel-empty">{emptyMsg}</div>
      ) : (
        <div className="mix-wheel-scroll" ref={scrollRef} onScroll={onScroll}>
          {items.map((item, i) => (
            <div
              className={`mix-wheel-slot${i === activeIndex ? " mix-wheel-slot--active" : ""}`}
              key={i}
              onClick={(e) => {
                if (i === activeIndex && e.target.closest?.("input, textarea, button, a, [contenteditable=true]")) return;
                if (i < activeIndex) {
                  onNavigate?.("up");
                  scrollTo(activeIndex - 1);
                } else if (i > activeIndex) {
                  onNavigate?.("down");
                  scrollTo(activeIndex + 1);
                } else {
                  scrollTo(i);
                }
              }}
              onPointerDown={(e) => {
                if (i !== activeIndex) {
                  e.preventDefault();
                }
              }}
            >
              {renderItem(item, i)}
            </div>
          ))}
        </div>
      )}
      {items.length > 1 && (
        <button
          type="button"
          className="mix-wheel-nav mix-wheel-nav-down"
          onClick={() => {
            onNavigate?.("down");
            scrollTo(activeIndex + 1);
          }}
          disabled={activeIndex >= items.length - 1}
          aria-label="다음"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      )}
    </div>
  );
}

function MixupRoulette({ personas, globalKey, mixProvider, mixModel, mixApiKey, onOpenSettings, utilProvider, utilModel, utilApiKey }) {
  const recordHistory = useRecordHistory();
  const target = useTarget();
  const { notifyStart, notifyDone } = useTaskNotify("mixroulette");
  const { spend } = useCredits();
  const ob = useMenuOnboarding("mixroulette");
  const [slotCount, setSlotCount] = useState(3);
  const [leftItems, setLeftItems] = useState(["", "", ""]);
  const [rightItems, setRightItems] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [leftIdx, setLeftIdx] = useState(0);
  const [rightIdx, setRightIdx] = useState(0);
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [saved, setSaved] = useState(false);
  const [keyHint, setKeyHint] = useState("");
  const [slotPopIdx, setSlotPopIdx] = useState(-1);
  const leftRef = useRef(null);
  const rightRef = useRef(null);

  const adjustSlots = (n) => {
    const nc = Math.max(1, Math.min(10, n));
    setSlotCount(nc);
    setLeftItems((prev) => {
      const next = [...prev];
      while (next.length < nc) next.push("");
      return next.slice(0, nc);
    });
  };

  const updateLeft = (i, v) => {
    setLeftItems((prev) => { const n = [...prev]; n[i] = v; return n; });
  };

  const filledLeft = leftItems.filter((s) => s.trim());
  const mixLeftStackCount = loadIdeaStack().length;
  const mix = resolveMixPersona(globalKey, mixProvider, mixModel, mixApiKey);
  const selectedLeft = leftItems[Math.min(leftIdx, leftItems.length - 1)] || "";
  const selectedRight = rightItems[Math.min(rightIdx, rightItems.length - 1)] || "";

  const generateTrends = async () => {
    if (filledLeft.length === 0) return;
    if (!mix.hasKey) {
      setKeyHint(`${mix.provName} API 키가 필요합니다. 설정(⚙️)에서 믹스업 룰렛 항목에 키를 입력하거나, 전체 일괄 변경으로 키를 설정하세요.`);
      return;
    }
    setKeyHint("");
    if (!spend("mixroulette_wheel")) return; notifyStart(); setGenerating(true);
    setRightItems([]);
    setReport(null);
    setShowReport(false);

    const tInfo = formatTargetForPrompt(target);
    const count = Math.min(30, Math.max(10, filledLeft.length * 5));
    const prompt = `사용자 아이디어 파츠:\n${filledLeft.map((s, i) => `${i + 1}. ${s}`).join("\n")}${tInfo}\n\n위 아이디어 파츠들과 폭발적으로 결합될 수 있는 글로벌 최신 밈, 서브컬처, 틈새 트렌드, 신기술, 신규 비즈니스 모델 요소를 ${count}개 생성하세요.\n각 파츠는 2-8 단어의 짧고 임팩트 있는 한국어 문구로. 서로 중복되지 않아야 합니다.\nJSON만 반환: {"right_wheel_parts":["...",...]}\n배열 길이는 정확히 ${count}.`;

    try {
      const r = await callAI(mix, [{ role: "user", content: prompt }], MIX_WHEEL_SYSTEM);
      const parsed = safeParseJsonText(r, { allowObject: true, allowArray: false });
      const parts = parsed?.right_wheel_parts;
      if (Array.isArray(parts) && parts.length > 0) {
        const clean = parts.map((s) => String(s).trim()).filter(Boolean);
        setRightItems(clean);
        setTimeout(() => {
          if (rightRef.current && clean.length > 1) {
            const dest = Math.floor(Math.random() * clean.length) * MIX_ITEM_H;
            rightRef.current.style.scrollBehavior = "smooth";
            rightRef.current.scrollTop = dest;
          }
        }, 120);
      } else {
        setRightItems(["결과 파싱 실패 — 다시 시도해 주세요"]);
      }
    } catch (err) {
      setRightItems([`오류: ${err.message}`]);
    }
    setGenerating(false);
    notifyDone(clipTitle(filledLeft[0] || "믹스업"));
  };

  const generateReport = async () => {
    if (!selectedLeft.trim() || !selectedRight.trim()) return;
    if (!mix.hasKey) { setKeyHint(`${mix.provName} API 키가 필요합니다.`); return; }
    if (!spend("mixroulette_report")) return; setReportLoading(true);
    setReport(null);
    setShowReport(true);
    setSaved(false);

    const tInfo = formatTargetForPrompt(target);
    const prompt = `[좌측 아이디어]: ${selectedLeft}\n[우측 트렌드]: ${selectedRight}${tInfo}\n\n이 두 요소를 강제로 융합하여 독창적인 비즈니스 아이디어를 도출하세요.\n다음 JSON만 반환 (코드펜스·설명 금지):\n{\n  "combined_concept": "결합된 아이디어의 캐치한 한 줄 요약 (20자 내외, 한국어)",\n  "tagline": "서비스 슬로건 (15자 내외)",\n  "problem": "이 아이디어가 해결하는 핵심 문제와 타깃 고객의 페인포인트 (3-4문장)",\n  "value_proposition": "이 믹스업이 왜 시장에서 파괴적인 시너지를 내는지 분석. 기존 대안 대비 10x 개선 포인트, 네트워크 효과, 방어 가능한 해자(moat) 포함 (5-6문장)",\n  "target_market": "핵심 타깃 시장 정의. TAM/SAM/SOM 추정치, Why Now 타이밍 분석 (4-5문장)",\n  "business_model": "수익 모델(구독/트랜잭션/광고/하이브리드), 예상 ARPU, 가격 전략 (3-4문장)",\n  "execution_strategy": "당장 실행 가능한 MVP 정의와 4단계 로드맵. 각 단계별 기간·목표·핵심 메트릭 포함 (6-8문장)",\n  "risk_and_moat": "핵심 리스크 3가지와 각 대응 전략, 경쟁 방어 전략 (4-5문장)",\n  "reference": "유사한 접근으로 성공한 기업/서비스 2-3개와 우리와의 차별점 (3-4문장)"\n}`;

    try {
      const r = await callAI(mix, [{ role: "user", content: prompt }], MIX_REPORT_SYSTEM);
      const parsed = safeParseJsonText(r, { allowObject: true, allowArray: false });
      if (parsed?.combined_concept) {
        setReport(parsed);
        addLinesToIdeaStack(`${selectedLeft} × ${selectedRight}`);
      } else {
        setReport({ combined_concept: "파싱 실패", value_proposition: r, execution_strategy: "다시 시도해 주세요." });
      }
    } catch (err) {
      setReport({ combined_concept: "오류", value_proposition: err.message, execution_strategy: "" });
    }
    setReportLoading(false);
  };

  const saveToStack = () => {
    if (!report) return;
    setSaved(true);
    recordHistory?.({
      modeId: "mixroulette",
      title: clipTitle(report.combined_concept),
      payload: { leftItems: filledLeft, rightItems, selectedLeft, selectedRight, report },
    });
  };

  const handleLeftScroll = () => {
    if (leftRef.current) setLeftIdx(Math.round(leftRef.current.scrollTop / MIX_ITEM_H));
  };
  const handleRightScroll = () => {
    if (rightRef.current) setRightIdx(Math.round(rightRef.current.scrollTop / MIX_ITEM_H));
  };

  return (
    <div>
      <div style={{
        background: "rgba(248,250,252,0.8)",
        borderLeft: "3px solid var(--accent-primary)", borderRadius: "0 10px 10px 0", padding: "14px 18px", marginBottom: 20,
        display: "flex", alignItems: "center", gap: 14,
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
          <rect x="2" y="4" width="20" height="16" rx="3" stroke="#1D4ED8" strokeWidth="1.5" fill="none"/>
          <circle cx="7" cy="12" r="2" fill="#1D4ED8"/>
          <circle cx="12" cy="12" r="2" fill="#1D4ED8"/>
          <circle cx="17" cy="12" r="2" fill="#1D4ED8"/>
        </svg>
        <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.55, letterSpacing: "-0.01em" }}>
          <strong style={{ color: "#111827", fontWeight: 700 }}>믹스업 룰렛</strong>
          <span style={{ color: "#9ca3af", margin: "0 8px" }}>·</span>
          아이디어 파츠 × AI 트렌드를 결합 → 새로운 비즈니스 아이디어 발견
        </div>
      </div>

      {keyHint && (
        <div className="err-msg" style={{ marginBottom: 14 }}>
          {keyHint}
          <button type="button" className="btn-cta" style={{ marginTop: 10, width: "100%" }} onClick={() => { setKeyHint(""); onOpenSettings(); }}>설정 열기</button>
        </div>
      )}

      <div className="mix-wheel-area">
        <div className="mix-wheel-col">
          <div className="mix-wheel-col-header">
            <div className="mix-wheel-label" style={{ margin: 0 }}>아이디어 파츠</div>
            {mixLeftStackCount > 0 && (
              <button
                type="button"
                className="idea-stack-btn mix-load-btn"
                onClick={() => {
                  const stack = loadIdeaStack();
                  const ni = [...leftItems];
                  while (ni.length < slotCount) ni.push("");
                  const trimmed = ni.slice(0, slotCount);
                  for (let si = 0; si < stack.length; si++) {
                    const emptyIdx = trimmed.findIndex((v, idx) => idx < slotCount && !v.trim());
                    if (emptyIdx === -1) break;
                    trimmed[emptyIdx] = stack[si];
                  }
                  setLeftItems(trimmed);
                }}
              >
                📋 <span className="mix-load-btn-text">전체 불러오기</span> ({mixLeftStackCount})
              </button>
            )}
          </div>
          <MixWheel
            items={leftItems}
            scrollRef={leftRef}
            onScroll={handleLeftScroll}
            activeIndex={leftIdx}
            emptyMsg="아이디어를 입력하세요"
            renderItem={(item, i) => (
              <div style={{ display: "flex", gap: 4, width: "100%", alignItems: "center", position: "relative" }}>
                <input
                  className="mix-wheel-input"
                  value={item}
                  onChange={(e) => updateLeft(i, e.target.value)}
                  placeholder={`아이디어 ${i + 1}`}
                  style={{ flex: 1 }}
                />
                {mixLeftStackCount > 0 && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setSlotPopIdx(slotPopIdx === i ? -1 : i); }}
                    title="불러오기"
                    style={{
                      flexShrink: 0, width: 26, height: 26, borderRadius: 7,
                      border: "1px solid var(--glass-border)", background: slotPopIdx === i ? "var(--accent-primary)" : "var(--bg-surface-1)",
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      color: slotPopIdx === i ? "#fff" : "var(--text-muted)", fontSize: 11, transition: "all 0.15s",
                    }}
                  >
                    📋
                  </button>
                )}
              </div>
            )}
          />
          {slotPopIdx >= 0 && (
            <IdeaStackPopover
              onSelect={(text) => {
                const next = [...leftItems];
                next[slotPopIdx] = text;
                setLeftItems(next);
                setSlotPopIdx(-1);
              }}
              onClose={() => setSlotPopIdx(-1)}
              personas={personas}
              globalKey={globalKey}
              utilProvider={utilProvider}
              utilModel={utilModel}
              utilApiKey={utilApiKey}
            />
          )}
          <div className="mix-slot-controls">
            <button type="button" className="mix-slot-btn" onClick={() => adjustSlots(slotCount - 1)} disabled={slotCount <= 1}>−</button>
            <span className="mix-slot-count">{slotCount}개 슬롯</span>
            <button type="button" className="mix-slot-btn" onClick={() => adjustSlots(slotCount + 1)} disabled={slotCount >= 10}>+</button>
          </div>
        </div>

        <div className="mix-center-indicator">
          <span className="mix-center-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 4v12M4 10h12" stroke="#1D4ED8" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          </span>
        </div>
        {ob.visible && <ObHint menuId="mixroulette" onDismiss={ob.dismiss} />}

        <div className="mix-wheel-col">
          <div className="mix-wheel-col-header">
            <div className="mix-wheel-label" style={{ margin: 0 }}>AI 트렌드</div>
          </div>
          <MixWheel
            items={rightItems}
            scrollRef={rightRef}
            onScroll={handleRightScroll}
            activeIndex={rightIdx}
            emptyMsg={generating ? "" : "🎲 아래 버튼으로\n트렌드를 생성하세요"}
            renderItem={(item) => (
              <div className="mix-wheel-text">{item}</div>
            )}
          />
          {generating && (
            <div style={{ textAlign: "center", marginTop: 8 }}>
              <span className="spinner" style={{ width: 18, height: 18 }} />
            </div>
          )}
        </div>
      </div>

      {selectedLeft.trim() && selectedRight.trim() && (
        <div className="mix-match-display">
          <div className="mix-match-left">{selectedLeft}</div>
          <span className="mix-match-x">×</span>
          <div className="mix-match-right">{selectedRight}</div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
        <button
          className="btn-cta"
          onClick={generateTrends}
          disabled={generating || filledLeft.length === 0}
          style={{ flex: 1, background: "#1D4ED8", color: "#fff", fontWeight: 700, border: "none" }}
        >
          {generating ? <><span className="spinner" /> 트렌드 생성 중<span className="loading-dots" /></> : <>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginRight: 6, verticalAlign: "-2px" }}>
              <path d="M8 1v14M1 8h14" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            믹스업 트렌드 생성<CreditCostTag costKey="mixroulette_wheel" /></>}
        </button>
        {rightItems.length > 0 && !rightItems[0]?.startsWith?.("오류") && (
          <button
            className="btn-cta"
            onClick={generateReport}
            disabled={reportLoading || !selectedLeft.trim() || !selectedRight.trim()}
            style={{ flex: 1, background: "#0f172a", color: "#fff", fontWeight: 700, border: "none" }}
          >
            {reportLoading ? <><span className="spinner" /> 분석 중<span className="loading-dots" /></> : <>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginRight: 6, verticalAlign: "-2px" }}>
                <rect x="1" y="2" width="14" height="12" rx="2" stroke="#fff" strokeWidth="1.5" fill="none"/>
                <path d="M4 6h8M4 9h5" stroke="#fff" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              아이디어 리포트 분석<CreditCostTag costKey="mixroulette_report" /></>}
          </button>
        )}
      </div>

      {generating && <QuoteRoller />}

      {showReport && (
        <div className="modal-overlay" onClick={() => setShowReport(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-handle"><div /></div>
            <div className="modal-title">
              <span>📊 믹스업 리포트</span>
              <button className="modal-close" onClick={() => setShowReport(false)}>✕</button>
            </div>
            {reportLoading ? (
              <div style={{ padding: "40px 20px", textAlign: "center" }}>
                <span className="spinner" style={{ width: 24, height: 24 }} />
                <div style={{ marginTop: 12, fontSize: 13, color: "var(--text-muted)" }}>리포트를 생성하고 있습니다…</div>
              </div>
            ) : report ? (
              <div style={{ padding: "16px 20px 24px", overflowY: "auto", maxHeight: "60vh" }}>
                <div className="mix-match-display" style={{ marginBottom: 16 }}>
                  <div className="mix-match-left">{selectedLeft}</div>
                  <span className="mix-match-x">×</span>
                  <div className="mix-match-right">{selectedRight}</div>
                </div>
                <div className="r-card" style={{ marginBottom: 12, borderLeft: "3px solid #f59e0b" }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#f59e0b", marginBottom: 4, letterSpacing: "0.04em" }}>💡 결합 컨셉</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em", lineHeight: 1.4 }}>{report.combined_concept}</div>
                  {report.tagline && <div style={{ fontSize: 13, color: "var(--text-muted)", fontStyle: "italic", marginTop: 4 }}>{report.tagline}</div>}
                </div>
                {report.problem && (
                  <div className="r-card" style={{ marginBottom: 10, borderLeft: "3px solid #dc2626" }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#dc2626", marginBottom: 6, letterSpacing: "0.04em" }}>🔥 핵심 문제</div>
                    <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>{report.problem}</div>
                  </div>
                )}
                <div className="r-card" style={{ marginBottom: 10, borderLeft: "3px solid var(--accent-primary)" }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "var(--accent-primary)", marginBottom: 6, letterSpacing: "0.04em" }}>🎯 가치 제안</div>
                  <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>{report.value_proposition}</div>
                </div>
                {report.target_market && (
                  <div className="r-card" style={{ marginBottom: 10, borderLeft: "3px solid #7c3aed" }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#7c3aed", marginBottom: 6, letterSpacing: "0.04em" }}>📊 타깃 시장</div>
                    <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>{report.target_market}</div>
                  </div>
                )}
                {report.business_model && (
                  <div className="r-card" style={{ marginBottom: 10, borderLeft: "3px solid #d97706" }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#d97706", marginBottom: 6, letterSpacing: "0.04em" }}>💰 비즈니스 모델</div>
                    <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>{report.business_model}</div>
                  </div>
                )}
                <div className="r-card" style={{ marginBottom: 10, borderLeft: "3px solid var(--accent-success)" }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "var(--accent-success)", marginBottom: 6, letterSpacing: "0.04em" }}>🚀 실행 전략</div>
                  <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>{report.execution_strategy}</div>
                </div>
                {report.risk_and_moat && (
                  <div className="r-card" style={{ marginBottom: 10, borderLeft: "3px solid #ef4444" }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#ef4444", marginBottom: 6, letterSpacing: "0.04em" }}>🛡️ 리스크 & 해자</div>
                    <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>{report.risk_and_moat}</div>
                  </div>
                )}
                {report.reference && (
                  <div className="r-card" style={{ marginBottom: 16, borderLeft: "3px solid #6b7280" }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#6b7280", marginBottom: 6, letterSpacing: "0.04em" }}>📚 유사 사례</div>
                    <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>{report.reference}</div>
                  </div>
                )}
                <QuantumSimCTA idea={selectedLeft + " × " + selectedRight} context="" existingReport={JSON.stringify(report)} personas={personas} globalKey={globalKey} />
                <ReportTools reportText={JSON.stringify(report)} personas={personas} globalKey={globalKey} />
                <button
                  className="btn-cta"
                  onClick={saveToStack}
                  disabled={saved}
                  style={{ width: "100%", marginTop: 8, background: saved ? "var(--accent-success)" : "linear-gradient(135deg, #f59e0b, #ef4444)" }}
                >
                  {saved ? "✓ 아이디어 스택에 저장됨" : "📥 아이디어 스택에 저장하기"}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {report && !showReport && !reportLoading && (
        <div style={{ marginTop: 16 }}>
          <div className="r-card" style={{ borderLeft: "3px solid #f59e0b", marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#f59e0b", marginBottom: 6 }}>💡 최근 결합 컨셉</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>{report.combined_concept}</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => setShowReport(true)}>상세 보기</button>
              <SaveToArchiveBtn modeId="mixroulette" title={clipTitle(report.combined_concept)} payload={{ leftItems: filledLeft, rightItems, selectedLeft, selectedRight, report }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Feature: ToT Deep Dive ───
const TOT_PHASES = [
  { key: "branch", label: "발산", icon: "🌿", desc: "3가지 방향 탐색" },
  { key: "eval", label: "평가 · 가지치기", icon: "✂️", desc: "자가 평가 & 선별" },
  { key: "deep", label: "심화 전개", icon: "🎯", desc: "최종 솔루션 도출" },
];
const TOT_SCORE_DIMS = ["시장성", "실현가능성", "혁신성", "리스크", "임팩트"];

function TotDeepDive({ personas, globalKey, totProvider, totModel, totApiKey, onOpenSettings, utilProvider, utilModel, utilApiKey }) {
  const recordHistory = useRecordHistory();
  const target = useTarget();
  const { notifyStart, notifyDone } = useTaskNotify("tot");
  const { spend } = useCredits();
  const [idea, setIdea] = useState("");
  const [context, setContext] = useState("");
  const [ideaContext, setIdeaContext] = useState("");
  const [phase, setPhase] = useState("input");
  const [phaseIdx, setPhaseIdx] = useState(-1);
  const [branches, setBranches] = useState([]);
  const [evaluation, setEvaluation] = useState(null);
  const [solution, setSolution] = useState("");
  const [solutionStreaming, setSolutionStreaming] = useState(false);
  const [running, setRunning] = useState(false);
  const [prunedOpen, setPrunedOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [keyHint, setKeyHint] = useState("");

  const tryJson = (s) => safeParseJsonText(s, { allowObject: true, allowArray: false });

  const run = async () => {
    if (!idea.trim()) return;
    const tot = resolveTotPersona(globalKey, totProvider, totModel, totApiKey);
    const p = { provider: tot.provider, model: tot.model, apiKey: tot.apiKey };
    if (!tot.hasKey) {
      setKeyHint(`${tot.provName} API 키가 필요합니다. 설정(⚙️)에서 ToT 딥 다이브 항목에 ${tot.provName} 키를 입력하거나, 전체 일괄 변경으로 GPT/Gemini 키를 설정하세요.`);
      return;
    }
    addLinesToIdeaStack(idea);
    setKeyHint("");
    if (!spend("tot")) return; notifyStart(); addToFeedbackStack(context); setRunning(true); setBranches([]); setEvaluation(null); setSolution(""); setPrunedOpen(false);

    // Phase 1: 발산
    setPhase("running"); setPhaseIdx(0); setStatusMsg("3가지 사고 방향을 탐색하고 있습니다…");
    let br = [];
    try {
      const tInfo = formatTargetForPrompt(target);
      const r = await callAI(p, [{ role: "user", content:
        `아이디어: "${idea}"${formatOptionalDirectionFb(context)}${formatIdeaContext(ideaContext)}${tInfo}\n\nSequoia의 "Idea Maze" 관점에서 이 아이디어의 **3가지 근본적으로 다른 실행 경로(Branch)**를 도출하세요.\n\n각 Branch는:\n- 서로 다른 산업 프레임워크, 비즈니스 모델, 기술 접근을 취해야 합니다\n- 실제 유니콘 기업이 선택한 경로를 참고하세요\n- 단순한 변형이 아닌, 가치 사슬 자체를 다르게 구성하는 수준이어야 합니다\n\nJSON 형식으로만 응답:\n{"branches":[{"id":1,"title":"방향 제목 (구체적)","angle":"비즈니스 모델·타깃·가치 제안의 핵심 차이 한 줄","reasoning":"이 경로가 $1B+ 결과를 만들 수 있는 근거 2-3문장. 유사 성공 기업 레퍼런스 포함."},{"id":2,"title":"...","angle":"...","reasoning":"..."},{"id":3,"title":"...","angle":"...","reasoning":"..."}]}`
      }], TOT_SYSTEM);
      const parsed = tryJson(r);
      br = parsed?.branches || [];
      if (br.length < 3) br = [{ id: 1, title: "방향 A", angle: "관점 A", reasoning: r.slice(0, 200) }, { id: 2, title: "방향 B", angle: "관점 B", reasoning: "" }, { id: 3, title: "방향 C", angle: "관점 C", reasoning: "" }];
    } catch (err) {
      br = [{ id: 1, title: "오류", angle: "", reasoning: `발산 단계 오류: ${err.message}` }];
    }
    setBranches(br);

    // Phase 2: 평가 & 가지치기
    setPhaseIdx(1); setStatusMsg("각 방향의 타당성을 자가 평가하고 있습니다…");
    let ev = null;
    try {
      const r2 = await callAI(p, [{ role: "user", content:
        `아이디어: "${idea}"${formatOptionalDirectionFb(context)}${formatIdeaContext(ideaContext)}\n\n3가지 실행 경로:\n${br.map(b => `Branch ${b.id}: ${b.title}\n관점: ${b.angle}\n근거: ${b.reasoning}`).join("\n\n")}\n\nTier-1 VC 파트너로서 각 경로를 아래 5가지 기준으로 **엄격하게** 10점 만점 평가하세요.\n\n**평가 기준 (낙관 편향 금지, 7점 이상은 확실한 근거 필요):**\n1. 시장성 — TAM $1B+ 잠재력, Why Now 타이밍, 성장률\n2. 실현가능성 — MVP 6개월 내 가능 여부, 기술 난이도, 콜드 스타트\n3. 혁신성 — 10x 개선 여부 (10% 개선은 0점), 기존 대비 근본적 차별\n4. 리스크 — (10=리스크 낮음) Kill Zone, 규제, 기술, 실행 리스크 종합\n5. 임팩트 — 바이럴 계수, 리텐션, NPS 잠재력, Power Law 가능성\n\n가지치기 사유는 "왜 $1B 결과를 만들 수 없는지" 구체적 시장 증거로.\n\nJSON만 응답:\n{"scores":[{"id":1,"시장성":8,"실현가능성":7,"혁신성":9,"리스크":7,"임팩트":8,"total":39},{"id":2,"시장성":6,"실현가능성":5,"혁신성":6,"리스크":4,"임팩트":5,"total":26},{"id":3,"시장성":5,"실현가능성":4,"혁신성":5,"리스크":3,"임팩트":4,"total":21}],"winner":1,"pruned":[{"id":2,"reason":"가지치기 사유 3-4문장, 유사 실패 사례 포함"},{"id":3,"reason":"가지치기 사유 3-4문장, 유사 실패 사례 포함"}],"reasoning":"최종 선택 근거 3-4문장, 유사 성공 사례 포함"}`
      }], TOT_SYSTEM);
      ev = tryJson(r2);
      if (!ev?.winner) ev = { scores: [], winner: 1, pruned: [], reasoning: r2.slice(0, 300) };
      ev.scores?.forEach(s => { if (!s.total) s.total = TOT_SCORE_DIMS.reduce((sum, d) => sum + (s[d] || 0), 0); });
    } catch (err) {
      ev = { scores: [], winner: 1, pruned: [], reasoning: `평가 단계 오류: ${err.message}` };
    }
    setEvaluation(ev);

    // Phase 3: 심화 전개
    setPhaseIdx(2); setStatusMsg("생존 방향을 심화하여 최종 솔루션을 도출합니다…");
    const winBranch = br.find(b => b.id === ev.winner) || br[0];
    let sol = "";
    setSolutionStreaming(true);
    try {
      sol = await callAIStream(p, [{ role: "user", content:
        `아이디어: "${idea}"${formatOptionalDirectionFb(context)}${formatIdeaContext(ideaContext)}\n선택된 방향: ${winBranch.title}\n관점: ${winBranch.angle}\n근거: ${winBranch.reasoning}\n\n이 방향을 **시리즈A 투자 제안서 수준**으로 구체화하세요.\n\n## 1. Executive Summary\n엘리베이터 피치 — 한 문단으로 핵심 가치 제안. "X for Y" 포맷 포함.\n\n## 2. Problem-Solution Fit\n- 타깃 고객의 구체적 페인포인트 (정량 데이터 포함)\n- 기존 대안 vs 우리 솔루션의 10x 개선 포인트\n- Hair-on-fire 문제인지 판정\n\n## 3. 비즈니스 모델 · 유닛 이코노믹스\n- 수익 모델 (구독/트랜잭션/광고/하이브리드)\n- 예상 ARPU, LTV:CAC 비율, 페이백 기간, 그로스 마진\n- 가격 책정 전략과 근거\n\n## 4. 기술 아키텍처 · MVP 정의\n- 핵심 기술 스택\n- MVP에 반드시 포함할 기능 vs 제외할 기능\n- 개발 예상 기간·인력\n\n## 5. Go-to-Market 전략\n- Beachhead 시장 정의 (구체적 세그먼트)\n- 채널 전략 (유료/무료/파트너십)\n- 초기 100명 → 1,000명 → 10,000명 확보 전략\n\n## 6. 실행 로드맵\n- 30일: 핵심 가설 3개 + 검증 방법 + 성공 기준\n- 90일: MVP 출시 + 초기 메트릭\n- 180일: PMF 증명 조건\n- 12개월: 스케일링 전략\n\n## 7. 팀 구성 · 자금\n핵심 인력 (직무/연차/채용 우선순위), 시드 자금 규모, 번 레이트\n\n## 8. 리스크 매트릭스 · 대응\n리스크별: 발생 확률(%), 임팩트(상/중/하), 대응 전략, 조기 경고 신호\n\n## 9. 최종 판정\nGo / No-Go / Pivot — 확신도(0-100%), 유사 성공 기업 레퍼런스\n\n한국어로 작성하세요.`
      }], TOT_SYSTEM, (_chunk, full) => { setSolution(full); });
    } catch (err) {
      sol = `심화 전개 오류: ${err.message}`;
    }
    setSolution(sol); setSolutionStreaming(false);

    setPhase("result"); setPhaseIdx(3); setRunning(false); setStatusMsg("");
    notifyDone(clipTitle(idea));
    recordHistory?.({
      modeId: "tot",
      title: clipTitle(idea),
      payload: { idea, context, branches: br, evaluation: ev, solution: sol, winnerBranch: winBranch },
    });
  };

  const winId = evaluation?.winner;
  const winBranch = branches.find(b => b.id === winId);
  const prunedBranches = evaluation?.pruned || [];

  if (phase === "input") {
    const tot = resolveTotPersona(globalKey, totProvider, totModel, totApiKey);
    return (
      <div>
        <div style={{ background: "linear-gradient(135deg, rgba(5,150,105,0.05), rgba(49,130,246,0.04))", border: "1px solid rgba(5,150,105,0.12)", borderRadius: 12, padding: "14px 16px", marginBottom: 18, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 26, flexShrink: 0 }}>🌳</span>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, letterSpacing: "-0.02em" }}>
            <strong style={{ color: "var(--text-primary)", fontWeight: 800 }}>Tree of Thoughts</strong>
            <span style={{ color: "var(--text-muted)", margin: "0 6px" }}>·</span>
            3방향 발산 → AI 자가 평가 → 가지치기 → 심화 솔루션
          </div>
        </div>
        {keyHint && (
          <div className="err-msg" style={{ marginBottom: 14 }}>
            {keyHint}
            <button type="button" className="btn-cta" style={{ marginTop: 10, width: "100%" }} onClick={() => { setKeyHint(""); onOpenSettings(); }}>설정 열기</button>
          </div>
        )}
        <div className="s-label">아이디어 / 질문</div>
        <IdeaInput value={idea} onChange={setIdea} placeholder="깊이 탐색하고 싶은 아이디어, 문제, 비즈니스 가설을 입력하세요..." style={{ marginBottom: 14 }} context={ideaContext} onContextChange={setIdeaContext} personas={personas} globalKey={globalKey} utilProvider={utilProvider} utilModel={utilModel} utilApiKey={utilApiKey} />
        <FeedbackField value={context} onChange={setContext} placeholder="예: 수익화 중심, 기술 혁신 관점, 사용자 경험 우선…" style={{ marginBottom: 20 }} />
        <button className="btn-cta tot-cta" onClick={run} disabled={running || !idea.trim()}>🌳 ToT 딥 다이브 시작<CreditCostTag costKey="tot" /></button>
      </div>
    );
  }

  if (phase === "running") {
    return (
      <div>
        <div className="tot-stepper">
          {TOT_PHASES.map((ph, i) => (
            <div className={`tot-step ${i < phaseIdx ? "done" : i === phaseIdx ? "active" : ""}`} key={ph.key}>
              <div className="tot-step-dot">{i < phaseIdx ? "✓" : ph.icon}</div>
              <span className="tot-step-label">{ph.label}</span>
              {i < TOT_PHASES.length - 1 && (
                <div className="tot-step-line"><div className="tot-step-line-fill" /></div>
              )}
            </div>
          ))}
        </div>
        <div key={statusMsg} className="tot-status-text" style={{ marginBottom: 20 }}>{statusMsg}</div>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <span className="spinner" style={{ width: 24, height: 24, borderTopColor: "var(--accent-primary)", borderWidth: 3 }} />
        </div>
        <QuoteRoller />
        {branches.length > 0 && phaseIdx >= 1 && (
          <div className="tot-branches">
            {branches.map((b, i) => {
              const sc = evaluation?.scores?.find(s => s.id === b.id);
              const isWin = evaluation && b.id === evaluation.winner;
              const isPruned = evaluation && !isWin && evaluation.winner;
              return (
                <div className={`tot-branch ${isWin ? "tot-winner" : ""} ${isPruned ? "tot-pruned" : ""}`} key={b.id} style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="tot-branch-num">{b.id}</div>
                  <div className="tot-branch-title">{b.title}</div>
                  <div className="tot-branch-angle">{b.angle}</div>
                  <div className="tot-branch-body">{b.reasoning}</div>
                  {sc && (
                    <div className="tot-scores">
                      {TOT_SCORE_DIMS.map(d => <span className="tot-score-pill" key={d}>{d} {sc[d] || 0}</span>)}
                      <span className="tot-score-pill" style={{ fontWeight: 800 }}>총 {sc.total || 0}</span>
                    </div>
                  )}
                  {isWin && <div style={{ marginTop: 8, fontSize: 11, fontWeight: 800, color: "var(--accent-success)" }}>✓ 생존</div>}
                  {isPruned && <div style={{ marginTop: 8, fontSize: 11, fontWeight: 600, color: "var(--accent-warning)" }}>✂️ 가지치기</div>}
                </div>
              );
            })}
          </div>
        )}
        {branches.length === 0 && (
          <div className="tot-branches">
            {[0, 1, 2].map(i => <div className="tot-skeleton" key={i} style={{ animationDelay: `${i * 0.15}s` }} />)}
          </div>
        )}
      </div>
    );
  }

  // Result phase
  const netFetchFail =
    (typeof solution === "string" && solution.includes("Failed to fetch")) ||
    (typeof evaluation?.reasoning === "string" && evaluation.reasoning.includes("Failed to fetch")) ||
    branches.some((b) => String(b.reasoning || "").includes("Failed to fetch"));

  return (
    <div>
      <div className="tot-stepper">
        {TOT_PHASES.map((ph, i) => (
          <div className="tot-step done" key={ph.key}>
            <div className="tot-step-dot">✓</div>
            <span className="tot-step-label">{ph.label}</span>
            {i < TOT_PHASES.length - 1 && (
              <div className="tot-step-line"><div className="tot-step-line-fill" /></div>
            )}
          </div>
        ))}
      </div>

      {netFetchFail && (
        <div className="err-msg" style={{ marginBottom: 16 }}>
          <strong>네트워크 오류</strong>로 API에 연결하지 못했습니다. VPN·방화벽·광고 차단기를 확인하고, 설정에서 API 키가 올바른지 검토한 뒤 홈에서 ToT를 다시 실행해 보세요.
          <button type="button" className="btn-ghost" style={{ marginTop: 10, width: "100%" }} onClick={() => { onOpenSettings(); }}>⚙️ 설정 열기</button>
        </div>
      )}

      {/* Main Solution */}
      <div className="tot-solution">
        <div className="tot-solution-badge">🎯 최적 솔루션 · Branch {winId}: {winBranch?.title || "선택됨"}</div>
        <StreamingRichText text={solution} isStreaming={solutionStreaming} variant="tot" />
      </div>

      {/* Evaluation reasoning */}
      {evaluation?.reasoning && (
        <div style={{ margin: "16px 0", padding: "14px 16px", background: "var(--bg-surface-2)", borderRadius: 12, borderLeft: "3px solid var(--accent-primary)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-primary)", marginBottom: 4 }}>선택 근거</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{evaluation.reasoning}</div>
        </div>
      )}

      {/* Branch comparison cards */}
      <div className="s-label" style={{ marginTop: 20 }}>사고 방향 비교</div>
      <div className="tot-branches">
        {branches.map((b) => {
          const sc = evaluation?.scores?.find(s => s.id === b.id);
          const isWin = b.id === winId;
          const isPruned = !isWin;
          return (
            <div className={`tot-branch ${isWin ? "tot-winner" : "tot-pruned"}`} key={b.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <div className="tot-branch-num">{b.id}</div>
                {isWin && <span style={{ fontSize: 10, fontWeight: 800, color: "var(--accent-success)", background: "rgba(5,150,105,0.08)", padding: "2px 8px", borderRadius: 6 }}>WINNER</span>}
                {isPruned && <span style={{ fontSize: 10, fontWeight: 700, color: "var(--accent-warning)", background: "rgba(217,119,6,0.08)", padding: "2px 8px", borderRadius: 6 }}>PRUNED</span>}
              </div>
              <div className="tot-branch-title">{b.title}</div>
              <div className="tot-branch-angle">{b.angle}</div>
              {sc && (
                <div className="tot-scores">
                  {TOT_SCORE_DIMS.map(d => <span className="tot-score-pill" key={d}>{d} {sc[d] || 0}</span>)}
                  <span className="tot-score-pill" style={{ fontWeight: 800 }}>총 {sc.total || 0}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pruned accordion */}
      {prunedBranches.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <button type="button" className="tot-accordion-trigger" onClick={() => setPrunedOpen(o => !o)}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14 }}>✂️</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", textAlign: "left" }}>가지치기된 아이디어 ({prunedBranches.length}개)</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "left" }}>왜 이 방향이 탈락했는지 확인하세요</div>
              </div>
            </div>
            <span style={{ fontSize: 14, color: "var(--text-muted)", transform: prunedOpen ? "rotate(180deg)" : "none", transition: "transform 0.3s cubic-bezier(0.33,1,0.68,1)" }}>▾</span>
          </button>
          <div className={`tot-accordion-body ${prunedOpen ? "open" : "closed"}`}>
            {prunedBranches.map(pr => {
              const b = branches.find(x => x.id === pr.id);
              return (
                <div key={pr.id} style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 4 }}>
                    Branch {pr.id}: {b?.title || ""}
                  </div>
                  <div className="tot-pruned-reason">{pr.reason}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div className="report-sticky-actions">
        <div className="report-sticky-inner">
          <div style={{ marginTop: 10 }}>
            <ReportExportBar entryForExport={{ modeId: "tot", title: clipTitle(idea), payload: { idea, context, branches, evaluation, solution } }} />
          </div>
          <DeepAnalysisPanel idea={idea} context={ideaContext} existingReport={solution} personas={personas} globalKey={globalKey} />
          <ReportTools reportText={solution} personas={personas} globalKey={globalKey} />
          <SaveToArchiveBtn modeId="tot" title={clipTitle(idea)} payload={{ idea, context, branches, evaluation, solution }} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 24, flexWrap: "wrap" }}>
        <button
          type="button"
          className="btn-ghost"
          style={{ flex: 1 }}
          onClick={() => {
            setPhase("input");
            setPhaseIdx(-1);
            setBranches([]);
            setEvaluation(null);
            setSolution("");
            setPrunedOpen(false);
            setKeyHint("");
            setStatusMsg("");
          }}
        >
          새 ToT 딥 다이브
        </button>
      </div>
    </div>
  );
}

// ─── Web App Prototyper ───
// Module-level generation state — survives component unmount for true background processing
const _protoGen = { running: false, itemId: null, skinKey: null, result: null, error: null, partial: "", listeners: new Set() };
function _protoGenNotify() { _protoGen.listeners.forEach(fn => fn({})); }

// Standalone generation function — runs independently of React component lifecycle
// onResult(raw, skinKey) — called when generation succeeds (for history + archive update)
function _startProtoGeneration({ itemId, skinKey, ideaText, persona, notifyDone, onResult }) {
  _protoGen.running = true;
  _protoGen.itemId = itemId;
  _protoGen.skinKey = skinKey;
  _protoGen.result = null;
  _protoGen.error = null;
  _protoGen.partial = "";
  _protoGenNotify();

  const skin = PROTOTYPER_SKINS[skinKey];
  const clipped = ideaText.length > 2000 ? ideaText.slice(0, 2000) + "\n…(이하 생략)" : ideaText;
  const userMsg = `[원본 아이디어]\n${clipped}\n\n[선택 스킨: ${skin.name}]\n${skin.cssGuide}\n\n위 아이디어를 Cursor AI / Claude Code에서 즉시 사용 가능한 완성형 웹앱 개발 마스터 프롬프트로 생성해주세요. 사용자 요구사항, 기술 스택, UI/UX 설계, 데이터 모델, API 설계, 배포 전략까지 포괄하는 종합 프롬프트를 작성하세요.`;

  callAIStream(
    { ...persona, role: PROTOTYPER_SYNTH_SYSTEM },
    [{ role: "user", content: userMsg }],
    undefined,
    (_chunk, full) => {
      _protoGen.partial = full;
      _protoGenNotify();
    },
    { maxTokens: 16000, timeoutMs: 300_000 }
  ).then(raw => {
    if (!raw || !raw.trim()) throw new Error("AI 응답이 비어있습니다. 다시 시도해 주세요.");
    _protoGen.running = false;
    _protoGen.result = raw;
    _protoGen.partial = "";
    _protoGenNotify();
    notifyDone(clipTitle(ideaText));
    onResult?.(raw, skinKey);
  }).catch(err => {
    const partialResult = _protoGen.partial;
    _protoGen.running = false;
    _protoGen.partial = "";
    if (partialResult && partialResult.length > 200) {
      _protoGen.result = partialResult;
      _protoGenNotify();
      showAppToast("⚠️ 생성이 중단되었으나 부분 결과를 표시합니다", "info", 5000);
      notifyDone(clipTitle(ideaText));
      onResult?.(partialResult, skinKey);
    } else {
      _protoGen.error = err.message;
      _protoGenNotify();
      showAppToast(`🚀 프롬프트 생성 실패: ${err.message}`, "error", 6000);
    }
  });
}

// Hook to subscribe to _protoGen changes
function useProtoGenState() {
  const [, setTick] = useState({});
  useEffect(() => {
    const fn = (v) => setTick(v);
    _protoGen.listeners.add(fn);
    return () => _protoGen.listeners.delete(fn);
  }, []);
  return _protoGen;
}

function WebAppPrototyper({ item, personas, globalKey, onClose, recordHistory, onProtoSaved }) {
  const pg = useProtoGenState();
  const hasCached = pg.itemId === item.id && pg.result;
  const isRunning = pg.running && pg.itemId === item.id;

  const [phase, setPhase] = useState(hasCached ? "result" : isRunning ? "generating" : "skin");
  const [selectedSkin, setSelectedSkin] = useState(hasCached ? pg.skinKey : isRunning ? pg.skinKey : null);
  const [result, setResult] = useState(hasCached ? pg.result : "");
  const [generating, setGenerating] = useState(isRunning);
  const [copied, setCopied] = useState(false);
  const [copiedGuide, setCopiedGuide] = useState(false);
  const [closing, setClosing] = useState(false);
  const [viewRaw, setViewRaw] = useState(false);
  const [activeTab, setActiveTab] = useState("prompt");
  const { notifyStart, notifyDone } = useTaskNotify("prototyper");

  // Consume cached result
  useEffect(() => { if (hasCached) { _protoGen.result = null; } }, []);

  // React to background state changes
  useEffect(() => {
    if (pg.itemId !== item.id) return;
    if (pg.result) {
      setResult(pg.result);
      setSelectedSkin(pg.skinKey);
      setPhase("result");
      setGenerating(false);
      _protoGen.result = null;
    } else if (pg.partial && generating) {
      // Streaming in progress — keep phase on "generating"
    } else if (!pg.running && generating) {
      // Generation ended (error or external)
      setPhase("skin");
      setGenerating(false);
    }
  }, [pg.running, pg.result, pg.partial]);

  const ideaText = useMemo(() => {
    const p = item.payload;
    if (typeof p === "string") return p;
    if (p?.idea) return p.idea;
    if (p?.input) return p.input;
    if (p?.ideasText) return p.ideasText;
    if (p?.ctx) return p.ctx;
    if (p?.combined_concept) return `${p.combined_concept}${p.value_proposition ? " - " + p.value_proposition : ""}`;
    if (p?.summary) return typeof p.summary === "string" ? p.summary : JSON.stringify(p.summary).slice(0, 500);
    return item.title || JSON.stringify(p).slice(0, 500);
  }, [item]);

  const guideContent = useMemo(() => {
    const title = clipTitle(ideaText) || item.title || "프로젝트";
    const skinName = selectedSkin ? (PROTOTYPER_SKINS[selectedSkin]?.name || selectedSkin) : "Default Modern";
    return PROTOTYPER_PROJECT_GUIDE_TEMPLATE
      .replace(/\{\{TITLE\}\}/g, title)
      .replace(/\{\{SKIN\}\}/g, skinName);
  }, [ideaText, selectedSkin, item.title]);

  const getPersona = useCallback(() => {
    const resolved = (personas || []).map(p => withResolvedApiKey(p, globalKey));
    const found = resolved.find(p => p.apiKey);
    if (found) return { ...found, hasKey: true };
    const gk = (globalKey || "").trim();
    if (gk) return { provider: "claude", model: PROVIDERS.claude.models[0], apiKey: gk, hasKey: true, role: "" };
    return null;
  }, [personas, globalKey]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 300);
  };

  const generatePrompt = () => {
    if (!selectedSkin) return;
    const persona = getPersona();
    if (!persona?.apiKey) { showAppToast("🔑 프로토타이퍼 생성을 위해 API 키가 필요합니다. ⚙️ 설정에서 API 키를 입력해 주세요.", "error", 5000); return; }
    setGenerating(true);
    setPhase("generating");
    notifyStart();
    _startProtoGeneration({
      itemId: item.id,
      skinKey: selectedSkin,
      ideaText,
      persona,
      notifyDone,
      onResult: (raw, sk) => {
        const skin = PROTOTYPER_SKINS[sk];
        // 1) 분석 히스토리에 저장
        recordHistory?.({
          modeId: "prototyper",
          title: clipTitle(ideaText),
          payload: {
            idea: ideaText,
            skinKey: sk,
            skinName: skin?.name || sk,
            result: raw,
            sourceItemId: item.id,
            sourceTitle: item.title,
          },
        });
        // 2) 아카이브 항목에 _proto 필드 업데이트
        onProtoSaved?.({ skinKey: sk, skinName: skin?.name || sk, result: raw, ts: Date.now() });
      },
    });
  };

  const copyToClipboard = () => {
    const doCopy = (text) => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
      }
      return fallbackCopy(text);
    };
    const fallbackCopy = (text) => {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;left:-9999px;top:-9999px;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (_) { /* noop */ }
      document.body.removeChild(ta);
      return Promise.resolve();
    };
    doCopy(result).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const copyGuideToClipboard = () => {
    const doCopy = (text) => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text).catch(() => {
          const ta = document.createElement("textarea");
          ta.value = text; ta.style.cssText = "position:fixed;left:-9999px;top:-9999px;opacity:0";
          document.body.appendChild(ta); ta.select();
          try { document.execCommand("copy"); } catch (_) {}
          document.body.removeChild(ta);
        });
      }
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.cssText = "position:fixed;left:-9999px;top:-9999px;opacity:0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch (_) {}
      document.body.removeChild(ta);
      return Promise.resolve();
    };
    doCopy(guideContent).then(() => {
      setCopiedGuide(true);
      setTimeout(() => setCopiedGuide(false), 2000);
    });
  };

  const skinKeys = Object.keys(PROTOTYPER_SKINS);

  return (
    <div className="proto-overlay" style={closing ? { animation: "protoFadeOut 0.3s forwards" } : undefined}>
      <header className="proto-header proto-header-premium">
        <div className="proto-header-inner">
          <span className="proto-header-eyebrow">Web prototype</span>
          <h2>웹앱 프로토타이퍼</h2>
          {item.title ? <p className="proto-header-context">{item.title}</p> : null}
        </div>
        <button type="button" className="proto-close" aria-label="닫기" onClick={handleClose}>✕</button>
      </header>

      <div className="proto-body">
        {phase === "skin" && (
          <div className="proto-skin-container">
            <div className="proto-skin-title">GUI 스킨 선택</div>
            <div className="proto-skin-sub">스타일을 고르면 마스터 프롬프트에 반영됩니다</div>
            <div className="proto-skin-grid">
              {skinKeys.map(k => {
                const s = PROTOTYPER_SKINS[k];
                return (
                  <div key={k} className={`proto-skin-card${selectedSkin === k ? " selected" : ""}`} onClick={() => setSelectedSkin(k)}>
                    <div className="proto-skin-preview" style={{ background: s.gradient }}>
                      <span>{s.emoji}</span>
                    </div>
                    <div className="proto-skin-info">
                      <div className="proto-skin-name">{s.name}</div>
                      <div className="proto-skin-desc">{s.desc}</div>
                      <div className="proto-skin-sub-label">{s.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <button type="button" className="proto-skin-confirm" disabled={!selectedSkin || generating} onClick={generatePrompt}>
              {selectedSkin ? `✨ "${PROTOTYPER_SKINS[selectedSkin].name}"로 프롬프트 생성` : "스킨을 선택해주세요"}
            </button>
          </div>
        )}

        {phase === "generating" && (
          <div className="proto-loading-phase" style={pg.partial ? { display: "flex", flexDirection: "column", padding: "20px 24px" } : undefined}>
            {pg.partial ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexShrink: 0 }}>
                  <span className="spinner" style={{ width: 16, height: 16 }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>마스터 프롬프트 작성 중…</span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>{(pg.partial.length / 1000).toFixed(1)}k 자</span>
                </div>
                <div style={{ flex: 1, minHeight: 0 }}>
                  <StreamingRichText text={pg.partial} isStreaming={true} variant="synth" />
                </div>
              </>
            ) : (
              <>
                <div className="proto-spinner" />
                <div className="proto-loading-title">마스터 프롬프트 합성 중…</div>
                <div className="proto-loading-sub">AI 연결 대기 중입니다</div>
              </>
            )}
            <button type="button" className="proto-bg-btn" onClick={handleClose} style={{ flexShrink: 0, marginTop: pg.partial ? 16 : 0 }}>
              🏠 백그라운드에서 계속 — 완료 시 알림
            </button>
          </div>
        )}

        {phase === "result" && (
          <div className="proto-result-container">
            <div className="proto-result-header">
              <div className="proto-result-meta">
                <span className="proto-result-tag">📐 {PROTOTYPER_SKINS[selectedSkin]?.name}</span>
              </div>
              {/* 탭 스위처 */}
              <div style={{ display: "flex", gap: 4, marginBottom: 12, background: "var(--bg-surface-2)", borderRadius: 10, padding: 3 }}>
                <button type="button" onClick={() => setActiveTab("prompt")} style={{
                  flex: 1, padding: "8px 6px", border: "none", borderRadius: 8, cursor: "pointer",
                  fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: activeTab === "prompt" ? 800 : 500,
                  background: activeTab === "prompt" ? "var(--bg-surface-1)" : "transparent",
                  color: activeTab === "prompt" ? "var(--accent-primary)" : "var(--text-muted)",
                  boxShadow: activeTab === "prompt" ? "var(--shadow-sm)" : "none",
                  transition: "all 0.18s",
                }}>📝 마스터 프롬프트</button>
                <button type="button" onClick={() => setActiveTab("guide")} style={{
                  flex: 1, padding: "8px 6px", border: "none", borderRadius: 8, cursor: "pointer",
                  fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: activeTab === "guide" ? 800 : 500,
                  background: activeTab === "guide" ? "var(--bg-surface-1)" : "transparent",
                  color: activeTab === "guide" ? "#7c3aed" : "var(--text-muted)",
                  boxShadow: activeTab === "guide" ? "var(--shadow-sm)" : "none",
                  transition: "all 0.18s",
                }}>📋 PROJECT_GUIDE.md</button>
              </div>
            </div>

            {activeTab === "prompt" && (<>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
                <button type="button" className={`proto-view-toggle${viewRaw ? " active" : ""}`} onClick={() => setViewRaw(v => !v)}>
                  {viewRaw ? "📖 렌더링 보기" : "📝 원본(MD) 보기"}
                </button>
              </div>
              <p className="proto-result-hint">복사 시 Cursor / Claude Code에 바로 붙여넣기 가능한 마크다운 원문이 복사됩니다.</p>
              {viewRaw ? (
                <div className="proto-code-block">
                  <div className="proto-code-header">
                    <span className="proto-code-label">master-prompt.md</span>
                    <button type="button" className={`proto-code-copy${copied ? " copied" : ""}`} onClick={copyToClipboard}>
                      {copied ? "✓ 복사됨" : "Copy"}
                    </button>
                  </div>
                  <div className="proto-code-content">{result}</div>
                </div>
              ) : (
                <div className="proto-rendered-block">
                  <RichText text={result} />
                </div>
              )}
              <div className="proto-result-actions">
                <button type="button" className="proto-result-btn primary" onClick={copyToClipboard}>
                  {copied ? "✓ 클립보드에 복사됨" : "📋 마크다운 복사"}
                </button>
                <button type="button" className="proto-result-btn" onClick={() => {
                  const blob = new Blob([result], { type: "text/markdown" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url; a.download = "master-prompt.md"; a.click();
                  URL.revokeObjectURL(url);
                }}>.md 다운로드</button>
                <button type="button" className="proto-result-btn" onClick={() => { setPhase("skin"); setResult(""); setViewRaw(false); }}>스킨 변경</button>
                <button type="button" className="proto-result-btn" onClick={handleClose}>닫기</button>
              </div>
              <RefineCopilot reportText={result} personas={personas} globalKey={globalKey} />
            </>)}

            {activeTab === "guide" && (<>
              <div style={{ padding: "10px 14px", background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)", borderRadius: 10, marginBottom: 12, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                <strong style={{ color: "#7c3aed" }}>📋 PROJECT_GUIDE.md</strong> — 프로젝트 루트에 이 파일을 생성하세요.<br />
                Cursor AI는 자동으로 참조하고, Claude Code 사용자는 <code style={{ fontSize: 11, padding: "1px 5px", background: "var(--bg-surface-2)", borderRadius: 4 }}>CLAUDE.md</code>로 이름을 바꿔도 됩니다.
              </div>
              <div className="proto-code-block">
                <div className="proto-code-header">
                  <span className="proto-code-label">PROJECT_GUIDE.md</span>
                  <button type="button" className={`proto-code-copy${copiedGuide ? " copied" : ""}`} onClick={copyGuideToClipboard}>
                    {copiedGuide ? "✓ 복사됨" : "Copy"}
                  </button>
                </div>
                <div className="proto-code-content">{guideContent}</div>
              </div>
              <div className="proto-result-actions">
                <button type="button" className="proto-result-btn primary" style={{ background: "#7c3aed" }} onClick={copyGuideToClipboard}>
                  {copiedGuide ? "✓ 클립보드에 복사됨" : "📋 가이드 복사"}
                </button>
                <button type="button" className="proto-result-btn" onClick={() => {
                  const blob = new Blob([guideContent], { type: "text/markdown" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url; a.download = "PROJECT_GUIDE.md"; a.click();
                  URL.revokeObjectURL(url);
                }}>PROJECT_GUIDE.md 다운로드</button>
                <button type="button" className="proto-result-btn" onClick={handleClose}>닫기</button>
              </div>
            </>)}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 웹앱 프롬프트 이력 뷰어 모달 ───
function ProtoHistoryModal({ item, onClose, onRegenerate }) {
  const proto = item?.payload?._proto;
  const [viewRaw, setViewRaw] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);
  if (!proto) return null;

  const copy = () => {
    const doCopy = (text) => navigator.clipboard?.writeText(text).catch(() => {
      const ta = document.createElement("textarea"); ta.value = text; ta.style.cssText = "position:fixed;left:-9999px;opacity:0"; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); } catch (_) {} document.body.removeChild(ta);
    });
    doCopy(proto.result).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };
  const download = () => {
    const blob = new Blob([proto.result], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "master-prompt.md"; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="history-detail-overlay" onClick={onClose} role="presentation">
      <div className="history-detail-panel" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="history-detail-handle" aria-hidden="true" />
        <div className="history-detail-head">
          <div style={{ minWidth: 0 }}>
            <h3>📱 웹앱 프롬프트 이력</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", background: "#6366f1", padding: "2px 10px", borderRadius: 8 }}>{proto.skinName || proto.skinKey}</span>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{new Date(proto.ts).toLocaleString("ko-KR")}</span>
            </div>
            {item.title && <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📦 {item.title}</p>}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
            <button type="button" className={`proto-view-toggle${viewRaw ? " active" : ""}`} style={{ fontSize: 11, padding: "5px 10px" }} onClick={() => setViewRaw(v => !v)}>
              {viewRaw ? "📖 렌더링" : "📝 원본"}
            </button>
            <button type="button" className="modal-close" onClick={onClose} aria-label="닫기">✕</button>
          </div>
        </div>

        <div className="history-detail-scroll">
          {/* 프롬프트 내용 */}
          <div style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.05), rgba(37,99,235,0.03))", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 16 }}>✨</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#6366f1", letterSpacing: "-0.02em" }}>마스터 프롬프트</span>
              <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: "auto" }}>{(proto.result.length / 1000).toFixed(1)}k자</span>
            </div>
            {viewRaw ? (
              <pre style={{ fontSize: 12, lineHeight: 1.7, color: "var(--text-primary)", whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "var(--font-sans)", margin: 0 }}>{proto.result}</pre>
            ) : (
              <RichText text={proto.result} />
            )}
          </div>
        </div>

        <div className="history-detail-footer">
          <div className="history-detail-footer-grab" aria-hidden="true" />
          <div className="history-detail-footer-inner" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" className="btn-cta" style={{ flex: 1, minWidth: 120, fontSize: 13, padding: "11px 16px", minHeight: 44 }} onClick={copy}>
                {copied ? "✓ 복사됨" : "📋 마크다운 복사"}
              </button>
              <button type="button" className="btn-ghost" style={{ fontSize: 13, padding: "11px 16px" }} onClick={download}>.md 다운로드</button>
            </div>
            <button type="button" className="btn-ghost" style={{ fontSize: 12, padding: "9px 14px", borderColor: "rgba(99,102,241,0.3)", color: "#6366f1" }} onClick={onRegenerate}>
              🔄 새 스킨으로 재생성
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ───
function extractIdeasFromArchivePayload(modeId, payload) {
  if (!payload) return [];
  const raw = [];
  if (modeId === "tournament") {
    (payload.finalTop || []).forEach(item => { if (item?.idea?.trim()) raw.push(item.idea.trim()); });
    (payload.seedIdeas || []).forEach(s => { if (s?.trim()) raw.push(s.trim()); });
    (payload.aiIdeas || []).forEach(s => { if (s?.trim()) raw.push(s.trim()); });
  } else if (modeId === "hyperniche") {
    if (payload.input?.trim()) raw.push(payload.input.trim());
    (payload.ideas || []).forEach(s => { if (s?.trim()) raw.push(s.trim()); });
  } else if (modeId === "mixroulette") {
    if (payload.combined_concept?.trim()) raw.push(payload.combined_concept.trim());
    (payload.leftItems || []).forEach(s => { if (s?.trim()) raw.push(s.trim()); });
    (payload.rightItems || []).forEach(s => { if (s?.trim()) raw.push(s.trim()); });
  } else {
    if (payload.idea?.trim()) raw.push(payload.idea.trim());
    if (payload.input?.trim()) raw.push(payload.input.trim());
    if (payload.ideasText?.trim()) {
      payload.ideasText.split("\n").map(l => l.trim()).filter(Boolean).forEach(l => raw.push(l));
    }
  }
  return [...new Set(raw.filter(Boolean))];
}

function ArchiveSaveModal({ entry, onClose }) {
  const [groups, setGroups] = useState(loadArchiveGroups);
  const [selGroup, setSelGroup] = useState(groups[0] || "기본");
  const [newGroup, setNewGroup] = useState("");
  const [memo, setMemo] = useState("");
  const addGroup = () => {
    const n = newGroup.trim();
    if (!n || groups.includes(n)) return;
    const ng = [...groups, n];
    setGroups(ng);
    saveArchiveGroups(ng);
    setSelGroup(n);
    setNewGroup("");
  };
  const save = () => {
    const items = loadArchive();
    const idea = entry.payload?.idea || entry.payload?.input || entry.payload?.ideasText || entry.title || "";
    const cached = getAddonCache(idea);
    const enrichedPayload = (cached && Object.keys(cached).length > 0) ? { ...entry.payload, _addons: cached } : entry.payload;
    const item = { id: `arc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, ts: Date.now(), group: selGroup, memo, modeId: entry.modeId, modeName: entry.modeName, modeIcon: entry.modeIcon, title: entry.title || "무제", payload: enrichedPayload };
    items.unshift(item);
    saveArchive(items);
    const ideasToStack = extractIdeasFromArchivePayload(entry.modeId, entry.payload);
    if (ideasToStack.length) addToIdeaStack(ideasToStack);
    onClose(true);
  };
  return (
    <div className="archive-save-modal" onClick={onClose}>
      <div className="archive-save-panel" onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.03em" }}>📦 아카이브 저장</div>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 14, padding: "10px 14px", background: "var(--bg-surface-2)", borderRadius: 10 }}>
          <span style={{ fontWeight: 700 }}>{entry.modeIcon} {entry.modeName}</span> · {entry.title}
        </div>
        <div className="s-label">저장할 그룹</div>
        <div className="archive-filter-block">
          <select className="archive-select" style={{ width: "100%" }} value={selGroup} onChange={e => setSelGroup(e.target.value)} aria-label="저장 그룹 선택">
            {groups.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <div className="archive-new-group-inline">
            <input type="text" value={newGroup} onChange={e => setNewGroup(e.target.value)} placeholder="새 그룹 이름 입력 후 추가" onKeyDown={e => e.key === "Enter" && addGroup()} />
            <button type="button" className="idea-stack-btn" onClick={addGroup}>+ 그룹 추가</button>
          </div>
        </div>
        <div className="s-label">메모 (선택)</div>
        <input type="text" value={memo} onChange={e => setMemo(e.target.value)} placeholder="왜 이 결과를 아카이브하나요?" style={{ marginBottom: 16, fontSize: 12 }} />
        <button type="button" className="btn-cta" onClick={save} style={{ width: "100%" }}>📦 저장하기</button>
      </div>
    </div>
  );
}

function ArchiveView({ personas, globalKey, onGoHome }) {
  const [items, setItems] = useState(loadArchive);
  const [groups, setGroups] = useState(loadArchiveGroups);
  const [activeTab, setActiveTab] = useState("all");
  const [activeGroup, setActiveGroup] = useState("all");
  const [editId, setEditId] = useState(null);
  const [editMemo, setEditMemo] = useState("");
  const [newGroup, setNewGroup] = useState("");
  const [confirmDel, setConfirmDel] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [protoItem, setProtoItem] = useState(null);
  const [protoHistoryItem, setProtoHistoryItem] = useState(null); // 저장된 웹앱 프롬프트 이력 뷰어
  const [showNewGroup, setShowNewGroup] = useState(false);
  const pg = useProtoGenState();
  const recordHistory = useRecordHistory();

  // 프로토타이퍼 결과 아카이브 항목에 저장
  const handleProtoSaved = useCallback((protoData, targetItem) => {
    setItems(prev => {
      const updated = prev.map(it =>
        it.id === targetItem.id ? { ...it, payload: { ...it.payload, _proto: protoData } } : it
      );
      saveArchive(updated);
      return updated;
    });
  }, []);
  useEffect(() => {
    if (!viewItem || protoItem) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [viewItem, protoItem]);

  const modeTabs = [{ id: "all", label: "전체", icon: "📦" }, ...MODES.filter(m => m.id !== "archive").map(m => ({ id: m.id, label: m.name, icon: m.icon }))];
  const filtered = items.filter(it => (activeTab === "all" || it.modeId === activeTab) && (activeGroup === "all" || it.group === activeGroup));

  const del = (id) => { const ni = items.filter(i => i.id !== id); setItems(ni); saveArchive(ni); setConfirmDel(null); };
  const updateMemo = (id) => { const ni = items.map(i => i.id === id ? { ...i, memo: editMemo } : i); setItems(ni); saveArchive(ni); setEditId(null); };
  const delGroup = (g) => {
    if (g === "기본") return;
    const ni = items.map(i => i.group === g ? { ...i, group: "기본" } : i);
    const ng = groups.filter(x => x !== g);
    setItems(ni); saveArchive(ni); setGroups(ng); saveArchiveGroups(ng);
    if (activeGroup === g) setActiveGroup("all");
  };
  const addGroup = () => {
    const n = newGroup.trim();
    if (!n || groups.includes(n)) return;
    const ng = [...groups, n]; setGroups(ng); saveArchiveGroups(ng); setNewGroup("");
  };
  const copyItem = (item) => {
    const fakeEntry = { modeId: item.modeId, modeName: item.modeName, modeIcon: item.modeIcon, ts: item.ts, payload: item.payload };
    const md = copyHistoryAsRichText(fakeEntry, []);
    const extra = item.memo ? `\n> 📝 메모: ${item.memo}\n` : "";
    const full = md + extra;
    navigator.clipboard.writeText(full).then(() => alert("클립보드에 복사되었습니다"));
  };

  return (
    <div>
      <div className="archive-filter-block">
        <div className="archive-top-bar">
          <div className="archive-select-row">
            <select className="archive-select" value={activeGroup} onChange={e => setActiveGroup(e.target.value)} aria-label="아카이브 그룹 필터">
              <option value="all">모든 아이디어 ({items.length})</option>
              {groups.map(g => {
                const cnt = items.filter(i => i.group === g).length;
                return <option key={g} value={g}>{g} ({cnt})</option>;
              })}
            </select>
            {activeGroup !== "all" && activeGroup !== "기본" && (
              <button type="button" className="archive-del-group-btn" onClick={() => { if (window.confirm(`「${activeGroup}」그룹을 삭제할까요? 항목은 「기본」으로 옮깁니다.`)) delGroup(activeGroup); }}>삭제</button>
            )}
          </div>
          <button type="button" className="archive-new-group-btn" onClick={() => setShowNewGroup(v => !v)}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            새 그룹
          </button>
        </div>
        {showNewGroup && (
          <div className="archive-new-group-inline">
            <input type="text" value={newGroup} onChange={e => setNewGroup(e.target.value)} placeholder="새 그룹 이름을 입력하세요" autoFocus onKeyDown={e => { if (e.key === "Enter") { addGroup(); setShowNewGroup(false); } }} />
            <button type="button" onClick={() => { addGroup(); setShowNewGroup(false); }}>만들기</button>
          </div>
        )}
      </div>

      <div className="archive-tab-wrapper">
        <div className="archive-tab-fade-l" />
        <div className="archive-tab-row">
          {modeTabs.map(t => (
            <button key={t.id} type="button" className={`archive-tab${activeTab === t.id ? " active" : ""}`} onClick={() => setActiveTab(t.id)}>{t.icon} {t.label}</button>
          ))}
        </div>
        <div className="archive-tab-fade-r" />
      </div>

      {filtered.length === 0 && (
        <div className="archive-empty">
          <svg className="archive-empty-icon" viewBox="0 0 80 80" fill="none">
            <rect x="16" y="24" width="48" height="36" rx="4" stroke="#cbd5e1" strokeWidth="1.5" fill="none"/>
            <path d="M16 32h48" stroke="#cbd5e1" strokeWidth="1.5"/>
            <rect x="24" y="38" width="16" height="3" rx="1.5" fill="#e2e8f0"/>
            <rect x="24" y="45" width="24" height="3" rx="1.5" fill="#e2e8f0"/>
            <rect x="24" y="52" width="12" height="3" rx="1.5" fill="#e2e8f0"/>
            <circle cx="56" cy="20" r="10" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5"/>
            <path d="M56 16v8M52 20h8" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <h4>아카이브가 비어 있습니다</h4>
          <p>분석 결과에서 "아카이브 저장"을 눌러<br/>소중한 아이디어를 보관하세요</p>
          <button type="button" className="archive-empty-cta" onClick={() => onGoHome?.()}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 2L2 8h4v6l4-6H6V2z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            아이디어 탐색하러 가기
          </button>
        </div>
      )}

      {filtered.map(item => (
        <div className="archive-item" key={item.id}>
          <div className="archive-item-body">
            <span style={{ fontSize: 22, flexShrink: 0, lineHeight: 1 }}>{item.modeIcon}</span>
            <div className="archive-item-meta">
              <div className="archive-item-title">{item.title}</div>
              <div className="archive-item-tags">
                <span className="archive-item-badge" style={{ background: "var(--bg-surface-2)", color: "var(--text-muted)" }}>{item.modeName}</span>
                <span className="archive-item-badge" style={{ background: "rgba(37,99,235,0.06)", color: "#2563eb" }}>{item.group}</span>
              </div>
              {editId === item.id ? (
                <div style={{ display: "flex", gap: 5, marginBottom: 4 }}>
                  <input type="text" value={editMemo} onChange={e => setEditMemo(e.target.value)} style={{ flex: 1, fontSize: 12, padding: "5px 10px", border: "1px solid var(--glass-border)", borderRadius: 8, outline: "none", fontFamily: "var(--font-sans)", background: "var(--bg-surface-2)" }} autoFocus onKeyDown={e => e.key === "Enter" && updateMemo(item.id)} />
                  <button type="button" style={{ padding: "5px 10px", border: "none", borderRadius: 8, background: "var(--accent-primary)", color: "#fff", fontSize: 11, cursor: "pointer", fontFamily: "var(--font-sans)" }} onClick={() => updateMemo(item.id)}>저장</button>
                  <button type="button" style={{ padding: "5px 10px", border: "1px solid var(--glass-border)", borderRadius: 8, background: "var(--bg-surface-1)", color: "var(--text-muted)", fontSize: 11, cursor: "pointer", fontFamily: "var(--font-sans)" }} onClick={() => setEditId(null)}>취소</button>
                </div>
              ) : (
                item.memo && <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4, fontStyle: "italic" }}>📝 {item.memo}</div>
              )}
              <div className="archive-item-date">{new Date(item.ts).toLocaleString("ko-KR")}</div>
            </div>
          </div>
          <div className="archive-item-bottom">
            <div className="archive-actions">
              <button onClick={() => setViewItem(item)} title="다시 보기">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.2"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/></svg>
              </button>
              <button onClick={() => copyItem(item)} title="복사">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M3 11V3.5A.5.5 0 0 1 3.5 3H11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              </button>
              <button onClick={() => { setEditId(item.id); setEditMemo(item.memo || ""); }} title="메모">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M11.5 2.5l2 2L5 13H3v-2l8.5-8.5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              {confirmDel === item.id ? (
                <>
                  <button className="del" onClick={() => del(item.id)} style={{ fontSize: 10, width: "auto", padding: "0 8px" }}>확인</button>
                  <button onClick={() => setConfirmDel(null)} style={{ fontSize: 10, width: "auto", padding: "0 8px" }}>취소</button>
                </>
              ) : (
                <button className="del" onClick={() => setConfirmDel(item.id)} title="삭제">
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 4h10M6 4V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1M5 4l.5 9a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1L11 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                </button>
              )}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
              {/* 저장된 웹앱 프롬프트 이력 버튼 */}
              {item.payload?._proto && (
                <button type="button" className="archive-proto-btn archive-proto-history" onClick={() => setProtoHistoryItem(item)} title="저장된 웹앱 프롬프트 보기">
                  <span style={{ fontSize: 11 }}>📱</span> 프롬프트 이력
                </button>
              )}
              {/* 생성 중 / 결과 / 신규 버튼 */}
              {pg.running && pg.itemId === item.id ? (
                <span className="archive-proto-running" onClick={() => setProtoItem(item)}>
                  <span className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5, borderColor: "rgba(99,102,241,0.25)", borderTopColor: "#6366f1" }} />
                  웹앱 프롬프트 생성중…
                </span>
              ) : pg.result && pg.itemId === item.id ? (
                <button type="button" className="archive-proto-btn archive-proto-done" onClick={() => setProtoItem(item)}>
                  ✅ 결과 보기
                </button>
              ) : (
                <button type="button" className="archive-proto-btn" onClick={() => setProtoItem(item)}>
                  🚀 웹앱 프롬프트
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {filtered.length > 0 && (
        <div style={{ textAlign: "right", fontSize: 11, color: "#9ca3af", marginTop: 12, letterSpacing: "-0.01em" }}>
          {filtered.length}개 표시 · 전체 {items.length}개 보관
        </div>
      )}

      {viewItem && !protoItem && ReactDOM.createPortal(
        <div className="history-detail-overlay" onClick={() => setViewItem(null)} role="presentation">
          <div className="history-detail-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="history-detail-handle" aria-hidden="true" />
            <div className="history-detail-head">
              <div style={{ minWidth: 0 }}>
                <h3>{viewItem.modeIcon} {viewItem.modeName}</h3>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{new Date(viewItem.ts).toLocaleString("ko-KR")}</p>
                {viewItem.memo && <p style={{ fontSize: 11, color: "var(--accent-primary)", marginTop: 4, fontStyle: "italic" }}>📝 {viewItem.memo}</p>}
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                <button type="button" className="idea-stack-btn" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => copyItem(viewItem)}>📋 복사</button>
                <button type="button" className="modal-close" onClick={() => setViewItem(null)} aria-label="닫기">✕</button>
              </div>
            </div>
            <div className="history-detail-scroll">
              <HistoryDetailBody entry={{ modeId: viewItem.modeId, payload: viewItem.payload }} personas={[]} />
              <SavedAddonsDisplay payload={viewItem.payload} />
            </div>
            <div className="history-detail-footer">
              <div className="history-detail-footer-grab" aria-hidden="true" />
              <div className="history-detail-footer-inner">
                <ReportExportBar entryForExport={{ modeId: viewItem.modeId, title: viewItem.title, payload: viewItem.payload }} />
                <DeepAnalysisPanel idea={extractIdeaFromPayload(viewItem)} context={viewItem.payload?.fb || viewItem.payload?.context || ""} existingReport={extractReportFromPayload(viewItem)} personas={personas} globalKey={globalKey} />
                <ReportTools reportText={extractReportFromPayload(viewItem)} personas={personas} globalKey={globalKey} />
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {protoItem && ReactDOM.createPortal(
        <WebAppPrototyper
          item={protoItem}
          personas={personas}
          globalKey={globalKey}
          onClose={() => setProtoItem(null)}
          recordHistory={recordHistory}
          onProtoSaved={(protoData) => handleProtoSaved(protoData, protoItem)}
        />,
        document.body
      )}

      {/* 웹앱 프롬프트 이력 뷰어 */}
      {protoHistoryItem && ReactDOM.createPortal(
        <ProtoHistoryModal item={protoHistoryItem} onClose={() => setProtoHistoryItem(null)} onRegenerate={() => { setProtoHistoryItem(null); setProtoItem(protoHistoryItem); }} />,
        document.body
      )}
    </div>
  );
}

// ─── Report Export & Addons ───
// ─── Report AI Chat Widget ───
const QUICK_PROMPTS = [
  "더 구체적으로 설명해줘",
  "FBO 관점에서 보강해줘",
  "VC 투자자 관점으로 재작성",
  "리스크를 더 자세히",
  "실행 계획 구체화",
  "경쟁사 추가 분석",
];

function ReportChat({ idea, reportSummary, personas, globalKey }) {
  const { spend } = useCredits();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([
    { role: "ai", text: `안녕하세요! **"${(idea || "").slice(0, 30)}"** 리포트에 대해 질문하거나 수정을 요청해 보세요.

예: "FBO 관점에서 보강해줘", "리스크를 더 자세히 분석해줘"` },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const msgsEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => { if (open) msgsEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, open]);

  const send = async (text) => {
    const q = (text || input).trim();
    if (!q || loading) return;
    if (!spend("report_chat")) return;

    const newMsgs = [...msgs, { role: "user", text: q }];
    setInput("");
    setMsgs(newMsgs);
    setLoading(true);

    try {
      const persona = pickUsablePersona(personas, globalKey);
      if (!persona?.apiKey) throw new Error("API 키를 설정해 주세요 (⚙️ 설정).");
      const contextMsg = reportSummary
        ? `[현재 리포트 요약]
${reportSummary.slice(0, 3000)}

[아이디어]: ${idea}

[사용자 질문]: ${q}`
        : `[아이디어]: ${idea}

[사용자 질문]: ${q}`;
      const history = newMsgs.slice(-6).map((m) => ({ role: m.role === "ai" ? "assistant" : "user", content: m.text }));
      history[history.length - 1].content = contextMsg;
      setMsgs((prev) => [...prev, { role: "ai", text: "", _streaming: true }]);
      const result = await callAIStream(persona, history, REPORT_CHAT_SYSTEM, (_chunk, full) => {
        setMsgs((prev) => { const n = [...prev]; n[n.length - 1] = { role: "ai", text: full, _streaming: true }; return n; });
      });
      setMsgs((prev) => { const n = [...prev]; n[n.length - 1] = { role: "ai", text: result }; return n; });
    } catch (err) {
      setMsgs((prev) => [...prev, { role: "ai", text: `⚠️ 오류: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <>
      <button
        className="report-chat-fab"
        onClick={() => setOpen((o) => !o)}
        title="AI와 리포트 대화"
        aria-label="AI 채팅"
      >
        {open ? "✕" : "💬"}
      </button>
      {open && (
        <div className="report-chat-panel">
          <div className="report-chat-header">
            <div className="report-chat-avatar">🤖</div>
            <div>
              <div className="report-chat-title">AI 리포트 어시스턴트</div>
              <div className="report-chat-sub">리포트 수정 · 보강 · 질문</div>
            </div>
            <button className="report-chat-close" onClick={() => setOpen(false)}>✕</button>
          </div>
          <div className="report-chat-msgs">
            {msgs.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role}`}>
                {m.role === "ai" && <div className="chat-avatar-sm">🤖</div>}
                <div className="chat-bubble"><StreamingRichText text={m.text} isStreaming={!!m._streaming} variant="chat" /></div>
              </div>
            ))}
            {loading && !msgs[msgs.length - 1]?._streaming && (
              <div className="chat-msg ai">
                <div className="chat-avatar-sm">🤖</div>
                <div className="chat-bubble" style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span className="spinner" style={{ width: 14, height: 14 }} />
                  <span style={{ color: "var(--text-muted)", fontSize: 12 }}>분석 중<span className="loading-dots" /></span>
                </div>
              </div>
            )}
            <div ref={msgsEndRef} />
          </div>
          <div className="report-chat-quick">
            {QUICK_PROMPTS.map((q) => (
              <button key={q} className="chat-quick-btn" onClick={() => send(q)}>{q}</button>
            ))}
          </div>
          <div className="report-chat-input-row">
            <textarea
              ref={textareaRef}
              className="report-chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="리포트에 대해 질문하거나 수정을 요청하세요... (Enter 전송)"
              rows={1}
            />
            <button className="report-chat-send" onClick={() => send()} disabled={!input.trim() || loading}>
              ↑
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Brand & Viral Strategy Section ───
function BrandViralSection({ idea, context, existingReport, personas, globalKey }) {
  const { spend } = useCredits();
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});
  const [open, setOpen] = useState({});

  const [streaming, setStreaming] = useState({});

  const generate = async (type) => {
    if (results[type]) { setOpen(p => ({ ...p, [type]: !p[type] })); return; }
    if (Object.values(loading).some((v) => v)) return;
    if (!spend("brand_viral")) return; setLoading(p => ({ ...p, [type]: true })); setStreaming(p => ({ ...p, [type]: true }));
    try {
      const persona = pickUsablePersona(personas, globalKey);
      if (!persona?.apiKey) throw new Error("API 키를 설정해 주세요.");
      const fn = BRAND_VIRAL_PROMPTS[type];
      const content = fn(idea, context, existingReport);
      const result = await callAIStream(persona, [{ role: "user", content }], undefined, (_chunk, full) => {
        setResults(p => ({ ...p, [type]: full }));
        setOpen(p => ({ ...p, [type]: true }));
      });
      setResults(p => ({ ...p, [type]: result }));
      setOpen(p => ({ ...p, [type]: true }));
    } catch (err) {
      setResults(p => ({ ...p, [type]: `오류: ${err.message}` }));
      setOpen(p => ({ ...p, [type]: true }));
    }
    setStreaming(p => ({ ...p, [type]: false })); setLoading(p => ({ ...p, [type]: false }));
  };

  const configs = {
    branding: { label: "🎨 브랜딩 플랜", headColor: "#7c3aed", headBg: "rgba(124,58,237,0.06)", title: "브랜딩 전략 플랜" },
    viral: { label: "🚀 바이럴 전략", headColor: "#ec4899", headBg: "rgba(236,72,153,0.06)", title: "바이럴 성장 전략" },
  };

  return (
    <div style={{ marginTop: 16 }}>
      <div className="brand-viral-bar">
        {Object.entries(configs).map(([type, cfg]) => (
          <button
            key={type}
            className={`brand-viral-btn ${type}`}
            onClick={() => generate(type)}
            disabled={!!loading[type]}
          >
            {loading[type] ? <><span className="spinner" style={{ width: 13, height: 13 }} /> 생성 중<span className="loading-dots" /></> : cfg.label}
          </button>
        ))}
      </div>
      {Object.entries(configs).map(([type, cfg]) => {
        const res = results[type];
        if (!res) return null;
        return (
          <div key={type} className="brand-viral-result" style={{ borderColor: `${cfg.headColor}22` }}>
            <div
              className="brand-viral-result-head"
              style={{ background: cfg.headBg }}
              onClick={() => setOpen(p => ({ ...p, [type]: !p[type] }))}
            >
              <h4 style={{ color: cfg.headColor }}>{cfg.title}</h4>
              <span style={{ fontSize: 13, color: cfg.headColor, transform: open[type] ? "rotate(180deg)" : "none", transition: "transform 0.2s", display: "inline-block" }}>▾</span>
            </div>
            {open[type] && (
              <div className="brand-viral-result-body">
                {res.startsWith("오류:") ? <div className="err-msg">{res}</div> : <StreamingRichText text={res} isStreaming={!!streaming[type]} variant="compact" />}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function payloadToReadableHtml(payload, modeId) {
  const esc = (s) => String(s || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const md2html = (t) => esc(t).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>");
  const section = (icon, title, content) => content ? `<div style="margin-bottom:16px"><div style="font-size:11px;font-weight:800;color:#3182f6;margin-bottom:6px;letter-spacing:0.03em">${icon} ${esc(title)}</div><div style="font-size:13px;color:#4e5968;line-height:1.7">${md2html(content)}</div></div>` : "";
  const p = payload;
  let html = "";
  if (p.idea) html += section("💡", "아이디어", p.idea);
  if (p.input) html += section("💡", "관심 산업 / 방향", p.input);
  if (p.ideasText) html += section("💡", "아이디어 목록", p.ideasText);
  if (p.ctx) html += section("📋", "컨텍스트", p.ctx);
  if (p.fb) html += section("🎯", "피드백 방향", p.fb);
  if (p.context) html += section("📎", "상황 보강", p.context);
  if (p.synthesis) html += section("⚡", "종합 분석 리포트", p.synthesis);
  if (p.result && typeof p.result === "string") html += section("📊", "분석 결과", p.result);
  if (p.solution) html += section("🎯", "최종 솔루션", p.solution);
  if (p.finalReport) html += section("🏆", "최종 리포트", p.finalReport);
  if (p.report) {
    const r = p.report;
    if (r.combined_concept) html += section("💡", "결합 컨셉", r.combined_concept);
    if (r.tagline) html += `<div style="font-size:14px;color:#8b95a1;font-style:italic;margin:-10px 0 14px">${esc(r.tagline)}</div>`;
    if (r.problem) html += section("🔥", "핵심 문제", r.problem);
    if (r.value_proposition) html += section("🎯", "가치 제안", r.value_proposition);
    if (r.target_market) html += section("📊", "타깃 시장", r.target_market);
    if (r.business_model) html += section("💰", "비즈니스 모델", r.business_model);
    if (r.execution_strategy) html += section("🚀", "실행 전략", r.execution_strategy);
    if (r.risk_and_moat) html += section("🛡️", "리스크 & 해자", r.risk_and_moat);
    if (r.reference) html += section("📚", "유사 사례", r.reference);
  }
  if (p.results && typeof p.results === "object" && !Array.isArray(p.results)) {
    Object.entries(p.results).forEach(([k, v]) => { if (typeof v === "string" && k !== "error" && k !== "__full") html += section("📌", k, v); });
  }
  if (p.finalTop?.length) {
    html += `<div style="margin-bottom:16px"><div style="font-size:11px;font-weight:800;color:#f59e0b;margin-bottom:6px">🏆 최종 순위</div>`;
    p.finalTop.forEach((t, i) => { html += `<div style="font-size:14px;padding:4px 0">${["🥇","🥈","🥉"][i] || `${i+1}.`} ${esc(typeof t === "string" ? t : t.idea || "")}</div>`; });
    html += `</div>`;
  }
  if (p.ideas?.length) {
    p.ideas.forEach((idea, i) => { html += section(`🦄 #${i+1}`, idea.idea_name || `아이디어 ${i+1}`, `타겟: ${idea.micro_target || ""}\n${idea.concept_description || ""}\n해자: ${idea.moat_strategy || ""}\nMVP: ${idea.first_step || ""}`); });
  }
  if (p.branches?.length) {
    p.branches.forEach((b) => { html += section(`🌿 방향 ${b.id}`, b.title, `${b.angle || ""}\n${b.reasoning || ""}`); });
  }
  if (p.deepSteps?.length) {
    p.deepSteps.forEach((s) => { html += section(s.icon || "🔬", s.name || `심화 ${s.step+1}`, s.content); });
  }
  return html || `<div style="font-size:13px;color:#4e5968;line-height:1.7;white-space:pre-wrap">${esc(JSON.stringify(p, null, 2))}</div>`;
}

function payloadToPlainText(payload, modeId) {
  const p = payload;
  let t = "";
  const add = (label, val) => { if (val) t += `\n\n── ${label} ──\n${val}`; };
  add("아이디어", p.idea || p.input || p.ideasText);
  if (p.ctx) add("컨텍스트", p.ctx);
  if (p.fb) add("피드백 방향", p.fb);
  if (p.context) add("상황 보강", p.context);
  // 개별 분석 결과 (멀티 관점 등)
  if (p.results && typeof p.results === "object" && !Array.isArray(p.results)) {
    Object.entries(p.results).forEach(([k, v]) => { if (typeof v === "string" && k !== "error" && k !== "__full") add(k, v); });
  }
  if (p.synthesis) add("종합 분석 리포트", p.synthesis);
  if (p.result && typeof p.result === "string") add("분석 결과", p.result);
  if (p.solution) add("최종 솔루션", p.solution);
  if (p.finalReport) add("최종 리포트", p.finalReport);
  // 토너먼트 최종 순위
  if (p.finalTop?.length) {
    add("최종 순위", p.finalTop.map((item, i) => `${["🥇","🥈","🥉"][i] || `${i+1}.`} ${typeof item === "string" ? item : item.idea || ""}`).join("\n"));
  }
  // 믹스업 룰렛 리포트
  if (p.report) {
    const r = p.report;
    if (r.combined_concept) add("결합 컨셉", r.combined_concept);
    if (r.tagline) add("태그라인", r.tagline);
    if (r.problem) add("핵심 문제", r.problem);
    if (r.value_proposition) add("가치 제안", r.value_proposition);
    if (r.target_market) add("타깃 시장", r.target_market);
    if (r.business_model) add("비즈니스 모델", r.business_model);
    if (r.execution_strategy) add("실행 전략", r.execution_strategy);
    if (r.risk_and_moat) add("리스크 & 해자", r.risk_and_moat);
    if (r.reference) add("유사 사례", r.reference);
  }
  // 하이퍼 니치
  if (p.ideas?.length) {
    p.ideas.forEach((idea, i) => {
      add(`니치 #${i+1}: ${idea.idea_name || ""}`, `타겟: ${idea.micro_target || ""}\n${idea.concept_description || ""}\n해자: ${idea.moat_strategy || ""}\nMVP: ${idea.first_step || ""}`);
    });
  }
  // ToT 브랜치
  if (p.branches?.length) {
    p.branches.forEach((b) => { add(`방향 ${b.id}: ${b.title || ""}`, `${b.angle || ""}\n${b.reasoning || ""}`); });
  }
  if (p.evaluation) add("ToT 평가", p.evaluation);
  // 심화 분석 단계
  if (p.deepSteps?.length) {
    p.deepSteps.forEach((s) => { add(s.name || `심화 ${(s.step||0)+1}`, s.content); });
  }
  // 폴백 (rawFallback)
  if (p.rawFallback && typeof p.rawFallback === "string") add("분석 결과", p.rawFallback);
  return t.trim() || JSON.stringify(p, null, 2);
}

function ReportExportBar({ entryForExport }) {
  const [exporting, setExporting] = useState(false);
  const handlePdfExport = async () => {
    setExporting(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const el = document.createElement("div");
      el.style.cssText = "padding:32px 28px;font-family:Pretendard,-apple-system,BlinkMacSystemFont,sans-serif;color:#191f28;max-width:700px;line-height:1.7;font-size:13px";
      const title = entryForExport.title || "리포트";
      const mode = MODES.find((m) => m.id === entryForExport.modeId);
      const bodyHtml = payloadToReadableHtml(entryForExport.payload, entryForExport.modeId);
      el.innerHTML = `<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px"><div style="font-size:28px">${mode?.icon || "📊"}</div><div><div style="font-size:20px;font-weight:800;letter-spacing:-0.03em">${mode?.name || "분석 리포트"}</div><div style="font-size:14px;color:#4e5968;margin-top:2px">${title.replace(/</g, "&lt;")}</div></div></div><div style="font-size:10px;color:#8b95a1;margin:8px 0 16px">생성일: ${new Date().toLocaleString("ko-KR")} · Brainstorm Arena by MOJITO Labs</div><hr style="border:none;border-top:1.5px solid #e5e7eb;margin:0 0 20px">${bodyHtml}`;
      document.body.appendChild(el);
      await html2pdf().set({ margin: [14, 12, 14, 12], filename: `${title.replace(/[^a-zA-Z0-9가-힣]/g, "_").slice(0, 40)}_report.pdf`, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: "mm", format: "a4" } }).from(el).save();
      document.body.removeChild(el);
    } catch (err) {
      alert(`PDF 내보내기 실패: ${err.message}`);
    }
    setExporting(false);
  };

  const handleEmail = () => {
    const title = entryForExport.title || "Brainstorm Arena 리포트";
    const mode = MODES.find((m) => m.id === entryForExport.modeId);
    const plainBody = payloadToPlainText(entryForExport.payload, entryForExport.modeId);
    const prefix = `${mode?.icon || "📊"} ${mode?.name || ""} — ${title}`;
    const fullText = `${prefix}\n\n${plainBody}\n\n---\nBrainstorm Arena by MOJITO Labs`;
    // mailto URL 길이 제한 (~1800 chars) 대응: 초과 시 잘라서 안내 추가
    const MAX_BODY = 1600;
    const truncated = fullText.length > MAX_BODY
      ? fullText.slice(0, MAX_BODY) + "\n\n... (전체 내용은 PDF 내보내기를 이용하세요)"
      : fullText;
    const subject = encodeURIComponent(prefix);
    const body = encodeURIComponent(truncated);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="report-export-bar">
      <button className="report-export-btn" onClick={handlePdfExport} disabled={exporting}>
        {exporting ? <><span className="spinner" style={{ width: 14, height: 14 }} /> 생성 중<span className="loading-dots" /></> : "📄 PDF 내보내기"}
      </button>
      <button className="report-export-btn" onClick={handleEmail}>
        📧 메일 보내기
      </button>
    </div>
  );
}

const REPORT_ADDONS = [
  { key: "branding", icon: "🎨", label: "브랜딩 플랜", desc: "아이덴티티·네이밍·포지셔닝" },
  { key: "viral", icon: "🚀", label: "바이럴 전략", desc: "성장 해킹·콘텐츠·채널" },
  { key: "vc", icon: "📋", label: "VC 투자제안서", desc: "시리즈A 수준 IR 덱" },
  { key: "legal", icon: "⚖️", label: "법무 리스크", desc: "규제·IP·개인정보보호" },
  { key: "growth", icon: "📈", label: "시장 성장도", desc: "TAM·CAGR·성숙도 분석" },
  { key: "cost", icon: "💰", label: "운영비 시뮬레이션", desc: "개발·인프라·번레이트" },
  { key: "revenue", icon: "💎", label: "수익화 시점", desc: "수익 모델·MRR·BEP" },
];

const ADDON_CATEGORIES = [
  { id: "strategy", label: "전략 & 브랜딩", color: "#7c3aed", keys: ["branding", "viral", "vc"] },
  { id: "finance", label: "재무 & 리서치", color: "#059669", keys: ["growth", "cost", "revenue", "legal"] },
];

function ReportAddonSection({ idea, context, existingReport, personas, globalKey }) {
  const { spend } = useCredits();
  const cached = getAddonCache(idea);
  const [results, setResults] = useState(cached);
  const [loading, setLoading] = useState({});
  const [open, setOpen] = useState(() => {
    const o = {};
    Object.keys(cached).forEach(k => { o[k] = true; });
    return o;
  });

  const [streaming, setStreaming] = useState({});

  const generate = async (key) => {
    if (results[key]) { setOpen((p) => ({ ...p, [key]: !p[key] })); return; }
    if (Object.values(loading).some((v) => v)) {
      showAppToast("다른 분석이 진행 중입니다", "info", 2000);
      return;
    }
    const costKey = (key === "branding" || key === "viral") ? key : "report_addon";
    if (!spend(costKey)) return; setLoading((p) => ({ ...p, [key]: true })); setStreaming((p) => ({ ...p, [key]: true }));
    try {
      const persona = pickUsablePersona(personas, globalKey);
      let r;
      if (key === "branding" || key === "viral") {
        const fn = BRAND_VIRAL_PROMPTS[key];
        r = await callAIStream(persona, [{ role: "user", content: fn(idea, context, existingReport) }], undefined, (_chunk, full) => {
          setResults((p) => ({ ...p, [key]: full }));
          setOpen((p) => ({ ...p, [key]: true }));
        });
      } else {
        r = await generateReportSectionStream(persona, key, idea, context, existingReport, (_chunk, full) => {
          setResults((p) => ({ ...p, [key]: full }));
          setOpen((p) => ({ ...p, [key]: true }));
        });
      }
      setResults((p) => { const n = { ...p, [key]: r }; setAddonCache(idea, n); return n; });
      setOpen((p) => ({ ...p, [key]: true }));
    } catch (err) {
      setResults((p) => ({ ...p, [key]: `오류: ${err.message}` }));
      setOpen((p) => ({ ...p, [key]: true }));
    }
    setStreaming((p) => ({ ...p, [key]: false })); setLoading((p) => ({ ...p, [key]: false }));
  };

  return (
    <div>
      {ADDON_CATEGORIES.map((cat) => (
        <Fragment key={cat.id}>
          <div className="deep-analysis-cat-label">
            <span className="deep-analysis-cat-dot" style={{ background: cat.color }} />
            {cat.label}
          </div>
          <div className="report-addon-grid">
            {REPORT_ADDONS.filter((a) => cat.keys.includes(a.key)).map((a) => (
              <button
                key={a.key}
                className={`report-addon-btn${results[a.key] ? " active" : ""}`}
                onClick={() => generate(a.key)}
                disabled={!!loading[a.key]}
              >
                <span className="addon-icon-label">
                  {loading[a.key] ? <span className="spinner" style={{ width: 13, height: 13 }} /> : a.icon} {a.label}
                </span>
                <span className="addon-desc">{a.desc}</span>
              </button>
            ))}
          </div>
        </Fragment>
      ))}
      {REPORT_ADDONS.map((a) => open[a.key] && results[a.key] ? (
        <div key={a.key} className="r-card" style={{ marginTop: 10, borderLeft: "3px solid var(--accent-primary)", animation: "fiu 0.3s ease-out" }}>
          <div className="addon-result-header" onClick={() => setOpen((p) => ({ ...p, [a.key]: !p[a.key] }))}>
            <span className="r-card-icon">{a.icon}</span>
            <span className="r-card-title" style={{ flex: 1 }}>{a.label}</span>
            <span className="addon-result-collapse" data-open={String(!!open[a.key])}>▾</span>
          </div>
          <div className="report-scroll-box" style={{ padding: "0 14px 14px" }}>
            {String(results[a.key]).startsWith("오류:") ? <div className="err-msg">{results[a.key]}</div> : <StreamingRichText text={results[a.key]} isStreaming={!!streaming[a.key]} variant="addon" />}
          </div>
        </div>
      ) : null)}
    </div>
  );
}

// ─── Map & Expert Search Components ───
// ── Competitor distribution map (CartoDB Positron tiles + markers) ─────────
function CompetitorMapFitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) {
      map.setView([20, 0], 2);
      return;
    }
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 5);
      return;
    }
    const b = L.latLngBounds(points.map(p => [p.lat, p.lng]));
    map.fitBounds(b, { padding: [32, 32], maxZoom: 8 });
  }, [map, points]);
  return null;
}

function DotWorldMap({ domestic, global: globalPts }) {
  const allPoints = useMemo(() => [
    ...(domestic || []).map(p => ({ ...p, isDomestic: true })),
    ...(globalPts || []).map(p => ({ ...p, isDomestic: false })),
  ], [domestic, globalPts]);

  return (
    <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(0,0,0,0.08)", height: 340 }}>
      <MapContainer center={[20, 0]} zoom={2} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false} worldCopyJump>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <CompetitorMapFitBounds points={allPoints} />
        {allPoints.map((p, i) => (
          <CircleMarker
            key={`${p.lat}-${p.lng}-${i}`}
            center={[p.lat, p.lng]}
            radius={8}
            pathOptions={{
              color: p.isDomestic ? "#1d4ed8" : "#dc2626",
              fillColor: p.isDomestic ? "#3b82f6" : "#ef4444",
              fillOpacity: 0.95,
              weight: 2,
            }}
          >
            <Tooltip direction="top" offset={[0, -6]}>
              <div style={{ fontWeight: 700 }}>{p.name}</div>
              <div style={{ fontSize: 11, opacity: 0.85 }}>{p.city}{p.country ? ` · ${p.country}` : ""}</div>
              {p.desc ? <div style={{ fontSize: 10, marginTop: 4, maxWidth: 200, whiteSpace: "normal" }}>{p.desc}</div> : null}
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
      <div style={{
        position: "absolute", bottom: 10, left: 12, display: "flex", gap: 12, fontSize: 11, fontWeight: 600, zIndex: 1000, pointerEvents: "none",
        background: "rgba(255,255,255,0.9)", padding: "6px 10px", borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.12)", color: "#1e293b",
      }}>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3b82f6", display: "inline-block" }} /> 국내
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", display: "inline-block" }} /> 해외
        </span>
      </div>
    </div>
  );
}

function CompetitorMapSection({ idea, personas, globalKey }) {
  const { spend } = useCredits();
  const [mapData, setMapData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const generate = async () => {
    if (mapData) { setOpen(!open); return; }
    if (!spend("competitor_map")) return; setLoading(true);
    try {
      const persona = pickUsablePersona(personas, globalKey);
      const r = await callAI(persona, [{ role: "user", content: `아이디어: "${idea}"\n\n이 아이디어와 유사한 사업을 하고 있는 기업/서비스의 글로벌 분포를 분석하세요.\n\n다음 JSON만 반환 (코드펜스 금지):\n{"domestic":[{"name":"기업명","city":"도시","lat":37.5665,"lng":126.978,"desc":"한줄설명"}],"global":[{"name":"기업명","city":"도시","country":"국가","lat":37.0,"lng":127.0,"desc":"한줄설명"}],"summary":"국내외 사업 분포 요약 2-3문장"}\n\ndomestic은 한국 기업 5-8개, global은 해외 기업 8-12개. 실제 존재하는 기업과 최대한 정확한 좌표.` }]);
      const cleaned = r.replace(/```json|```/g, "").trim();
      let parsed;
      try { parsed = JSON.parse(cleaned); } catch {
        const a = cleaned.indexOf("{"), b = cleaned.lastIndexOf("}");
        if (a >= 0 && b > a) try { parsed = JSON.parse(cleaned.slice(a, b + 1)); } catch { /* noop */ }
      }
      setMapData(parsed || { summary: r });
      setOpen(true);
    } catch (err) {
      setMapData({ summary: `오류: ${err.message}` });
      setOpen(true);
    }
    setLoading(false);
  };

  return (
    <div style={{ marginTop: 10 }}>
      <button className="report-addon-btn full-width" onClick={generate} disabled={loading}>
        <span className="addon-icon-label">
          {loading ? <><span className="spinner" style={{ width: 13, height: 13 }} /> 지도 데이터 생성 중<span className="loading-dots" /></> : <>🗺️ 유사 사업 분포 지도</>}
        </span>
        <span className="addon-desc">국내외 경쟁사 위치 시각화</span>
      </button>
      {open && mapData && (
        <div className="r-card" style={{ marginTop: 10, animation: "fiu 0.3s ease-out" }}>
          <div className="r-card-header">
            <span className="r-card-icon">🗺️</span>
            <span className="r-card-title">국내외 유사 사업 분포</span>
          </div>
          {(mapData.domestic?.length > 0 || mapData.global?.length > 0) && (
            <div style={{ margin: "12px 0" }}>
              <DotWorldMap domestic={mapData.domestic} global={mapData.global} />
            </div>
          )}
          {mapData.summary && <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 10, lineHeight: 1.6 }}>{mapData.summary}</div>}
          {(mapData.domestic?.length > 0 || mapData.global?.length > 0) && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {mapData.domestic?.length > 0 && (
                <div style={{ padding: 12, background: "rgba(59,130,246,0.04)", borderRadius: 10, border: "1px solid rgba(59,130,246,0.1)" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#3b82f6", marginBottom: 8 }}>🇰🇷 국내 ({mapData.domestic.length})</div>
                  {mapData.domestic.map((p, i) => (
                    <div key={i} style={{ fontSize: 12, marginBottom: 6, lineHeight: 1.4 }}>
                      <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{p.name}</div>
                      <div style={{ color: "var(--text-muted)", fontSize: 11 }}>{p.city} · {p.desc}</div>
                    </div>
                  ))}
                </div>
              )}
              {mapData.global?.length > 0 && (
                <div style={{ padding: 12, background: "rgba(239,68,68,0.04)", borderRadius: 10, border: "1px solid rgba(239,68,68,0.1)" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#ef4444", marginBottom: 8 }}>🌍 해외 ({mapData.global.length})</div>
                  {mapData.global.map((p, i) => (
                    <div key={i} style={{ fontSize: 12, marginBottom: 6, lineHeight: 1.4 }}>
                      <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{p.name}</div>
                      <div style={{ color: "var(--text-muted)", fontSize: 11 }}>{p.country} · {p.city} · {p.desc}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ExpertSearchSection({ idea, personas, globalKey }) {
  const { spend } = useCredits();
  const [experts, setExperts] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const generate = async () => {
    if (experts) { setOpen(!open); return; }
    if (!spend("expert_search")) return; setLoading(true);
    try {
      const persona = pickUsablePersona(personas, globalKey);
      const r = await callAI(persona, [{ role: "user", content: `아이디어: "${idea}"\n\n이 아이디어 분야의 최고 권위자, 핵심 인재, 관련 논문을 서칭하세요.\n\nJSON만 반환:\n{"experts":[{"name":"이름","title":"직함/소속","expertise":"전문분야","linkedin_query":"LinkedIn 검색 키워드","reason":"왜 이 사람이 핵심인지"}],"papers":[{"title":"논문 제목","authors":"저자","year":"연도","relevance":"관련성","scholar_query":"Google Scholar 검색 키워드"}],"communities":[{"name":"커뮤니티명","platform":"플랫폼","url":"예상 URL","desc":"설명"}]}\n\nexperts 5-8명, papers 3-5편, communities 3-5개. 실존 인물/논문 기반. 한국어로.` }]);
      const cleaned = r.replace(/```json|```/g, "").trim();
      let parsed;
      try { parsed = JSON.parse(cleaned); } catch {
        const a = cleaned.indexOf("{"), b = cleaned.lastIndexOf("}");
        if (a >= 0 && b > a) try { parsed = JSON.parse(cleaned.slice(a, b + 1)); } catch { /* noop */ }
      }
      setExperts(parsed || { fallback: r });
      setOpen(true);
    } catch (err) {
      setExperts({ fallback: `오류: ${err.message}` });
      setOpen(true);
    }
    setLoading(false);
  };

  return (
    <div style={{ marginTop: 10 }}>
      <button className="report-addon-btn full-width" onClick={generate} disabled={loading}>
        <span className="addon-icon-label">
          {loading ? <><span className="spinner" style={{ width: 13, height: 13 }} /> 전문가 서칭 중<span className="loading-dots" /></> : <>👨‍🔬 전문가 & 논문 서칭</>}
        </span>
        <span className="addon-desc">핵심 인재·관련 논문·커뮤니티</span>
      </button>
      {open && experts && (
        <div className="r-card" style={{ marginTop: 10, animation: "fiu 0.3s ease-out" }}>
          <div className="r-card-header">
            <span className="r-card-icon">👨‍🔬</span>
            <span className="r-card-title">전문가 · 논문 · 커뮤니티</span>
          </div>
          {experts.fallback ? <RichText text={experts.fallback} /> : (
            <>
              {experts.experts?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "var(--accent-primary)", marginBottom: 8 }}>🏆 핵심 인재 ({experts.experts.length})</div>
                  {experts.experts.map((ex, i) => (
                    <div key={i} style={{ padding: "10px 12px", background: "var(--bg-surface-2)", borderRadius: 10, marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{ex.name}</span>
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{ex.title}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6, lineHeight: 1.5 }}>{ex.reason}</div>
                      <a href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(ex.linkedin_query || ex.name)}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "var(--accent-primary)", textDecoration: "none", fontWeight: 600 }}>🔗 LinkedIn에서 검색 →</a>
                    </div>
                  ))}
                </div>
              )}
              {experts.papers?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#7c3aed", marginBottom: 8 }}>📚 관련 논문 ({experts.papers.length})</div>
                  {experts.papers.map((p, i) => (
                    <div key={i} style={{ padding: "10px 12px", background: "rgba(124,58,237,0.03)", borderRadius: 10, marginBottom: 6, border: "1px solid rgba(124,58,237,0.08)" }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 3 }}>{p.title}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>{p.authors} · {p.year}</div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>{p.relevance}</div>
                      <a href={`https://scholar.google.com/scholar?q=${encodeURIComponent(p.scholar_query || p.title)}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#7c3aed", textDecoration: "none", fontWeight: 600 }}>📖 Google Scholar에서 검색 →</a>
                    </div>
                  ))}
                </div>
              )}
              {experts.communities?.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "var(--accent-success)", marginBottom: 8 }}>💬 관련 커뮤니티 ({experts.communities.length})</div>
                  {experts.communities.map((c, i) => (
                    <div key={i} style={{ padding: "10px 12px", background: "rgba(5,150,105,0.03)", borderRadius: 10, marginBottom: 6, border: "1px solid rgba(5,150,105,0.08)" }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>{c.name} <span style={{ fontSize: 10, color: "var(--text-muted)" }}>({c.platform})</span></div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 3 }}>{c.desc}</div>
                      {c.url && <a href={c.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "var(--accent-success)", textDecoration: "none", fontWeight: 600, marginTop: 4, display: "inline-block" }}>🔗 방문하기 →</a>}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Investor Search Section ───
function InvestorSearchSection({ idea, personas, globalKey }) {
  const { spend } = useCredits();
  const [investors, setInvestors] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const generate = async () => {
    if (investors) { setOpen(!open); return; }
    if (!spend("investor_search")) return; setLoading(true);
    try {
      const persona = pickUsablePersona(personas, globalKey);
      const r = await callAI(persona, [{ role: "user", content: `아이디어: "${idea}"\n\n이 아이디어/비즈니스에 투자 가능성이 있는 국내외 투자처 TOP10을 서칭하세요.\n\nJSON만 반환 (코드펜스 금지):\n{"investors":[{"rank":1,"name":"기관/펀드/인물명","type":"VC/엔젤/CVC/정부/액셀러레이터","country":"국가","focus":"주요 투자 분야","stage":"투자 단계(시드/시리즈A 등)","notable":"대표 포트폴리오 2-3개","reason":"이 아이디어에 투자 가능성이 높은 이유","email":"공개 연락처 이메일 (없으면 null)","website":"공식 웹사이트 URL","linkedin":"LinkedIn 페이지 URL (없으면 null)","contact_note":"연락 팁 한 줄"}]}\n\n반드시 10개. 국내 5개 + 해외 5개 혼합. 실제 존재하는 기관 기반. 한국어로.` }]);
      const cleaned = r.replace(/```json|```/g, "").trim();
      let parsed;
      try { parsed = JSON.parse(cleaned); } catch {
        const a = cleaned.indexOf("{"), b = cleaned.lastIndexOf("}");
        if (a >= 0 && b > a) try { parsed = JSON.parse(cleaned.slice(a, b + 1)); } catch { /* noop */ }
      }
      setInvestors(parsed || { fallback: r });
      setOpen(true);
    } catch (err) {
      setInvestors({ fallback: `오류: ${err.message}` });
      setOpen(true);
    }
    setLoading(false);
  };

  const typeColor = { VC: "#3b82f6", 엔젤: "#f59e0b", CVC: "#7c3aed", 정부: "#059669", 액셀러레이터: "#ec4899" };

  return (
    <div style={{ marginTop: 10 }}>
      <button className="report-addon-btn full-width" onClick={generate} disabled={loading}>
        <span className="addon-icon-label">
          {loading ? <><span className="spinner" style={{ width: 13, height: 13 }} /> 투자처 서칭 중<span className="loading-dots" /></> : <>💰 잠재 투자처 TOP10</>}
        </span>
        <span className="addon-desc">국내외 VC·엔젤·CVC 매칭</span>
      </button>
      {open && investors && (
        <div className="r-card" style={{ marginTop: 10, animation: "fiu 0.3s ease-out" }}>
          <div className="r-card-header">
            <span className="r-card-icon">💰</span>
            <span className="r-card-title">잠재 투자처 TOP10</span>
            <span className="r-card-badge" style={{ background: "rgba(5,150,105,0.08)", color: "var(--accent-success)", border: "1px solid rgba(5,150,105,0.15)" }}>AI 서치</span>
          </div>
          {investors.fallback ? <RichText text={investors.fallback} /> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(investors.investors || []).map((inv, i) => {
                const tc = typeColor[inv.type] || "#6b7280";
                return (
                  <div key={i} style={{ padding: "12px 14px", background: "var(--bg-surface-2)", borderRadius: 12, border: "1px solid var(--glass-border)", position: "relative" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                      <span style={{ width: 24, height: 24, borderRadius: 8, background: `${tc}15`, color: tc, fontWeight: 800, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1px solid ${tc}25` }}>{inv.rank}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 3 }}>
                          <span style={{ fontWeight: 800, fontSize: 14, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>{inv.name}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 8, background: `${tc}12`, color: tc, border: `1px solid ${tc}20` }}>{inv.type}</span>
                          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{inv.country}</span>
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>
                          {inv.stage && <span style={{ marginRight: 8 }}>📍 {inv.stage}</span>}
                          {inv.focus && <span>{inv.focus}</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 8 }}>{inv.reason}</div>
                    {inv.notable && (
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>
                        <span style={{ fontWeight: 600 }}>포트폴리오:</span> {inv.notable}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {inv.website && (
                        <a href={inv.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "var(--accent-primary)", textDecoration: "none", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
                          🌐 웹사이트
                        </a>
                      )}
                      {inv.linkedin && (
                        <a href={inv.linkedin} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#0077b5", textDecoration: "none", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
                          💼 LinkedIn
                        </a>
                      )}
                      {inv.email && (
                        <a href={`mailto:${inv.email}`} style={{ fontSize: 11, color: "#7c3aed", textDecoration: "none", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
                          ✉️ {inv.email}
                        </a>
                      )}
                      {inv.contact_note && (
                        <span style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: 4, fontStyle: "italic" }}>{inv.contact_note}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Deep Analysis Panel (unified wrapper) ───
function DeepAnalysisPanel({ idea, context, existingReport, personas, globalKey }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="deep-analysis-panel">
      <button type="button" className="deep-analysis-toggle" onClick={() => setOpen(!open)}>
        <div className="deep-analysis-toggle-left">
          <span className="deep-analysis-toggle-icon">🔬</span>
          <div>
            <div className="deep-analysis-toggle-title">추가 분석 도구</div>
            <div className="deep-analysis-toggle-desc">전략·재무·리서치·시뮬레이션</div>
          </div>
        </div>
        <span className="deep-analysis-arrow" data-open={open}>▾</span>
      </button>
      {open && (
        <div className="deep-analysis-body">
          <ReportAddonSection idea={idea} context={context} existingReport={existingReport} personas={personas} globalKey={globalKey} />
          <div className="deep-analysis-cat-label">
            <span className="deep-analysis-cat-dot" style={{ background: "#3182f6" }} />
            탐색 & 시뮬레이션
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <CompetitorMapSection idea={idea} personas={personas} globalKey={globalKey} />
            <InvestorSearchSection idea={idea} personas={personas} globalKey={globalKey} />
            <ExpertSearchSection idea={idea} personas={personas} globalKey={globalKey} />
          </div>
          <QuantumSimCTA idea={idea} context={context} existingReport={existingReport} personas={personas} globalKey={globalKey} />
        </div>
      )}
    </div>
  );
}

// ─── 48-Week Quantum Simulator ───
function QuantumSimCTA({ idea, context, existingReport, personas, globalKey }) {
  const [open, setOpen] = useState(false);
  const [simPending, setSimPending] = useState(false);
  const [simResult, setSimResult] = useState(null);
  const { spend } = useCredits();

  const runSimulation = useCallback(async (weeks, perspective) => {
    const perspectiveLabels = { optimistic: "낙관적", neutral: "중립적", pessimistic: "비관적" };
    setSimPending(true);
    setSimResult(null);
    showAppToast("퀀텀 시뮬레이션 진행 중...", "info", 8000);
    try {
      const persona = pickUsablePersona(personas, globalKey);
      if (!persona?.apiKey) throw new Error("API 키를 설정해 주세요.");
      const reportText = typeof existingReport === "string" ? existingReport : JSON.stringify(existingReport || {});
      const content = `아이디어: "${idea || ""}"\n${context ? `배경: ${context}\n` : ""}\n기존 분석 리포트:\n${reportText.slice(0, 4000)}\n\n설정 주차: ${weeks}주\n선택 관점: ${perspectiveLabels[perspective]}\n\n위 정보를 기반으로 ${weeks}주 시뮬레이션을 JSON으로 실행하세요.`;
      const r = await callAI(
        { ...persona, role: QUANTUM_SIMULATOR_SYSTEM },
        [{ role: "user", content }]
      );
      const cleaned = r.replace(/```json|```/g, "").trim();
      let parsed;
      try { parsed = JSON.parse(cleaned); } catch {
        const a = cleaned.indexOf("{"), b = cleaned.lastIndexOf("}");
        if (a >= 0 && b > a) try { parsed = JSON.parse(cleaned.slice(a, b + 1)); } catch { /* noop */ }
      }
      setSimResult(parsed || { error: "응답 파싱 실패", raw: r });
      showAppToast("시뮬레이션 완료", "info", 4000);
    } catch (err) {
      setSimResult({ error: err.message });
      showAppToast(`오류: ${err.message}`, "error", 5000);
    }
    setSimPending(false);
  }, [idea, context, existingReport, personas, globalKey]);

  const handleStartFromModal = useCallback((weeks, perspective) => {
    if (!spend("quantum_sim")) return;
    setOpen(false);
    runSimulation(weeks, perspective);
  }, [spend, runSimulation]);

  const summaryPreview = simResult?.summary && typeof simResult.summary === "string" ? simResult.summary : "";
  const summaryShort = summaryPreview.length > 280 ? `${summaryPreview.slice(0, 280)}…` : summaryPreview;

  return (
    <>
      <button type="button" className="quantum-sim-cta" onClick={() => setOpen(true)}>
        🚀 주차별 실행 시뮬레이션 돌려보기
      </button>
      {simPending && (
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 600, color: "var(--text-muted)" }}>
          <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2, flexShrink: 0 }} />
          퀀텀 시뮬레이션 진행 중…
        </div>
      )}
      {!simPending && simResult && (simResult.weeks?.length > 0 || simResult.error) && (
        <div style={{ marginTop: 12, padding: 14, borderRadius: 12, background: "var(--bg-surface-2)", border: "1px solid var(--glass-border)" }}>
          {simResult.error && !simResult.weeks?.length ? (
            <>
              <div style={{ fontSize: 13, color: "var(--accent-error)", lineHeight: 1.5 }}>오류: {simResult.error}</div>
              <button type="button" className="btn-ghost" style={{ marginTop: 10 }} onClick={() => setOpen(true)}>다시 시도</button>
            </>
          ) : (
            <>
              {summaryShort ? (
                <p style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.55, margin: "0 0 10px", color: "var(--text-primary)" }}>{summaryShort}</p>
              ) : null}
              <button type="button" className="btn-ghost" onClick={() => setOpen(true)}>전체 타임라인 보기</button>
            </>
          )}
        </div>
      )}
      {open && (
        <QuantumSimulator
          idea={idea}
          context={context}
          existingReport={existingReport}
          personas={personas}
          globalKey={globalKey}
          onClose={() => setOpen(false)}
          result={simResult}
          setResult={setSimResult}
          pending={simPending}
          onStartRun={handleStartFromModal}
        />
      )}
    </>
  );
}

function QuantumSimulator({ idea, context, existingReport, personas, globalKey, onClose, result, setResult, pending, onStartRun }) {
  const [weeks, setWeeks] = useState(12);
  const [perspective, setPerspective] = useState("neutral");
  const [expanded, setExpanded] = useState(new Set([1]));
  const bodyRef = useRef(null);

  const perspectiveLabels = { optimistic: "낙관적", neutral: "중립적", pessimistic: "비관적" };

  useEffect(() => {
    if (result?.weeks?.length) setExpanded(new Set([1]));
  }, [result]);

  const toggleWeek = (w) => setExpanded(prev => {
    const next = new Set(prev);
    next.has(w) ? next.delete(w) : next.add(w);
    return next;
  });
  const expandAll = () => setExpanded(new Set((result?.weeks || []).map(w => w.week)));
  const collapseAll = () => setExpanded(new Set());

  const successColor = (v) => v >= 70 ? "#059669" : v >= 40 ? "#f59e0b" : "#dc2626";
  const riskClr = (v) => v >= 70 ? "#dc2626" : v >= 40 ? "#f59e0b" : "#059669";
  const impactClr = { "상": "#dc2626", "중": "#f59e0b", "하": "#059669" };

  return (
    <div className="quantum-sim-overlay" onClick={onClose}>
      <div className="quantum-sim-panel" onClick={e => e.stopPropagation()}>
        <div className="qs-header">
          <div className="qs-header-text">
            <h2>🚀 48주 퀀텀 시뮬레이터</h2>
            <p>AI가 사업 실행 과정과 리스크를 주차별로 시뮬레이션합니다</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="닫기">✕</button>
        </div>

        <div className="qs-body" ref={bodyRef}>
          {/* ─ Settings Phase ─ */}
          {!result && !pending && (
            <div className="qs-settings-card" style={{ animation: "fiu 0.4s ease-out" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 10, letterSpacing: "0.04em" }}>시뮬레이션 기간</div>
              <div className="qs-week-control">
                <button className="qs-week-btn" onClick={() => setWeeks(w => Math.max(1, w - 1))} disabled={weeks <= 1}>−</button>
                <div className="qs-week-display">{weeks}<span>주</span></div>
                <button className="qs-week-btn" onClick={() => setWeeks(w => Math.min(48, w + 1))} disabled={weeks >= 48}>+</button>
              </div>
              <div className="qs-slider-wrap">
                <div className="qs-slider-track" />
                <div className="qs-slider-fill" style={{ width: `${((weeks - 1) / 47) * 100}%` }} />
                <input type="range" className="qs-slider-input" min={1} max={48} value={weeks} onChange={e => setWeeks(+e.target.value)} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-muted)", margin: "-8px 0 24px", fontWeight: 600 }}>
                <span>1주</span><span>12주</span><span>24주</span><span>36주</span><span>48주</span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 12, letterSpacing: "0.04em" }}>시나리오 관점</div>
              <div className="qs-segment">
                {[["optimistic", "☀️ 낙관적"], ["neutral", "⚖️ 중립"], ["pessimistic", "🌧️ 비관적"]].map(([k, label]) => (
                  <button key={k} className={`qs-segment-btn ${k} ${perspective === k ? "active" : ""}`} onClick={() => setPerspective(k)}>{label}</button>
                ))}
              </div>
              {idea && (
                <div className="qs-callout" style={{ marginTop: 20 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-primary)", marginBottom: 4 }}>📌 분석 대상</p>
                  <p style={{ fontSize: 13 }}>{typeof idea === "string" ? idea.slice(0, 200) : ""}{idea?.length > 200 ? "…" : ""}</p>
                </div>
              )}
              <button type="button" className="qs-run-btn" onClick={() => onStartRun(weeks, perspective)} disabled={pending}>🚀 시뮬레이션 시작</button>
            </div>
          )}

          {/* ─ In-flight (modal reopened while API runs) ─ */}
          {pending && !result && (
            <div style={{ textAlign: "center", padding: "40px 20px 32px", animation: "fiu 0.4s ease-out" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 12, fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                퀀텀 시뮬레이션 진행 중…
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 10 }}>{perspectiveLabels[perspective]} 관점 · 백그라운드에서 분석 중입니다</div>
            </div>
          )}

          {/* ─ Error ─ */}
          {result?.error && !result.weeks && (
            <div style={{ animation: "fiu 0.4s ease-out" }}>
              <div className="err-msg" style={{ marginBottom: 16 }}>오류: {result.error}</div>
              {result.raw && <div className="r-card"><RichText text={result.raw} /></div>}
              <button className="qs-run-btn" style={{ marginTop: 16 }} onClick={() => setResult(null)}>← 설정으로 돌아가기</button>
            </div>
          )}

          {/* ─ Results ─ */}
          {result?.weeks?.length > 0 && (
            <div style={{ animation: "fiu 0.5s ease-out" }}>
              <div className="qs-callout">
                <p style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.7 }}>{result.summary}</p>
              </div>

              <div className="qs-stats-grid">
                <div className="qs-stat-card">
                  <div className="qs-stat-value" style={{ color: successColor(result.success_probability) }}>
                    {result.success_probability ?? "—"}<span style={{ fontSize: 14 }}>%</span>
                  </div>
                  <div className="qs-stat-label">성공 확률</div>
                  <div className="qs-gauge-wrap">
                    <div className="qs-gauge-fill" style={{ width: `${result.success_probability || 0}%`, background: successColor(result.success_probability) }} />
                  </div>
                </div>
                <div className="qs-stat-card">
                  <div className="qs-stat-value" style={{ color: riskClr(result.risk_index) }}>
                    {result.risk_index ?? "—"}<span style={{ fontSize: 14 }}>%</span>
                  </div>
                  <div className="qs-stat-label">리스크 지수</div>
                  <div className="qs-gauge-wrap">
                    <div className="qs-gauge-fill" style={{ width: `${result.risk_index || 0}%`, background: riskClr(result.risk_index) }} />
                  </div>
                </div>
                <div className="qs-stat-card">
                  <div className="qs-stat-value" style={{ color: "var(--text-primary)", fontSize: 18 }}>{result.total_burn || "—"}</div>
                  <div className="qs-stat-label">총 예상 자금</div>
                </div>
              </div>

              <div className="qs-controls">
                <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>📅 주차별 타임라인 ({result.weeks.length}주)</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="qs-control-btn" onClick={expandAll}>모두 펼치기</button>
                  <button className="qs-control-btn" onClick={collapseAll}>모두 접기</button>
                </div>
              </div>

              <div className="qs-timeline">
                {result.weeks.map(w => {
                  const isOpen = expanded.has(w.week);
                  return (
                    <div key={w.week} className="qs-week-item">
                      <div className="qs-week-dot" style={{ borderColor: successColor(w.progress || 0) }} />
                      <div className={`qs-week-header ${isOpen ? "expanded" : ""}`} onClick={() => toggleWeek(w.week)}>
                        <span className="qs-week-badge">{w.week}주차</span>
                        {w.phase && <span className="qs-week-phase">{w.phase}</span>}
                        <span className="qs-week-goal">{w.main_goal}</span>
                        <span className={`qs-week-arrow ${isOpen ? "expanded" : ""}`}>▾</span>
                      </div>
                      {isOpen && (
                        <div className="qs-week-body">
                          <div className="qs-section-title">🎯 핵심 마일스톤</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.6, marginBottom: 4 }}>{w.main_goal}</div>

                          {w.checklist?.length > 0 && (
                            <>
                              <div className="qs-section-title">☑️ 실행 체크리스트</div>
                              <ul className="qs-checklist">
                                {w.checklist.map((item, ci) => <li key={ci}>{item}</li>)}
                              </ul>
                            </>
                          )}

                          {w.scenarios && (
                            <>
                              <div className="qs-section-title">⚡ 예상 시나리오</div>
                              <div className="qs-scenario-block">{w.scenarios}</div>
                            </>
                          )}

                          {w.risk && (
                            <>
                              <div className="qs-section-title">⚠️ 리스크 관리</div>
                              <div className="qs-risk-card">
                                <div className="qs-risk-head">
                                  <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", flex: 1 }}>{w.risk.description}</span>
                                  {w.risk.probability != null && (
                                    <span className="qs-risk-prob" style={{ background: `${riskClr(w.risk.probability)}15`, color: riskClr(w.risk.probability) }}>
                                      발생 {w.risk.probability}%
                                    </span>
                                  )}
                                  {w.risk.impact && (
                                    <span className="qs-risk-impact" style={{ background: `${impactClr[w.risk.impact] || "#6b7280"}15`, color: impactClr[w.risk.impact] || "#6b7280" }}>
                                      임팩트: {w.risk.impact}
                                    </span>
                                  )}
                                </div>
                                {w.risk.mitigation && (
                                  <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, marginTop: 4 }}>
                                    💡 <strong>대응:</strong> {w.risk.mitigation}
                                  </div>
                                )}
                              </div>
                            </>
                          )}

                          {w.resources && (
                            <>
                              <div className="qs-section-title">📊 투입 자원</div>
                              <div className="qs-resource-grid">
                                {w.resources.budget && <div className="qs-resource-item"><div className="qs-res-label">💰 예산</div><div className="qs-res-value">{w.resources.budget}</div></div>}
                                {w.resources.team && <div className="qs-resource-item"><div className="qs-res-label">👥 인력</div><div className="qs-res-value">{w.resources.team}</div></div>}
                                {w.resources.tools && <div className="qs-resource-item"><div className="qs-res-label">🔧 도구</div><div className="qs-res-value">{w.resources.tools}</div></div>}
                              </div>
                            </>
                          )}

                          {w.progress != null && (
                            <div style={{ marginTop: 14 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4 }}>
                                <span>누적 진행률</span>
                                <span style={{ color: successColor(w.progress) }}>{w.progress}%</span>
                              </div>
                              <div className="qs-progress-bar">
                                <div className="qs-progress-fill" style={{ width: `${w.progress}%` }} />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
                <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setResult(null)}>← 설정 변경</button>
                <button type="button" className="qs-run-btn" style={{ flex: 2, marginTop: 0 }} onClick={() => onStartRun(weeks, perspective)} disabled={pending}>🔄 다시 시뮬레이션</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Fact-Check Radar ───
function FactCheckRadar({ reportText, personas, globalKey }) {
  const { spend } = useCredits();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [open, setOpen] = useState(false);

  const run = async () => {
    if (results) { setOpen(!open); return; }
    if (!spend("fact_check")) return; setScanning(true);
    setLoading(true);
    try {
      const persona = pickUsablePersona(personas, globalKey);
      if (!persona?.apiKey) throw new Error("API 키를 설정해 주세요.");
      const text = typeof reportText === "string" ? reportText : JSON.stringify(reportText || {});
      const r = await callAI(
        { ...persona, role: FACT_CHECK_SYSTEM },
        [{ role: "user", content: `다음 텍스트를 팩트체크하세요:\n\n${text.slice(0, 5000)}` }]
      );
      const cleaned = r.replace(/```json|```/g, "").trim();
      let parsed;
      try { parsed = JSON.parse(cleaned); } catch {
        const a = cleaned.indexOf("["), b = cleaned.lastIndexOf("]");
        if (a >= 0 && b > a) try { parsed = JSON.parse(cleaned.slice(a, b + 1)); } catch { /* noop */ }
      }
      setResults(Array.isArray(parsed) ? parsed : []);
      setOpen(true);
    } catch (err) {
      setResults([{ quote_text: "분석 실패", status: "CAUTION", reason: err.message, source: null }]);
      setOpen(true);
    }
    setLoading(false);
    setTimeout(() => setScanning(false), 600);
  };

  const cfg = {
    VERIFIED: { color: "#059669", bg: "rgba(5,150,105,0.06)", border: "#059669", label: "✅ 검증됨" },
    CAUTION: { color: "#d97706", bg: "rgba(217,119,6,0.06)", border: "#d97706", label: "⚠️ 확인 필요" },
    FALSE: { color: "#dc2626", bg: "rgba(220,38,38,0.06)", border: "#dc2626", label: "❌ 환각 의심" },
  };

  const vCount = (results || []).filter(r => r.status === "VERIFIED").length;
  const cCount = (results || []).filter(r => r.status === "CAUTION").length;
  const fCount = (results || []).filter(r => r.status === "FALSE").length;

  return (
    <div style={{ marginTop: 10 }}>
      <button className="fc-radar-btn" onClick={run} disabled={loading}>
        {loading ? <><span className="spinner" style={{ width: 13, height: 13 }} /> 팩트체크 분석 중…</> : "🔍 팩트체크 레이더 가동"}
      </button>
      {scanning && <div className="fc-scan-overlay"><div className="fc-scan-line" /></div>}
      {open && results?.length > 0 && (
        <div className="r-card" style={{ marginTop: 10, animation: "fiu 0.3s ease-out" }}>
          <div className="r-card-header">
            <span className="r-card-icon">🔍</span>
            <span className="r-card-title">팩트체크 레이더 결과</span>
            <span className="r-card-badge" style={{ background: "rgba(5,150,105,0.08)", color: "#059669", border: "1px solid rgba(5,150,105,0.15)" }}>
              {results.length}건 분석
            </span>
          </div>
          <div className="fc-stats-bar">
            {vCount > 0 && <div className="fc-stat-pill" style={{ background: "rgba(5,150,105,0.08)", color: "#059669" }}>🟢 {vCount}</div>}
            {cCount > 0 && <div className="fc-stat-pill" style={{ background: "rgba(217,119,6,0.08)", color: "#d97706" }}>🟡 {cCount}</div>}
            {fCount > 0 && <div className="fc-stat-pill" style={{ background: "rgba(220,38,38,0.08)", color: "#dc2626" }}>🔴 {fCount}</div>}
          </div>
          {results.map((item, i) => {
            const c = cfg[item.status] || cfg.CAUTION;
            return (
              <div key={i} className="fc-item" style={{ borderLeft: `3px solid ${c.border}`, background: c.bg }}>
                <div className="fc-item-header">
                  <span className="fc-status-badge" style={{ color: c.color }}>{c.label}</span>
                </div>
                <div className="fc-quote">"{item.quote_text}"</div>
                <div className="fc-reason">{item.reason}</div>
                {item.source && item.source !== "null" && (
                  <div className="fc-source">
                    📎 {item.source.startsWith("http") ? <a href={item.source} target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>{item.source}</a> : item.source}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Word Diff Utility ───
function computeWordDiff(a, b) {
  const ta = (a || "").split(/(\s+)/), tb = (b || "").split(/(\s+)/);
  let pi = 0;
  while (pi < ta.length && pi < tb.length && ta[pi] === tb[pi]) pi++;
  let si = 0;
  while (si < ta.length - pi && si < tb.length - pi && ta[ta.length - 1 - si] === tb[tb.length - 1 - si]) si++;
  const parts = [];
  if (pi > 0) parts.push({ t: "=", v: ta.slice(0, pi).join("") });
  const del = ta.slice(pi, ta.length - (si || undefined)).join("");
  const ins = tb.slice(pi, tb.length - (si || undefined)).join("");
  if (del) parts.push({ t: "-", v: del });
  if (ins) parts.push({ t: "+", v: ins });
  if (si > 0) parts.push({ t: "=", v: ta.slice(ta.length - si).join("") });
  return parts;
}

function DiffView({ original, modified }) {
  const parts = useMemo(() => computeWordDiff(original, modified), [original, modified]);
  return (
    <div className="rc-diff-view">
      {parts.map((p, i) => {
        if (p.t === "-") return <span key={i} className="rc-diff-del">{p.v}</span>;
        if (p.t === "+") return <span key={i} className="rc-diff-add">{p.v}</span>;
        return <span key={i}>{p.v}</span>;
      })}
    </div>
  );
}

// ─── Refine Copilot ───
function RefineCopilot({ reportText, personas, globalKey }) {
  const { spend } = useCredits();
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [toolbarPos, setToolbarPos] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingDiff, setPendingDiff] = useState(null);
  const containerRef = useRef(null);
  const msgEndRef = useRef(null);

  useEffect(() => {
    const handleUp = () => {
      if (containerRef.current && containerRef.current.offsetParent === null) return;
      const sel = window.getSelection();
      const text = sel?.toString()?.trim();
      if (text && text.length > 3) {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectedText(text);
        setToolbarPos({ x: rect.left + rect.width / 2, y: rect.top - 10 });
      } else {
        setToolbarPos(null);
      }
    };
    document.addEventListener("mouseup", handleUp);
    return () => document.removeEventListener("mouseup", handleUp);
  }, []);

  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const openCopilot = (text) => {
    const target = text || (typeof reportText === "string" ? reportText : JSON.stringify(reportText || {}));
    setSelectedText(target);
    setToolbarPos(null);
    window.getSelection()?.removeAllRanges();
    setChatOpen(true);
    if (messages.length === 0) {
      setMessages([{
        role: "system",
        content: text ? "선택한 텍스트 영역에 대해 코파일럿이 활성화되었습니다." : "리포트 전문에 대해 코파일럿이 활성화되었습니다."
      }]);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedText);
    setToolbarPos(null);
    window.getSelection()?.removeAllRanges();
  };

  const handleHighlight = () => {
    try {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const mark = document.createElement("mark");
        mark.style.cssText = "background:rgba(250,204,21,0.35);border-radius:2px;padding:0 1px;";
        range.surroundContents(mark);
      }
    } catch { /* noop */ }
    setToolbarPos(null);
    window.getSelection()?.removeAllRanges();
  };

  const sendMessage = async () => {
    if (!inputMsg.trim() || loading) return;
    if (!spend("refine_copilot")) return;
    const userMsg = inputMsg.trim();
    setInputMsg("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const persona = pickUsablePersona(personas, globalKey);
      if (!persona?.apiKey) throw new Error("API 키를 설정해 주세요.");
      const contextText = selectedText.slice(0, 4000);
      const r = await callAI(
        { ...persona, role: REFINE_COPILOT_SYSTEM },
        [{ role: "user", content: `[원본 텍스트]\n${contextText}\n\n[수정 요청]\n${userMsg}\n\n수정된 전체 텍스트만 반환하세요.` }]
      );
      const modified = r.trim();
      setPendingDiff({ original: contextText, modified });
      setMessages(prev => [...prev, { role: "assistant", content: "수정안을 생성했습니다. 아래 diff를 확인 후 수락/거절하세요.", hasDiff: true }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: `오류: ${err.message}` }]);
    }
    setLoading(false);
  };

  const acceptDiff = () => {
    if (pendingDiff) setSelectedText(pendingDiff.modified);
    setPendingDiff(null);
    setMessages(prev => [...prev, { role: "system", content: "✅ 수정이 반영되었습니다." }]);
  };
  const rejectDiff = () => {
    setPendingDiff(null);
    setMessages(prev => [...prev, { role: "system", content: "❌ 수정이 거절되었습니다." }]);
  };

  return (
    <div ref={containerRef} style={{ display: "contents" }}>
      {toolbarPos && (
        <div className="rc-toolbar" style={{ left: toolbarPos.x, top: toolbarPos.y }}>
          <button onClick={() => openCopilot(selectedText)}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z"/></svg> 코파일럿</button>
          <button onClick={handleCopy}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> 복사</button>
          <button onClick={handleHighlight}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> 하이라이트</button>
        </div>
      )}
      <button className="rc-fab" onClick={() => openCopilot("")} title="리파인 코파일럿">
        <span className="rc-fab-inner">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z" />
          </svg>
        </span>
      </button>
      {chatOpen && (
        <div className="rc-panel-overlay" onClick={() => setChatOpen(false)}>
          <div className="rc-panel" onClick={e => e.stopPropagation()}>
            <div className="rc-panel-header">
              <h3>✨ 리파인 코파일럿</h3>
              <button type="button" className="modal-close" onClick={() => setChatOpen(false)}>✕</button>
            </div>
            {selectedText && (
              <div className="rc-context-bar">
                📌 {selectedText.length > 120 ? selectedText.slice(0, 120) + "…" : selectedText}
              </div>
            )}
            <div className="rc-messages">
              {messages.map((msg, i) => (
                <div key={i} className={`rc-msg rc-msg-${msg.role}`}>
                  <div className="rc-msg-bubble">{msg.content}</div>
                  {msg.hasDiff && pendingDiff && (
                    <div className="rc-diff-wrap">
                      <div className="rc-diff-label">변경 사항 비교 (DIFF VIEW)</div>
                      <DiffView original={pendingDiff.original} modified={pendingDiff.modified} />
                      <div className="rc-diff-actions">
                        <button className="rc-accept-btn" onClick={acceptDiff}>✅ 수락 (Accept)</button>
                        <button className="rc-reject-btn" onClick={rejectDiff}>❌ 거절 (Reject)</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="rc-msg rc-msg-assistant">
                  <div className="rc-msg-bubble"><span className="spinner" style={{ width: 14, height: 14 }} /> 수정안 생성 중…</div>
                </div>
              )}
              <div ref={msgEndRef} />
            </div>
            <div className="rc-input-bar">
              <input
                value={inputMsg}
                onChange={e => setInputMsg(e.target.value)}
                placeholder="수정 요청을 입력하세요…"
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              />
              <button onClick={sendMessage} disabled={loading || !inputMsg.trim()}>전송</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Report Tools (Composite) ───
function ReportTools({ reportText, personas, globalKey }) {
  return (
    <>
      <FactCheckRadar reportText={reportText} personas={personas} globalKey={globalKey} />
      <RefineCopilot reportText={reportText} personas={personas} globalKey={globalKey} />
    </>
  );
}

// ─── Background Task System ───
function useBackgroundTasks() {
  const [tasks, setTasks] = useState({});
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

  const startTask = useCallback((modeId) => {
    setTasks((prev) => ({ ...prev, [modeId]: "running" }));
  }, []);

  const EXTRA_MODE_LABELS = { prototyper: { icon: "🚀", name: "웹앱 프로토타이퍼" } };
  const completeTask = useCallback((modeId, title) => {
    setTasks((prev) => ({ ...prev, [modeId]: "done" }));
    const mode = MODES.find((m) => m.id === modeId) || EXTRA_MODE_LABELS[modeId];
    setToast({ modeId, icon: mode?.icon || "✓", modeName: mode?.name || modeId, title: title || "결과 확인하기" });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 6000);
  }, []);

  const clearTask = useCallback((modeId) => {
    setTasks((prev) => { const n = { ...prev }; delete n[modeId]; return n; });
  }, []);

  return { tasks, toast, startTask, completeTask, clearTask, setToast };
}

const MODE_CATEGORIES = [ 
  { key: "all", label: "전체" },
  { key: "ideation", label: "아이디어 도출" },
  { key: "validation", label: "검증" },
  { key: "research", label: "리서치" },
];
const MODE_CAT_MAP = {
  tournament: "ideation", hyperniche: "ideation", mixroulette: "ideation",
  tot: "ideation", scamper: "ideation",
  analyze: "validation", devil: "validation", market: "validation",
  dna: "research", compete: "research", refhub: "research", archive: "research",
};

function HomeScreen({ activeMode, bgTasks, navigateTo }) {
  const [catFilter, setCatFilter] = useState("all");
  const filteredModes = catFilter === "all" ? MODES : MODES.filter(m => MODE_CAT_MAP[m.id] === catFilter);

  return (
    <div style={{ display: !activeMode ? "block" : "none" }}>
      <div className="home-enter">
        <div className="hero">
          <div className="hero-badge"><span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-primary)" }} />AI-Powered Idea Studio</div>
          <h1>숨겨진 기회 포착</h1>
          <p>아이디어만 입력하면 시장분석부터 검증까지 올인원!</p>
        </div>

        <div className="home-cat-bar">
          {MODE_CATEGORIES.map(c => (
            <button key={c.key} className={`home-cat-tab${catFilter === c.key ? " active" : ""}`} onClick={() => setCatFilter(c.key)}>
              {c.label}
            </button>
          ))}
        </div>

        <div className="mode-grid">
          {filteredModes.map((mode, i) => {
            const isTot = mode.accent === "tot";
            const isMain = mode.accent === true;
            const isNiche = mode.accent === "niche";
            const isMix = mode.accent === "mix";
            const hasAccent = isMain || isTot || isNiche || isMix;
            const iconBg = isMix
              ? { background: "linear-gradient(135deg, #f59e0b, #ef4444)", boxShadow: "0 2px 8px rgba(245,158,11,0.2)" }
              : isNiche ? { background: "linear-gradient(135deg, #8b5cf6, #d946ef)", boxShadow: "0 2px 8px rgba(139,92,246,0.2)" }
              : isTot ? { background: "linear-gradient(135deg, #059669, #0d9488)", boxShadow: "0 2px 8px rgba(5,150,105,0.2)" }
              : isMain ? { background: "linear-gradient(135deg, #2563eb, #3b82f6)", boxShadow: "0 2px 8px rgba(37,99,235,0.2)" } : {};
            const badgeLabel = isMix ? "NEW" : isNiche ? "NEW" : isTot ? "NEW" : isMain ? "MAIN" : null;
            const badgeColor = isMix ? "#d97706" : isNiche ? "#7c3aed" : isTot ? "#047857" : "var(--accent-primary)";
            const badgeBg = isMix ? "rgba(217,119,6,0.08)" : isNiche ? "rgba(124,58,237,0.07)" : isTot ? "rgba(4,120,87,0.07)" : "rgba(37,99,235,0.06)";
            const taskState = bgTasks.tasks[mode.id] || (mode.id === "archive" ? bgTasks.tasks["prototyper"] : undefined);
            return (
              <div className="mode-card" key={mode.id}
                onClick={() => { if (taskState === "done") bgTasks.clearTask(mode.id); navigateTo(mode.id); }}
                style={{ animationDelay: `${i * 0.035}s` }}>
                <div className="mc-icon" style={iconBg}>
                  {hasAccent ? <span style={{ filter: "brightness(0) invert(1)" }}>{mode.icon}</span> : mode.icon}
                </div>
                <div className="mc-text">
                  <div className="mc-name">{mode.name}{badgeLabel && <span style={{ display: "inline-block", fontSize: 9, fontWeight: 700, color: badgeColor, marginLeft: 6, padding: "2px 6px", background: badgeBg, borderRadius: 4, letterSpacing: "0.04em", verticalAlign: "middle", lineHeight: "1.3" }}>{badgeLabel}</span>}</div>
                  <div className="mc-desc">{mode.desc}</div>
                </div>
                <span className="mc-arrow">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </span>
                {taskState === "running" && (
                  <span style={{ position: "absolute", bottom: 10, right: 14, display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, color: "#d97706", background: "rgba(217,119,6,0.06)", border: "1px solid rgba(217,119,6,0.12)", borderRadius: 6, padding: "3px 8px", pointerEvents: "none" }}>
                    <span className="spinner" style={{ width: 9, height: 9, borderColor: "rgba(217,119,6,0.25)", borderTopColor: "#d97706", borderWidth: 1.5 }} />
                    작업중
                  </span>
                )}
                {taskState === "done" && (
                  <span style={{ position: "absolute", bottom: 10, right: 14, fontSize: 10, fontWeight: 600, color: "var(--accent-success)", background: "rgba(5,150,105,0.05)", border: "1px solid rgba(5,150,105,0.1)", borderRadius: 6, padding: "3px 8px", pointerEvents: "none" }}>✓ 완료</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const BrandSvg = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: "relative", zIndex: 1 }}>
    <path d="M12 2C8.68 2 6 4.68 6 8c0 2.53 1.56 4.69 3.77 5.58.14.06.23.2.23.35V16a1 1 0 001 1h2a1 1 0 001-1v-2.07c0-.15.09-.29.23-.35C16.44 12.69 18 10.53 18 8c0-3.32-2.68-6-6-6z" fill="rgba(255,255,255,0.95)"/>
    <path d="M9 18.5a.5.5 0 01.5-.5h5a.5.5 0 010 1h-5a.5.5 0 01-.5-.5zM10 20.5a.5.5 0 01.5-.5h3a.5.5 0 010 1h-3a.5.5 0 01-.5-.5z" fill="rgba(255,255,255,0.6)"/>
    <circle cx="12" cy="8" r="2.5" fill="rgba(255,255,255,0.25)"/>
  </svg>
);

export default function App() {
  const [sInit] = useState(loadSettings);
  const [personas, setPersonas] = useState(loadPersonasFromStorage);
  const [globalKey, setGlobalKey] = useState(sInit.globalKey);
  const [totProvider, setTotProvider] = useState(sInit.totProvider);
  const [totModel, setTotModel] = useState(sInit.totModel);
  const [totApiKey, setTotApiKey] = useState(sInit.totApiKey);
  const [mixProvider, setMixProvider] = useState(sInit.mixProvider);
  const [mixModel, setMixModel] = useState(sInit.mixModel);
  const [mixApiKey, setMixApiKey] = useState(sInit.mixApiKey);
  const [utilProvider, setUtilProvider] = useState(sInit.utilProvider);
  const [utilModel, setUtilModel] = useState(sInit.utilModel);
  const [utilApiKey, setUtilApiKey] = useState(sInit.utilApiKey);
  const [showSettings, setShowSettings] = useState(false);
  const [activeMode, setActiveMode] = useState(null);
  const [historyEntries, setHistoryEntries] = useState(loadHistory);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyDetail, setHistoryDetail] = useState(null);
  const [archiveSaveEntry, setArchiveSaveEntry] = useState(null);
  const bgTasks = useBackgroundTasks();

  const [credits, setCredits] = useState(loadCredits);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const creditsRef = useRef(credits);
  creditsRef.current = credits;
  const spendCredits = useCallback((costKey) => {
    const info = CREDIT_COSTS[costKey];
    if (!info) return true;
    if (creditsRef.current < info.cost) {
      showAppToast(`크레딧이 부족합니다 (필요: ${info.cost}, 보유: ${creditsRef.current})`, "error", 4000);
      return false;
    }
    setCredits(prev => {
      if (prev < info.cost) return prev;
      const next = prev - info.cost;
      saveCredits(next);
      return next;
    });
    return true;
  }, []);
  const rechargeCredits = useCallback((amount) => {
    setCredits(prev => {
      const next = prev + amount;
      saveCredits(next);
      return next;
    });
  }, []);
  const creditCtx = useMemo(() => ({ credits, spend: spendCredits, recharge: rechargeCredits }), [credits, spendCredits, rechargeCredits]);

  const [tRegion, setTRegion] = useState("local");
  const [tGender, setTGender] = useState("all");
  const [tAge, setTAge] = useState("전체");
  const [localCountry, setLocalCountry] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [localGeoReady, setLocalGeoReady] = useState(false);
  useEffect(() => {
    let done = false;
    const controllers = new Set();
    const set = (name, code) => {
      if (done) return;
      done = true;
      setLocalCountry(name);
      setCountryCode(code);
      setLocalGeoReady(true);
      LOG.info(`IP country: ${name} (${code})`);
    };
    const setKoreaDefault = () => {
      if (!done) { LOG.warn("All IP APIs failed → 한국 디폴트"); set("South Korea", "KR"); }
    };
    const safeFetch = (url) => {
      const ctrl = new AbortController();
      controllers.add(ctrl);
      const tid = setTimeout(() => ctrl.abort(), 5000);
      return fetch(url, { signal: ctrl.signal }).finally(() => {
        clearTimeout(tid);
        controllers.delete(ctrl);
      });
    };
    (async () => {
      try {
        const r1 = await safeFetch("https://ipwho.is/");
        const d1 = await r1.json();
        if (!done && d1.success !== false && d1.country) { set(d1.country, d1.country_code || ""); return; }
      } catch (e) { LOG.warn(`ipwho fail: ${e.message}`); }
      try {
        const r2 = await safeFetch("https://freeipapi.com/api/json");
        const d2 = await r2.json();
        if (!done && d2.countryName) { set(d2.countryName, d2.countryCode || ""); return; }
      } catch (e) { LOG.warn(`freeipapi fail: ${e.message}`); }
      try {
        const r3 = await safeFetch("https://ipapi.co/json/");
        if (!r3.ok) throw new Error(`ipapi ${r3.status}`);
        const d3 = await r3.json();
        if (!done && d3.country_name) { set(d3.country_name, d3.country_code || ""); return; }
      } catch (e) { LOG.warn(`ipapi fail: ${e.message}`); }
      setKoreaDefault();
    })().catch(() => setKoreaDefault());
    const guard = setTimeout(setKoreaDefault, 10000);
    return () => {
      done = true;
      clearTimeout(guard);
      controllers.forEach((ctrl) => ctrl.abort());
      controllers.clear();
    };
  }, []);
  useEffect(() => {
    try { localStorage.setItem(PERSONAS_STORAGE_KEY, JSON.stringify(personas)); } catch (_) {}
  }, [personas]);
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ globalKey, totProvider, totModel, totApiKey, mixProvider, mixModel, mixApiKey, utilProvider, utilModel, utilApiKey }));
    } catch (_) {}
  }, [globalKey, totProvider, totModel, totApiKey, mixProvider, mixModel, mixApiKey, utilProvider, utilModel, utilApiKey]);
  const targetCtx = useMemo(() => ({ region: tRegion, setRegion: setTRegion, gender: tGender, setGender: setTGender, age: tAge, setAge: setTAge, localCountry, countryCode, localGeoReady }), [tRegion, tGender, tAge, localCountry, countryCode, localGeoReady]);
  const archiveSave = useCallback((entry) => setArchiveSaveEntry(entry), []);
  const archiveCtx = useMemo(() => ({ save: archiveSave }), [archiveSave]);

  const recordAnalysis = useCallback((partial) => {
    const meta = MODES.find((m) => m.id === partial.modeId);
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      ts: Date.now(),
      modeId: partial.modeId,
      modeName: meta?.name || "분석",
      modeIcon: meta?.icon || "📌",
      title: partial.title || "무제",
      payload: partial.payload,
    };
    setHistoryEntries((prev) => {
      const next = [entry, ...prev].slice(0, HISTORY_MAX);
      persistHistory(next);
      return next;
    });
  }, []);

  const deleteHistoryId = useCallback((id) => {
    setHistoryEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      persistHistory(next);
      return next;
    });
    setHistoryDetail((d) => (d?.id === id ? null : d));
  }, []);

  const clearHistory = useCallback(() => {
    setHistoryEntries([]);
    persistHistory([]);
    setHistoryDetail(null);
  }, []);

  const [visitedModes, setVisitedModes] = useState(() => new Set());

  // navigateTo: activeMode + visitedModes를 같은 배치로 업데이트 (useEffect 지연 제거)
  const navigateTo = useCallback((modeId) => {
    setActiveMode(modeId);
    if (modeId && modeId !== "archive") {
      setVisitedModes((prev) => {
        if (prev.has(modeId)) return prev;
        const n = new Set(prev); n.add(modeId); return n;
      });
    }
  }, []);

  const [splashDone, setSplashDone] = useState(false);
  useEffect(() => { const t = setTimeout(() => setSplashDone(true), 1200); return () => clearTimeout(t); }, []);

  const taskMgrCtx = useMemo(() => ({ startTask: bgTasks.startTask, completeTask: bgTasks.completeTask, clearTask: bgTasks.clearTask }), [bgTasks.startTask, bgTasks.completeTask, bgTasks.clearTask]);

  return (
    <ViewportProvider>
    <>
      <style>{STYLES}</style>
      <div className={`splash-overlay ${splashDone ? "splash-out" : ""}`}>
        <div className="splash-logo"><BrandSvg size={30} /></div>
        <div className="splash-title">Brainstorm Arena</div>
        <div className="splash-sub">MOJITO Labs</div>
      </div>
      <div className="app-bg">
        <div className="app-shell app-shell-enhanced">
          <header className="top-toolbar">
            <div className="brand-group" onClick={() => setActiveMode(null)} role="button" tabIndex={0} onKeyDown={e => e.key === "Enter" && setActiveMode(null)}>
              <div className="brand-mark" aria-hidden><BrandSvg size={20} /></div>
              <div className="brand-title-row" style={{ flex: 1, minWidth: 0 }}>
                <div className="brand-lines">
                  <strong>Brainstorm Arena <span>Global No.1</span></strong>
                </div>
                <div className="plan-badges" aria-hidden onClick={e => e.stopPropagation()}>
                  <span className="plan-pill plan-pill-premium" title="프리미엄 플랜">프리미엄</span>
                  <span className="plan-pill plan-pill-live" title="세션 활성"><span className="plan-dot" />활성</span>
                </div>
              </div>
            </div>
            <div className="toolbar-actions">
              <CreditContext.Provider value={creditCtx}><CreditBadge onClick={() => setShowCreditModal(true)} /></CreditContext.Provider>
              <button type="button" className="icon-tool-btn" title="디버그 로그 복사" aria-label="로그 복사"
                onClick={() => {
                  const info = `Brainstorm Arena Debug Log\n${new Date().toISOString()}\nUA: ${navigator.userAgent}\nPersonas: ${personas.map(p => `${p.name}[${p.provider}/${p.model}/${p.apiKey ? "key✓" : "no-key"}]`).join(", ")}\nToT: ${totProvider}/${totModel}/${totApiKey ? "key✓" : "no-key"}\nGlobalKey: ${globalKey ? "set" : "none"}\n${"─".repeat(40)}\n${LOG.getAll() || "(no logs)"}`;
                  navigator.clipboard.writeText(info).then(() => alert("로그가 클립보드에 복사되었습니다")).catch(() => { const ta = document.createElement("textarea"); ta.value = info; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta); alert("로그가 클립보드에 복사되었습니다"); });
                }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              </button>
              <button type="button" className="icon-tool-btn" title="분석 히스토리" onClick={() => setHistoryOpen(true)} aria-label="분석 히스토리 열기">
                {historyEntries.length > 0 ? <span className="notif-dot" aria-hidden /> : null}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
              </button>
              <button type="button" className="icon-tool-btn" title="설정" onClick={() => setShowSettings(true)} aria-label="설정">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
          </header>

          <CreditContext.Provider value={creditCtx}>
          <TargetContext.Provider value={targetCtx}>
          <ArchiveContext.Provider value={archiveCtx}>
          <RecordHistoryContext.Provider value={recordAnalysis}>
          <TaskManagerContext.Provider value={taskMgrCtx}>
            {showSettings && (
              <SettingsModal
                personas={personas}
                setPersonas={setPersonas}
                globalKey={globalKey}
                setGlobalKey={setGlobalKey}
                totProvider={totProvider}
                setTotProvider={setTotProvider}
                totModel={totModel}
                setTotModel={setTotModel}
                totApiKey={totApiKey}
                setTotApiKey={setTotApiKey}
                mixProvider={mixProvider}
                setMixProvider={setMixProvider}
                mixModel={mixModel}
                setMixModel={setMixModel}
                mixApiKey={mixApiKey}
                setMixApiKey={setMixApiKey}
                utilProvider={utilProvider}
                setUtilProvider={setUtilProvider}
                utilModel={utilModel}
                setUtilModel={setUtilModel}
                utilApiKey={utilApiKey}
                setUtilApiKey={setUtilApiKey}
                onClose={() => setShowSettings(false)}
              />
            )}
            <HistoryDrawer
              open={historyOpen}
              onClose={() => setHistoryOpen(false)}
              entries={historyEntries}
              onPick={(e) => { setHistoryOpen(false); setHistoryDetail(e); }}
              onDelete={deleteHistoryId}
              onClear={clearHistory}
            />
            {historyDetail ? <HistoryDetailModal entry={historyDetail} onClose={() => setHistoryDetail(null)} personas={personas} globalKey={globalKey} /> : null}

            {/* ══ HOME: display:none으로 숨기되 언마운트 하지 않음 ══ */}
            <HomeScreen activeMode={activeMode} bgTasks={bgTasks} navigateTo={navigateTo} />

            {/* ══ ARCHIVE: active일 때만 렌더링 (아카이브는 상태 보존 불필요) ══ */}
            {activeMode === "archive" && (
              <div className="page-enter" style={{ paddingTop: 12, paddingBottom: 40 }}>
                <button type="button" className="back-btn" onClick={() => setActiveMode(null)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                  홈으로
                </button>
                <h2 className="mode-title">📦 아카이브</h2>
                <ArchiveView personas={personas} globalKey={globalKey} onGoHome={() => setActiveMode(null)} />
              </div>
            )}

            {/* ══ MODE SHELL: 방문한 모드는 항상 DOM에 살아있음 ══
                홈으로 가도 display:none으로만 숨기므로 진행 중인 fetch/state 유지 */}
            <div style={{ display: (activeMode && activeMode !== "archive") ? "block" : "none", paddingTop: 12 }}>
              <nav className="breadcrumb-nav" aria-label="breadcrumb">
                <button type="button" className="breadcrumb-item" onClick={() => setActiveMode(null)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                  홈
                </button>
                <span className="breadcrumb-sep">/</span>
                {Array.from(visitedModes).map((modeId) => {
                  const m = MODES.find(x => x.id === modeId);
                  return m && activeMode === modeId ? (
                    <span key={modeId} className="breadcrumb-current">{m.name}</span>
                  ) : null;
                })}
              </nav>
              {Array.from(visitedModes).map((modeId) => {
                const m = MODES.find(x => x.id === modeId);
                return m ? (
                  <div key={modeId} style={{ display: activeMode === modeId ? "block" : "none" }}>
                    <h2 className="mode-title">{m.icon} {m.name}</h2>
                    {MODE_TAGLINES[modeId] && <ModeTaglineRoller key={modeId} lines={MODE_TAGLINES[modeId]} />}
                    <TargetBar />
                  </div>
                ) : null;
              })}
            </div>
            <div style={{ display: (activeMode && activeMode !== "archive") ? "block" : "none", paddingBottom: 40 }}>
                  {visitedModes.has("analyze") && (
                    <div style={{ display: activeMode === "analyze" ? "block" : "none" }}>
                      <MultiPerspective personas={personas} globalKey={globalKey} utilProvider={utilProvider} utilModel={utilModel} utilApiKey={utilApiKey} />
                    </div>
                  )}
                  {visitedModes.has("tournament") && (
                    <div style={{ display: activeMode === "tournament" ? "block" : "none" }}>
                      <Tournament personas={personas} globalKey={globalKey} utilProvider={utilProvider} utilModel={utilModel} utilApiKey={utilApiKey} onOpenSettings={() => setShowSettings(true)} />
                    </div>
                  )}
                  {visitedModes.has("devil") && (
                    <div style={{ display: activeMode === "devil" ? "block" : "none" }}>
                      <DevilsAdvocate personas={personas} globalKey={globalKey} utilProvider={utilProvider} utilModel={utilModel} utilApiKey={utilApiKey} />
                    </div>
                  )}
                  {visitedModes.has("scamper") && (
                    <div style={{ display: activeMode === "scamper" ? "block" : "none" }}>
                      <ScamperMode personas={personas} globalKey={globalKey} utilProvider={utilProvider} utilModel={utilModel} utilApiKey={utilApiKey} />
                    </div>
                  )}
                  {visitedModes.has("dna") && (
                    <div style={{ display: activeMode === "dna" ? "block" : "none" }}>
                      <DNAMap personas={personas} globalKey={globalKey} utilProvider={utilProvider} utilModel={utilModel} utilApiKey={utilApiKey} />
                    </div>
                  )}
                  {visitedModes.has("market") && (
                    <div style={{ display: activeMode === "market" ? "block" : "none" }}>
                      <MarketValidation personas={personas} globalKey={globalKey} utilProvider={utilProvider} utilModel={utilModel} utilApiKey={utilApiKey} />
                    </div>
                  )}
                  {visitedModes.has("compete") && (
                    <div style={{ display: activeMode === "compete" ? "block" : "none" }}>
                      <CompeteScan personas={personas} globalKey={globalKey} utilProvider={utilProvider} utilModel={utilModel} utilApiKey={utilApiKey} />
                    </div>
                  )}
                  {visitedModes.has("refhub") && (
                    <div style={{ display: activeMode === "refhub" ? "block" : "none" }}>
                      <ReferenceHub personas={personas} globalKey={globalKey} utilProvider={utilProvider} utilModel={utilModel} utilApiKey={utilApiKey} />
                    </div>
                  )}
                  {visitedModes.has("hyperniche") && (
                    <div style={{ display: activeMode === "hyperniche" ? "block" : "none" }}>
                      <HyperNicheExplorer personas={personas} globalKey={globalKey} utilProvider={utilProvider} utilModel={utilModel} utilApiKey={utilApiKey} />
                    </div>
                  )}
                  {visitedModes.has("mixroulette") && (
                    <div style={{ display: activeMode === "mixroulette" ? "block" : "none" }}>
                      <MixupRoulette personas={personas} globalKey={globalKey} mixProvider={mixProvider} mixModel={mixModel} mixApiKey={mixApiKey} onOpenSettings={() => setShowSettings(true)} utilProvider={utilProvider} utilModel={utilModel} utilApiKey={utilApiKey} />
                    </div>
                  )}
                  {visitedModes.has("tot") && (
                    <div style={{ display: activeMode === "tot" ? "block" : "none" }}>
                      <TotDeepDive personas={personas} globalKey={globalKey} totProvider={totProvider} totModel={totModel} totApiKey={totApiKey} onOpenSettings={() => setShowSettings(true)} utilProvider={utilProvider} utilModel={utilModel} utilApiKey={utilApiKey} />
                    </div>
                  )}
            </div>
            {/* ══ FOOTER ══ */}
            <div className="footer">
              <span>MOJITO Labs · Brainstorm Arena</span>
              <br />
              <span style={{ fontSize: 9, opacity: 0.6, letterSpacing: "0.3px" }}>© 2026 MOJITO Labs. All rights reserved. — AI-Powered Idea Validation Platform</span>
            </div>
          </TaskManagerContext.Provider>
          </RecordHistoryContext.Provider>
          </ArchiveContext.Provider>
          </TargetContext.Provider>
          {showCreditModal && <CreditChargeModal onClose={() => setShowCreditModal(false)} onCharge={rechargeCredits} />}
          </CreditContext.Provider>
          {archiveSaveEntry && <ArchiveSaveModal entry={archiveSaveEntry} onClose={(saved) => { setArchiveSaveEntry(null); if (saved) alert("아카이브에 저장되었습니다"); }} />}
          {bgTasks.toast && (
            <div className="toast-alert" onClick={() => { const modeId = bgTasks.toast.modeId; bgTasks.setToast(null); navigateTo(modeId); }} role="alert">
              <span className="toast-alert-icon">✅</span>
              <div className="toast-alert-body">
                <div className="toast-alert-label">{bgTasks.toast.icon} {bgTasks.toast.modeName} 완료</div>
                <div className="toast-alert-title">{bgTasks.toast.title}</div>
              </div>
              <span className="toast-alert-nav" aria-hidden="true">→</span>
            </div>
          )}
          <AppToastRenderer />
        </div>
      </div>
    </>
    </ViewportProvider>
  );
}

function AppToastRenderer() {
  const toasts = useAppToasts();
  if (!toasts.length) return null;
  return ReactDOM.createPortal(
    <div className="app-toast-stack">
      {toasts.map((t, i) => (
        <div key={t.id} className={`app-toast app-toast-${t.level}`} style={{ bottom: 24 + i * 60 }}>
          <span className="app-toast-icon">{t.level === "error" ? "⛔" : t.level === "warn" ? "⚠️" : "ℹ️"}</span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>,
    document.body
  );
}
