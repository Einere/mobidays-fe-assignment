# Daily Trend Chart Refactor Design

## 배경

`src/widgets/daily-trend-chart`는 이미 `useDailyTrendChartViewModel()`을 통해 데이터 조회와 상태 판별을 분리하고 있지만, UI 쪽에서는 아직 카드 프레임, 상태 UI, 메트릭 토글, 차트 본문, 툴팁 포맷, 축 포맷이 같은 파일에 섞여 있다. 특히 `daily-trend-chart-card.tsx`는 오케스트레이션과 상태 렌더링을 동시에 맡고 있고, `daily-trend-line-chart.tsx`는 차트 조립뿐 아니라 토글 그룹과 여러 helper 함수를 함께 들고 있어 수정 비용이 커진다.

이번 작업의 목적은 `platform-performance-chart`에서 정리한 것과 같은 기준으로 책임을 재배치하는 것이다. 다만 `daily-trend-chart`는 구조가 더 단순하므로, 파일 수를 과도하게 늘리지 않고도 경계를 분명하게 나눈다.

## 목표

- 카드 레벨에서는 `viewState.kind` 해석과 상위 레이아웃 조립만 담당한다.
- 상태 UI는 `loading`, `full-error`, `empty-campaigns`, `empty-data`, `stale`, `syncing`을 독립적으로 렌더링할 수 있어야 한다.
- 메트릭 토글은 차트 본문과 분리해 재사용 가능한 UI 컴포넌트로 만든다.
- 라인 차트 파일은 Recharts 조립만 담당하고, 포맷 및 config 생성은 helper로 분리한다.
- 기존 동작, 테스트, 문구는 유지한다.

## 범위

### 포함

- `src/widgets/daily-trend-chart/ui/daily-trend-chart-card.tsx` 분리
- `src/widgets/daily-trend-chart/ui/daily-trend-line-chart.tsx` 분리
- 메트릭 토글 UI와 차트 helper 추출
- 카드 프레임과 상태 컴포넌트 추가
- 단위 테스트 재배치 및 보강

### 제외

- 데이터 조회 로직 자체의 변경
- 메트릭 종류나 기본 선택값 변경
- 차트 시각 스타일 재설계
- 전역 필터나 `App.tsx` 레이아웃 재배치

## 설계 원칙

### 1. 카드와 차트의 책임 분리

`DailyTrendChartCard`는 view model을 읽고 상태에 따라 무엇을 보여줄지 결정한다. 반면 카드 내부의 실제 UI 구조는 별도 frame과 status/content 컴포넌트로 내려서, 카드 파일이 상태 분기와 조립만 보이도록 한다.

### 2. 차트 조립과 helper의 분리

`DailyTrendLineChart`는 Recharts의 `LineChart`, `Line`, `XAxis`, `YAxis`, `Tooltip`, `Legend`를 조립하는 역할만 맡는다. 날짜 라벨, Y축 포맷, 툴팁 포맷, chart config 생성은 순수 helper로 옮겨서 테스트를 쉽게 만든다.

### 3. 메트릭 토글은 독립 UI로 유지

토글은 차트의 일부처럼 보이지만 실제로는 선택 상태를 바꾸는 입력 장치다. 따라서 차트 본문과 분리해 별도 컴포넌트로 둔다. 이 방식은 다른 위젯의 토글 패턴과도 맞아 떨어진다.

### 4. 과분할 방지

`daily-trend-chart`는 `platform-performance-chart`보다 단순하므로, legend나 tooltip을 별도 파일로 과도하게 쪼개지 않는다. 기준은 “이 파일이 더 이상 UI를 직접 렌더링하지 않는가”와 “같이 바뀌는 로직인가”이다.

## 제안 구조

### 카드 레벨

- `ui/daily-trend-chart-card.tsx`
  - `useDailyTrendChartViewModel()` 호출
  - `viewState.kind`에 따른 상위 분기
  - frame/status/content 조립

- `ui/daily-trend-chart-frame.tsx`
  - 제목, 설명, actions 슬롯, status 슬롯, children 레이아웃 담당

- `ui/daily-trend-chart-status.tsx`
  - loading, full-error, empty-campaigns, empty-data, stale, syncing 상태 렌더링 담당

