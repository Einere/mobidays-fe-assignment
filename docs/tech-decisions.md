# 기술 의사결정 기록

마케팅 캠페인 성과 대시보드 과제의 기술 스택 선정 과정과 최종 결정을 기록합니다.

---

## 최종 기술 스택

| 역할 | 도구 | 버전 |
|---|---|---|
| UI 프레임워크 | React + TypeScript + Vite | React 19 |
| 스타일링 | Tailwind CSS + shadcn/ui | - |
| 린트/포맷 | Biome | - |
| API mocking | MSW | - |
| 서버 상태 | TanStack Query | v5 |
| 전역 상태 | Jotai | - |
| Suspense/ErrorBoundary | Suspensive | - |
| 차트 | Recharts | v3 |
| 테이블 | TanStack Table | v8 |
| 폼 | react-hook-form + Zod | - |
| 날짜 | date-fns | - |
| 테스트 | Vitest + React Testing Library | - |
| 폴더 구조 | FSD (4레이어 간소화) | - |

---

## 항목별 의사결정 과정

### 공용 컴포넌트 라이브러리 — shadcn/ui

**검토 대상**: shadcn/ui vs Radix UI (headless only)

- Radix UI는 headless primitives만 제공하므로 스타일을 전부 직접 작성해야 함
- shadcn/ui는 Radix UI 기반의 이미 스타일된 컴포넌트를 소스 코드로 복사하는 방식 → 빠른 UI 구성 + 커스텀 자유도 유지
- 접근성(키보드 컨트롤, 포커스 관리, ARIA)이 Radix UI primitives 수준으로 보장됨
- 평가 항목 "UX & 접근성(10점)"에 직접적으로 유리
- Tailwind CSS 의존성이 생기지만, Tailwind 사용을 병행하기로 결정

**결정**: shadcn/ui (Tailwind CSS 포함)

---

### 린트/포맷 — Biome

**검토 대상**: ESLint + Prettier / oxlint + Prettier / Biome / oxlint + oxfmt

| 조합 | 안정성 | 비고 |
|---|---|---|
| ESLint + Prettier | ✅ 안정 | 설정 파일 복수, 느림 |
| oxlint + Prettier | ✅ 안정 | 린트만 빠름 |
| Biome | ✅ 안정 | 린트+포맷 일체형, 빠름 |
| oxlint + oxfmt | ⚠️ Beta | oxfmt가 Beta 단계로 마감 리스크 존재 |

- oxc.rs를 검토했으나 oxfmt가 Beta 단계 → 7일 과제에서 예상치 못한 이슈 리스크
- Biome은 린트+포맷을 단일 도구로 통합, 설정 간소화

**결정**: Biome

---

### API mocking — MSW

**검토 대상**: json-server vs MSW

- json-server: 로컬 서버를 별도로 실행해야 하는 번거로움, 과제 제출 시 실행 환경 의존성 발생
- MSW: Service Worker로 fetch를 intercept → 별도 서버 없이 비동기 통신 요구사항 충족
- 브라우저 모드(Service Worker) + Node 모드(테스트 환경) 이중 지원 → Vitest 테스트에서도 동일 핸들러 재활용 가능

**결정**: MSW

---

### 서버 상태 — TanStack Query v5

- `useSuspenseQuery` 공식 지원 (v5) → Suspensive와 자연스럽게 통합
- 필터 변경 시 query key에 필터값 포함 → 자동 re-fetch
- `useMutation` + `invalidateQueries`로 캠페인 등록 후 즉시 반영 처리

**결정**: TanStack Query v5

---

### 전역 상태 — Jotai

**검토 대상**: Zustand vs Jotai vs React Context

- 글로벌 필터(날짜 범위, 상태, 매체)를 여러 위젯이 구독해야 함
- Context는 불필요한 리렌더링 유발 가능성
- Zustand: 단일 스토어 기반, 규모가 커질수록 유리
- Jotai: atom 단위 구독으로 필요한 컴포넌트만 리렌더링, React 19와 잘 맞는 bottom-up 방식
- `@suspensive/jotai` 패키지로 Suspensive와도 통합 가능

**결정**: Jotai

---

### Suspense/ErrorBoundary — Suspensive

- Toss(비바리퍼블리카)에서 만든 라이브러리, 국내 대형 서비스에서 검증
- `@suspensive/react-query`: `<SuspenseQuery />` 컴포넌트로 선언적 데이터 패칭 → wrapper 컴포넌트 불필요
- `@suspensive/jotai`: Jotai atom의 Suspense 지원
- `<ErrorBoundaryGroup />`: 여러 ErrorBoundary 일괄 reset
- TanStack Query + Jotai를 모두 사용하는 현재 스택과 시너지 최대

**결정**: Suspensive (`@suspensive/react`, `@suspensive/react-query`, `@suspensive/jotai`)

---

### 차트 — Recharts v3

**검토 대상**: Recharts / Nivo / Chart.js / ECharts

| 라이브러리 | 장점 | 단점 |
|---|---|---|
| Recharts | React 전용 선언적 API, 가벼움 | 고급 커스텀 한계 |
| Nivo | 차트 종류 다양, 접근성 우수 | 번들 크기 큰 편 |
| Chart.js | 성숙한 생태계 | imperative API |
| ECharts | 기능 방대 | 공식 React wrapper 없음 |

