# Brainstorm Arena — API 호출 기능 리스트

> **이 문서는 앱이 AI API를 통해 호출하는 모든 기능을 메뉴별로 정리합니다.**
> 각 기능의 프롬프트는 `src/prompts.js`에서 편집 가능합니다.

---

## 문서 구조도

```
02_API_FEATURES.md          ← 이 문서 (기능 목록 + 프롬프트 위치 매핑)
src/
├── prompts.js              ← 모든 AI 시스템/유저 프롬프트 (편집 가능 스크립트)
├── api.js                  ← callAI / callAIStream 핵심 호출 엔진
├── constants.js            ← PROVIDERS, 모델 목록, 페르소나 역할(role)
└── App.jsx                 ← 각 메뉴 컴포넌트 (프롬프트 조합 + UI)
```

---

## 1. 공통 API 호출 계층

| 함수 | 위치 | 설명 |
|------|------|------|
| `callAI(persona, messages, systemPrompt?)` | `api.js:228` | 단건 API 호출 (retry 2회, backoff, 타임아웃 120초) |
| `callAIStream(persona, messages, systemPrompt?, onChunk, opts?)` | `api.js:347` | 스트리밍 API 호출 (SSE 기반 실시간 출력) |
| `generateReportSection(persona, sectionType, idea, context, report)` | `api.js:1088` | 리포트 섹션별 생성 |
| `generateReportSectionStream(...)` | `api.js:1095` | 리포트 섹션 스트리밍 생성 |
| `generateTournamentSlotIdeas(persona, globalKey, ctx, seeds, count)` | `api.js:1131` | 토너먼트 아이디어 자동 보충 |

### 지원 프로바이더

| 프로바이더 | 엔드포인트 | 모델 |
|-----------|-----------|------|
| **Claude** (Anthropic) | `api.anthropic.com/v1/messages` | claude-sonnet-4-20250514 |
| **GPT** (OpenAI) | `api.openai.com/v1/chat/completions` | gpt-5.4, gpt-5.4-mini, gpt-5.4-nano, o3, o4-mini |
| **Gemini** (Google) | `generativelanguage.googleapis.com/v1beta` | gemini-2.5-flash, gemini-2.0-flash |

### 보호 메커니즘

| 기능 | 설명 |
|------|------|
| Rate Limiter | 60초 30회 / 1시간 300회 제한 |
| Circuit Breaker | 단기 폭주 시 30초 잠금 |
| Retry + Backoff | 429/5xx 시 최대 2회 재시도 (1s → 4s → 8s) |
| Timeout | 기본 120초, 프로토타이퍼는 300초 |

---

## 2. 메뉴별 API 호출 기능

### 2.1 멀티 관점 분석 (`analyze`)

| 기능 | 프롬프트 위치 | 시스템 프롬프트 | 설명 |
|------|-------------|---------------|------|
| **페르소나별 개별 분석** | `prompts.js` → `buildMultiAnalysisPrompt()` | 페르소나 기본 역할 | 선택된 전문가 각자 관점으로 아이디어 분석 |
| **종합 분석 (Synthesis)** | `prompts.js` → `buildSynthesisPrompt()` | 없음 | 전문가 의견 종합 투자 심사 리포트 |
| **딥 분석 4단계** | `prompts.js` → `buildDeepAnalysisPrompts()` | 없음 | SCAMPER·약점·시장·액션플랜 순차 실행 |

### 2.2 아이디어 토너먼트 (`tournament`)

| 기능 | 프롬프트 위치 | 시스템 프롬프트 | 설명 |
|------|-------------|---------------|------|
| **아이디어 자동 보충** | `api.js:1131` | `prompts.js` → `TOURNAMENT_FILL_SYSTEM` | 부족한 슬롯을 AI로 채움 |
| **매치 심판** | `prompts.js` → `buildTournamentMatchPrompt()` | `prompts.js` → `TOURNAMENT_MATCH_SYSTEM` | 5차원 점수 JSON 판정 |
| **최종 리포트** | `prompts.js` → `buildTournamentFinalReportPrompt()` | 없음 | 순위 분석 + 1위 투자 제안서 |

### 2.3 악마의 대변인 (`devil`)

| 기능 | 프롬프트 위치 | 시스템 프롬프트 | 설명 |
|------|-------------|---------------|------|
| **Pre-mortem 분석** | `prompts.js` → `buildDevilAdvocatePrompt()` | 페르소나 `devil` 역할 | 사망 선고서 + Kill Zone + 처방전 |

### 2.4 SCAMPER 확장 (`scamper`)

| 기능 | 프롬프트 위치 | 시스템 프롬프트 | 설명 |
|------|-------------|---------------|------|
| **7축 분석** | `prompts.js` → `buildScamperPrompt()` | 없음 | S/C/A/M/P/E/R 각 축별 파생 아이디어 |

