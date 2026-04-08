# 구현 시 주의 사항

과제 요구사항을 꼼꼼히 분석하면서 도출한 비즈니스 로직 및 데이터 처리 관련 주의사항입니다.

---

## 1. 테이블 "총 집행금액" 계산

`Campaign.budget`은 총 예산이고, 테이블 컬럼 "총 집행금액"은 **필터링된 기간의 `DailyStat.cost` 합산값**입니다. 테이블 렌더링 시 campaigns + dailyStats 조인이 필요하므로, `entities/daily-stat/metrics.ts`에 집계 함수를 두고 TanStack Query `select` 옵션으로 미리 가공합니다.

---

## 2. 신규 캠페인 지표 표시 처리

> **수정 이력**: AI가 초안에서 "등록 시 합성 DailyStat을 생성하여 집행금액을 테이블에 반영"하는 방식을 제안했으나, 과제에 해당 지침이 없으므로 사용자가 아래 방향으로 정정함.

과제 명세에 "신규 캠페인은 `daily_stats`가 없으므로, 테이블에서 지표는 0 또는 -으로 표시되어도 무방합니다"라고 명시되어 있습니다. 별도의 합성 DailyStat을 생성하지 않고, 집계 함수가 해당 캠페인의 dailyStats가 없을 경우 `null`을 반환하도록 처리합니다. 테이블 렌더링 시 `null`은 `"-"`으로 표시합니다.

모달 폼의 "집행 금액" 입력 필드는 실제 서비스 흐름을 반영한 UI 항목으로, 과제 내에서는 유효성 검증 목적으로만 사용합니다.

---

## 3. 집행 기간 필터 로직 (서버 사이드 처리)

> **수정 이력**: AI가 초안에서 "MSW 핸들러는 전체 데이터를 반환하고 클라이언트에서 필터링"하는 방식을 제안했으나, 사용자가 MSW 핸들러에 필터 로직을 추가하는 서버 사이드 방식으로 정정함.

MSW는 서버를 흉내내는 레이어이므로, 필터링 로직을 MSW 핸들러에 두는 것이 관심사 분리 관점에서 자연스럽습니다. 클라이언트는 쿼리 파라미터만 전달하고, TanStack Query query key에 필터 파라미터를 포함하는 정석적인 패턴을 그대로 적용합니다.

```
GET /campaigns?platform=Google&status=active
GET /daily_stats?startDate=2024-01-01&endDate=2024-01-31&campaignIds=1,2,3
```

필터 로직 자체는 `entities` 레이어의 순수 함수로 분리하고, MSW 핸들러에서 해당 함수를 호출하는 방식으로 구성합니다. 이렇게 하면 필터 로직을 단위 테스트할 수 있고 MSW 핸들러는 얇게 유지됩니다.

```
캠페인 필터 조건:
  campaign.startDate <= filterEnd
  AND (campaign.endDate >= filterStart OR campaign.endDate === null)
  AND (platforms가 비어있으면 전체 / 아니면 campaign.platform in platforms)
  AND (statuses가 비어있으면 전체 / 아니면 campaign.status in statuses)

dailyStat 필터 조건:
  dailyStat.campaignId in 필터링된 캠페인 IDs
  AND dailyStat.date >= filterStart
  AND dailyStat.date <= filterEnd
```

---

## 4. 파생 지표 예외 처리 (TDD 1순위)

```typescript
// entities/daily-stat/metrics.ts
calcCTR(impressions, clicks): number | null  // clicks=0 → null
calcCPC(cost, clicks): number | null         // clicks=0 → null
calcROAS(conversionsValue, cost): number | null  // cost=0 또는 conversionsValue=null → null
```

---

## 5. 데이터 정규화

과제 명세에서 "필드 값의 포맷이 다른 경우"를 명시적으로 경고하고 있습니다. db.json 데이터를 그대로 사용하지 않고, API 응답 수신 직후 정규화 레이어를 거쳐야 합니다.

확인이 필요한 항목:
- `date`, `startDate`, `endDate` 필드의 날짜 포맷 일관성 (YYYY-MM-DD 외 다른 포맷 혼재 가능)
- 숫자 필드가 문자열로 들어오는 경우 (`"1000"` vs `1000`)
- `status`, `platform` 필드의 대소문자 불일치 가능성

정규화는 `entities/*/api.ts`의 응답 파싱 단계에서 처리합니다.

---

## 6. 일별 추이 차트 데이터 집계

필터링된 여러 캠페인의 dailyStats를 **날짜 기준으로 합산**해야 합니다. 캠페인 단위가 아닌 날짜 단위로 그룹핑하여 차트에 렌더링합니다.

```
날짜별 집계:
  { date: '2024-01-01', impressions: 합산, clicks: 합산, ... }
```

---

## 7. 캠페인명 검색은 테이블에만 적용

과제 명세에 "검색: 캠페인명 실시간 검색 **(단, 테이블에만 적용)**"이 명시되어 있습니다. 캠페인명 검색 상태는 글로벌 필터 atom이 아닌 **테이블 위젯 로컬 상태**로 관리해야 합니다. 검색으로 인해 차트 데이터가 변경되어서는 안 됩니다.

---

## 8. 일괄 상태 변경 즉시 반영

체크박스 선택 후 드롭다운으로 상태 일괄 변경 시, 새로고침 없이 테이블에 즉시 반영되어야 합니다. MSW 핸들러의 인메모리 배열을 직접 업데이트한 뒤 TanStack Query `invalidateQueries`로 처리합니다.

---

## 9. 캠페인 등록 자동 설정값

모달 폼에서 사용자가 입력하지 않는 필드는 자동으로 설정합니다.

- `status`: `'active'`로 고정
- `id`: `crypto.randomUUID()`로 자동 생성 (별도 라이브러리 불필요)

---

## 10. 랭킹 차트 정렬 기준 (선택 구현)

ROAS, CTR, CPC 메트릭별 정렬 방향이 다릅니다.

| 메트릭 | 정렬 방향 | 이유 |
|---|---|---|
| ROAS | 내림차순 (높을수록 상위) | 광고 수익률이 높을수록 좋음 |
| CTR | 내림차순 (높을수록 상위) | 클릭률이 높을수록 좋음 |
| CPC | 오름차순 (낮을수록 상위) | 클릭당 비용이 낮을수록 효율적 |
