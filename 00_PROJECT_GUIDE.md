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

## 7. 수정 시 체크리스트

1. [ ] 이 문서(`00_PROJECT_GUIDE.md`)를 먼저 읽었는가?
2. [ ] 수정 후 `npm run build`가 성공하는가?
3. [ ] 한국어 출력 원칙을 지켰는가?
4. [ ] 토너먼트 수정 시 5대 심사 기준 구조를 유지했는가?
5. [ ] `01_CHANGELOG.md`에 변경 내용을 기록했는가?

---

## 8. 향후 확장 방향 (참고)

- 히스토리 JSON 내보내기/가져오기
- 다크 모드
- 토너먼트 라운드별 실시간 진행 애니메이션
- 다국어 지원 (현재 한국어 only)
- 파일 분리 리팩토링 (컴포넌트 단위)
