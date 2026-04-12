# 1. 사용한 AI 도구

## 1.1. Claude Code + Codex

위 두 도구는 구독하여 사용중인 도구입니다.
클로드코드를 사용하고 있다가, 카카오톡 선물하기 특가로 인해 코덱스도 병행하고 있습니다.

# 2. AI 도구 활용

Google Stitch를 이용해 디자인 시스템의 개요를 정의하고, Impeccable로 디자인 시스템을 구체화했습니다.
- [design-context.md](./docs/design-context.md) 
- [design-system.md](./docs/design-system.md)

기본적으로 기능 구현 시 superpower 를 이용해서 구현했습니다. 기본적인 워크플로우는 다음과 같습니다.
- 스펙 정의 -> 리뷰 -> 계획 수립 -> 리뷰 -> 서브 에이전트 기반 구현 -> 리뷰
 
과제의 각 요구사항을 구현 후, 다음 네 가지 코드 리뷰를 서브에이전트 기반으로 진행했습니다.

> 비록 Superpower 워크플로우애서 매 단계마다 자체적으로 리뷰하기는 하지만, 더 높은 퀄리티를 위해 직접 유저테스트와 함께 별도의 코드리뷰도 진행했습니다.

1. requesting-code-review 기반 코드 리뷰
2. vercel-react-best-practice 기반 코드 리뷰
3. 자체 구현 스킬인 Frontend CleanCode 기반 코드 리뷰
4. Impeccable 기반 코드 리뷰

이외에도 과제 수행중에 궁금한 것들이나 의사결정이 필요한 부분들, 신경쓰이는 부분들에 대해 AI와 논의를 진행했습니다.

필수 기능과 추가 기능 구현 후, 평가 지표 항목별로 검사하고 보완을 실시했습니다.
- [mobidays_data_flow_analysis.md](docs/mobidays_data_flow_analysis.md)
- [2026-04-11-kst-date-policy-date-fns-migration.md](docs/superpowers/plans/2026-04-11-kst-date-policy-date-fns-migration.md)
- [2026-04-11-dashboard-orchestration-refactor.md](docs/superpowers/plans/2026-04-11-dashboard-orchestration-refactor.md)

# 3. AI 결과물을 비판적으로 수용한 사례

[DEV_JOURNAL.md](./docs/DEV_JOURNAL.md)에서 굵직한 것들만 추렸습니다.

## 3.1. 디자인 시스템 구축

디자인 시스템 구축을 위해 기본적인 디자인 토큰 정의 과정에서, stitch는 매우 파편적인 정보만 산출했습니다. (일부 브랜드 컬러, 폰트 종류 등)
- 실제 제품에 쓰일정도로 탄탄한 디자인 토큰들을 준비하기 위해 잘 정의된 사례를 들고, 이와 같은 패턴으로 정의해달라고 요청했습니다.

그 후, 실제로 디자인 토큰들이 컨벤션을 제대로 지켰는지, 촘촘히 정의되었는지 검사했습니다.
- 위반사항을 발견해서 수정을 지시했습니다.

## 3.3. 일별 추이 차트 기능 구현 후 피드백

"상태 패칭 및 해석" 책임은 부모로 위임, `DailyTrendChartCard`는 데이터를 렌더링하는 책임만 갖도록 수정을 지시했습니다.

끊어진 시계열 데이터도 명확히 인지할 수 있게 `dot={false}` 옵션을 제거했습니다.

과도한 불리언 변수들을 이용한 렌더링 제어를 개선하기 위해, Tagged Union(`DailyTrendChartViewState`)을 이용해 의도치않은 상태로의 전이를 방지했습니다.

UX를 위해 cross-key fetch 실패 시 최근 성공 UI 보존 기능을 도입하기 위해 이런저런 시도를 했으나, 
- 결국 “현재 필터와 무관한 stale 데이터 노출”이라는 위험이 정확도와 신뢰도를 중요시하는 대시보드 철학을 위배하는 것으로 판단
- 기능을 제거했습니다.

## 3.4. 캠페인 관리 테이블 기능 구현 후 피드백

`CampaignTableRow` 의 책임을 조금 더 명확화했습니다.
- AI 도구는 상태에 표현을 위한 `display*` 필드들을 제안했으나, 실제 렌더링을 하는 셀에서 순수함수로 포메팅을 하면 될 것으로 판단하여 표현용 상태 제거를 지시했습니다.

캠페인 관리 테이블 구현 후, 다음 사항을 발견 후 보완했습니다.
- 검색 필드에 디바운싱이 빠져 있어, 추가했습니다.
- 선택된 항목이 없어도 일괄 변경 상태 선택 select 요소가 인터렉션 가능해서, 선택된 항목이 없다면 비활성화되도록 처리했습니다.
- 공용 컴포넌트(`Select`, `Button`)에 disabled 스타일 처리가 미비해 보완했습니다.

## 3.5. 플랫폼 별 성과 차트 구현 후 피드백

확장성을 위해 매체의 유연함을 지시했더니 일부 타입을 너무 넓히는 반작용이 발생했습니다. (`CampaignPlatform` -> `string`)
- 그 결과, 코드 내에서 타입 호환성을 위해 타입 강제 변환하는 코드가 대량 생성되었습니다.
- 타입 안정성을 보장하기 위해 타입을 기존대로 복원했습니다.
- 추후 매체 추가 시, `CampaignPlatform` 에 유니온 값을 추가하는 것으로 방향을 설정했습니다.

## 3.6. 랭킹 차트 계획 문서 작성 후, 피드백

일부 컴포넌트가 기존 패턴과 다른 책임을 갖도록 구현해서 수정을 지시했습니다.
- 카드 컴포넌트가 데이터 해석과 렌더링 제어 등을 담당하고, 차트 컴포넌트는 순수한 프레젠테이션을 담당하도록 패턴을 고정했습니다.

## 3.7. 필수 기능과 추가 기능 구현 후 피드백

모든 기능 구현 후, 개선하면 좋을 것 같은 부분들에 TODO 주석을 달았으며, 이 내용을 AI와 함께 타당성을 검토한 뒤 개선 방안을 도출했습니다.
- [2026-04-11-todo-review.md](docs/reviews/2026-04-11-todo-review.md)

## 3.8. 글로벌 필터의 책임 경계 분리

다른 컴포넌트처럼 글로벌 필터도 view model 과 contents 책임을 명확히 분리했습니다.
 
- `useGlobalFilterSummaryViewModel`
  - query 해석만 담당하는 모델로 분리했습니다.
  - 에러면 full-error, 아니면 요약 상태를 반환합니다.
- `GlobalFilterSummaryContent`
  - 순수 프레젠테이션 컴포넌트로 분리했습니다.
  - 에러 UI와 요약 UI를 내부에서만 렌더링합니다.
- `GlobalFilterSummary`
  - 이제 상위 컨테이너 역할만 합니다.
- `useDashboardDerivations`
  - `useDashboardVisibleData`와 그 전용 타입을 제거했고, derivation 계산만 남겼습니다.

