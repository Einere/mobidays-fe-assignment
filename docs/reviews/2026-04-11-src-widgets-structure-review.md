# `src/widgets` 구조 리뷰

## 대상 범위
- `src/widgets` 하위 컴포넌트 구조
- 특히 `campaign-table`, `global-filter`, `daily-trend-chart`, `platform-performance-chart`, `campaign-ranking-top3`

## 결론
- 전체적으로는 위젯별 책임 분리가 잘 되어 있다.
- 가장 큰 구조 문제는 `campaign-table`에 집중되어 있다.
- 나머지 위젯은 대체로 "데이터 해석 레이어"와 "렌더링 레이어"의 경계가 유지되고 있다.

## 사용한 관점
- `frontend-clean-code`

## 핵심 판단

### 1. `campaign-table`은 오케스트레이션 책임이 과도하다
- 위치: `src/widgets/campaign-table/ui/campaign-table-card.tsx`
- 문제:
  - 전역 필터 연결
  - 테이블 데이터 조회
  - selection reset 조건 계산
  - bulk action 상태 관리
  - create dialog 상태 관리
  - loading/error/empty 상태 분기
  - 최종 렌더링
  를 한 컴포넌트가 모두 맡고 있다.
- 영향:
  - 파일을 읽는 사람이 동작의 전체 흐름을 여러 번 오가야 한다.
  - 변경 비용이 높다. 예를 들어 선택 초기화 정책만 바꿔도 카드 전체를 다시 이해해야 한다.
- 작은 리팩토링:
  - `useCampaignTableViewModel`처럼 상태 조합을 모으는 훅으로 정리하거나,
  - 최소한 selection / bulk action / dialog 상태 계산을 별도 훅으로 더 분리한다.

### 2. 선택 초기화 규칙이 암묵적이다
- 위치: `src/widgets/campaign-table/ui/campaign-table-card.tsx`
- 문제:
  - `selectionResetKey`를 `JSON.stringify({ filter, page, searchTerm, sort })`로 만든다.
  - 어떤 입력이 선택을 초기화하는지 이름만 보고는 예상하기 어렵다.
- 영향:
  - 예측 가능성이 떨어진다.
  - 필터 객체 구조가 바뀌면 선택 초기화 규칙도 함께 흔들릴 수 있다.
- 작은 리팩토링:
  - 선택 초기화 조건을 명시적인 primitive 조합으로 바꾸거나,
  - 초기화 정책을 별도 함수로 이름 붙여 숨긴다.

### 3. toolbar/table/dialog props가 넓어서 결합도가 높다
- 위치:
  - `src/widgets/campaign-table/ui/campaign-table-toolbar.tsx`
  - `src/widgets/campaign-table/ui/campaign-table-table.tsx`
  - `src/widgets/campaign-table/ui/campaign-create-dialog.tsx`
  - `src/widgets/campaign-table/ui/campaign-table-status-dialog.tsx`
- 문제:
  - 각 컴포넌트가 6개 이상 props를 받는다.
  - 부모가 이벤트와 상태를 세세하게 중계한다.
- 영향:
  - 작은 UI 변경도 부모/자식 여러 파일을 동시에 건드리게 된다.
  - props drilling 성격이 강해지고, 책임 경계가 흐려진다.
- 작은 리팩토링:
  - `toolbarState`, `tableState`, `dialogState` 같은 목적별 객체로 묶는다.
  - 정적 값과 이벤트를 분리해 인터페이스를 읽기 쉽게 만든다.

## 상대적으로 좋은 구조

### 4. `campaign-ranking-top3`는 구조가 가장 안정적이다
- 위치: `src/widgets/campaign-ranking-top3/ui/campaign-ranking-top3-card.tsx`
- 장점:
  - card는 view model만 소비하고 렌더링에 집중한다.
  - 상태 계산과 UI가 비교적 잘 분리되어 있다.
- 판단:
  - `src/widgets` 안에서 가장 깔끔한 편이다.

### 5. 차트 위젯들은 상태 해석을 helper로 분리하고 있다
- 위치:
  - `src/widgets/daily-trend-chart/ui/daily-trend-chart-card.tsx`
  - `src/widgets/platform-performance-chart/ui/platform-performance-chart-card.tsx`
- 장점:
  - `resolve*ViewState` 계열 helper로 loading/error/empty/chart 분기를 숨기고 있다.
  - 카드 컴포넌트가 무조건 모든 계산을 직접 들고 있지는 않다.
- 판단:
  - 구조적으로는 무난하다.

### 6. `global-filter`는 기능이 조금 많지만 경계는 유지된다
- 위치: `src/widgets/global-filter/ui/global-filter-bar.tsx`
- 관찰:
  - 날짜 범위 draft와 validation을 같은 컴포넌트에서 처리한다.
  - 다만 필터 칩, 드롭다운, summary, date range fields가 분리되어 있어 응집도는 괜찮다.
- 판단:
  - 현재 수준에서는 허용 가능하다.
  - 다만 날짜 범위 검증 로직이 더 복잡해지면 분리 후보가 된다.

## 우선순위

### 즉시 정리할 것
- `campaign-table-card.tsx`의 오케스트레이션 과밀
- `selectionResetKey`의 암묵적 정책

### 다음으로 정리할 것
- `campaign-table` 하위 컴포넌트들의 props 정리
- 상태 객체 단위의 인터페이스 단순화

### 유지해도 되는 것
- `campaign-ranking-top3`의 view model 분리 방식
- `daily-trend-chart` / `platform-performance-chart`의 state resolver 방식

## 한줄 결론
- `src/widgets` 전체는 대체로 괜찮고, 구조상 가장 큰 개선 여지는 `campaign-table`에 있다.
- 그 외 위젯은 책임 분리 방향이 비교적 일관적이다.
