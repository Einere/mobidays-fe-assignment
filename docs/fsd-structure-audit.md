# FSD 구조 점검 리포트

작성 기준: 현재 저장소의 `src/entities`, `src/shared`, `src/widgets`, `src/app` 구조를 직접 점검한 결과를 정리했다.

## 요약

전체적으로는 `app / entities / widgets / shared` 레이어가 존재하고, UI 컴포넌트와 도메인 로직이 어느 정도 분리되어 있다.

다만 엄격한 FSD 기준으로 보면 아래 경계가 흐려져 있다.

- `shared/api/mock`가 도메인 지식을 직접 알고 있다.
- `entities/dashboard`가 다른 entity들의 공용 파서처럼 쓰이고 있다.
- 일부 슬라이스에서 `api`와 `hooks` 책임이 섞여 있다.
- 일부 widget model이 자기 slice의 `ui` 타입에 역의존한다.

## 조사 결과

### 1. `shared/api/mock`가 도메인 의존을 가진다

문제 파일:

- `src/shared/api/mock/memory-db.ts`
- `src/shared/api/mock/handlers.ts`

확인된 내용:

- `memory-db.ts`가 `entities/global-filter/model/types`를 직접 import한다.
- `handlers.ts`가 `entities/campaign/lib/create-campaign-schema`를 직접 import한다.
- `handlers.ts`가 `entities/global-filter/model/platforms`와 `entities/global-filter/model/types`에 의존한다.

판단:

- `shared`는 원칙적으로 도메인 비의존이어야 한다.
- 현재 구조는 mock 인프라가 특정 도메인 지식을 알고 있어서 shared 레이어의 순수성이 깨져 있다.

### 2. `entities/dashboard`가 공용 파서 허브처럼 쓰인다

문제 파일:

- `src/entities/dashboard/lib/parse-dashboard-data.ts`
- `src/entities/campaign/api/fetch-campaigns.ts`
- `src/entities/daily-stat/api/fetch-daily-stats.ts`
- `src/entities/campaign/lib/build-campaign-table-rows.ts`
- `src/entities/daily-stat/lib/build-daily-trend-series.ts`

확인된 내용:

- `campaign`과 `daily-stat`가 `entities/dashboard/lib/parse-dashboard-data.ts`를 직접 import한다.
- `dashboard`라는 이름인데 실제로는 raw response parsing contract를 여러 entity가 공유하는 형태다.
- `entities/dashboard/lib/parse-dashboard-data.ts`는 `src/shared/api/mock/types.ts`까지 참조한다.

판단:

- `dashboard`는 조립/화면 성격이 강한데, 현재는 다른 entity들의 공용 계약 저장소처럼 동작한다.
- 이 때문에 entity 간 결합도가 높아지고, slice 독립성이 떨어진다.

### 3. `api`와 `hooks`의 책임이 섞여 있다

문제 파일:

- `src/entities/campaign/api/use-create-campaign.ts`
- `src/entities/campaign/api/use-update-campaign-statuses.ts`
- `src/entities/dashboard/api/use-dashboard-data.ts`
- 실제 구현:
  - `src/entities/campaign/hooks/use-create-campaign.ts`
  - `src/entities/campaign/hooks/use-update-campaign-statuses.ts`
  - `src/entities/dashboard/hooks/use-dashboard-data.ts`

확인된 내용:

- `api/use-*.ts` 파일은 실제 로직이 아니라 `hooks`로의 re-export다.
- 파일명만 보면 hook이 api에 있는 것처럼 보이거나, 반대로 api와 hooks가 같은 역할을 하는 것처럼 보인다.

판단:

- 런타임 문제는 아니지만, 구조를 읽는 사람에게 혼동을 준다.
- public API는 slice root의 `index.ts`로 모으는 편이 더 일관적이다.

### 4. `model -> ui` 역의존이 있다

문제 파일:

- `src/widgets/campaign-ranking-top3/model/use-campaign-ranking-top3.ts`

확인된 내용:

- `CampaignRankingTop3DisplayRow`를 자기 slice의 `ui/campaign-ranking-top3-bar-chart`에서 가져온다.

판단:

- `model`이 `ui` 타입에 의존하는 것은 FSD 관점에서 방향이 거꾸로다.
- 해당 타입은 `model` 쪽으로 내려오거나 별도 공용 타입으로 분리하는 편이 맞다.

### 5. `shared/ui`는 대체로 괜찮지만 일부 이름은 앱 전용처럼 보인다