### 2.5 아이디어 DNA 맵 (`dna`)

| 기능 | 프롬프트 위치 | 시스템 프롬프트 | 설명 |
|------|-------------|---------------|------|
| **클러스터 분석** (JSON) | `prompts.js` → `buildDnaMapPrompt()` | `prompts.js` → `DNA_MAP_SYSTEM` | 클러스터 + 블루오션 + 시너지 JSON |
| **텍스트 폴백** | `prompts.js` → `buildDnaMapFallbackPrompt()` | `prompts.js` → `DNA_MAP_SYSTEM` | JSON 파싱 실패 시 텍스트 분석 |

### 2.6 시장 검증 (`market`)

| 기능 | 프롬프트 위치 | 시스템 프롬프트 | 설명 |
|------|-------------|---------------|------|
| **웹 검색 기반 시장 분석** | `prompts.js` → `buildMarketValidationPrompt()` | 없음 | Claude 웹 검색 도구 활용 (max 5회) |
| **지식 기반 폴백** | `prompts.js` → `buildMarketFallbackPrompt()` | 없음 | 웹 검색 실패 시 내부 지식 기반 분석 |

### 2.7 경쟁 환경 스캐너 (`compete`)

| 기능 | 프롬프트 위치 | 시스템 프롬프트 | 설명 |
|------|-------------|---------------|------|
| **경쟁사 스캔** | `prompts.js` → `buildCompeteScanPrompt()` | 없음 | 직접/간접 경쟁 + 빅테크 위협 분석 |

### 2.8 레퍼런스 허브 (`refhub`)

| 기능 | 프롬프트 위치 | 시스템 프롬프트 | 설명 |
|------|-------------|---------------|------|
| **레퍼런스 발굴** (JSON) | `prompts.js` → `buildRefhubSearchPrompt()` | 없음 | 웹사이트/커뮤니티/유튜브/리서치 20개 |
| **추가 발굴** | `prompts.js` → `buildRefhubMorePrompt()` | 없음 | 기존 결과와 중복 없는 추가 20개 |

### 2.9 하이퍼 니치 익스플로러 (`hyperniche`)

| 기능 | 프롬프트 위치 | 시스템 프롬프트 | 설명 |
|------|-------------|---------------|------|
| **초니치 아이디어 3개** (JSON) | `prompts.js` → `HYPERNICHE_SYSTEM` | `prompts.js` → `HYPERNICHE_SYSTEM` | 밈 + 트렌드 결합 초니치 비즈니스 |

### 2.10 믹스업 룰렛 (`mixroulette`)

| 기능 | 프롬프트 위치 | 시스템 프롬프트 | 설명 |
|------|-------------|---------------|------|
| **트렌드 휠 생성** (JSON) | `prompts.js` → `buildMixWheelPrompt()` | `prompts.js` → `MIX_WHEEL_SYSTEM` | 아이디어 파츠와 결합될 트렌드 생성 |
| **믹스업 리포트** (JSON) | `prompts.js` → `buildMixReportPrompt()` | `prompts.js` → `MIX_REPORT_SYSTEM` | 두 요소 강제 결합 비즈니스 분석 |

### 2.11 ToT 딥 다이브 (`tot`)

| 기능 | 프롬프트 위치 | 시스템 프롬프트 | 설명 |
|------|-------------|---------------|------|
| **Phase 1: 발산** (JSON) | `prompts.js` → `buildTotBranchPrompt()` | `prompts.js` → `TOT_SYSTEM` | 3가지 근본적으로 다른 실행 경로 |
| **Phase 2: 평가·가지치기** (JSON) | `prompts.js` → `buildTotEvalPrompt()` | `prompts.js` → `TOT_SYSTEM` | 5차원 10점 만점 평가 + 가지치기 |
| **Phase 3: 심화 전개** | `prompts.js` → `buildTotSolutionPrompt()` | `prompts.js` → `TOT_SYSTEM` | 승자 방향 시리즈A 수준 구체화 |

### 2.12 웹앱 프로토타이퍼 (`prototyper`)

| 기능 | 프롬프트 위치 | 시스템 프롬프트 | 설명 |
|------|-------------|---------------|------|
| **Q&A 생성** (JSON) | `prompts.js` → `PROTOTYPER_QA_SYSTEM` | `prompts.js` → `PROTOTYPER_QA_SYSTEM` | 핵심 질문 10가지 |
| **마스터 프롬프트 합성** | `prompts.js` → `buildPrototyperSynthMessage()` | `prompts.js` → `PROTOTYPER_SYNTH_SYSTEM` | Cursor/Claude Code용 개발 프롬프트 |
| **PROJECT_GUIDE.md 생성** | `prompts.js` → `PROTOTYPER_PROJECT_GUIDE_TEMPLATE` | 없음 | 템플릿 기반 가이드 문서 |

---

