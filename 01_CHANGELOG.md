# Brainstorm Arena - Changelog

> 변경 사항을 **최신순**으로 기록합니다. 수정 시 맨 위에 추가하세요.

---

## 2026-04-03 #17 — 추가분석 출력 겹침 수정, 히스토리 × 버튼 가시성 개선

### 변경

#### 추가 분석 옵션 출력 겹침 해결
- `.report-sticky-actions`: `position: sticky; bottom: 0` 제거 → `position: relative`로 전환.
- 바이럴 전략, 브랜딩 플랜 등 확장 콘텐츠가 리포트 위로 겹쳐지던 현상 해결.
- 배경 그라디언트(`linear-gradient`)와 `pointer-events: none` 제거 — 일반 플로우로 자연스럽게 배치.

#### 히스토리 × 삭제 버튼 가시성 개선
- `×` 텍스트 → SVG 아이콘(`<svg>` X 마크)으로 교체 — 폰트 렌더링 불일치 해소.
- `color: var(--text-muted)` → `#9ca3af` 고정 + `font-weight: 600` — 더 선명하게 보임.

### 관련 파일
- `src/styles.js` (`.report-sticky-actions`, `.history-row-del`)
- `src/App.jsx` (`HistoryDrawer` × 버튼)

---

## 2026-04-03 #16 — 믹스업 룰렛 터치 네비게이션, 더블박스 제거, AI 스택 분리, GPT 4.1 제거

### 변경

#### 믹스업 룰렛 터치/클릭 네비게이션 수정
- 비활성 슬롯 클릭 시 `input`이 이벤트를 가로채 네비게이션이 안 되던 문제 해결.
- `onClick` 가드를 `i === activeIndex`인 경우에만 적용 — 비활성 슬롯은 클릭 즉시 한 칸 이동.
- 비활성 슬롯에 `onPointerDown` + `preventDefault()` 추가 — 인풋 포커스 원천 차단.
- CSS: `.mix-wheel-slot:not(.mix-wheel-slot--active) .mix-wheel-input { pointer-events: none }` 추가.

#### 더블 박스 디자인 제거
- 활성 인풋(`.mix-wheel-slot--active .mix-wheel-input`): `background`/`border`/`box-shadow` 모두 `transparent`/`none`으로.
- 활성 텍스트(`.mix-wheel-slot--active .mix-wheel-text`): 동일하게 배경·테두리 제거.
- 하이라이트 박스(`.mix-wheel-highlight`)만 단일 시각 컨테이너 역할 — 깔끔한 단일 박스.

#### AI 생성 아이디어 스택 제외
- 토너먼트 컨셉 모드: `addToIdeaStack(all)` 제거 — AI가 생성한 아이디어가 스택에 쌓이지 않음.
- 믹스업 룰렛 `saveToStack`: `addToIdeaStack([…])` 제거 — 히스토리 저장은 유지, 스택에는 불저장.
- 유저가 직접 입력한 아이디어만 스택에 쌓이도록 정리.

#### GPT 4.1 모델 제거
- `constants.js` PROVIDERS에서 `gpt-4.1` 삭제.
- 남은 모델: `gpt-5.4`, `gpt-5.4-mini`, `gpt-5.4-nano`, `o3`, `o4-mini`.

### 관련 파일
- `src/App.jsx` (`MixWheel`, `Tournament`, `MixupRoulette.saveToStack`)
- `src/styles.js` (`.mix-wheel-input`, `.mix-wheel-slot--active`)
- `src/constants.js` (`PROVIDERS.openai.models`)

---

## 2026-04-03 #15 — GPT API 호환성, 아카이브 팝업 z-index, 믹스업 룰렛 UI 대폭 개선

### 변경

#### GPT API `max_tokens` → `max_completion_tokens` 수정
- `gpt-5.4`, `gpt-4.1` 등 신형 모델에서 `max_tokens` 파라미터 미지원 오류 해결.
- `api.js`의 `callAI` 및 `processImageWithVision` 함수에 `isNewModel` 체크 추가: `/^(o[1-9]|gpt-(4\.1|5\.))/.test(m)` 매칭 시 `max_completion_tokens` 사용.
- 기존 `isOSeries`(o-시리즈만) 체크를 `isNewModel`로 확장하여 모든 신형 OpenAI 모델 호환.

