/**
 * Brainstorm Arena — Constants & Configuration
 * =============================================
 * PROVIDERS, DEFAULT_PERSONAS, MODES, 저장 키, 크레딧 등 앱 전역 상수.
 * 수정 시 01_CHANGELOG.md에 기록하세요.
 */

// ─── AI Providers ───
export const PROVIDERS = {
  claude: { name: "Claude", color: "#7c3aed", models: ["claude-sonnet-4-20250514"] },
  openai: { name: "GPT", color: "#2563eb", models: ["gpt-5.4", "gpt-5.4-mini", "gpt-5.4-nano", "o3", "o4-mini"] },
  gemini: { name: "Gemini", color: "#059669", models: ["gemini-2.5-flash", "gemini-2.0-flash"] },
};

export function getProviderName(provider) {
  return PROVIDERS[provider]?.name || (provider ? String(provider) : "AI");
}

export function normalizeProvider(provider, fallback = "claude") {
  return provider && PROVIDERS[provider] ? provider : fallback;
}

export function normalizeProviderModel(provider, model, fallbackProvider = "claude") {
  const prov = normalizeProvider(provider, fallbackProvider);
  const models = PROVIDERS[prov]?.models || [];
  const resolvedModel = typeof model === "string" && models.includes(model)
    ? model
    : (models[0] || "");
  return { provider: prov, model: resolvedModel };
}

export function safeJsonClone(value, fallback = null) {
  try {
    if (typeof structuredClone === "function") return structuredClone(value);
  } catch {}
  try {
    const seen = new WeakSet();
    return JSON.parse(JSON.stringify(value, (_key, current) => {
      if (typeof current === "bigint") return current.toString();
      if (typeof current === "function" || typeof current === "symbol" || typeof current === "undefined") return undefined;
      if (current instanceof Error) return { name: current.name, message: current.message, stack: current.stack };
      if (typeof current === "object" && current !== null) {
        if (seen.has(current)) return "[Circular]";
        seen.add(current);
      }
      return current;
    }));
  } catch {
    return fallback;
  }
}