## 3. 리포트 부가 기능 (Deep Analysis Panel)

모든 분석 결과에 공통으로 제공되는 추가 API 기능:

### 3.1 리포트 추가 섹션 (`REPORT_ADDON_PROMPTS`)

| 기능 | 프롬프트 키 | 설명 |
|------|-----------|------|
| **VC 투자 제안서** | `prompts.js` → `REPORT_ADDON_PROMPTS.vc` | 시리즈A 수준 투자 제안서 |
| **법무 리스크** | `prompts.js` → `REPORT_ADDON_PROMPTS.legal` | 규제·개인정보·지적재산 점검 |
| **시장 성장도** | `prompts.js` → `REPORT_ADDON_PROMPTS.growth` | 시장 규모·CAGR·성숙도 분석 |
| **비용 시뮬레이션** | `prompts.js` → `REPORT_ADDON_PROMPTS.cost` | 개발비·인건비·인프라·BEP |
| **수익화 의견서** | `prompts.js` → `REPORT_ADDON_PROMPTS.revenue` | 수익 모델·가격 전략·MRR 전망 |

### 3.2 브랜딩 & 바이럴 (`BRAND_VIRAL_PROMPTS`)

| 기능 | 프롬프트 키 | 설명 |
|------|-----------|------|
| **브랜딩 전략 플랜** | `prompts.js` → `BRAND_VIRAL_PROMPTS.branding` | Brand Sprint + StoryBrand + 아키타입 |
| **바이럴 성장 전략** | `prompts.js` → `BRAND_VIRAL_PROMPTS.viral` | Growth Hacking + AARRR + PLG |

### 3.3 리포트 도구

| 기능 | 프롬프트 위치 | 시스템 프롬프트 | 설명 |
|------|-------------|---------------|------|
| **AI 채팅** | App.jsx | `prompts.js` → `REPORT_CHAT_SYSTEM` | 리포트 기반 후속 대화 |
| **팩트체크 레이더** | `prompts.js` → `buildFactCheckPrompt()` | `prompts.js` → `FACT_CHECK_SYSTEM` | 수치·사실 검증 (VERIFIED/CAUTION/FALSE) |
| **리파인 코파일럿** | `prompts.js` → `buildRefineCopilotPrompt()` | `prompts.js` → `REFINE_COPILOT_SYSTEM` | 리포트 문구 수정·개선 |
| **퀀텀 시뮬레이터** | `prompts.js` → `buildQuantumSimPrompt()` | `prompts.js` → `QUANTUM_SIMULATOR_SYSTEM` | 1~48주 실행 시뮬레이션 JSON |

### 3.4 지도·전문가·투자처 서칭

| 기능 | 프롬프트 위치 | 설명 |
|------|-------------|------|
| **유사 사업 분포 지도** | `prompts.js` → `buildCompetitorMapPrompt()` | 국내 5~8 + 해외 8~12개 좌표 JSON |
| **전문가 서칭** | `prompts.js` → `buildExpertSearchPrompt()` | 권위자 5~8명 + 논문 + 커뮤니티 JSON |
| **투자처 서칭** | `prompts.js` → `buildInvestorSearchPrompt()` | 국내외 투자처 TOP10 JSON |

---

## 4. 유틸리티 API 호출

| 기능 | 위치 | 설명 |
|------|------|------|
| **문서 요약** (PDF/Excel/PPTX) | `prompts.js` → `buildDocumentSummaryPrompt()` | 업로드 문서에서 아이디어 추출 |
| **이미지 비전 분석** | `api.js` → `processImageWithVision` | 이미지에서 아이디어 추출 |
| **YouTube 분석** | `api.js` → `extractYouTubeVideoInfo` | 유튜브 자막 기반 아이디어 추출 |
| **웹 아티클 추출** | `api.js` → `extractWebArticle` | URL에서 본문 추출 |

---

## 5. FBO 프레임워크 (공통 주입)

모든 분석에 공통으로 주입되는 검증 레이어:

```
prompts.js → FBO_FRAMEWORK
```

- **최초(First)** — 세계/국내 최초 여부
- **최고(Best)** — 10배 이상 우월한 지표
- **유일(Only)** — 유일한 포지셔닝 가능 특성

---

## 6. 프롬프트 편집 가이드

### 편집 대상 파일
- **`src/prompts.js`** — 모든 시스템/유저 프롬프트의 중앙 관리소
- **`src/constants.js`** — 페르소나 기본 역할(`DEFAULT_PERSONAS[].role`)

### 편집 시 주의사항
1. JSON 응답을 요구하는 프롬프트의 스키마 키는 **영문 유지**
2. 모든 텍스트 값은 **한국어**로 작성
3. `FBO_FRAMEWORK` 변경 시 전체 분석 품질에 영향
4. 프롬프트 수정 후 반드시 `npm run build` 확인
5. `LAST_UPDATED` 갱신 필수
