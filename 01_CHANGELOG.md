# Brainstorm Arena - Changelog

> 변경 사항을 **최신순**으로 기록합니다. 수정 시 맨 위에 추가하세요.

---

## 2026-04-07 #39-b — API 기능 문서화 · 프롬프트 스크립트 분리 · 하네스 엔지니어링 지침 CLAUDE.md 분리

### 변경

#### 신규 파일
- `02_API_FEATURES.md` 생성: 전체 12개 메뉴 + 리포트 애드온의 API 호출 기능 리스트, 프롬프트 빌더 함수 매핑, 프로바이더·레이트 리미터 정보 문서화
- `CLAUDE.md` 생성: 하네스 엔지니어링 지침을 독립 파일로 분리, Claude Code 매 작업 시 자동 로드 (복잡 버그 절차·fallback 금지·한국어 원칙·체크리스트 포함)

#### 리팩토링
- `src/prompts.js`: 인라인 AI 프롬프트 27개를 `buildXxx()` 빌더 함수로 분리·export (유저가 직접 편집 가능한 스크립트로 독립)
- `src/App.jsx`: `prompts.js` 빌더 함수 import 블록 추가 (실제 교체는 #39-a에서 완료)

#### 문서 갱신
- `00_PROJECT_GUIDE.md`: 섹션 10 추가 (CLAUDE.md 자동 반영 구조 명기), 폴더 구조에 `02_API_FEATURES.md`·`CLAUDE.md` 추가

### 파일 변경
- `02_API_FEATURES.md` (신규)
- `CLAUDE.md` (신규)
- `src/prompts.js` — 빌더 함수 27개 추가 (L551~696)
- `src/App.jsx` — import 블록 갱신
- `00_PROJECT_GUIDE.md` — 섹션 10 추가, 폴더 구조 업데이트

---

## 2026-04-07 #39-a — App.jsx 인라인 프롬프트 → prompts.js 빌더 함수로 전면 교체

### 변경

#### 리팩토링
- App.jsx의 모든 인라인 AI 프롬프트 문자열(27개)을 `src/prompts.js` 빌더 함수 호출로 교체
- 교체 대상: MultiAnalysis, Synthesis, DeepAnalysis, Tournament(Match/FinalReport), DevilAdvocate, Scamper, DnaMap(+Fallback), MarketValidation(+Fallback), CompeteScan, RefhubSearch, RefhubMore, MixWheel, MixReport, TotBranch, TotEval, TotSolution, PrototyperSynth, CompetitorMap, ExpertSearch, InvestorSearch, QuantumSim, FactCheck, RefineCopilot, DocumentSummary
- 프롬프트 수정 시 `src/prompts.js`만 편집하면 전체 반영

### 파일 변경
- `src/App.jsx`: 인라인 프롬프트 → 빌더 함수 호출 교체, LAST_UPDATED 갱신
- `src/prompts.js`: 변경 없음 (빌더 함수는 이전 커밋에서 이미 추가됨)

---

## 2026-04-07 #38 — 웹앱 프로토타이퍼: PROJECT_GUIDE.md 자동 생성 탭 추가

### 변경

#### 기능 추가
- 프로토타이퍼 결과 화면에 "마스터 프롬프트 / PROJECT_GUIDE.md" 탭 구조 추가
- PROJECT_GUIDE.md 탭: 생성된 프로젝트에 배치할 개발 지침 파일을 즉시 확인·복사·다운로드 가능
- Claude Code 사용자는 `CLAUDE.md`로 이름 변경 시 자동 참조됨을 안내

#### PROJECT_GUIDE.md 내용 (PROTOTYPER_PROJECT_GUIDE_TEMPLATE)
- **프로젝트 개요**: 프로젝트명(아이디어 제목)·UI 스킨·기술 스택 자동 주입
- **2.1 복잡한 버그 수정 절차**: 원인 파악→설명→합의→실행 필수 순서
- **2.2 fallback 분기 금지**: 크리티컬 경로 절대 금지, 허용 예외 범위 명시
- **2.3 코드 작성 원칙**: TypeScript strict, 컴포넌트 단일책임, 에러 명시적 노출
- **2.4 추가 금지 목록**: 요청 외 기능·추측 기반 에러 핸들링·레거시 호환 코드
- **3. 커밋 & PR 규칙**: 메시지 형식, PR 제목 70자 이내
- **4. 수정 체크리스트**: 6개 항목

#### UI 구성
- 탭 스위처: "📝 마스터 프롬프트" / "📋 PROJECT_GUIDE.md" (기존 UI 완전 호환)
- 가이드 탭: 코드블록 뷰어 + "📋 가이드 복사" 버튼 + "PROJECT_GUIDE.md 다운로드" 버튼
- 프로젝트명·스킨명은 `{{TITLE}}`, `{{SKIN}}` 플레이스홀더로 동적 치환

### 파일 변경
- `src/prompts.js` — `PROTOTYPER_PROJECT_GUIDE_TEMPLATE` 상수 추가
- `src/App.jsx` — `PROTOTYPER_PROJECT_GUIDE_TEMPLATE` import, `WebAppPrototyper`에 `activeTab`·`copiedGuide`·`guideContent`·`copyGuideToClipboard` 추가, result 탭 UI 재구성

---

## 2026-04-06 #37 — 스트리밍 출력 영역 높이 60vh 제한 (모바일 최적화)

### 변경

#### 문제
- `StreamingRichText` 컴포넌트의 출력 영역이 고정 px 값(520px~600px)으로 설정되어 9:16 모바일 디바이스 화면의 80% 이상을 점유 → 가독성 저하

#### 수정
- `STREAM_HEIGHTS` 상수를 고정 px → CSS `min()` 함수 기반으로 변경
  - `card`: `520px` → `min(520px, 60vh)`
  - `synth`: `600px` → `min(600px, 60vh)`
  - `tot`: `540px` → `min(540px, 60vh)`
  - `compact`: `360px` → `min(360px, 48vh)`
  - `chat`: `320px` → `min(320px, 42vh)`
- PC(뷰포트 높이 900px 이상)에서는 기존 px 한도 유지, 모바일에서 화면의 약 60% 이하로 자동 제한

### 파일 변경
- `src/App.jsx` — `STREAM_HEIGHTS` 값 `min(px, vh)` 형식으로 교체

---

## 2026-04-06 #36 — 아카이브 저장 시 아이디어 스택 자동 동기화

### 변경

#### 기능 추가
- 아카이브 저장(`ArchiveSaveModal`) 시 payload에서 아이디어를 추출해 아이디어 스택에 자동 적재
- 각 메뉴별 아이디어 입력창 "불러오기"에서 아카이브에 저장된 아이디어도 확인 가능

#### 모드별 추출 로직 (`extractIdeasFromArchivePayload`)
- **tournament**: `finalTop`(수상 아이디어) + `seedIdeas`(입력 아이디어) + `aiIdeas`(AI 생성 아이디어)
- **hyperniche**: `input` + `ideas` 배열
- **mixroulette**: `combined_concept` + `leftItems` + `rightItems`
- **나머지 (analyze, devil 등)**: `idea` / `input` / `ideasText`

#### 중복 방지
- `extractIdeasFromArchivePayload` 내부 `Set`으로 1차 중복 제거
- `addToIdeaStack()`의 기존 대소문자 무시 비교로 2차 중복 방지

### 파일 변경
- `src/App.jsx` — `extractIdeasFromArchivePayload` 헬퍼 함수 추가, `ArchiveSaveModal.save()`에 스택 적재 로직 삽입

---

## 2026-04-06 #35 — 토너먼트 라운드 전환 알럿 (라운드 완료 → 다음 라운드 안내)

### 변경

#### 문제
- 토너먼트 각 라운드(32강·16강·8강·준결승·결승) 완료 후 피드백 없이 즉시 다음 라운드가 시작 → 사용자 경험 단절

#### 추가 기능
- 각 라운드 종료 후 2.8초 동안 중앙 오버레이 알럿 표시
  - 헤더: 라운드 이모지 + 라운드명 + "완료" + 진출자 수
  - 승자 목록: 각 승자가 ✓ 체크와 함께 stagger fade-in (0.07초 간격)
  - 다음 라운드 안내: 하단에 `{emoji} {다음라운드명} 진행` 배지
- 오버레이 배경: `backdrop-filter: blur(8px)` 처리로 집중감 부여
- 마지막 라운드(결승) 이후에는 오버레이 미표시

#### 구현
- `roundSummary` 상태 추가 (`{ roundName, winners, nextRoundName, emoji, color, nextEmoji, nextColor }`)
- 기존 `setTimeout(1500~2500)` 대기를 `setRoundSummary` 오버레이 표시 + 2800ms 대기로 교체

### 파일 변경
- `src/App.jsx` — `roundSummary` state 추가, `go()` 라운드 전환 로직 수정, Tournament JSX에 오버레이 렌더링 추가

---

## 2026-04-06 #34 — 믹스업 룰렛 좌우 컬럼 Y좌표 정렬 수정 (모바일)

### 변경

#### 원인
- 좌측 컬럼 헤더: `idea-stack-toolbar` (라벨 + "📋 전체 불러오기" 버튼) — 모바일(~157px 컬럼 폭)에서 버튼이 2번째 줄로 wrap → 헤더 ~53px
- 우측 컬럼 헤더: 라벨 단독 1줄 → ~20px
- 결과: 좌측 wheel이 우측 wheel보다 ~33px 아래에서 시작 (시각적 틀어짐)

#### 수정
- 양쪽 컬럼 헤더를 `.mix-wheel-col-header` 래퍼로 통일
  - 데스크톱: `flex-direction: row; min-height: 40px` — 라벨+버튼 가로 배치
  - 모바일: `flex-direction: column; min-height: 58px; justify-content: center` — 두 컬럼 모두 58px 고정 → wheel 시작 Y 일치
- `.mix-load-btn`: 모바일에서 "📋 (N)" 축약 표시 (`mix-load-btn-text` 텍스트 숨김)
- 모바일 `.mix-center-indicator { top: calc(50% + 6px) }` — 헤더 높이 반영 보정

### 파일 변경
- `src/App.jsx` — 좌측 헤더 `idea-stack-toolbar` → `mix-wheel-col-header`, 우측 라벨 동일 래퍼로 감쌈, `mix-load-btn-text` span 추가, LAST_UPDATED 갱신
- `src/styles.js` — `.mix-wheel-col-header`, `.mix-load-btn`, `.mix-load-btn-text` 신규 CSS, 모바일 미디어쿼리 보정

---

## 2026-04-06 #33 — 백그라운드 완료 토스트 카드 UI 전면 재설계 (모바일 최적화)

### 변경

#### ① 토스트 레이아웃 2줄 카드 구조로 재설계
- 기존: 아이콘 + 긴 단일 텍스트("모드 완료 — 타이틀") → 모바일에서 어색한 줄바꿈
- 변경: 아이콘 서클 + **상단 라벨** (모드명 완료, 11px) + **하단 타이틀** (13.5px bold, ellipsis 처리) + → 화살표
- `setToast`에 `{ icon, modeName, title }` 필드 분리 저장 (단일 문자열 → 구조화)

#### ② CSS 모바일 최적화
- `left: 50%; transform: translateX(-50%)` → `left: 16px; right: 16px; max-width: 400px; margin: 0 auto` (모바일 전폭 활용)
- `bottom: max(28px, env(safe-area-inset-bottom) + 16px)` — 노치/홈바 기기 safe-area 대응
- 배경 `#1a1a2e` 다크 카드 + 반투명 blur + 미세 테두리 (glass-morphism 감성)
- 아이콘 영역: 36×36 초록 라운드 박스 (`border-radius: 12px`)
- `:active { transform: scale(0.97) }` 터치 피드백
- `.toast-alert-title`: `white-space: nowrap; overflow: hidden; text-overflow: ellipsis` — 긴 제목 자동 말줄임

#### ③ `app-toast` 애니메이션 이름 충돌 수정
- `@keyframes toastIn` 중복 → `.app-toast`용 `@keyframes appToastIn`으로 분리

### 파일 변경
- `src/App.jsx` — `completeTask` toast 데이터 구조화, toast JSX 재설계, LAST_UPDATED 갱신
- `src/styles.js` — `.toast-alert` 전면 재작성, `.toast-alert-icon/body/label/title/nav` 신규 클래스, `appToastIn` keyframe

---

## 2026-04-06 #32 — 웹앱 프롬프트 생성 결과 분석히스토리 저장 · 아카이브 프롬프트 이력 뷰어 · CSS 히스토리 버튼 스타일

### 변경

#### ① 웹앱 프롬프트 결과 → 분석 히스토리 자동 저장
- `_startProtoGeneration`에 `onResult(raw, skinKey)` 콜백 파라미터 추가
- `WebAppPrototyper`가 생성 완료 시 `recordHistory`를 호출해 modeId `"prototyper"` 엔트리로 분석히스토리에 자동 저장
- `ArchiveView`에서 `recordHistory = useRecordHistory()` + `onProtoSaved` 콜백 배선

#### ② 아카이브 아이템 — 웹앱 프롬프트 이력 뱃지·뷰어
- 아카이브 카드에 `item.payload?._proto` 존재 시 "📱 프롬프트 이력" 버튼 노출 (`archive-proto-history` 클래스)
- `ProtoHistoryModal` 컴포넌트 신설: 원본/렌더링 토글, 마크다운 복사, .md 다운로드, 🔄 새 스킨으로 재생성
- 인디고 그라디언트 스타일(`archive-proto-history` CSS 규칙) 추가

#### ③ HistoryDetailBody — prototyper modeId 브랜치
- 분석히스토리 팝업에서 prototyper 항목 선택 시 소스 아카이브 제목·아이디어·프롬프트 결과 표시
- `extractReportFromPayload`에 prototyper 케이스 추가

#### ④ 아카이브 눈동자 팝업 안정화
- viewItem 팝업에서 `HistoryDetailBody`, `SavedAddonsDisplay`, `DeepAnalysisPanel`, `ReportTools` 오류 케이스 점검
- `extractReportFromPayload` prototyper 분기로 복사/내보내기 기능 정상화

### 파일 변경
- `src/App.jsx` — ProtoHistoryModal, ArchiveView recordHistory 배선, HistoryDetailBody prototyper 분기, extractReportFromPayload 수정, LAST_UPDATED 갱신
- `src/styles.js` — `.archive-proto-history` CSS 규칙 추가

---

## 2026-04-06 #31 — 분석히스토리·아카이브 팝업 3단 레이아웃 재설계 · 모바일 바텀시트 · 도구 하단 고정

### 변경

#### ① 팝업 flex 레이아웃 근본 수정 (footer 사라짐 버그)
- **원인**: `flex: 1 1 auto` 스크롤 영역의 flex-basis=콘텐츠 높이 → 리포트가 길면 footer가 비례 축소되어 사라짐
- **수정**: `flex: 1 1 0` (basis=0)으로 변경 → footer 크기 먼저 확보 후 남은 공간 전부 스크롤이 차지
- `history-detail-footer`: `flex: 0 1 auto` → `flex: 0 0 auto` (footer 절대 고정, 수축 불가)
- `max-height: 55%` → `max-height: 46vh` (뷰포트 기준으로 안정화)

#### ② 모바일 바텀시트 레이아웃 전환
- 오버레이 `align-items: flex-end` + 패널 `border-radius: 16px 16px 0 0` → 네이티브 바텀시트 감성
- 패널 상단 드래그 핸들(`.history-detail-handle`), 도구 영역 상단 구분 그랩 바 추가
- 모바일 `min-height: 30vh` 스크롤 보장 + 푸터 `max-height: 42vh`
- `100dvh` + `safe-area-inset-bottom` 지원으로 노치/홈바 기기 대응

#### ③ 데스크톱: 중앙 플로팅 패널 유지
- `min-width: 1024px`에서 오버레이 `align-items: center; padding: 24px` → 기존 중앙 정렬 복원
- 드래그 핸들 숨김, `border-radius: 16px` 전체 둥근 모서리
- 분석히스토리·아카이브 팝업 동일하게 적용

### 파일 변경
- `src/styles.js` — history-detail 3단 flex 구조, 모바일/데스크톱 분기, 드래그 핸들
- `src/App.jsx` — HistoryDetailModal·ArchiveView 팝업 JSX 핸들 추가, 인라인 style 제거

---

## 2026-04-05 #30 — PC/데스크톱 반응형 스케일업 · ViewportProvider 코드 구조 개선

### 변경

#### ① PC 웹브라우저 폰트/레이아웃 스케일업
- `min-width: 1024px` 데스크톱 미디어 쿼리 신설 (40+ 요소 조정)
  - 기본 font-size 15px → 16px, line-height 1.65 → 1.7
  - 히어로: h1 40px, p 17px / 모드카드: name 17px, desc 14px, icon 52px
  - 입력필드: font 16px, padding 증가 / CTA 버튼: 16px, min-height 54px
  - 리포트 카드: title 16px, padding 22px / 히스토리: title 14px
  - 설정 모달·코파일럿·프로토타이퍼·브라켓 등 전면 스케일업
- `min-width: 1280px` 와이드 데스크톱 쿼리 추가
  - app-shell max-width 980px / 히어로 h1 44px / 모드카드 name 18px
  - 리포트 카드 title 17px / 히스토리·설정 모달 폭 확대
- 기존 `min-width: 640px` 태블릿 쿼리와 계층적으로 동작

#### ② ViewportProvider 반응형 상태 관리 인프라
- `ViewportContext` + `useViewport()` 훅 추가 (`isDesktop`, `isMobile`, `width`)
- `ViewportProvider`가 App 최상위를 감싸 모든 컴포넌트에서 접근 가능
- `requestAnimationFrame` 기반 resize 디바운싱으로 성능 최적화
- 향후 PC/모바일 이원화 로직(조건부 렌더링, 레이아웃 분기) 즉시 적용 가능

### 파일 변경
- `src/styles.js` — `@media (min-width: 1024px)`, `@media (min-width: 1280px)` 블록 추가
- `src/App.jsx` — `ViewportProvider`/`useViewport` 훅, App return에 Provider 래핑

---

## 2026-04-04~05 #29 — SCAMPER 스트리밍 · 프로토타이퍼 스트리밍 · 애드온 캐시 · SCAMPER 프리미엄 UI · YouTube/웹 추출 재설계

### 변경

#### ⓪-b 웹 URL 본문 추출 4단 폴백 엔진 재설계
- **Jina Reader API** (`r.jina.ai`) 1차 적용: CORS OK, 무료 20RPM, JS 렌더링(SPA/Notion) 지원, 마크다운 반환
- **Microlink API** 2차 폴백: 구조화된 메타데이터 + 본문 추출
- **Reddit JSON** 전용 경로: `.json` URL 우회로 게시글 + 상위 댓글 5개 추출
- **CORS 프록시 + Readability.js** 3차 폴백: Mozilla 리더모드 엔진 + 수동 시맨틱 추출
- Google AMP URL 자동 변환, OG 메타(제목·사이트명·작성자) 수집
- AI 프롬프트 개선: 본문 요약 + 8개+ 실행 가능한 아이디어(서비스·타겟·수익 모델)

#### ⓪ YouTube 영상 정보 추출 근본 재설계
- Invidious API (5개 인스턴스) → Piped API (3개 인스턴스) → YouTube HTML 파싱 → noembed 순 다중 폴백
- `ytInitialPlayerResponse` JSON 파싱으로 제목·설명·자막 URL 추출
- 자막: 한국어 우선 → 영어/일본어 → 첫 번째 트랙 순 자동 선택
- VTT/XML 자막 포맷 모두 파싱, 키워드/태그 정보도 수집
- AI 프롬프트 개선: 자막 전문 분석 시 8개+ 아이디어(서비스 형태·타겟·수익 모델 포함)

#### ① SCAMPER 확장 기능 응답 없음 수정 + 스트리밍 전환
- `callAI` → `callAIStream`(maxTokens: 8000)으로 전환, 실시간 스트리밍 표시
- `parseScamperResponse()` 멀티 전략 파서로 7축 분리 파싱

#### ② 프로토타이퍼 마스터프롬프트 합성 타임아웃 수정
- `callAI` → `callAIStream`(maxTokens: 16000, timeoutMs: 300초)으로 전환
- 스트리밍 중간 결과 표시 (`StreamingRichText` + 문자 수 카운터)
- 오류 시 200자 이상 수신된 부분 결과 복원

#### ③ 애드온(추가분석도구) 결과 아카이브 저장 연동
- `_addonCache` 모듈 레벨 캐시로 세션 내 애드온 결과 보존
- `SaveToArchiveBtn` · `ArchiveSaveModal`에서 저장 시 `_addons` 필드로 payload에 병합
- `SavedAddonsDisplay` 컴포넌트: 아카이브/히스토리 팝업에서 저장된 애드온 결과 표시

#### ④ 아카이브 저장 모달 z-index 수정
- `.archive-save-modal` z-index 200 → 230 (히스토리 팝업 위에 표시)

#### ⑤ 토너먼트 라운드명 동적 표시
- 8강/16강 모드에서도 "32강" 표시되던 문제 → 실제 라운드명으로 동적 생성

#### ⑥ SCAMPER 프리미엄 카드 UI 리디자인
- 7축별 고유 색상 + 아이콘 박스 + 레터 뱃지 + 그라데이션 코너 + surface-2 콘텐츠 영역
- 라이브 결과·히스토리 팝업·아카이브 팝업 모두 동일 프리미엄 디자인 적용

### 파일 변경
- `src/App.jsx` — SCAMPER/프로토타이퍼 스트리밍, 애드온 캐시, z-index, 토너먼트 라운드명, SCAMPER 프리미엄 UI, YouTube/웹 분석 프롬프트 개선
- `src/api.js` — `callAIStream` options, YouTube 다중 API, 웹 Jina Reader/Microlink/Reddit JSON/Readability 4단 폴백
- `src/styles.js` — `.archive-save-modal` z-index, `.proto-loading-phase` 레이아웃
- `package.json` — `@mozilla/readability` 의존성 추가

---

## 2026-04-04 #28 — 팝업 스크롤 배경 전파 차단 · 팝업 내부 스크롤 UX 안정화

### 변경

#### ① 팝업 휠 스크롤이 배경 홈화면을 움직이는 문제 수정
- `HistoryDetailModal` / 아카이브 상세 팝업 열릴 때 `document.body.style.overflow = "hidden"` 처리
- 팝업 닫힐 때 기존 overflow 값 복원
- `.history-detail-overlay`에 `overflow: hidden` 추가

#### ② 스크롤 체이닝(scroll chaining) 차단
- `.history-detail-scroll`, `.history-detail-footer`에 `overscroll-behavior: contain` 적용
- 내부 스크롤이 끝에 도달해도 이벤트가 배경으로 전파되지 않음

### 파일 변경
- `src/App.jsx` — HistoryDetailModal, ArchiveView에 body overflow lock useEffect 추가
- `src/styles.js` — overlay overflow, scroll/footer overscroll-behavior

---

## 2026-04-04 #27 — 토너먼트 최종리포트 볼드 버그 수정 · 전체 리포트 스트리밍 리팩토링 · 출력 영역 고정 높이

### 변경

#### ① 토너먼트 최종 리포트 **bold** 텍스트 누락 버그 수정
- `App.jsx:2113` `.replace(/\*\*/g, "")` 제거 — AI 응답의 마크다운 볼드가 통째로 제거되던 원인

#### ② `callAIStream()` 전체 스트리밍 함수 신규 추가 (`api.js`)
- Claude SSE (`content_block_delta`), OpenAI stream (`choices[0].delta.content`), Gemini `streamGenerateContent?alt=sse` 3종 지원
- `onChunk(delta, fullText)` 콜백으로 호출자가 실시간 state 업데이트
- 오류 발생 시 기수신 텍스트 부분 반환

#### ③ `generateReportSectionStream()` 추가 (`api.js`)
- 리포트 섹션(전략·재무·리서치 등) 스트리밍 래퍼

#### ④ `StreamingRichText` 컴포넌트 전면 재설계 (`App.jsx`)
- 타자기 커서 애니메이션 (`stream-cursor`)
- 사용자 스크롤 감지 후 자동 스크롤 일시 중단 / 하단 복귀 시 재개
- `variant` prop으로 맥락별 높이 제어 (card 520px / synth 600px / tot 540px / chat 320px / compact 360px)
- 외부 스크롤 컨테이너 **인라인 스타일**로 max-height 보장 (CSS 우선순위 우회)

#### ⑤ 스트리밍 적용 범위
멀티퍼스펙티브 · 토너먼트 최종리포트 · 악마의변호인 · 시장분석(웹검색+폴백) · 경쟁스캔 · ToT 딥다이브 Phase 3 · 브랜드바이럴 · 리포트애드온 · 리포트챗

### 파일 변경
- `src/App.jsx` — StreamingRichText 재설계, 스트리밍 변환, LAST_UPDATED
- `src/api.js` — callAIStream, generateReportSectionStream (+137줄)
- `src/styles.js` — streamCursorBlink, .stream-cursor, .srt-scroll, .streaming-richtext (+42줄)

---

## 2026-04-04 #26 — 백그라운드 박스 그리드 정렬 · 토너먼트 아이디어별 아카이브 · API 키 미설정 차단 일관화

### 변경

#### ① 백그라운드 박스 그리드 정렬 수정
- 프로토타이퍼 백그라운드 생성 중 표시되는 박스 레이아웃 그리드 정렬 개선

#### ② 토너먼트 아이디어별 아카이브 저장
- 토너먼트 진행 시 각 아이디어를 아카이브에 자동 저장하는 기능 추가

#### ③ API 키 미설정 차단 일관화
- 모든 분석 모드에서 API 키가 없을 경우 일관된 방식으로 차단 및 안내 메시지 출력
- 기존 모드별 개별 처리 → 공통 `requireApiKey()` 패턴으로 통일

### 파일 변경
- `src/App.jsx` — 백그라운드 박스, 토너먼트 아카이브, API 키 차단 일관화

---

## 2026-04-03 #25 — 안정성 리팩토링 · API 방어 강화 · 특수 모드 설정 정합성 보강

### 변경

#### ① 특수 페르소나 설정 정합성 보강
- `resolveTotPersona`, `resolveUtilPersona`, `resolveMixPersona` 반환값에 `hasKey`, `provName` 추가
- 저장된 provider/model 조합이 현재 스택과 맞지 않을 경우 자동 정규화
- `loadSettings()`에서 ToT·Mix·Util 설정을 provider별 유효 모델로 보정

#### ② API 호출/예외 처리 공통화
- `callAI()`의 공급자별 응답 파싱과 오류 메시지 구조 정리
- 타임아웃·네트워크 오류·빈 응답·비 JSON 응답 처리 강화
- `safeParseJsonText()` 추가로 모드별 JSON 파싱 방어 로직 공통화
- `fetchViaProxy` export로 웹 URL 분석 기능의 런타임 오류 제거
- `processImageWithVision()`을 공통 fetch/parse 정책에 맞춰 정리

#### ③ 상태 관리 및 비동기 방어 강화
- `ReportChat` 크레딧 부족 시 loading 상태가 고정되던 문제 수정
- `HyperNicheExplorer` 실패 응답 history 기록 누락/stale 상태 문제 수정
- `ModeTaglineRoller`, `QuoteRoller`, `useBackgroundTasks` timeout cleanup 보강
- IP 국가 감지 effect에서 unmount 이후 state update 가능성 방어

#### ④ 로그/스토리지 안정성 강화
- `logger.js`에 순환 참조·Error 객체 안전 직렬화 추가
- `loadCredits()`의 NaN/음수 방어 및 저장 헬퍼 예외 처리 강화
- history/archive/stack 계열 localStorage helper를 안전 로드/저장 구조로 정리
- 테스트용 전체 데이터 삭제 루틴에서 onboarding key 정리 안정화

#### ⑤ 유지보수성 개선
- `App.jsx` 반복 JSON 파싱을 공통 유틸 기반으로 정리
- 안전하지 않은 깊은 복사 패턴을 `safeJsonClone()`으로 대체
- 시장 검증 1차 웹검색이 `investor` 페르소나 키를 우선 사용하도록 수정
- `LAST_UPDATED` 갱신

### 파일 변경
- `src/constants.js` — 설정 정규화, 특수 persona resolver 보강, storage/helper 안정화
- `src/api.js` — 공통 JSON 파서, `callAI` 예외 처리 정리, `fetchViaProxy` export, vision/toast 안정화
- `src/logger.js` — 안전 직렬화 로거
- `src/App.jsx` — 런타임 오류 수정, 비동기 cleanup, history/loading/state 흐름 개선

---

## 2026-04-03 #24 — 프로토타이퍼 뷰포트 수정 · 백그라운드 근본 재설계 · 진행 상태 UI

### 변경

#### ① 프로토타이퍼 오버레이 뷰포트 깨짐 수정
- `.proto-overlay`에 `max-width: 860px; left: 50%; transform: translateX(-50%)` 적용
- fadeIn/fadeOut 키프레임도 translateX(-50%) 유지하도록 수정
- 9:16 모바일 뷰포트 내에서 정상 표시

#### ② 백그라운드 생성 로직 근본 재설계
- 생성 로직을 React 컴포넌트 밖 `_startProtoGeneration()` 독립 함수로 분리
- Promise 기반 `.then()/.catch()` — 컴포넌트 unmount와 무관하게 완료까지 진행
- `_protoGen.listeners` 이벤트 시스템 + `useProtoGenState()` 훅으로 반응형 상태 구독
- ideaText 2000자 클리핑으로 과도한 입력 방지
- 백그라운드 실패 시 `showAppToast`로 에러 알림 (기존: 무응답)

#### ③ 아카이브 항목 진행 상태 표시
- 생성 중: "🔄 웹앱 프롬프트 생성중…" (펄스 애니메이션)
- 완료: "✅ 결과 보기" 버튼 (초록)
- 미시작: 기존 "🚀 웹앱 프롬프트"

#### ④ 홈 아카이브 카드 작업중 배지
- `bgTasks.tasks["prototyper"]` 상태를 아카이브 카드에 연동
- 프로토타이퍼 백그라운드 진행 시 아카이브 카드에 "작업중" 배지 표시

### 파일 변경
- `src/App.jsx` — _startProtoGeneration, useProtoGenState, ArchiveView 진행표시, HomeScreen 배지
- `src/styles.js` — proto-overlay 뷰포트, archive-proto-running, protoFadeIn/Out 키프레임

---

## 2026-04-03 #23 — 아카이브→프로토타이퍼 백그라운드 생성 완전 지원 · 에러 수정

### 변경

#### ① 프로토타이퍼 진정한 백그라운드 생성
- 모듈 레벨 `_protoGen` 캐시 도입: 컴포넌트 unmount 후에도 AI 생성이 계속 진행
- "마스터 프롬프트 합성 중" 단계에 **"🏠 백그라운드에서 계속 — 완료 시 알림"** 버튼 추가
- 버튼 클릭 시 오버레이 닫히지만 생성은 백그라운드 진행, 완료 시 토스트 알림
- 아카이브에서 같은 항목 재진입 시 캐시된 결과 자동 복원 또는 진행 중 상태 폴링

#### ② ideaText 추출 개선 (프롬프트 생성오류 해결)
- `p.input` (하이퍼니치), `p.ideasText` (DNA), `p.ctx` (토너먼트) 등 다양한 payload 형식 지원
- 기존 `extractIdeaFromPayload`와 동일한 커버리지로 아카이브 항목 호환성 강화

### 파일 변경
- `src/App.jsx` — `_protoGen` 캐시, mountedRef, 폴링 effect, ideaText 확장, 백그라운드 버튼
- `src/styles.js` — `.proto-bg-btn` 스타일

---

## 2026-04-03 #22 — OpenAI 빈 응답 수정 · 안드로이드 파일 피커 · 프로토타이퍼 백그라운드

### 변경

#### ① OpenAI gpt-5.4 "AI 응답이 비어있습니다" 오류 수정
- `api.js`: `tokenLimit`을 `isOSeries`뿐 아니라 `isNewModel`(gpt-4.1, gpt-5.x 등)도 16000으로 설정
- 원인: gpt-5.4가 `max_completion_tokens: 4000`에서 reasoning_tokens에 전부 사용, 실제 출력 0
- 시장 검증 · 웹앱 프로토타이퍼 모두 해결

#### ② 안드로이드 파일 피커 카메라만 뜨는 문제
- `DOCUMENT_ACCEPT`를 `"*/*"`로 변경하여 파일 관리자가 직접 열리도록 수정
- JS 단에서 `ALLOWED_DOC_EXTS` 배열로 파일 확장자 검증 추가 (pdf, ppt, pptx, xls, xlsx, csv + 이미지)
- 지원하지 않는 파일 선택 시 안내 alert 표시

#### ③ 웹앱 프로토타이퍼 백그라운드 처리
- `useTaskNotify("prototyper")` 통합
- 생성 시작 시 `notifyStart()`, 완료 시 `notifyDone()` 호출
- `EXTRA_MODE_LABELS`로 토스트 알림에 아이콘·이름 표시 ("🚀 웹앱 프로토타이퍼 완료")

### 파일 변경
- `src/api.js` — tokenLimit 조건 수정
- `src/App.jsx` — 파일 피커 accept 변경, doc 검증 로직 추가, 프로토타이퍼 백그라운드 태스크

---

## 2026-04-03 #21 — 모바일 6개 버그 수정

### 변경

#### ① 국가 탭 "아시아" 말림
- `.target-chip-group` `overflow: hidden` → `overflow-x: auto; overflow-y: hidden`
- 스크롤바 숨김(`scrollbar-width: none`) + `-webkit-overflow-scrolling: touch`

#### ② 갤럭시 파일 불러오기 (PPT/엑셀 등)
- `DOCUMENT_ACCEPT` MIME 타입 제거, 확장자 전용으로 변경 (`.pdf,.ppt,.pptx,.xls,.xlsx,.csv`)
- Android 미디어 피커 대신 파일 관리자 직접 오픈
- `IMAGE_ACCEPT` 도 `image/*` → 명시적 MIME 타입으로 변경

#### ③ 홈 하단 MOJITO Labs 푸터 사라짐
- `.footer` CSS에서 `position: relative; z-index: -1` 제거
- 푸터가 다른 요소 뒤에 숨겨지던 문제 수정

#### ④ 시장검증 오류 "폴백도 비어있음"
- `api.js` Claude 응답 파싱 개선: `text` 타입 블록만 필터링 → 비 text 블록(thinking 등)이 빈 값 반환하던 문제 수정
- `stop_reason: max_tokens`일 때 명시적 한국어 오류 메시지 제공
- 폴백 로직에 `apiKey` 존재 여부 사전 체크 추가
- 폴백 빈 응답 시 메시지 명확화

#### ⑤ 웹앱 프로토타이퍼 내용 미표시
- api.js 동일 수정으로 Claude 응답 text 블록 필터링 해결
- `generatePrompt`에서 빈 `raw` 체크 추가 → 빈 결과 시 스킨 선택 화면으로 복귀 + 에러 알림
- `.proto-code-content` CSS에 `color: #cdd6f4` 명시 (상속 의존 제거)

### 관련 파일
- `src/App.jsx`, `src/api.js`, `src/styles.js`

---

## 2026-04-03 #20 — 설정 모달 최종 업데이트 시점 표기 + 프로젝트 규칙 정의

### 변경
- `src/App.jsx` 상단에 `LAST_UPDATED` 상수 추가 (`"2026-04-03 15:20"`)
- 설정 모달 하단에 "최종 업데이트 YYYY-MM-DD HH:MM" 표기 영역 추가
- `00_PROJECT_GUIDE.md` 섹션 7 신설: 업데이트 시점 표기 규칙 (위치·형식·갱신 규칙·코드 위치)
- 수정 시 체크리스트에 `LAST_UPDATED` 갱신 항목(#6) 추가
- 기존 섹션 8(향후 확장) → 섹션 9로 번호 조정

### 관련 파일
- `src/App.jsx`
- `00_PROJECT_GUIDE.md`
- `01_CHANGELOG.md`

---

## 2026-04-03 #19 — 추가 분석 도구 GUI 전면 리디자인

### 변경

#### DeepAnalysisPanel 접이식 래퍼 신설
- 기존 5개 분산 컴포넌트(ReportAddonSection, CompetitorMapSection, InvestorSearchSection, ExpertSearchSection, QuantumSimCTA)를 하나의 접이식 패널로 통합
- 그라디언트 토글 버튼 + 아이콘으로 깔끔한 진입점 제공
- 12개 이상 호출부를 `<DeepAnalysisPanel />` 1개로 교체

#### 분석 옵션 카테고리화
- REPORT_ADDONS에 `desc` 추가, `ADDON_CATEGORIES`로 그룹 분리
- "전략 & 브랜딩" (3개) / "재무 & 리서치" (4개) / "탐색 & 시뮬레이션" (3개+퀀텀) 구분
- 카테고리별 컬러 도트 + 라벨 헤더로 시각적 정리

#### 버튼 카드형 리디자인 (CSS)
- `.report-addon-grid`: flex-wrap → 2열 grid (모바일 1열 반응형)
- `.report-addon-btn`: 칩형 → 카드형 (아이콘+라벨+설명, min-height 52px)
- hover 시 translateY(-1px) + box-shadow 미세 애니메이션
- active 상태: 그라디언트 배경으로 시각 피드백 개선
- 독립 버튼(지도/투자/전문가)에 `.full-width` + `addon-desc` 통일

#### 결과 출력 영역 개선
- `.report-scroll-box` max-height: 60vh → 75vh(데스크탑), 65vh(모바일)
- 결과 카드 헤더 전체 클릭으로 접기/펼치기 (▲ 버튼 → ▾ 회전 아이콘)
- `.addon-result-header` hover 효과 + 28px 히트 영역

#### UX 피드백 보강
- 다른 분석 진행 중 클릭 시 토스트 알림 표시 (기존: 무반응 차단)
- `Fragment` import 추가 (카테고리 그룹 렌더링용)

### 관련 파일
- `src/App.jsx`
- `src/styles.js`

---

## 2026-04-03 #18 — 모바일 불러오기 패널 키보드 자동 팝업 제거

### 변경
- `App.jsx` 1823번째 줄 `IdeaStackPopover` 내 검색 입력창에서 `autoFocus` 속성 제거
- 불러오기 패널 열릴 때 키보드가 자동으로 올라오던 문제 수정
- 이제 사용자가 검색창을 직접 탭할 때만 키보드 트레이 노출

### 관련 파일
- `src/App.jsx`

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