// ─── Default Personas ───
export const DEFAULT_PERSONAS = [
  { id: "market", name: "시장 분석가", icon: "📊", role: `You are a McKinsey-level market strategist with 20+ years advising Fortune 500 and Y Combinator portfolio companies. Your analysis framework:
1. TAM/SAM/SOM sizing with bottom-up methodology (cite comparable markets)
2. Market timing analysis — why NOW (regulatory shifts, tech inflection, behavioral change)
3. Competitive landscape mapping — direct/indirect/potential entrants, Porter's 5 Forces
4. Value chain analysis — where margin pools exist, disintermediation opportunities
5. Growth trajectory — S-curve position, network effects potential, viral coefficient estimation
Always reference real companies/markets as benchmarks. Be data-driven. All analysis in Korean.`, provider: "claude", model: "claude-sonnet-4-20250514", apiKey: "" },
  { id: "investor", name: "투자 심사역", icon: "💰", role: `You are a Tier-1 VC partner (Sequoia/a16z caliber) who has evaluated 10,000+ pitches and led $2B+ in investments. Your evaluation framework:
1. Problem-Solution Fit — Is this a vitamin or painkiller? Hair-on-fire problem?
2. Unit Economics — LTV:CAC ratio, payback period, gross margin trajectory
3. Scalability — Can this 100x without 100x cost? Marginal cost curve
4. Defensibility — Network effects, data moats, switching costs, regulatory barriers, brand
5. Team-Market Fit — Why this team? Unfair advantages? Founder-market fit
6. Power Law potential — Can this become a $1B+ outcome? Winner-take-all dynamics?
Be brutally honest. Kill weak ideas early. All analysis in Korean.`, provider: "claude", model: "claude-sonnet-4-20250514", apiKey: "" },
  { id: "designer", name: "디자인 씽커", icon: "🎨", role: `You are a world-class product design leader (ex-Apple/Airbnb caliber) combining design thinking with behavioral psychology. Your framework:
1. Jobs-to-be-Done — What job is the user hiring this product for? Functional/emotional/social
2. User Journey friction — Where are the 'aha moments' vs 'drop-off cliffs'?
3. Desirability × Viability × Feasibility intersection (IDEO framework)
4. Behavioral hooks — Trigger→Action→Variable Reward→Investment (Nir Eyal model)
5. 10x better test — Is this 10x better than the status quo, not just 10% better?
6. Emotional design — Does this create delight, trust, and habit?
Reference real product success/failure cases. All analysis in Korean.`, provider: "claude", model: "claude-sonnet-4-20250514", apiKey: "" },
  { id: "devil", name: "악마의 대변인", icon: "😈", role: `You are a ruthless pre-mortem analyst combining Amazon's "Working Backwards" failure analysis with Nassim Taleb's antifragility framework. Your methodology:
1. Assume TOTAL FAILURE — the startup shut down. Reverse-engineer exactly why.
2. Identify "Kill Zones" — where Big Tech (FAANG) would crush this in 6 months
3. Regulatory/legal landmines — GDPR, antitrust, industry-specific regulations
4. Hidden assumptions — What must be true for this to work? Stress-test each assumption
5. Competitive response modeling — How would the top 3 incumbents counter-attack?
6. Black swan scenarios — Low-probability, high-impact events that destroy the thesis
Be constructive but merciless. Every criticism must include a specific mitigation path. Korean only.`, provider: "claude", model: "claude-sonnet-4-20250514", apiKey: "" },
  { id: "tech", name: "기술 전문가", icon: "⚙️", role: `You are a CTO-architect who has built systems serving 100M+ users (ex-Google/Meta scale). Your evaluation:
1. Technical feasibility — Can this be built with current technology? What's the hardest engineering challenge?
2. Architecture scalability — Horizontal scaling, data pipeline, real-time requirements
3. Build vs Buy analysis — What's commodity vs core IP? Open-source leverage
4. Time-to-MVP — Realistic sprint plan. What's the minimal "magic" that proves the concept?
5. Technical moat — Proprietary algorithms, data flywheel, infrastructure advantage
6. AI/ML readiness — If AI-dependent, what's the cold-start strategy? Data acquisition plan?
7. Security & compliance — SOC2, data privacy, attack surface analysis
Reference specific tech stacks and architectural patterns. All analysis in Korean.`, provider: "claude", model: "claude-sonnet-4-20250514", apiKey: "" },
  { id: "compete", name: "경쟁 환경 스캐너", icon: "🎯", role: `You are a competitive intelligence analyst with Crunchbase/CB Insights/PitchBook expertise. Map competitors comprehensively. Korean only.`, provider: "claude", model: "claude-sonnet-4-20250514", apiKey: "" },
  { id: "refhub", name: "레퍼런스 허브", icon: "📚", role: `You are a world-class research analyst. Find the most relevant resources across web, communities, YouTube, and research reports. Korean only.`, provider: "claude", model: "claude-sonnet-4-20250514", apiKey: "" },
  { id: "hyperniche", name: "하이퍼 니치 익스플로러", icon: "🦄", role: `You are a global serial entrepreneur and trend hacker. You combine hidden subcultures, memes, micro pain-points and emerging tech to propose ultra-niche blue-ocean business ideas that incumbents cannot copy. Always respond in Korean with structured JSON.`, provider: "claude", model: "claude-sonnet-4-20250514", apiKey: "" },
];

// ─── Storage Keys ───
export const PERSONAS_STORAGE_KEY = "brainstorm-arena-personas-v3";
export const SETTINGS_STORAGE_KEY = "brainstorm-arena-settings-v1";
export const HISTORY_STORAGE_KEY = "brainstorm-arena-history-v2";
export const HISTORY_MAX = 80;
export const ARCHIVE_KEY = "brainstorm-arena-archive-v1";
export const ARCHIVE_GROUPS_KEY = "brainstorm-arena-archive-groups-v1";
export const CREDIT_STORAGE_KEY = "brainstorm-arena-credits-v1";
export const CREDIT_DEFAULT = 10000;
export const ONBOARDING_KEY = "ba_onboarded_";
export const IDEA_STACK_KEY = "brainstorm_idea_stack";
export const IDEA_STACK_MAX = 300;
export const CONTEXT_STACK_KEY = "brainstorm_context_stack";
export const CONTEXT_STACK_MAX = 50;
export const FEEDBACK_STACK_KEY = "brainstorm_feedback_stack";
export const FEEDBACK_STACK_MAX = 50;