- 필요한 차트: Line(일별 추이), Donut(플랫폼별), Bar(랭킹 Top3)
- Recharts v3로 모두 커버 가능
- React 19 peer dependency 공식 지원 확인 (`"react": "^16.0.0 || ^17.0.0 || ^18.0.0 || ^19.0.0"`)
- 선언적 JSX 기반 API로 컴포넌트 설계와 자연스럽게 통합
- Donut 차트 클릭 → 글로벌 필터 연동은 PieChart `onClick` prop으로 처리 가능

**결정**: Recharts v3

---

### 테이블 — TanStack Table v8

- 필요 기능: 정렬, 검색(클라이언트), 페이지네이션(10건), 체크박스 선택, 일괄 상태 변경
- TanStack Query와 같은 생태계로 문서 진입장벽 낮음
- Headless 방식 → shadcn/ui 테이블 컴포넌트와 조합하여 스타일 자유도 유지

**결정**: TanStack Table v8

---

### 폼 — react-hook-form + Zod

**폼 라이브러리 검토 대상**: react-hook-form vs Formik vs TanStack Form

| | react-hook-form | Formik | TanStack Form |
|---|---|---|---|
| 렌더링 방식 | 비제어 컴포넌트 기반, 리렌더링 최소화 | 제어 컴포넌트, 입력마다 리렌더링 | 비제어 기반, TanStack 생태계 통합 |
| 번들 크기 | 작음 (~9KB) | 중간 (~15KB) | 작음 |
| 성숙도 | 높음 | 높음 | 상대적으로 낮음 |
| 학습 곡선 | 낮음 | 중간 | 중간 |

**유효성 검증 라이브러리 검토 대상**: Zod vs Yup vs Valibot

| | Zod | Yup | Valibot |
|---|---|---|---|
| TypeScript 설계 | TypeScript-first | 후속 지원 | TypeScript-first |
| 번들 크기 | 중간 (~14KB) | 중간 (~14KB) | 매우 작음 (tree-shaking 극대화) |
| cross-field validation | `.refine()` / `.superRefine()` | `.test()` | `check()` |
| 생태계 | 넓음 (zodResolver 등) | 넓음 | 성장 중 |

**Zod 단일 진실의 원천 (Single Source of Truth)**

Zod 스키마 하나가 런타임 유효성 검증과 TypeScript 타입 정의를 동시에 담당합니다. `z.infer<>`로 스키마에서 타입을 추출하므로, 타입과 검증 규칙이 별도로 존재하여 불일치가 발생하는 문제를 원천 차단합니다.

```typescript
// 스키마 정의 한 곳에서 타입과 검증 규칙을 동시에 관리
const campaignFormSchema = z.object({
  name: z.string().min(2).max(100),
  platform: z.enum(['Google', 'Meta', 'Naver']),
  budget: z.number().int().min(100).max(1_000_000_000),
  cost: z.number().int().min(0).max(1_000_000_000),
  startDate: z.string(),
  endDate: z.string(),
}).refine(data => data.cost <= data.budget, {
  message: '집행 금액은 예산을 초과할 수 없습니다',
  path: ['cost'],
}).refine(data => data.endDate > data.startDate, {
  message: '종료일은 시작일 이후여야 합니다',
  path: ['endDate'],
})

// 타입을 별도로 선언할 필요 없음 — 스키마에서 자동 추론
type CampaignFormValues = z.infer<typeof campaignFormSchema>
```

- `zodResolver`로 react-hook-form과 타입 안전하게 연동
- cross-field validation (종료일 > 시작일, 집행금액 ≤ 예산) `.refine()`으로 처리

**결정**: react-hook-form + Zod

---

### 날짜 처리 — date-fns

**검토 대상**: date-fns vs dayjs

| | date-fns | dayjs |
|---|---|---|
| API 스타일 | 함수형 (immutability 자연스러움) | 체이닝 (moment.js 스타일) |
| 번들 크기 | tree-shaking으로 사용 함수만 포함 | 초경량 (~2KB) |

- 함수형 API가 immutability 원칙에 부합
- 당월 1일~말일 초기값 계산, 날짜 비교, YYYY-MM-DD 파싱 모두 지원

**결정**: date-fns

---

### 테스트 — Vitest + React Testing Library

- Vite 기반 프로젝트이므로 Jest 대비 설정 최소화, 속도 빠름
- MSW Node 모드를 테스트 환경에서 재활용 → 브라우저/테스트 핸들러 통합
- TDD 1순위 대상: 파생 지표 계산 순수 함수(CTR/CPC/ROAS), 데이터 정규화 로직

**결정**: Vitest + React Testing Library

---

### 폴더 구조 — FSD 4레이어 간소화

**검토 대상**:
- FSD 전체 레이어 (app/pages/widgets/features/entities/shared)
- FSD 4레이어 간소화 (app/widgets/entities/shared)
- 도메인 기반 단순 구조 (components/features/hooks/lib)

- 단일 페이지 대시보드에서 pages/features 레이어는 불필요한 복잡도
- FSD 전체 레이어는 단일 페이지 규모에 오버 엔지니어링
- 도메인 기반 단순 구조는 설계 어필에 불리 (평가 항목 "아키텍처 & 설계 20점")
- FSD 핵심 원칙(레이어별 단방향 의존성)을 유지하면서 현실적 규모에 맞게 조정

```
src/
├── app/        # Provider, 전역 설정
├── widgets/    # 차트, 테이블, 필터 등 독립 UI 블록
├── entities/   # 도메인 모델, API, 파생 지표 계산
└── shared/     # shadcn 컴포넌트, utils, hooks, types, MSW handlers, Jotai atoms
```

**결정**: FSD 4레이어 간소화 (app / widgets / entities / shared)

