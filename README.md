# 실행 방법

1. 의존성을 설치합니다.

```bash
npm install
```

2. 개발 서버를 실행합니다.

```bash
npm run dev
```

# 기술 스택 선정 과정

[tech-decisions.md](./docs/tech-decisions.md)

# 아키텍처

## 폴더 구조 — FSD 4레이어 간소화

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

## 데이터 흐름

1. `db.json` 
2. MSW 인메모리 DB
3. `useDashboardData` 쿼리 + 전역 필터 `globalFilterAtom`
4. 루트 컨텍스트 `DashboardDataContext`
5. 각 컴포넌트에서 컨텍스트 상태 구독

특히, flux 구조를 의식하여
- 플랫폼별 성과 차트는 액션 아톰을 통해 `globalFilterAtom`만 변경하도록 했습니다.
- 캠페인 생성 기능은 API를 통해 서버 상태를 변경하도록 했습니다.

# 컴포넌트 설계

FSD에 의거하여 크게 UI와9 model로 구분했습니다.
- UI 컴포넌트는 책임 단위로 분리했습니다.
- 특히 오케스트레이션용 컨테이너 컴포넌트와 순수한 프레젠테이션 컴포넌트로 분리했습니다.
- 구성 컴포넌트도 더 작게 쪼갰습니다.