#### 아카이브 팝업 z-index 수정 (footer 관통 해결)
- `ArchiveView`의 상세 팝업(`viewItem` 오버레이): `ReactDOM.createPortal(…, document.body)`로 전환 — `page-enter` 래퍼의 stacking context에 갇히지 않도록.
- `HistoryDetailModal`도 동일하게 `createPortal` 적용 — 일관된 오버레이 동작 보장.
- `.footer` z-index: `0` → `-1`로 변경 — 오버레이 뒤로 확실히 내려감.

#### 믹스업 룰렛 UI/UX 대폭 개선
- **z-index 재조정**: `.mix-wheel-mask` z-index `5` → `2`로 하향 — 활성 슬롯(z-index 4)을 덮지 않도록.
- **활성 슬롯 강조**: `scale(1)` → `scale(1.08)`, 비활성 `scale(0.88)` → `scale(0.78)` + `blur(0.5px)` — 중앙 아이디어가 확실히 크고 선명하게 보임.
- **하이라이트 박스**: 좌우 인셋 + `border-radius: 14px` + 반투명 배경 + `backdrop-filter: blur` — 프리미엄 글래스 느낌.
- **배경 컬러**: 진한 회색(`#edf0f4`) → 밝은 화이트(`#f8fafc`) 그라디언트 — 마스크와 자연스러운 페이드.
- **마스크 그라디언트**: 새 배경 컬러에 맞춰 `rgba(248,250,252, …)` 적용.
- **텍스트 타이포**: 비활성 텍스트 `11px`/`#9ca3af`, 활성 텍스트 `14~15px`/`#0f172a`/`font-weight: 700` — 극적 대비.
- **중앙 + 인디케이터**: `52px`, 그라디언트 배경, 더 강한 블루 글로우 shadow.
- **레이블**: `text-transform: uppercase`, `letter-spacing: 0.04em`, `font-weight: 700`.

### 관련 파일
- `src/api.js` (`callAI`, `processImageWithVision`)
- `src/App.jsx` (`HistoryDetailModal`, `ArchiveView`)
- `src/styles.js` (`.mix-wheel-*`, `.mix-center-*`, `.footer`)

---

## 2026-04-02 #14 — 히스토리 × 버튼 가시성, 믹스업 텍스트 강화, 메일 보내기 전환

### 변경

#### 히스토리 드로어 × 삭제 버튼
- `.history-row-del`: `border` + `background: var(--bg-surface-1)` + `display: flex; align-items/justify-content: center` 추가 — 버튼이 명확히 보이도록 개선.
- `.history-row` CSS에서 중복 `margin-bottom: 8px` 제거 (wrapper inline style과 이중 적용 방지).
- wrapper `alignItems: "stretch"` → `"center"`, `gap: 4` → `6`으로 조정.

#### 믹스업 룰렛 텍스트 가시성 (2차 강화)
- `.mix-wheel-highlight`: 배경 `rgba(219,234,254,0.85)` (더 진한 블루), 테두리 두께 `2px`, `box-shadow` inset 추가.
- `.mix-wheel-slot--active .mix-wheel-input`: `background: rgba(255,255,255,0.6)` + `border: 1px solid rgba(37,99,235,0.12)` — 입력 필드 자체에 반투명 백을 깔아 텍스트 배경 대비 확보.
- `.mix-wheel-slot--active .mix-wheel-text`: 동일하게 `background: rgba(255,255,255,0.5)` + 패딩 추가.
- placeholder: `#4b5563` + `font-weight: 500`으로 더 어둡게.

#### 메일용 복사 → 메일 보내기
- `ReportExportBar`의 `handleEmail`: 클립보드 복사 → `mailto:?subject=&body=` URL로 전환. 기기의 기본 메일 앱이 바로 열림.
- 버튼 라벨: `📧 메일용 복사` → `📧 메일 보내기`.

### 관련 파일
- `src/styles.js`
- `src/App.jsx` (`HistoryDrawer`, `ReportExportBar`)

---

## 2026-04-02 #13 — 히스토리/아카이브 상세 팝업 상하 확대

