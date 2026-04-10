# 3.4 캠페인 등록 모달 설계

## 배경

`docs/mobidays_fe_assignment_guide.md`의 `3.4 캠페인 등록 모달`은 사용자가 새 캠페인을 생성하고, 별도 새로고침 없이 캠페인 목록과 대시보드에 즉시 반영되는 흐름을 요구한다. 현재 코드베이스는 이미 다음 구조를 갖고 있다.

- `db.json`을 원본으로 유지하고, 실행 중에는 MSW 메모리 DB를 사용한다.
- 대시보드 데이터는 `useDashboardData(filter)`로 조회하고 TanStack Query가 캐싱한다.
- 캠페인 관리 테이블의 상태 변경은 mutation 이후 query 재조회로 동기화한다.

따라서 캠페인 등록도 별도 로컬 병합 상태를 만들기보다, MSW 인메모리 `campaigns`에 신규 항목을 추가하고 기존 query 재조회 흐름에 편입하는 방식이 가장 자연스럽다.

## 목표

- `캠페인 등록` 버튼 클릭 시 등록 모달을 노출한다.
- 과제 명세의 필수 입력 필드와 유효성 검사를 구현한다.
- 등록 성공 시 `db.json` 원본 수정 없이 브라우저 메모리 DB에 캠페인을 추가한다.
- 성공 직후 테이블과 차트가 같은 데이터 소스를 기준으로 동시에 갱신되도록 한다.
- 신규 캠페인에 `daily_stats`가 없는 상태를 기존 집계 규칙 안에서 안전하게 처리한다.

## 비목표

- `db.json` 원본 파일 수정
- 새로고침 이후에도 유지되는 영속 저장소 연동
- 신규 캠페인 생성 시 `daily_stats` 초기 레코드 생성
- 등록 이후 별도의 온보딩, 상세 화면 이동, 후속 편집 흐름

## 핵심 결정

### 1. 등록 데이터는 MSW 메모리 DB에만 추가한다

- `src/db.json`은 읽기 전용 초기값으로 유지한다.
- 앱 실행 중 변경은 `memory-db.ts`의 `campaigns` 배열에만 반영한다.
- 새로고침 시 초기화 허용이라는 과제 명세를 그대로 따른다.

### 2. 화면 동기화는 query 재조회로 통일한다

- 등록 성공 후 테이블만 로컬 append 하지 않는다.
- `useDashboardData(filter)` 관련 query를 invalidate해서 `/campaigns`, `/daily_stats`를 다시 읽는다.
- 테이블과 차트는 같은 재조회 결과를 소비하므로 동기화 타이밍이 어긋나지 않는다.

### 3. `집행 금액`은 저장하지 않고 검증에만 사용한다

사용자가 `집행 금액`을 입력하더라도, 현재 제공 스키마의 `Campaign`에는 이 필드가 없다. 따라서 이 값은 등록 시점 유효성 검사에만 사용하고 메모리 DB에는 저장하지 않는다.

### 4. 신규 캠페인은 `daily_stats` 없이 생성한다

과제 명세대로 신규 캠페인은 `daily_stats`가 없는 상태로 생성한다. 이후 테이블 지표는 기존 집계/포맷 규칙에 따라 `0` 또는 `-`로 표현한다.

## 책임 경계

- `entities/campaign`
  - 생성 API 호출
  - mutation 훅
  - 생성 입력 검증/정규화
- `shared/api/mock`
  - 메모리 DB에 캠페인 추가
  - `POST /campaigns` 핸들러 제공
- `widgets/campaign-table`
  - 등록 버튼, 모달 UI, 폼 입력 상태, 제출 오케스트레이션
- `useDashboardData(filter)`
  - 등록 후 재조회 대상
  - 차트/테이블 공통 데이터 소스 유지

전역 필터와 등록 폼 상태는 섞지 않는다. 전역 필터는 어떤 대시보드 데이터를 보여줄지 결정하고, 등록 모달은 새 캠페인 생성만 담당한다.

## 사용자 흐름