- `ui/daily-trend-chart-content.tsx`
  - chart 상태에서 `DailyTrendMetricToggleGroup`과 `DailyTrendLineChart` 조립 담당
  - `DataDenseScrollArea`는 여기서 유지하거나, 필요 시 별도 wrapper로 감싼다

### 차트 레벨

- `ui/daily-trend-line-chart.tsx`
  - Recharts line chart 조립
  - 선택된 메트릭만 라인으로 렌더링
  - `DailyTrendChartHelpers`에서 받은 config / formatter를 사용

- `ui/daily-trend-metric-toggle-group.tsx`
  - 메트릭 버튼 그룹만 렌더링

- `model/daily-trend-chart.ts`
  - chart config 생성
  - tooltip formatter
  - 날짜/축 포맷 helper
  - 선택된 메트릭 정의 계산

기존 `model/metrics.ts`와 `model/daily-trend-metric-selection.ts`는 유지하되, `daily-trend-chart.ts`는 이 둘 위에 놓이는 차트 전용 helper 레이어로 본다.

## 데이터 흐름

1. `useDailyTrendChartViewModel()`이 query와 derivation 결과를 받아 `viewState`와 `activeMetrics`를 만든다.
2. `DailyTrendChartCard`는 `viewState.kind`를 해석해 상태 UI 또는 차트 콘텐츠를 선택한다.
3. `DailyTrendChartContent`는 토글과 라인 차트를 조립한다.
4. `DailyTrendLineChart`는 helper가 제공한 config와 formatter를 사용해 Recharts 요소를 렌더링한다.
5. 사용자 입력은 `toggleMetric`과 기존 query refetch 흐름으로 이어진다.

## 상태 처리

### 로딩

- 초기 조회 중에는 고정 높이의 loading placeholder를 보여준다.

### 오류

- 초기 조회 실패 시 full-error 상태를 보여준다.
- 재조회 실패 시 stale 상태를 별도 표시하고, 기존 차트는 유지한다.

### 빈 상태

- 캠페인 0건과 데이터 0건을 구분한다.
- 원인별로 메시지를 다르게 보여준다.

### 동기화

- `isSyncing` 시에는 차트 위에 보조 상태 텍스트를 노출한다.
- 상태 텍스트는 레이아웃을 밀지 않도록 카드 프레임의 status 슬롯을 사용한다.

## 테스트 전략

### 단위 테스트

- `model/daily-trend-chart.ts`
  - tooltip formatter가 메트릭 키를 안정적으로 해석하는지
  - chart config가 기본 메트릭 정의와 일치하는지
  - 날짜/축 포맷이 예상 형식인지

- `ui/daily-trend-metric-toggle-group.tsx`
  - 기본 선택 상태
  - 클릭 시 `onToggleMetric` 호출

- `ui/daily-trend-line-chart.tsx`
  - 선택된 메트릭만 라인을 렌더링하는지
  - tooltip과 legend가 유지되는지

- `ui/daily-trend-chart-status.tsx`
  - 각 상태 문구와 role이 올바른지

- `ui/daily-trend-chart-frame.tsx`
  - 제목/설명/status/children 배치가 맞는지

### 통합 테스트

- `ui/daily-trend-chart-card.test.tsx`
  - viewState별 분기
  - stale/syncing 노출
  - chart 상태에서 토글과 라인 차트가 함께 렌더링되는지
  - `App` 레이아웃에서 다른 패널과의 상대 위치가 유지되는지

## 파일별 역할 요약

- `daily-trend-chart-card.tsx`: 오케스트레이션
- `daily-trend-chart-frame.tsx`: 카드 레이아웃
- `daily-trend-chart-status.tsx`: 상태 표시
- `daily-trend-chart-content.tsx`: chart 상태 조립
- `daily-trend-metric-toggle-group.tsx`: 메트릭 선택 UI
- `daily-trend-line-chart.tsx`: 차트 렌더링
- `daily-trend-chart.ts`: 차트 helper

## 성공 기준

- 카드 파일에서 `viewState.kind` 분기가 직접 UI 레이어를 지배하지 않는다.
- 라인 차트 파일에서 토글/UI helper가 사라진다.
- 기존 테스트가 의미 단위로 분산되며, 전체 동작은 유지된다.
- 파일 수는 늘어도, 각 파일의 책임이 한눈에 보인다.