문제 파일:

- `src/shared/ui/sidebar.tsx`

확인된 내용:

- 코드상으로는 상위 레이어 의존이 없다.
- 다만 이름과 용도가 dashboard shell에 강하게 맞아 있어서, 범용 shared 컴포넌트처럼 읽히지 않을 수 있다.

판단:

- hard violation은 아니다.
- 다만 범용성에 대한 팀 합의가 없다면 별도 정리가 필요하다.

## 개선 방안

### 우선순위 1: `shared/api/mock` 분리

목표:

- mock 인프라가 도메인 타입을 직접 알지 않게 만든다.

권장 방향:

- `src/db.json`을 mock 전용 위치로 옮긴다.
- `shared/api/mock` 안의 domain-aware 로직을 최소화한다.
- 도메인별 mock 계약이 필요하면 `entities`가 아니라 별도 mock schema/adapter 계층으로 분리한다.

가능한 정리 예시:

- `src/shared/api/mock/types.ts`는 진짜 raw fixture 계약만 남긴다.
- 도메인별 검증/변환은 `entities` 쪽이나 별도 adapter 모듈로 옮긴다.

### 우선순위 2: `dashboard`의 raw parsing 책임 재배치

목표:

- `entities/dashboard`가 다른 entity의 공용 parser처럼 쓰이지 않게 한다.

권장 방향:

- `parse-dashboard-data.ts`가 실제로 공용 raw parser라면 더 중립적인 위치로 옮긴다.
  - 예: `shared/api` 아래의 parser/adapter 계층
  - 또는 `entities/dashboard` 내부에서만 쓰는 조립용 로직으로 축소
- `campaign`과 `daily-stat`는 dashboard 내부 구현을 직접 참조하지 않도록 한다.

판단 기준:

- 여러 entity가 함께 쓰는 변환 로직이면 `dashboard`가 아니라 더 범용적인 위치가 맞다.
- dashboard 전용 조립 로직이면 외부 entity가 그 내부를 직접 import하지 못하게 막아야 한다.

### 우선순위 3: slice public API 정리

목표:

- deep import를 줄이고, slice 경계를 분명하게 만든다.

권장 방향:

- `src/entities/*/index.ts`를 두고 외부는 그 진입점만 보게 한다.
- `api/use-*.ts` 같은 re-export 파일은 `index.ts`로 흡수하거나 역할을 명확히 분리한다.
- `hooks`는 구현 세그먼트로 유지하되, 공개 경로는 하나로 정리한다.

### 우선순위 4: `model -> ui` 역의존 제거

목표:

- model이 UI 파일 타입에 의존하지 않도록 한다.

권장 방향:

- `CampaignRankingTop3DisplayRow`를 `model`로 이동한다.
- 또는 `model`에서 반환하는 기본 DTO를 별도 타입 파일로 분리한다.

### 우선순위 5: 공용 상수와 타입 중복 정리

목표:

- 같은 도메인 값을 여러 곳에서 다시 정의하지 않는다.

권장 방향:

- `entities/global-filter/model/platforms.ts`의 `campaignPlatformValues`를 플랫폼 원천 정의로 유지한다.
- `entities/campaign/lib/create-campaign-schema.ts`처럼 동일한 플랫폼 목록을 다시 정의하는 부분은 재사용하도록 바꾼다.

## 권장 작업 순서

1. `shared/api/mock`의 도메인 의존 제거
2. `entities/dashboard`의 parser 역할 재정의
3. `entities/*`의 public API 정리
4. `widgets/campaign-ranking-top3`의 `model -> ui` 역의존 제거
5. 공용 상수/타입 중복 정리

## 최종 판단

이 저장소는 FSD 레이어를 “전반적으로는” 따르고 있지만, 엄격하게 보면 몇 가지 핵심 경계가 흐려져 있다.

가장 중요한 건 다음 두 가지다.

- `shared`가 도메인 지식을 갖지 않도록 되돌리는 것
- `entities/dashboard`를 공용 계약 허브처럼 쓰는 구조를 정리하는 것

이 두 가지를 정리하면, 나머지 deep import와 혼합 책임 문제는 훨씬 다루기 쉬워진다.

## 개선 진행 상태