1. 사용자가 `캠페인 등록` 버튼을 클릭한다.
2. 등록 모달이 열린다.
3. 사용자가 캠페인명, 광고 매체, 예산, 집행 금액, 시작일, 종료일을 입력한다.
4. 제출 시 필드 단위 유효성 검사를 수행한다.
5. 실패한 필드 하단에 에러 메시지를 노출한다.
6. 검증 통과 시 `POST /campaigns` mutation을 호출한다.
7. MSW 메모리 DB가 신규 캠페인을 `campaigns` 배열에 추가한다.
8. 성공 시 대시보드 query를 invalidate한다.
9. 테이블과 차트가 현재 전역 필터 기준으로 동시에 최신 결과를 반영한다.
10. 모달은 닫히고 로컬 폼 상태는 초기화된다.

## 데이터 계약

### 생성 입력

```ts
interface CreateCampaignInput {
	name: string;
	platform: "Google" | "Meta" | "Naver";
	budget: number;
	spend: number;
	startDate: string;
	endDate: string;
}
```

- `spend`는 검증용 입력이다.
- `status`와 `id`는 요청에서 받지 않는다.

### 메모리 DB 저장 형태

```ts
interface Campaign {
	id: string;
	name: string;
	platform: "Google" | "Meta" | "Naver";
	status: "active";
	budget: number;
	startDate: string;
	endDate: string | null;
}
```

- `status`는 항상 `active`로 자동 설정한다.
- `id`는 API 계층에서 고유하게 생성한다.
- `endDate`는 본 과제 입력 규칙상 필수이므로 일반적으로 문자열이 들어가지만, 기존 스키마와의 호환을 위해 타입은 `string | null`을 유지한다.

### 응답 형태

`POST /campaigns`는 생성된 `Campaign` 객체 전체를 반환한다.

```ts
type CreateCampaignResponse = Campaign;
```

## 유효성 검사 규칙

### 캠페인명

- 필수
- `trim()` 기준 2자 이상 100자 이하
- 공백만 입력 불가

에러 메시지:

- `캠페인명을 입력해주세요.`
- `캠페인명은 2자 이상 100자 이하로 입력해주세요.`

### 광고 매체

- 필수
- 허용값: `Google | Meta | Naver`

에러 메시지:

- `광고 매체를 선택해주세요.`

### 예산

- 필수
- 정수
- `100` 이상 `1_000_000_000` 이하

에러 메시지:

- `예산을 입력해주세요.`
- `예산은 100원 이상 10억 원 이하의 정수여야 합니다.`

### 집행 금액

- 필수
- 정수
- `0` 이상 `1_000_000_000` 이하
- `budget` 초과 불가

에러 메시지:

- `집행 금액을 입력해주세요.`
- `집행 금액은 0원 이상 10억 원 이하의 정수여야 합니다.`
- `집행 금액은 예산을 초과할 수 없습니다.`

### 시작일

- 필수
- 유효한 날짜 문자열

에러 메시지:

- `시작일을 선택해주세요.`

### 종료일

- 필수
- 유효한 날짜 문자열
- 과제 문구를 `endDate >= startDate`로 해석

에러 메시지:

- `종료일을 선택해주세요.`
- `종료일은 시작일과 같거나 이후여야 합니다.`

## 모달 상호작용 규칙

- 모달 오픈 시 첫 입력 필드에 포커스를 둔다.
- 제출 중에는 제출 버튼을 비활성화한다.
- 제출 중 중복 요청을 막는다.
- 필드 에러는 각 필드 하단에만 표시한다.
- 서버 실패나 예기치 않은 실패는 모달 공통 에러 영역에 표시한다.
- 성공 시 모달을 닫고, 입력값과 에러 상태를 초기화한다.
- 닫기 버튼이나 외부 닫기 동작 시 미제출 입력은 버리고 초기 상태로 되돌린다.

공통 에러 메시지 예시:

- `캠페인을 등록하지 못했습니다. 잠시 후 다시 시도해주세요.`

## 상태 동기화 규칙

### 등록 성공 이후 표시 여부

등록 성공은 “데이터 소스 반영”을 의미한다. 실제 화면 표시 여부는 현재 전역 필터에 따라 결정한다.

예를 들어:

- 현재 상태 필터에 `active`가 포함되지 않으면, 등록 성공 후 목록에 보이지 않아도 정상이다.
- 현재 매체 필터가 `Meta`만 선택된 상태에서 `Google` 캠페인을 등록하면 즉시 보이지 않아도 정상이다.
- 현재 집행 기간 필터와 신규 캠페인 기간이 겹치지 않으면 즉시 보이지 않아도 정상이다.

즉, “등록 성공 = 무조건 가시화”가 아니라 “등록 성공 = 메모리 DB 반영 후, 현재 필터 기준으로 재평가”다.