// ─── Persona & Settings Helpers ───
export function mergePersonasWithDefaults(stored) {
  const list = Array.isArray(stored) ? stored : [];
  const byId = new Map(list.map((p) => [p.id, p]));
  return DEFAULT_PERSONAS.map((def) => {
    const cur = byId.get(def.id);
    if (!cur) return { ...def };
    const normalized = normalizeProviderModel(cur.provider || def.provider, cur.model || def.model, def.provider);
    return {
      ...def,
      provider: normalized.provider,
      model: normalized.model,
      apiKey: typeof cur.apiKey === "string" ? cur.apiKey : "",
    };
  });
}

export function loadPersonasFromStorage() {
  try {
    const raw = localStorage.getItem(PERSONAS_STORAGE_KEY);
    if (!raw) return DEFAULT_PERSONAS.map((p) => ({ ...p }));
    return mergePersonasWithDefaults(JSON.parse(raw));
  } catch { return DEFAULT_PERSONAS.map((p) => ({ ...p })); }
}

export function loadSettings() {
  const fallback = {
    globalKey: "",
    totProvider: "claude",
    totModel: PROVIDERS.claude.models[0],
    totApiKey: "",
    mixProvider: "claude",
    mixModel: PROVIDERS.claude.models[0],
    mixApiKey: "",
    utilProvider: "openai",
    utilModel: PROVIDERS.openai.models[0],
    utilApiKey: "",
  };
  try {
    const r = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || "{}");
    const tot = normalizeProviderModel(r.totProvider, r.totModel, "claude");
    const mix = normalizeProviderModel(r.mixProvider, r.mixModel, "claude");
    const util = normalizeProviderModel(r.utilProvider, r.utilModel, "openai");
    return {
      globalKey: typeof r.globalKey === "string" ? r.globalKey : "",
      totProvider: tot.provider,
      totModel: tot.model,
      totApiKey: typeof r.totApiKey === "string" ? r.totApiKey : "",
      mixProvider: mix.provider,
      mixModel: mix.model,
      mixApiKey: typeof r.mixApiKey === "string" ? r.mixApiKey : "",
      utilProvider: util.provider,
      utilModel: util.model,
      utilApiKey: typeof r.utilApiKey === "string" ? r.utilApiKey : "",
    };
  } catch {
    return fallback;
  }
}

/** Claude는 글로벌 키 폴백, OpenAI/Gemini는 개별 키만 */
export function withResolvedApiKey(persona, globalKey) {
  const normalized = normalizeProviderModel(persona?.provider, persona?.model, "claude");
  const own = typeof persona?.apiKey === "string" ? persona.apiKey.trim() : "";
  const g = typeof globalKey === "string" ? globalKey.trim() : "";
  const apiKey = own || (normalized.provider === "claude" ? g : "");
  return {
    ...persona,
    provider: normalized.provider,
    model: normalized.model,
    apiKey,
    hasKey: !!apiKey,
    provName: getProviderName(normalized.provider),
  };
}

export function pickUsablePersona(personas, globalKey) {
  const resolved = personas.map((p) => withResolvedApiKey(p, globalKey));
  return resolved.find((p) => p.apiKey) || resolved[0];
}

export function formatOptionalDirectionFb(fb) {
  const t = (fb || "").trim();
  return t ? `\n\n**사용자가 원하는 피드백 방향:** ${t}` : "";
}

export const ANTHROPIC_MESSAGES_URL =
  typeof import.meta !== "undefined" && import.meta.env && import.meta.env.DEV
    ? "/anthropic/v1/messages"
    : "https://api.anthropic.com/v1/messages";