### 배경
- 히스토리 상세 및 아카이브 상세 팝업의 상하 높이가 부족하여 리포트 영역이 너무 좁게 표시됨.
- 하단 액션 영역(추가 분석 옵션 버튼 등)이 전체 팝업 높이의 55%까지 차지하여 상단 리포트 본문 스크롤 영역이 압박됨.

### 변경
- **`.history-detail-panel`**: `max-height`를 `min(88vh, 900px)` → `min(94vh, 1100px)`으로 확대.
- **`.history-detail-scroll`**: `min-height: 200px` 추가 — 리포트 본문이 최소한의 가독 영역을 확보.
- **`.history-detail-footer`**: `max-height: 55%` → `45%`로 축소 — 리포트 본문에 더 많은 공간 배분.
- **모바일(480px)**: `max-height: 92vh` → `96vh`로 확대.
- **아카이브 상세 팝업**: 인라인 `maxHeight`도 `min(94vh, 1100px)`으로 동기화.

### 관련 파일
- `src/styles.js` (`.history-detail-panel`, `.history-detail-scroll`, `.history-detail-footer`)
- `src/App.jsx` (ArchiveView 인라인 style)

---

## 2026-04-02 #12 — 믹스업 룰렛 중앙 슬롯 텍스트 가시성 개선

### 배경
- 믹스업 룰렛의 좌우 양 박스에서 중앙 활성 슬롯의 하이라이트 배경이 순백(`rgba(255,255,255,0.85)`)이라 입력 텍스트·플레이스홀더·AI 트렌드 텍스트가 거의 보이지 않음.
- 상하 페이드 마스크 그라데이션과 겹치면서 가시성이 더욱 악화.

### 변경
- **`.mix-wheel-highlight`**: 배경을 `rgba(237,243,255,0.92)` (아주 연한 블루 틴트)로 변경, 테두리를 `rgba(37,99,235,0.15)` 블루 라인으로 교체 — 활성 영역 시각 구분 강화.
- **`.mix-wheel-slot--active .mix-wheel-input`**: 색상 `#0f172a` + 미세 `text-shadow` 추가.
- **`.mix-wheel-slot--active .mix-wheel-text`**: 동일한 text-shadow 적용.
- **`.mix-wheel-input::placeholder`**: `#9ca3af` → `#6b7280`으로 어둡게 — 연한 배경에서도 가독성 확보.

### 관련 파일
- `src/styles.js`

---

## 2026-04-02 #12a — 코드 모듈화 (단일 파일 → 6개 모듈)

### 배경
- `src/App.jsx` 단일 파일이 9,482줄(548KB)로 비대화.
- Claude/GPT/Gemini API로 유지보수 시 컨텍스트 윈도우 한계로 전체 파일 전달 불가.
- 수정 대상이 아닌 코드(CSS, 상수, API 레이어)가 컴포넌트 코드와 혼재하여 작업 효율 저하.

### 변경

#### 신규 모듈 파일
| 파일 | 줄수 | 역할 |
|------|------|------|
| `src/logger.js` | 20 | `LOG` 객체 (info/warn/error/api) |
| `src/constants.js` | 416 | PROVIDERS, DEFAULT_PERSONAS, MODES, 저장 키, 크레딧 비용, 국가 데이터, localStorage 헬퍼, 페르소나 리졸버 |
| `src/api.js` | 398 | `callAI`, 레이트 리미터, 서킷 브레이커, 토스트 시스템, 문서 파싱(PDF/Excel/PPTX), YouTube 인텔리전스, 비전 API, 토너먼트 슬롯 생성 |
| `src/styles.js` | 2,536 | Toss-Style CSS 전체 (기존 `const STYLES` 문자열 분리) |
| `src/prompts.js` | 463 | (기존 유지) AI 프롬프트 라이브러리 |

#### App.jsx 변경
- **9,482줄 → 6,024줄** (36% 감소)
- 모든 상수·API·CSS·프롬프트를 `import`로 참조
- 컴포넌트 코드만 잔류 — AI 에이전트에게 컴포넌트 수정 요청 시 `App.jsx`만 전달하면 충분
- `constants.js` + `api.js` 변경 시 전체 앱 영향 최소화 (인터페이스 기반 분리)

