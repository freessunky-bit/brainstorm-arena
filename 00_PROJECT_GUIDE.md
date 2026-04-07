# Brainstorm Arena - Project Guide

> **이 문서는 어떤 AI 작업 환경으로 이동하더라도 프로젝트 컨텍스트를 유지하기 위해 작성되었습니다.**
> 코드 수정 전 반드시 이 문서를 읽고, 수정 후에는 `01_CHANGELOG.md`에 기록하세요.

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **이름** | Brainstorm Arena |
| **목적** | AI 기반 멀티 관점 아이디어 검증 웹앱 |
| **기술 스택** | React 19 + Vite 6 (단일 `src/App.jsx` SPA) |
| **언어** | UI·프롬프트·결과 모두 **한국어** 기본 |
| **외부 API** | Claude (Anthropic), GPT (OpenAI), Gemini (Google) |
| **데이터 저장** | `localStorage` (히스토리·페르소나·글로벌/ToT 설정 등, 히스토리 최대 80건) |
| **빌드 결과** | `dist/` (정적 파일, 더블클릭 실행 가능) |

---

## 2. 폴더 구조

```
brainstrom/
├── 00_PROJECT_GUIDE.md   ← 이 문서 (프로젝트 가이드)
├── 01_CHANGELOG.md       ← 변경 이력
├── 02_API_FEATURES.md    ← API 호출 기능 전체 리스트
├── CLAUDE.md             ← 하네스 엔지니어링 지침 (Claude Code 자동 반영)
├── index.html            ← Vite 진입점 (dev server용)
├── package.json          ← 의존성 (react, react-dom, vite)
├── vite.config.js        ← Vite 설정 (dev: base="/", build: base="./")
├── run.bat               ← 실행 배치 (ASCII only)
├── 실행.bat              ← run.bat 호출 래퍼
├── src/
│   ├── main.jsx          ← React 엔트리 (createRoot)
│   ├── App.jsx           ← 앱 셸 + 전체 컴포넌트 (~6,000줄)
│   ├── logger.js         ← 앱 로거 (LOG 객체)
│   ├── constants.js      ← PROVIDERS, PERSONAS, MODES, 저장키, 크레딧, 유틸 헬퍼
│   ├── api.js            ← callAI, 레이트 리미터, 토스트, 문서 파싱, YouTube
│   ├── styles.js         ← Toss-Style CSS 전체 (~2,500줄)
│   └── prompts.js        ← AI 시스템/유저 프롬프트 전체
├── dist/                 ← 빌드 산출물
└── node_modules/
```

### 2.1 모듈 의존성 (import 방향)
```
main.jsx → App.jsx → constants.js, api.js, styles.js, prompts.js, logger.js
api.js → constants.js, prompts.js, logger.js
constants.js → (독립)
logger.js → (독립)
styles.js → (독립)
prompts.js → (독립)
```

---

## 3. 핵심 모드 (요약)

| 모드 ID | 홈 표시명 | 비고 |
|---------|------------|------|
| `tournament` | 아이디어 토너먼트 | 32강·5차원 심사 |
| `tot` | ToT 딥 다이브 | 설정에서 ToT 전용 API (멀티 패널과 별도) |
| `analyze` | 멀티 관점 분석 | 패널 페르소나만 선택 (`compete`/`refhub` 제외) |
| `devil` | 악마의 대변인 | Pre-mortem |
| `scamper` | SCAMPER 확장 | |
| `dna` | 아이디어 DNA 맵 | |
| `market` | 시장 검증 | 웹 검색 1차는 `investor` 페르소나 키 |
| `compete` | 경쟁 환경 스캐너 | 설정에서 `compete` ID 페르소나 |
| `refhub` | 레퍼런스 허브 | 설정에서 `refhub` ID 페르소나 |
| `archive` | 아카이브 | 영구 보관 |
| `pipeline` | (히스토리 등 레거시) | 코드에 상세 바디가 있을 수 있음 |