// ─── Modes & UI Config ───
export const MODES = [
  { id: "tournament", name: "아이디어 토너먼트", icon: "🏆", desc: "32강 토너먼트로 최고의 아이디어를 선별합니다", accent: true },
  { id: "hyperniche", name: "하이퍼 니치 익스플로러", icon: "🦄", desc: "초니치 시장, 글로벌 밈, 서브컬처를 결합해 복제 불가능한 블루오션 아이템을 발굴합니다", accent: "niche" },
  { id: "mixroulette", name: "믹스업 룰렛", icon: "🎰", desc: "아이디어 파츠 × AI 트렌드를 슬롯머신처럼 조합해 새로운 비즈니스 아이디어를 발견합니다", accent: "mix" },
  { id: "tot", name: "ToT 딥 다이브", icon: "🌳", desc: "생각의 가지를 뻗고 스스로 평가하며 최적의 솔루션을 찾아냅니다", accent: "tot" },
  { id: "analyze", name: "멀티 관점 분석", icon: "🧠", desc: "다수 AI가 병렬 분석 · 심화 모드로 SCAMPER·검증·리포트까지" },
  { id: "devil", name: "악마의 대변인", icon: "😈", desc: "Pre-mortem으로 아이디어의 약점을 극한 검증합니다" },
  { id: "scamper", name: "SCAMPER 확장", icon: "💡", desc: "7가지 축으로 아이디어를 변형·확장합니다" },
  { id: "dna", name: "아이디어 DNA 맵", icon: "🧬", desc: "아이디어들의 관계와 블루오션을 시각화합니다" },
  { id: "market", name: "시장 검증", icon: "🔍", desc: "실시간 웹서치로 경쟁사·시장을 분석합니다" },
  { id: "compete", name: "경쟁 환경 스캐너", icon: "🎯", desc: "유사 제품·서비스·플랫폼을 탐색합니다" },
  { id: "refhub", name: "레퍼런스 허브", icon: "📚", desc: "관련 웹사이트·커뮤니티·유튜브를 발굴합니다" },
  { id: "archive", name: "아카이브", icon: "📦", desc: "우수 결과물을 영구 보관합니다" },
];

export const SCAMPER_AXES = [
  { key: "S", name: "Substitute", desc: "대체할 수 있는 것은?", icon: "🔄" },
  { key: "C", name: "Combine", desc: "결합할 수 있는 것은?", icon: "🤝" },
  { key: "A", name: "Adapt", desc: "적용/차용할 수 있는 것은?", icon: "🔧" },
  { key: "M", name: "Modify", desc: "수정/확대/축소할 것은?", icon: "✏️" },
  { key: "P", name: "Put to other use", desc: "다른 용도는?", icon: "🎯" },
  { key: "E", name: "Eliminate", desc: "제거할 수 있는 것은?", icon: "✂️" },
  { key: "R", name: "Reverse", desc: "뒤집거나 재배열하면?", icon: "↩️" },
];

export const PERSONA_HOME_HINT = {
  market: "사용 메뉴: 멀티 관점 분석 · 아이디어 토너먼트 · SCAMPER · DNA 맵 · 시장 검증 (기본 모델)",
  investor: "사용 메뉴: 멀티 관점 분석 (투자 심사역 패널)",
  designer: "사용 메뉴: 멀티 관점 분석 (디자인 씽커 패널)",
  devil: "사용 메뉴: 멀티 관점 분석 · 악마의 대변인 (Pre-mortem)",
  tech: "사용 메뉴: 멀티 관점 분석 (기술 전문가 패널)",
  compete: "사용 메뉴: 경쟁 환경 스캐너",
  refhub: "사용 메뉴: 레퍼런스 허브",
  hyperniche: "사용 메뉴: 하이퍼 니치 익스플로러",
  mixroulette: "사용 메뉴: 믹스업 룰렛",
};