#### 의존성 방향
```
main.jsx → App.jsx → constants.js, api.js, styles.js, prompts.js, logger.js
api.js → constants.js, prompts.js, logger.js
constants.js / logger.js / styles.js / prompts.js → (독립, 순환 없음)
```

#### GUI·밸런스 변경 없음
- 기능·UI·CSS 출력이 원본과 동일하도록 검증 (빌드 성공 확인)
- `npm run build` 통과 (92 modules transformed, dist/ 생성)

### 관련 파일
- `src/logger.js` (신규)
- `src/constants.js` (신규)
- `src/api.js` (신규)
- `src/styles.js` (신규)
- `src/App.jsx` (대폭 축소)
- `00_PROJECT_GUIDE.md` (폴더 구조·모듈 의존성 문서화)

---

## 2026-04-02 #11 — 아카이브 상세·리파인 코파일럿 뷰포트 정렬 (fixed 기준 박스)

### 배경
- 아카이브에서 항목 상세(`history-detail-overlay`) 또는 리파인 코파일럿을 열면 UI가 **화면 상단에만 붙고** 하단에 **빈 캔버스**가 크게 남는 현상.
- 원인: 아카이브 전용 래퍼 `.page-enter`의 `pageEnter` 애니메이션이 **`animation-fill-mode: both`**로 끝난 뒤에도 **`transform`**을 유지 → 조상에 `transform`이 있으면 자손의 **`position: fixed`가 뷰포트가 아닌 해당 래퍼**를 기준으로 잡힘.

### 변경
- **`@keyframes pageEnter`**: `translateY` / `scale` 제거, **opacity만** 페이드인 유지.
- 동작: `fixed` 오버레이·코파일럿 패널이 다시 **뷰포트 기준**으로 전체 화면을 덮고, 상세 모달은 기존처럼 flex **세로·가로 중앙** 정렬이 적용됨.

### 관련 파일
- `src/App.jsx` (`STYLES` 내 `pageEnter` / `.page-enter`)

---

## 2026-04-02 #10 — 온보딩 정리, 아카이브·리파인 코파일럿 모바일 UX

### 배경
- 온보딩 힌트가 믹스업 룰렛 외에도 전 모드에 노출되어 노이즈.
- 9:16 모바일에서 아카이브 카드가 세로로 과도하게 길고, 웹앱 프롬프트 CTA가 full-width로 시각적 부담.
- 리파인 코파일럿이 모바일에서 전면 패널로 열려 리포트와 동시 확인이 어려움.

### 변경
- **온보딩**: `mixroulette`만 `useMenuOnboarding` + `ObHint` 유지. 나머지 모드 훅/렌더 제거. `OB_HINTS`도 해당 항목만 유지.
- **아카이브**: 카드 2단 구조(본문: 아이콘+제목+태그+메모+날짜 / 하단: 액션 아이콘 + 컴팩트 「웹앱 프롬프트」 버튼). `.archive-item-body`, `.archive-item-bottom`, `.archive-proto-btn` 등 CSS 재정의.
- **리파인 코파일럿**: `@media (max-width: 768px)`에서 하단 시트(`~45vh`, 상단 라운드+핸들, 약한 오버레이)로 전환해 상단 리포트 가시성 확보. safe-area 대응.

### 관련 파일
- `src/App.jsx`

---

## 2026-04-02 #9 — 코드 오딧: 비용 방어, 크레딧 게이팅, 렌더·데드코드 정리

### 배경
- 프로덕션 전 LLM 호출 무제한·연타·대량 루프에 대한 클라이언트 측 안전망 부재.
- 크레딧 차감만 되고 **부족해도 API가 계속 호출**되는 구조.
- Context value 매 렌더 신규 객체 생성, `loadSettings()` 매 렌더 호출 등 성능 이슈.