**원하는 피드백 방향 (선택)** 입력은 위 분석 모드들의 프롬프트에 옵션으로 합쳐짐 (`formatOptionalDirectionFb`).

---

## 4. 아이디어 토너먼트 심사 기준 (핵심 규칙)

토너먼트는 **성공 확률이 가장 높은 아이디어**를 선별하는 것이 목적입니다.

### 4.1 심사 5대 기준

| 기준 | 약어 | 평가 범위 |
|------|------|-----------|
| **시장성** | TAM/SAM | 시장 크기, 성장률, 타이밍, 트렌드 |
| **실현 가능성** | Feasibility | 기술 난이도, 필요 리소스, MVP 출시 속도 |
| **수익 모델** | Revenue | 단위 경제, 반복 매출, LTV/CAC 잠재력 |
| **차별화·방어력** | Moat | 경쟁 우위, 모방 장벽, IP·네트워크 효과 |
| **사용자 임팩트** | Impact | 해결하는 페인포인트 크기, 재사용률, 바이럴 가능성 |

### 4.2 심사 결과 형식

각 매치의 AI 판정은 **JSON 한 줄**로 출력됩니다:

```json
{
  "match": 1,
  "winner": "A",
  "scores": {
    "A": {"시장성": 8, "실현가능성": 7, "수익모델": 6, "차별화": 7, "임팩트": 8},
    "B": {"시장성": 5, "실현가능성": 6, "수익모델": 4, "차별화": 5, "임팩트": 6}
  },
  "reasoning": "A가 시장 규모와 사용자 임팩트에서 압도적 우위. B는 수익 모델이 불명확하고 차별화가 약함."
}
```

### 4.3 UI 표시

- 각 매치 카드에 **5차원 점수 바** + **총점** 표시
- **판정 근거** 영역에 2~3문장의 논리적 이유 전문 출력
- 최종 리포트: 순위 분석 + 1위 실행 전략(3/6/12개월) + GTM 제안

---

## 5. 기술 규칙

### 5.1 파일 구조
- **모듈 기반 앱**: `src/App.jsx`에 컴포넌트·UI 로직, 나머지는 모듈로 분리
  - `logger.js` — 앱 로거
  - `constants.js` — 상수, 저장 키, 헬퍼 함수
  - `api.js` — API 호출, 레이트 리미터, 문서 파싱
  - `styles.js` — CSS 전체
  - `prompts.js` — AI 프롬프트
- 컴포넌트 추가 분리가 필요하면 `src/components/` 아래 생성 가능
- **AI 에이전트 작업 시**: 컴포넌트 수정 → `App.jsx` + `constants.js`, API 수정 → `api.js`, 스타일 수정 → `styles.js`, 프롬프트 수정 → `prompts.js`만 전달하면 충분