export const OB_HINTS = {
  mixroulette: { text: "왼쪽에 내 아이디어 키워드를 넣고, AI 트렌드와 조합하세요. 슬롯 수를 늘리면 더 복합적인 결과를 얻을 수 있습니다", icon: "tip" },
};

// ─── Credit System ───
export const CREDIT_COSTS = {
  analyze: { cost: 75, label: "멀티 관점 분석" },
  tournament: { cost: 100, label: "아이디어 토너먼트" },
  devil: { cost: 40, label: "Pre-mortem" },
  scamper: { cost: 60, label: "SCAMPER" },
  dna: { cost: 50, label: "DNA 맵" },
  market: { cost: 60, label: "시장 검증" },
  compete: { cost: 50, label: "경쟁 스캔" },
  refhub: { cost: 40, label: "레퍼런스 허브" },
  hyperniche: { cost: 50, label: "하이퍼 니치" },
  mixroulette_wheel: { cost: 25, label: "믹스업 휠 생성" },
  mixroulette_report: { cost: 50, label: "믹스업 리포트" },
  tot: { cost: 75, label: "ToT 딥다이브" },
  report_addon: { cost: 30, label: "추가 리포트" },
  brand_viral: { cost: 30, label: "브랜딩/바이럴" },
  competitor_map: { cost: 25, label: "유사사업 분포" },
  expert_search: { cost: 25, label: "전문가 서칭" },
  investor_search: { cost: 25, label: "투자처 서칭" },
  quantum_sim: { cost: 75, label: "퀀텀 시뮬레이터" },
  fact_check: { cost: 40, label: "팩트체크 레이더" },
  refine_copilot: { cost: 20, label: "리파인 코파일럿" },
  report_chat: { cost: 20, label: "리포트 챗" },
  prototyper_qa: { cost: 25, label: "프로토타이퍼 Q&A" },
  prototyper_synth: { cost: 90, label: "프롬프트 합성" },
  doc_upload: { cost: 15, label: "문서 분석" },
  vision: { cost: 25, label: "이미지 분석" },
  video: { cost: 25, label: "영상 분석" },
};

export const CREDIT_PACKAGES = [
  { id: "s1", credits: 500, price: "$5", bonus: 0 },
  { id: "s2", credits: 1000, price: "$10", bonus: 0 },
  { id: "s3", credits: 2000, price: "$20", bonus: 0 },
  { id: "s4", credits: 5000, price: "$45", bonus: 500, hot: true },
  { id: "s5", credits: 10000, price: "$80", bonus: 1500 },
  { id: "s6", credits: 25000, price: "$180", bonus: 5000 },
  { id: "s7", credits: 50000, price: "$320", bonus: 12000 },
  { id: "s8", credits: 100000, price: "$580", bonus: 28000 },
];