### 변경
- **Rate limit + 서킷 브레이커** (`_rateLimiter`): 60초당 30회 초과 시 30초 락, 1시간당 300회 상한. `callAI` 진입·재시도 전 검사.
- **`callAI`**: `AbortController` 60초 타임아웃, 429/5xx에 exponential backoff 재시도(최대 3회).
- **크레딧**: `spend`가 부족 시 `false` + 토스트; 모든 `spend(...)` 호출부에 `if (!spend) return` 가드. `creditsRef`로 동기 판단.
- **토너먼트 슬롯 채우기**: 루프당 API 호출 **예산 10회** 상한.
- **버튼**: ToT `disabled={running || !idea.trim()}`, QuantumSim `disabled={loading}`.
- **토스트**: `showAppToast` / `AppToastRenderer` — rate limit·크레딧 등 사용자 피드백.
- **렌더링**: `targetCtx`·`archiveCtx`·`taskMgrCtx` `useMemo`; `loadSettings` → `useState(loadSettings)`; `visitedModes` lazy `Set`; `BrandSvg`·`FighterRow` 모듈 스코프 이동.
- **데드코드**: `ReportResultWrapper` 삭제, `FBO_FRAMEWORK` import 제거, `_KO` 별칭 상수 제거 후 원본 프롬프트명 직접 사용.

### 관련 파일
- `src/App.jsx`

---

## 2026-04-02 #8 — 설정 테스트 초기화, 온보딩 토스트(이후 #10에서 믹스업만 유지)