### 5.1b CSS 주의 (아카이브·모달)
- 아카이브 영역 래퍼 **`.page-enter`**의 페이지 진입 애니메이션은 **opacity만** 사용한다 (`01_CHANGELOG.md` #11).
- 이 래퍼에 **`transform`이 `forwards`/`both` 등으로 남으면**, 그 안의 **`position: fixed`**(히스토리/아카이브 상세 오버레이, 리파인 코파일럿 등)가 뷰포트가 아니라 **해당 래퍼**에 묶여 레이아웃이 깨진다.

### 5.2 API 호출
- `callAI(persona, messages, systemPrompt?)` 함수로 통일
- 3번째 인자 `systemPrompt`를 넘기면 페르소나의 기본 역할을 덮어씀
- **`withResolvedApiKey(persona, globalKey)`** 호출 후 `callAI`에 전달 권장: Claude만 글로벌 키 폴백, GPT/Gemini는 개별 키만
- Claude **키 없음**이면 네트워크 요청 없이 한국어 오류 throw
- **Anthropic URL**: 개발(`npm run dev`)에서는 Vite 프록시 **`/anthropic/v1/messages`** → `api.anthropic.com`; 프로덕션 빌드는 직접 `https://api.anthropic.com/v1/messages`
- DNA 맵: `DNA_MAP_SYSTEM_KO` (한국어 JSON 전용)
- 토너먼트 채우기: `TOURNAMENT_FILL_SYSTEM_KO`
- 토너먼트 심판: `TOURNAMENT_MATCH_SYSTEM_KO` (5차원 점수 + JSON 출력)

### 5.3 한국어 원칙
- **모든 AI 프롬프트**에 한국어 출력을 명시할 것
- JSON 응답의 **키는 영문** 유지, **값은 한국어**
- UI 라벨·플레이스홀더·에러 메시지 전부 한국어

### 5.4 localStorage 키 (요약)
| 키 | 용도 |
|----|------|
| `brainstorm-arena-history-v2` | 분석 히스토리 (최대 80건) |
| `brainstorm-arena-personas-v3` | 페르소나 배열 (로드 시 `DEFAULT_PERSONAS`와 ID 병합) |
| `brainstorm-arena-settings-v1` | 글로벌 Claude 키 + ToT provider/model/key |
| `brainstorm-arena-archive-v1` 등 | 아카이브·그룹 (기존과 동일) |

### 5.5 히스토리 시스템
- `RecordHistoryContext`를 통해 각 모드가 분석 완료 시 자동 저장
- 엔트리 구조: `{ id, ts, modeId, modeName, modeIcon, title, payload }`
- `payload`에 **`fb`(피드백 방향)** 등을 모드별로 포함 가능
- API 키·시스템 프롬프트는 **절대 저장하지 않음**

### 5.6 배치 파일
- `run.bat`: ASCII 전용 (한글 금지), CMD 호환
- `실행.bat`: `run.bat` 호출만 수행

---

## 6. 개발 워크플로

```bash
# 의존성 설치
npm install

# 개발 서버 (자동 브라우저 열기)
npm run dev

# 프로덕션 빌드 (dist/ 더블클릭 가능)
npm run build

# 빌드 결과 미리보기
npm run preview
```

---

## 7. 최종 업데이트 시점 표기 규칙

### 7.1 위치
- `src/App.jsx` 상단의 `LAST_UPDATED` 상수 (import 블록 직후, 약 60번째 줄)
- 설정 모달(⚙️) 하단에 자동 노출됨

### 7.2 형식 (반드시 KST 명시)
```
"YYYY-MM-DD HH:MM KST"  ← 반드시 이 형식 그대로
```
예시: `"2026-04-04 22:39 KST"`

> **KST = UTC+9 (한국 표준시)**
> AI 에이전트가 시간대를 모를 경우 아래 명령으로 확인:
> ```bash
> # Windows (PowerShell)
> [System.TimeZoneInfo]::ConvertTimeBySystemTimeZoneId([DateTime]::UtcNow, 'Korea Standard Time').ToString('yyyy-MM-dd HH:mm')
> # Linux/Mac
> TZ='Asia/Seoul' date '+%Y-%m-%d %H:%M'
> ```

### 7.3 갱신 규칙
- **`src/App.jsx`·`src/api.js`·`src/styles.js`·`src/prompts.js`·`src/constants.js` 중 하나라도 수정할 때마다** `LAST_UPDATED`를 갱신한다
- `01_CHANGELOG.md` 기록과 함께 반드시 수행
- 단순 문서 수정(`.md` 파일만 변경)은 갱신 불필요
- 값은 수정 완료 직전 시점의 KST 현재 시각으로 입력

### 7.4 코드 위치
```js
// src/App.jsx — import 블록 직후 (~60번째 줄)
// ─── 앱 업데이트 시점 (코드 수정 시 반드시 갱신) ───
const LAST_UPDATED = "YYYY-MM-DD HH:MM KST";
```

### 7.5 체크 방법 (다른 AI 에이전트를 위한 가이드)
1. 코드 수정 시작 전: `grep -n "LAST_UPDATED" src/App.jsx` 로 현재 값 확인
2. 코드 수정 완료 후: KST 현재 시각으로 값 교체
3. 형식 오류 예시 (사용 금지):
   - `"2026-04-04 03:20"` ← KST 미표기 (과거 형식, 사용 금지)
   - `"2026-04-04T03:20:00Z"` ← ISO8601, 사용 금지
   - UTC 시간 그대로 입력 금지

---

## 8. AI 작업 행동 규칙 (필수)

> **이 섹션은 AI 에이전트가 코드 수정 시 반드시 따라야 할 원칙이다. 예외 없이 적용.**

### 8.1 복잡한 버그 수정 절차

복잡도가 높은 버그(여러 컴포넌트 연동, React 라이프사이클/리소스 관리, Three.js/WebGL, 동시성, 렌더링 파이프라인, 상태 동기화 등)를 수정할 때는 **곧바로 코드를 고치지 말 것.**

**필수 순서:**
1. 원인을 정확히 파악한 뒤 사용자에게 상세히 설명
2. 가능한 수정 방안을 제시
3. 사용자와 논의해 최종 방안을 합의한 뒤에만 실행

**추측 기반 즉흥 수정 절대 금지.**

### 8.2 fallback 분기 금지 원칙

근본 원인을 확인하지 않고 fallback 분기를 만들지 말 것.
- 데이터가 안 맞으면 → 데이터를 고친다
- 함수가 안 불리면 → 호출 경로를 추적해서 수정한다
- fallback은 문제를 숨기고 데드코드를 만든다

**fallback 절대 금지 영역:**
- 결제, 로그인, 데이터 동기화 등 크리티컬 경로 — 실패는 명시적으로 노출하고 사용자에게 알려야 한다
- UI 렌더링, 스탯 계산, 게임 로직 — `|| 기본값` 폴백 금지. 데이터를 올바르게 초기화하거나 에러를 명시적으로 표시할 것 (예: `|| 50` 같은 폴백을 걸면 버그가 영원히 숨겨진다)

**fallback 허용 범위 (예외):**
- 로컬 환경 전용 기능
- OS/디바이스 차이에 의한 해상도/API 차이 등 진짜 예외 케이스에만 한정

---

## 9. 수정 시 체크리스트

1. [ ] 이 문서(`00_PROJECT_GUIDE.md`)를 먼저 읽었는가?
2. [ ] 복잡한 버그라면 원인 설명 → 방안 제시 → 사용자 합의 순서를 지켰는가?
3. [ ] 수정 후 `npm run build`가 성공하는가?
4. [ ] 한국어 출력 원칙을 지켰는가?
5. [ ] 토너먼트 수정 시 5대 심사 기준 구조를 유지했는가?
6. [ ] `01_CHANGELOG.md`에 변경 내용을 기록했는가?
7. [ ] `src/App.jsx`의 `LAST_UPDATED` 상수를 현재 시각으로 갱신했는가?

---

## 10. 하네스 엔지니어링 지침 (자동 반영)

> **AI 에이전트 작업 규칙은 `CLAUDE.md`에 별도 관리됩니다.**
> Claude Code는 매 작업 시작 시 `CLAUDE.md`를 자동으로 읽으므로,
> 지침을 변경하려면 `CLAUDE.md` 파일을 수정하세요.
>
> - `CLAUDE.md` — 하네스 엔지니어링 지침 (복잡 버그 절차, fallback 금지, 체크리스트 등)
> - `02_API_FEATURES.md` — API 호출 기능 전체 리스트
> - `src/prompts.js` — AI 프롬프트 편집 가능 스크립트 (유저 프롬프트 빌더 함수 포함)

---

## 11. 향후 확장 방향 (참고)

- 히스토리 JSON 내보내기/가져오기
- 다크 모드
- 토너먼트 라운드별 실시간 진행 애니메이션
- 다국어 지원 (현재 한국어 only)
- 파일 분리 리팩토링 (컴포넌트 단위) — `02_API_FEATURES.md` 참조