// ─── Country & Region Data ───
export const COUNTRY_FLAG = (cc) => { if (!cc) return "🌐"; const c = cc.toUpperCase(); if (c.length !== 2) return "🌐"; return String.fromCodePoint(...[...c].map(ch => 0x1F1E6 + ch.charCodeAt(0) - 65)); };
export const COUNTRY_KO = {
  KR: "한국", US: "미국", JP: "일본", CN: "중국", GB: "영국", DE: "독일", FR: "프랑스", CA: "캐나다", AU: "호주", SG: "싱가포르", IN: "인도", BR: "브라질", TW: "대만", VN: "베트남", TH: "태국", ID: "인도네시아", MY: "말레이시아", PH: "필리핀", MX: "멕시코", AE: "아랍에미리트", SA: "사우디", IL: "이스라엘", SE: "스웨덴", NL: "네덜란드", ES: "스페인", IT: "이탈리아", PL: "폴란드", CH: "스위스",
  NZ: "뉴질랜드", NO: "노르웨이", DK: "덴마크", FI: "핀란드", IE: "아일랜드", PT: "포르투갈", AT: "오스트리아", BE: "벨기에", CZ: "체코", HU: "헝가리", RO: "루마니아", UA: "우크라이나", TR: "튀르키예", EG: "이집트", ZA: "남아프리카", NG: "나이지리아", AR: "아르헨티나", CL: "칠레", CO: "콜롬비아", HK: "홍콩", MO: "마카오", PK: "파키스탄", BD: "방글라데시", KZ: "카자흐스탄", RU: "러시아",
};
export const COUNTRY_NAME_EN_TO_KO = {
  "South Korea": "한국", "Korea, Republic of": "한국", "Korea (South)": "한국", "Republic of Korea": "한국",
  "United States": "미국", "United States of America": "미국", "USA": "미국",
  "Japan": "일본", "China": "중국", "United Kingdom": "영국", "Great Britain": "영국", "Germany": "독일", "France": "프랑스",
  "Canada": "캐나다", "Australia": "호주", "Singapore": "싱가포르", "India": "인도", "Brazil": "브라질", "Taiwan": "대만",
  "Vietnam": "베트남", "Thailand": "태국", "Indonesia": "인도네시아", "Malaysia": "말레이시아", "Philippines": "필리핀",
  "Mexico": "멕시코", "United Arab Emirates": "아랍에미리트", "Saudi Arabia": "사우디아라비아", "Israel": "이스라엘",
  "Sweden": "스웨덴", "Netherlands": "네덜란드", "Spain": "스페인", "Italy": "이탈리아", "Poland": "폴란드", "Switzerland": "스위스",
  "New Zealand": "뉴질랜드", "Norway": "노르웨이", "Denmark": "덴마크", "Finland": "핀란드", "Ireland": "아일랜드", "Portugal": "포르투갈",
  "Austria": "오스트리아", "Belgium": "벨기에", "Czech Republic": "체코", "Czechia": "체코", "Hungary": "헝가리", "Romania": "루마니아",
  "Ukraine": "우크라이나", "Turkey": "튀르키예", "Türkiye": "튀르키예", "Egypt": "이집트", "South Africa": "남아프리카", "Nigeria": "나이지리아",
  "Argentina": "아르헨티나", "Chile": "칠레", "Colombia": "콜롬비아", "Hong Kong": "홍콩", "Macao": "마카오", "Macau": "마카오",
  "Russia": "러시아", "Russian Federation": "러시아",
};

export function getCountryNameKo(countryCode, countryNameEn) {
  const cc = (countryCode || "").toUpperCase();
  if (cc.length === 2 && COUNTRY_KO[cc]) return COUNTRY_KO[cc];
  const en = (countryNameEn || "").trim();
  if (en && COUNTRY_NAME_EN_TO_KO[en]) return COUNTRY_NAME_EN_TO_KO[en];
  if (en) {
    const hit = Object.keys(COUNTRY_NAME_EN_TO_KO).find(k => en.toLowerCase() === k.toLowerCase());
    if (hit) return COUNTRY_NAME_EN_TO_KO[hit];
  }
  return en || "";
}

export const REGIONS = [
  { id: "local", label: "🌏 내 지역" },
  { id: "global", label: "🌍 글로벌" },
  { id: "na", label: "🇺🇸 북미" },
  { id: "eu", label: "🇪🇺 유럽" },
  { id: "asia", label: "🌏 아시아" },
  { id: "sea", label: "🌴 동남아" },
  { id: "mena", label: "🕌 중동" },
  { id: "latam", label: "🌎 중남미" },
];
export const GENDERS = [
  { id: "all", label: "공통" },
  { id: "male", label: "남성" },
  { id: "female", label: "여성" },
];
export const AGE_RANGES = ["전체", "10대", "20대", "30대", "40대", "50대", "60대+"];

// ─── Utility Constants ───
export const MIX_ITEM_H = 72;

export function clipTitle(s, n = 80) {
  const t = (s || "").replace(/\s+/g, " ").trim();
  return t.length <= n ? t : `${t.slice(0, n)}…`;
}

export function formatHistoryTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function formatIdeaContext(ctx) {
  const t = (ctx || "").trim();
  return t ? `\n\n**아이디어 상황/배경:** ${t}` : "";
}