### 변경
- **설정 모달**: 「앱 초기화 (테스트)」 — 알려진 `localStorage` 키 + `ba_onboarded_*` 제거 후 `location.reload()`.
- **온보딩 힌트** (당시): `ObHint`를 `createPortal` 하단 토스트로 전환, 문구를 기능별 실용 팁으로 교체. *(#10에서 믹스업 룰렛 외 제거됨.)*

### 관련 파일
- `src/App.jsx`

---

## 2026-04-01 #8 — 설정·API 안정화, 페르소나 병합, 피드백 방향 전 모드, 히스토리 보정

### 배경
- 설정 화면에 **경쟁 환경 스캐너·레퍼런스 허브**가 누락되는 현상(구버전 `localStorage` 페르소나 배열이 신규 ID 없이 로드됨).
- 레퍼런스 허브 등에서 **`[Claude] Failed to fetch`** 및 키 미설정 시 불명확한 실패.
- 홈 메뉴명과 설정 워딩 불일치, 멀티 관점 외 모드에 **「원하는 피드백 방향」** 미적용.
- IP 위치 실패 시 **「국가 확인 중」**이 계속 표시되는 UX.

### 변경

#### 페르소나·설정 영속화
- **`PERSONAS_STORAGE_KEY`**: `brainstorm-arena-personas-v3` — 저장 시 전체 `personas` 배열.
- **`SETTINGS_STORAGE_KEY`**: `brainstorm-arena-settings-v1` — `globalKey`, `totProvider`, `totModel`, `totApiKey`.
- **`mergePersonasWithDefaults(stored)`**: 로드 시 `DEFAULT_PERSONAS`와 **ID 기준 병합** → 누락된 `compete`·`refhub` 등 자동 추가, `role`·`name`·`icon`은 코드 기본값 유지, 사용자의 `provider`·`model`·`apiKey`는 보존.
- **`loadPersonasFromStorage()`** / **`loadSettings()`**: 앱 초기 상태에 사용.
- **설정 모달**: `useEffect`로 부모 `personas`·`globalKey`·ToT 설정과 동기화; 열 때마다 병합된 목록 표시.

#### 설정 UI·홈 워딩
- **`PERSONA_HOME_HINT`**: 각 페르소나 카드에 홈 메뉴와의 대응 안내(멀티 패널 vs 경쟁/레퍼런스 전용 등).
- ToT 블록에 「홈 ToT 딥 다이브 전용(멀티 패널과 별도)」 설명 추가.
- **`MODES`**: `devil` 표시명 **「Devil's Advocate」→「악마의 대변인」** (홈·히스토리와 통일).

#### API 키·Claude 호출
- **`withResolvedApiKey(persona, globalKey)`**: 개별 키 우선; **Claude만** 글로벌 키 폴백. OpenAI/Gemini는 개별 키만 사용(이전에 악마 페르소나 등에서 `globalKey`를 잘못 붙이던 문제 제거).
- **`callAI` (Claude)**: 키 없으면 요청 전 **`throw`** — 한국어 메시지(키 설정 유도). 헤더는 키 있을 때만 구성.
- **`ANTHROPIC_MESSAGES_URL`**: `import.meta.env.DEV`일 때 **`/anthropic/v1/messages`**, 빌드·프로덕션은 `https://api.anthropic.com/v1/messages`.
- **`vite.config.js`**: dev **`server.proxy`** — `/anthropic` → `https://api.anthropic.com` (path rewrite)로 동출처 프록시, 로컬 CORS/Failed to fetch 완화.
- **시장 검증**: 웹 검색 1차 호출도 동일 URL 사용; 키는 **`investor` 페르소나 + `withResolvedApiKey`** 로 결정.

#### 멀티 관점·피드백 방향
- **`formatOptionalDirectionFb(fb)`**: 비어 있지 않을 때만 프롬프트에 `**사용자가 원하는 피드백 방향:**` 블록 삽입.
- **멀티 관점**: `compete`·`refhub`는 **패널 칩에서 제외**; `useEffect`로 선택 ID 정리. **심화 분석** 각 단계 프롬프트에도 `fb` 반영. 피드백 입력을 **textarea**로 통일.
- **적용 모드**: 토너먼트, 악마의 대변인, SCAMPER, DNA 맵, 시장 검증, 경쟁 환경 스캐너, 레퍼런스 허브, ToT(기존 `context` 필드 — 라벨을 「원하는 피드백 방향 (선택)」으로 통일, textarea).

#### 히스토리·상세·복사
- **레퍼런스 허브**: `recordHistory`에 **갱신 전 state가 아닌** 실제 파싱 결과(`mergedForHistory`) 저장.
- **HistoryDetailBody** / **`copyHistoryAsRichText`**: 토너먼트·악마·SCAMPER·DNA·시장·경쟁·레퍼런스·ToT 등에 **`fb`(또는 ToT `context`)** 표시·마크다운 섹션 추가. 멀티 관점 상세 라벨 **「원하는 피드백 방향」** 통일.

#### 타겟 바(IP)
- **`TargetContext`**에 **`localGeoReady`** 추가; IP API 전부 실패 후에도 **`setLocalGeoReady(true)`**.
- **TargetBar**: 국가명 없을 때 준비 완료 후 **「이 기기 (국가 미확인)」** 표시(무한 「국가 확인 중」 방지).

### 관련 파일
- `src/App.jsx` — 상기 로직 대부분
- `vite.config.js` — `server.proxy`

---

## 2026-04-01 #7 — 토너먼트 UX 전면 개편 + 셔플 + 라운드별 탭

### 변경
- **토너먼트를 MODES 1번(메인)으로 배치**, `accent: true` 적용
  - 홈 화면에서 그라데이션 강조 카드 + MAIN 배지로 시각 구분
- **Fisher-Yates 셔플** 적용 (`fisherYatesShuffle()`)
  - 32개 아이디어 확보 후 **랜덤 대진** → 유저 아이디어가 초반에 몰리는 편향 제거
- **라운드별 탭 네비게이션** (32강 → 16강 → 8강 → 준결승 → 결승 → 결과)
  - 각 탭에 라운드 아이콘(⚔️🔥💎🌟👑) + 진출 인원 표시
  - 활성 탭 하이라이트, 라운드 컬러 코드 적용
- **MatchCard 컴포넌트** 분리: 접기/펼치기(아코디언) UX
  - 접힌 상태: 양쪽 아이디어 + 총점 + WIN 배지 (한 눈에 파악)
  - 펼친 상태: **5차원 바 차트**(세로 막대) + 세부 점수 + 판정 근거 전문
  - "모두 펼치기/접기" 버튼 추가
- **결과 탭** (🏆): 대형 트로피 + TOP 3 강조 + 최종 리포트
  - 1위 카드 금색 강조, 순위별 크기·색상 차별화
  - "새 토너먼트 시작" 버튼
- **AI 생성 아이디어** `<details>` 접기 처리 (메인 뷰 깔끔하게)
- **토너먼트 진행 방식 안내** 카드 추가 (입력 화면 상단)
- 진행 중 상태: 라운드명 + 이모지 뱃지 표시

---

## 2026-04-01 #6 — 토너먼트 심사 고도화 + 프로젝트 문서화

### 변경
- **토너먼트 심판 프롬프트 전면 교체**
  - 기존: 한 줄 형식(`Match 1: A - 이유`) → 파싱 실패 빈번, 이유가 1줄로 축약
  - 변경: **5대 심사 기준**(시장성·실현가능성·수익모델·차별화·임팩트) 10점 만점 채점 + 2~3문장 논리적 근거를 **JSON 한 줄**로 출력
  - `TOURNAMENT_MATCH_SYSTEM_KO` system 프롬프트에 세계 최고 수준 심사 기준 명시
- **브래킷 UI 개선**
  - 각 매치 카드에 **5차원 점수 바** + **총점(pt)** 표시
  - **판정 근거** 영역을 카드 하단에 전문 출력 (truncate 제거)
- **최종 리포트 프롬프트 강화**
  - 순위 분석 + 1위 실행 전략(3/6/12개월 마일스톤) + GTM 제안 포함
- `00_PROJECT_GUIDE.md` 생성: 프로젝트 구조·방향성·규칙·심사 기준 문서화
- `01_CHANGELOG.md` 생성: 전체 변경 히스토리

---

## 2026-04-01 #5 — 아이디어 DNA 맵 한국어 출력 수정

### 변경
- `DNA_MAP_SYSTEM_KO` 상수 추가: DNA 맵 호출 시 system을 한국어 전용 분석가로 덮어씀
- JSON 프롬프트 전면 재작성: 모든 문자열 값이 한국어만 포함되도록 스키마 예시까지 한국어로 명시
- 폴백(텍스트) 요청에도 동일 system 적용

### 원인
- 페르소나의 영어 system 프롬프트가 JSON 값까지 영어로 편향시킴

---

## 2026-04-01 #4 — 토너먼트 AI 슬롯 채우기 개선

### 변경
- `generateTournamentSlotIdeas()` 함수 신규: 8개씩 청크 요청, JSON→줄 목록 2단 폴백
- `TOURNAMENT_FILL_SYSTEM_KO` 한국어 전용 system 추가
- `parseIdeasLinesFromText()`, `safeParseIdeasJson()` 파서 추가
- 기존 `AI 아이디어 #n` 플레이스홀더 제거

### 원인
- 한 번에 28개를 번호 목록으로 요청 → 파싱 실패 시 빈 슬롯만 나옴

---

## 2026-04-01 #3 — 히스토리 기능 + GUI 대폭 개선

### 변경
- **히스토리 시스템** 추가 (localStorage, 최대 80건)
  - `RecordHistoryContext`: 각 모드가 분석 완료 시 자동 저장
  - `HistoryDrawer`: 오른쪽 슬라이드 패널 (목록·개별 삭제·전체 삭제)
  - `HistoryDetailModal`: 모드별 레이아웃으로 상세 결과 재확인
- **GUI 개선**
  - 다중 라디얼 그라데이션 배경
  - 상단 sticky 툴바 (브랜드 마크 + 히스토리/설정 버튼)
  - 모드 카드 호버 효과 강화 (그림자·테두리)

---

## 2026-04-01 #2 — SCAMPER 파서 개선

### 변경
- `parseScamperResponse()` 전면 재작성: 4단 폴백 파서
  - 줄 스캔 → 정규식 위치 스플릿 → 레거시 → `**` 스플릿
  - `—`, `:`, `：`, `．` 등 다양한 구분자 지원
- 파싱 완전 실패 시 `__full` 키로 원문 전체 표시

### 원인
- 모델별 마크다운 형식 차이로 `**S -` 패턴만으로는 7축 매칭 실패

---

## 2026-04-01 #1 — 초기 웹앱 구조 구성

### 변경
- `brainstorm-arena.jsx` → Vite + React 프로젝트로 전환
  - `package.json`, `vite.config.js`, `index.html`, `src/main.jsx`, `src/App.jsx`
- `run.bat` / `실행.bat` 실행 배치 파일 생성
- `vite.config.js`: `base` 조건 분기 (dev: `/`, build: `./`)
- `server.open: true` 추가로 dev 서버 준비 후 자동 브라우저 열기