### 신규 캠페인의 지표 표현

신규 캠페인은 `daily_stats`가 없으므로 기존 계산 규칙을 그대로 따른다.

- 총 집행금액: 집계값 기준 `0` 또는 `null` 처리
- CTR: 계산 불가 시 `-`
- CPC: 계산 불가 시 `-`
- ROAS: 계산 불가 시 `-`

등록 폼의 `집행 금액` 입력값은 테이블 지표 초기값으로 사용하지 않는다.

## 권장 파일 구조

- Create: `src/entities/campaign/api/create-campaign.ts`
- Create: `src/entities/campaign/api/use-create-campaign.ts`
- Create: `src/entities/campaign/lib/validate-create-campaign.ts`
- Create: `src/entities/campaign/lib/build-create-campaign-payload.ts`
- Modify: `src/shared/api/mock/memory-db.ts`
- Modify: `src/shared/api/mock/handlers.ts`
- Create: `src/widgets/campaign-table/model/use-campaign-create-dialog.ts`
- Create: `src/widgets/campaign-table/ui/campaign-create-dialog.tsx`
- Modify: `src/widgets/campaign-table/ui/campaign-table-toolbar.tsx`
- Modify: `src/widgets/campaign-table/ui/campaign-table-card.tsx`

구조 선택 이유는 다음과 같다.

- API/검증 로직은 `entities`에 둬서 재사용과 테스트를 쉽게 한다.
- 모달 표시와 폼 입력 제어는 화면 관심사이므로 `widgets`에 둔다.
- 기존 캠페인 테이블 위젯의 진입점은 유지하되, 등록 기능을 별도 훅/다이얼로그로 분리해 파일 책임을 좁힌다.

## 테스트 범위

### 단위 테스트

- `validate-create-campaign`
  - 이름 길이 검증
  - 예산 범위/정수 검증
  - 집행 금액 범위/정수 검증
  - `spend <= budget`
  - `endDate >= startDate`

### 메모리 DB / API 테스트

- 메모리 DB에 캠페인 append
- `status=active` 자동 설정
- ID 자동 생성 및 중복 방지
- `POST /campaigns` 성공/실패 응답 처리

### mutation 테스트

- 성공 시 dashboard query invalidation
- 실패 시 에러 상태 유지

### UI 테스트

- `캠페인 등록` 버튼 클릭 시 모달 오픈
- 잘못된 입력 제출 시 필드별 에러 메시지 노출
- 정상 제출 시 모달 닫힘 및 폼 초기화
- 등록 후 현재 필터와 일치하면 테이블에 반영
- 등록 후 현재 필터와 불일치하면 성공은 유지하되 화면에 즉시 보이지 않을 수 있음

## 리스크와 대응

### 1. 필터와 등록 성공 UX의 충돌

사용자는 등록 성공 후 바로 행이 보이길 기대할 수 있다. 그러나 전역 필터에 따라 보이지 않는 것이 명세상 정상이다. 따라서 성공 피드백 문구는 “캠페인이 등록되었습니다”로 두되, 필요하면 현재 필터 영향 가능성을 짧게 보조 문구로 안내할 수 있다.

### 2. `집행 금액` 의미 혼동

입력 필드가 있지만 저장되지 않으므로 구현 중 혼동이 생길 수 있다. 검증용 입력이라는 점을 payload 변환 함수와 테스트에서 명확히 고정해야 한다.

### 3. ID 생성 책임 분산

UI와 API가 각각 ID를 만들기 시작하면 테스트와 유지보수가 복잡해진다. 생성 책임은 API 계층 하나로 고정한다.

## 최종 정리

`3.4 캠페인 등록 모달`은 “모달 폼 제출”보다 “기존 대시보드 데이터 흐름에 신규 캠페인 생성 기능을 안전하게 편입하는 일”에 가깝다. 따라서 구현의 중심은 다음 세 가지다.

- MSW 메모리 DB에 신규 `campaign`을 추가하는 생성 mutation
- 필드 단위 검증과 에러 노출이 분리된 로컬 폼 상태
- 등록 성공 후 query 재조회로 테이블과 차트를 함께 갱신하는 단일 동기화 경로

이 방향이면 `db.json` 원본 불변, 세션 내 유지, 새로고침 시 초기화 허용, 별도 새로고침 없는 즉시 반영이라는 과제 요구사항을 모두 만족할 수 있다.