export function formatTargetForPrompt(t) {
  const parts = [];
  if (t.region === "local") {
    const ko = getCountryNameKo(t.countryCode, t.localCountry);
    if (ko) parts.push(`타겟 시장: ${ko} (IP 기준 접속 지역)`);
  } else { const rg = REGIONS.find(r => r.id === t.region); if (rg) parts.push(`타겟 시장: ${rg.label.replace(/^[^\s]+\s/, "")}`); }
  if (t.gender !== "all") parts.push(`타겟 성별: ${t.gender === "male" ? "남성" : "여성"}`);
  if (t.age !== "전체") parts.push(`타겟 연령: ${t.age}`);
  return parts.length ? `\n\n[타겟 정보]\n${parts.join("\n")}` : "";
}

export function fisherYatesShuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── localStorage Helpers ───
function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export function loadHistory() {
  const parsed = loadJson(HISTORY_STORAGE_KEY, []);
  return Array.isArray(parsed) ? parsed : [];
}
export function persistHistory(entries) {
  saveJson(HISTORY_STORAGE_KEY, Array.isArray(entries) ? entries.slice(0, HISTORY_MAX) : []);
}
export function loadArchive() {
  const parsed = loadJson(ARCHIVE_KEY, []);
  return Array.isArray(parsed) ? parsed : [];
}
export function saveArchive(items) { saveJson(ARCHIVE_KEY, Array.isArray(items) ? items : []); }
export function loadArchiveGroups() {
  const parsed = loadJson(ARCHIVE_GROUPS_KEY, ["기본"]);
  return Array.isArray(parsed) && parsed.length ? parsed : ["기본"];
}
export function saveArchiveGroups(g) { saveJson(ARCHIVE_GROUPS_KEY, Array.isArray(g) ? g : ["기본"]); }
export function loadCredits() {
  try {
    const raw = localStorage.getItem(CREDIT_STORAGE_KEY);
    if (raw === null) return CREDIT_DEFAULT;
    const num = Number(raw);
    return Number.isFinite(num) && num >= 0 ? num : CREDIT_DEFAULT;
  } catch {
    return CREDIT_DEFAULT;
  }
}
export function saveCredits(n) { try { localStorage.setItem(CREDIT_STORAGE_KEY, String(Math.max(0, Number(n) || 0))); } catch {} }

// Idea / Context / Feedback Stack Helpers
export function loadIdeaStack() {
  const parsed = loadJson(IDEA_STACK_KEY, []);
  return Array.isArray(parsed) ? parsed.slice(0, IDEA_STACK_MAX) : [];
}
export function saveIdeaStack(stack) { saveJson(IDEA_STACK_KEY, Array.isArray(stack) ? stack.slice(0, IDEA_STACK_MAX) : []); }
export function addToIdeaStack(texts) {
  const stack = loadIdeaStack();
  const existing = new Set(stack.map(s => s.trim().toLowerCase()));
  const newItems = texts.filter(t => { const k = t.trim().toLowerCase(); return k && !existing.has(k); });
  if (!newItems.length) return stack;
  const updated = [...newItems, ...stack].slice(0, IDEA_STACK_MAX);
  saveIdeaStack(updated);
  return updated;
}
export function addLinesToIdeaStack(multilineOrSingle) {
  const lines = String(multilineOrSingle).split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length) addToIdeaStack(lines);
}
export function removeFromIdeaStack(text) {
  const stack = loadIdeaStack().filter(s => s.trim().toLowerCase() !== text.trim().toLowerCase());
  saveIdeaStack(stack);
  return stack;
}
export function loadContextStack() {
  const parsed = loadJson(CONTEXT_STACK_KEY, []);
  return Array.isArray(parsed) ? parsed.slice(0, CONTEXT_STACK_MAX) : [];
}
export function saveContextStack(s) { saveJson(CONTEXT_STACK_KEY, Array.isArray(s) ? s.slice(0, CONTEXT_STACK_MAX) : []); }
export function addToContextStack(text) {
  const t = String(text || "").trim();
  if (!t) return;
  const stack = loadContextStack();
  if (stack.some(s => s.trim().toLowerCase() === t.toLowerCase())) return;
  saveContextStack([t, ...stack].slice(0, CONTEXT_STACK_MAX));
}
export function removeFromContextStack(text) {
  const stack = loadContextStack().filter(s => s.trim().toLowerCase() !== text.trim().toLowerCase());
  saveContextStack(stack);
  return stack;
}
export function loadFeedbackStack() {
  const parsed = loadJson(FEEDBACK_STACK_KEY, []);
  return Array.isArray(parsed) ? parsed.slice(0, FEEDBACK_STACK_MAX) : [];
}
export function saveFeedbackStack(s) { saveJson(FEEDBACK_STACK_KEY, Array.isArray(s) ? s.slice(0, FEEDBACK_STACK_MAX) : []); }
export function addToFeedbackStack(text) {
  const t = String(text || "").trim();
  if (!t) return;
  const stack = loadFeedbackStack();
  if (stack.some(s => s.trim().toLowerCase() === t.toLowerCase())) return;
  saveFeedbackStack([t, ...stack].slice(0, FEEDBACK_STACK_MAX));
}
export function removeFromFeedbackStack(text) {
  const stack = loadFeedbackStack().filter(s => s.trim().toLowerCase() !== text.trim().toLowerCase());
  saveFeedbackStack(stack);
  return stack;
}