- [x] `shared/api/mock`의 raw 계약을 `shared/api/contracts`로 분리했다.
- [x] `entities/dashboard`의 raw parsing 로직을 `shared/api/contracts/dashboard-data.ts`로 이동했다.
- [x] `campaign-ranking-top3`의 `model -> ui` 역의존을 제거했다.
- [x] 관련 테스트를 갱신하고 통과시켰다.
- [x] `api/use-*.ts`와 `hooks/`의 public API 혼합을 정리하고 `entities/*/index.ts`를 canonical entrypoint로 만들었다.
- [x] MSW domain handlers를 `app/mock`로 옮겨 `shared`를 순수 저장소로 축소했다.
- [ ] `entities/global-filter/lib/date-range.ts`의 책임을 더 쪼갠다.

## 이 프로젝트의 특수한 전제와 보완 방향

이 프로젝트는 과제 성격상 `db.json`을 직접 오염시키지 않으면서도 실제 서비스처럼 동작해야 한다.
그래서 MSW 인메모리 DB를 수정하는 방식은 기능적으로 타당하다.

즉, 문제는 "mock이 비즈니스 로직을 아는 것" 자체가 아니라,
그 로직이 `shared` 안에 들어가서 shared 레이어가 도메인에 잠식되는 점이다.

### 권장 분리 원칙

1. `shared`

- 역할: 순수한 공통 인프라
- 허용: 인메모리 저장소, 공통 fetch helper, clone/reset 유틸, transport 계약
- 금지: campaign/global-filter 같은 도메인 규칙 직접 참조

2. `entities`

- 역할: 도메인 규칙, 검증, 변환, 타입 계약
- 허용: campaign 생성 스키마, status 변경 규칙, dashboard 데이터 파싱 같은 도메인별 로직
- 책임: mock이 필요한 도메인 계약을 public API로 제공

3. `app` 또는 `app/mock`

- 역할: MSW를 조립하고 실제 데이터 흐름을 구성하는 곳
- 허용: 어떤 handler를 붙일지, 어떤 seed를 쓸지, 어떤 route를 어떤 도메인 로직으로 처리할지

### 현재 구조에 맞는 개선 방향

#### 1. `shared/api/mock`는 저장소만 맡기기

현재 `shared/api/mock/memory-db.ts`와 `shared/api/mock/handlers.ts`는 도메인 규칙까지 같이 들고 있다.
이 구조를 다음처럼 바꾸는 것이 좋다.

- `shared`는 DB 읽기/쓰기/리셋/clone 같은 저장소 책임만 가진다.
- 도메인별 검증과 변환은 `app/mock` 또는 `entities/*`로 옮긴다.

#### 2. 도메인별 MSW 핸들러는 `app/mock` 또는 `entities/*/mock`로 이동

예시:

- `app/mock/handlers/campaign.ts`
- `app/mock/handlers/daily-stat.ts`
- `app/mock/handlers/global-filter.ts`

이렇게 두면 mock이 비즈니스 로직을 아는 것은 유지하면서도, 그 책임이 shared로 새지 않는다.

#### 3. raw transport 타입은 `mock` 타입이 아니라 `contract` 타입으로 분리

현재는 `src/shared/api/mock/types.ts`가 사실상 응답 계약 역할을 하고 있다.
이 역할은 `mock`이라는 이름보다 `contract`나 `schema`가 더 맞다.

권장 방향:

- `shared/api/mock/types.ts`를 최소화하거나 이동한다.
- `shared/api/contracts` 또는 `shared/api/schema` 같은 위치에 raw 계약 타입을 둔다.
- `entities`는 mock 구현이 아니라 계약을 보게 한다.

#### 4. `dashboard`는 공용 parser 허브인지, 전용 조립 레이어인지 다시 결정

`entities/dashboard/lib/parse-dashboard-data.ts`는 실제로 여러 entity가 쓰는 공용 변환소처럼 동작한다.

선택지는 두 가지다.

- 선택 A: 공용 transport parser로 승격해서 `shared/api/contracts` 계층으로 옮긴다.
- 선택 B: dashboard 전용 조립 로직으로 축소하고, campaign/daily-stat는 자기 도메인 파서를 갖게 한다.

이 저장소의 현재 형태를 보면 선택 A가 더 자연스럽다.

### 실무적 정리

- mock이 비즈니스 로직을 아는 건 허용 가능하다.
- 다만 그 로직을 `shared`에 두지 말고, `app/mock`이나 `entities`로 옮겨야 한다.
- 이렇게 하면 `db.json`은 그대로 두면서도, FSD 경계는 더 명확해진다.
