# Mobidays Dashboard Data Flow Analysis

이 문서는 현재 프로젝트에서 `db.json` 데이터가 `MSW` 인메모리 DB를 거쳐 전역 필터, 차트, 테이블로 전달되는 흐름과, 스키마에 맞지 않는 데이터가 각 계층에서 어떻게 처리되는지를 정리한 분석 문서다.

## 1. 전체 흐름

1. `src/db.json`이 원본 데이터 소스다.
2. `src/shared/api/mock/memory-db.ts`가 `db.json`을 `structuredClone`해서 `mockDb`와 `memoryDb`를 만든다.
3. 브라우저에서는 `src/main.tsx`가 `worker.start()`를 실행해 MSW를 활성화한다.
4. `src/app/mock/handlers.ts`가 `/campaigns`, `/daily_stats`, `/campaigns/status`, `/campaigns` POST를 가로채서 응답한다.
5. 각 위젯은 `getDashboardDataQueryOptions(filter)`를 통해 같은 쿼리 결과를 가져온다.
6. 전역 필터가 바뀌면 React Query의 `queryKey`가 바뀌고, 관련 위젯은 데이터를 refetch한다.

## 2. 데이터 소스와 MSW 메모리 DB

### 2.1 원본 데이터

- `src/db.json`은 원본을 유지한다.
- 테스트와 런타임에서 이 파일을 직접 수정하지 않고, 메모리 복사본을 사용한다.

### 2.2 메모리 DB

- `mockDb`는 `db.json`의 복사본이다.
- `memoryDb`는 런타임 상태를 담는 별도 복사본이다.
- `appendCampaignToMemoryDb()`와 `updateCampaignStatusesByIds()`는 `memoryDb`만 갱신한다.
- 새로고침하면 `resetMemoryDb()`를 통해 원본 상태로 돌아간다.

### 2.3 MSW 요청 처리

- `GET /campaigns`
  - 전역 필터의 `dateRange`, `statuses`, `platforms`를 query string으로 받는다.
  - 캠페인 필터링은 날짜 겹침, 상태, 매체를 모두 만족해야 통과한다.
- `GET /daily_stats`
  - 전역 필터의 `dateRange`와 캠페인 ID 목록을 query string으로 받는다.
  - 해당 캠페인 ID이면서 날짜 범위에 들어오는 일별 데이터만 반환한다.
- `POST /campaigns`
  - 캠페인을 `memoryDb`에 추가한다.
  - 새 캠페인은 `active` 상태로 생성된다.
- `PATCH /campaigns/status`
  - 선택된 캠페인의 상태를 일괄 변경한다.

## 3. 전역 필터의 역할

전역 필터는 세 가지 축으로 동작한다.

- `dateRange`: 집행 기간
- `statuses`: 상태 다중 선택
- `platforms`: 매체 다중 선택

초기값은 현재 월의 1일~말일, 상태 전체, 매체 전체다.

### 3.1 날짜 입력

- 시작일/종료일은 draft 상태로 먼저 입력된다.
- 시작일이 종료일보다 늦으면 commit되지 않는다.
- 이 경우 전역 필터 atom은 유지되고, 쿼리도 새로 발생하지 않는다.

### 3.2 상태/매체 토글

- 상태와 매체는 다중 선택이다.
- `전체` 버튼은 모든 항목 선택으로 복원한다.
- 토글은 AND 조합으로 최종 필터에 반영된다.

### 3.3 쿼리 키

- `dashboard-data` 쿼리 키는 날짜 범위, 상태 배열, 매체 배열로 만들어진다.
- 배열은 정렬된 값으로 키를 만들기 때문에 선택 순서가 달라도 같은 캐시로 취급된다.

## 4. 서버 응답과 스키마 정규화

서버 응답은 `src/shared/api/contracts/dashboard-data.ts`에서 정규화된다.

### 4.1 캠페인 정규화

#### 4.1.1. 전처리

- `campaignRowSchema`는 `id`만 필수로 검증해서 row 생존 여부를 판단한다.

#### 4.1.2. 후처리

- `parseCampaignResponse()`의 후처리 단계에서 나머지 필드를 정규화한다.
- `name`은 문자열이 아니면 `null`.
- `platform`은 `Google | Meta | Naver`만 유효하다.
- `status`는 `active | paused | ended`만 유효하다.
- `budget`은 유한한 숫자가 아니면 `null`.
- `startDate`, `endDate`는 날짜처럼 해석되지 않으면 `null`.
- 원본 값은 `raw`, `rawPlatform`에 유지된다.

### 4.2 일별 성과 정규화

- `id`, `campaignId`, 수치 필드는 Zod로 검증한다.
- 수치 필드는 숫자 또는 `null`만 허용한다.
- 날짜는 `YYYY-MM-DD` 유효성 검사가 아니라, 파서 단계에서 다시 날짜 문자열로 검토된다.

### 4.3 중요한 차이

- 날짜는 `Date.parse()` 이용해 파싱하므로, 다른 필드와 엄격도가 다르다.
- 파서는 더 엄격한 해석을 추가해서, 화면에서 null/unknown으로 표현할 수 있게 한다.
- 즉 “서버에서 통과”와 “화면에서 의미 있게 해석”은 같은 기준이 아니다.