export function clearBrainstormAppDataForTesting() {
  const keys = [PERSONAS_STORAGE_KEY, SETTINGS_STORAGE_KEY, HISTORY_STORAGE_KEY, ARCHIVE_KEY, ARCHIVE_GROUPS_KEY, CREDIT_STORAGE_KEY, IDEA_STACK_KEY, CONTEXT_STACK_KEY, FEEDBACK_STACK_KEY, "brainstorm-arena-personas-v2", "brainstorm-arena-personas", "brainstorm-arena-history"];
  const onboardingKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(ONBOARDING_KEY)) onboardingKeys.push(k);
  }
  [...keys, ...onboardingKeys].forEach((k) => { try { localStorage.removeItem(k); } catch {} });
  if (typeof location !== "undefined" && typeof location.reload === "function") location.reload();
}

// Resolve persona for ToT / Util / Mix
function buildSpecialPersona({ id, name, icon, provider, model, apiKey, globalKey, fallbackProvider }) {
  const normalized = normalizeProviderModel(provider, model, fallbackProvider);
  let key = typeof apiKey === "string" ? apiKey.trim() : "";
  if (!key && normalized.provider === "claude") key = typeof globalKey === "string" ? globalKey.trim() : "";
  return {
    id,
    name,
    icon,
    role: "",
    provider: normalized.provider,
    model: normalized.model,
    apiKey: key,
    hasKey: !!key,
    provName: getProviderName(normalized.provider),
  };
}

export function resolveTotPersona(globalKey, totProvider, totModel, totApiKey) {
  return buildSpecialPersona({ id: "__tot", name: "ToT", icon: "🌳", provider: totProvider, model: totModel, apiKey: totApiKey, globalKey, fallbackProvider: "claude" });
}
export function resolveUtilPersona(globalKey, utilProvider, utilModel, utilApiKey, personas) {
  const base = buildSpecialPersona({ id: "__util", name: "Util", icon: "🔧", provider: utilProvider || "openai", model: utilModel, apiKey: utilApiKey, globalKey, fallbackProvider: "openai" });
  if (base.hasKey) return base;
  const resolvedMatch = (personas || [])
    .map((p) => withResolvedApiKey(p, globalKey))
    .find((p) => p.provider === base.provider && p.apiKey);
  if (!resolvedMatch) return base;
  return { ...base, apiKey: resolvedMatch.apiKey, hasKey: true };
}
export function resolveMixPersona(globalKey, mixProvider, mixModel, mixApiKey) {
  return buildSpecialPersona({ id: "__mix", name: "Mix", icon: "🎰", provider: mixProvider, model: mixModel, apiKey: mixApiKey, globalKey, fallbackProvider: "claude" });
}