## 5. 스키마 불일치 데이터 처리 원칙

이 프로젝트는 불량 데이터를 전부 버리지 않고, 가능한 한 살려서 보여주는 방식이다.

### 5.1 버리는 경우

- 캠페인 응답은 `id`가 없으면 제외된다.
- 일별 성과 응답은 필수 필드 구조를 만족하지 않으면 제외된다.
- 날짜 파싱이 불가능한 일별 성과는 차트 집계에서 제외된다.

### 5.2 null로 유지하는 경우

- 캠페인명 누락
- 예산이 숫자가 아닌 경우
- 상태/매체가 허용 목록 밖인 경우
- `conversionsValue`가 `null`인 경우
- 일별 수치 필드가 `null`인 경우

### 5.3 의미를 바꾸는 경우

- 알 수 없는 매체는 `null`이 아니라 `알 수 없음`으로 도넛 차트에 노출된다.
- 캠페인명 누락은 테이블과 랭킹에서 `-` 또는 `이름 없음`으로 보인다.
- 지표 계산 불가 시 `null`을 유지하고, UI는 `-`로 표시한다.

## 6. 위젯별 데이터 해석

### 6.1 글로벌 필터 요약

- 전역 필터 결과로 조회된 캠페인 수와 일별 데이터 수를 표시한다.
- 이전 성공 데이터를 유지하면서, 재요청 실패 시 stale 메시지를 노출한다.

### 6.2 일별 추이 차트

- `buildDailyTrendSeries()`가 날짜별로 집계한다.
- 유효하지 않은 날짜 문자열은 제외한다.
- 합산 대상이 전혀 없으면 해당 지표는 `null`이다.
- 차트는 `connectNulls=false`라서 null 구간이 선으로 연결되지 않는다.
- 기본 활성 메트릭은 `노출수`, `클릭수`다.
- 최소 1개는 항상 활성 상태로 유지된다.

### 6.3 플랫폼별 성과 도넛

- 캠페인 플랫폼별로 메트릭을 합산한다.
- 수치가 `null`이면 `toSafeNumber()`에 의해 `0`으로 해석된다.
- 알 수 없는 플랫폼은 `알 수 없음` 슬라이스로 표시된다.
- 알려진 플랫폼 클릭은 글로벌 매체 필터와 양방향 연동된다.
- 알 수 없는 플랫폼은 필터 토글 대상이 아니다.

### 6.4 캠페인 랭킹 Top3

- 캠페인별 지표를 합산하고 선택한 메트릭으로 정렬한다.
- 선택한 메트릭 값이 `null`인 캠페인은 랭킹에서 제외된다.
- ROAS/CTR은 큰 값이 우선, CPC는 작은 값이 우선이다.
- 이름이 비어 있으면 `이름 없음`으로 표시한다.

### 6.5 캠페인 테이블

- 캠페인별 일간 성과를 다시 합산해서 `cost`, `CTR`, `CPC`, `ROAS`를 만든다.
- 분모가 0이거나 값이 없으면 `null`이다.
- `null`은 UI에서 `-`로 표시된다.
- 검색은 테이블에만 적용되고, 전역 필터와는 별개다.
- 정렬과 페이지네이션은 서버가 아닌 클라이언트에서 처리한다.

## 7. 실제 데이터 기준으로 보이는 현상

현재 `src/db.json`에는 다음과 같은 스키마 불일치 사례가 존재한다.

- 비표준 날짜 형식: `2026/04/12`
- 잘못된 상태: `stopped`, `running`
- 잘못된 플랫폼: `네이버`, `Facebook`, `facebook`
- 예산이 `null`이거나 문자열
- 캠페인명 누락
- 일간 성과 수치의 `null`

이 데이터는 다음처럼 보인다.

- 필터 단계에서 걸러짐
- `null`로 남아 지표 계산 불가
- `-`로 표시
- `알 수 없음`으로 표시

즉, 이 프로젝트는 strict reject보다 tolerant normalize에 가깝다.

## 8. 코드 기준 핵심 참조

- `src/shared/api/contracts/dashboard-data.ts`
- `src/app/mock/handlers.ts`
- `src/shared/api/mock/memory-db.ts`
- `src/entities/dashboard/api/fetch-dashboard-data.ts`
- `src/entities/global-filter/model/store.ts`
- `src/entities/global-filter/model/defaults.ts`
- `src/widgets/daily-trend-chart/model/use-daily-trend-chart-view-model.ts`
- `src/entities/daily-stat/lib/build-daily-trend-series.ts`
- `src/widgets/platform-performance-chart/model/use-platform-performance-chart-view-model.ts`
- `src/entities/platform-performance/lib/aggregate-platform-performance.ts`
- `src/widgets/campaign-ranking-top3/model/use-campaign-ranking-top3.ts`
- `src/entities/campaign-ranking/lib/build-campaign-ranking-top3.ts`
- `src/widgets/campaign-table/model/use-campaign-table-data.ts`
- `src/entities/campaign/lib/build-campaign-table-rows.ts`
