# TODO 검토 정리

대상: 프로젝트 내 TODO 중 실제로 검토 가치가 있는 항목만 정리함.

제외한 항목:
- `shared/api`로 통째 이동
- `shared/store`로 통째 이동
- `shared/lib`로 통째 이동

## 우선 실행 대상

### 1. 공용 Dialog 사용으로 정리
- 파일: `src/widgets/campaign-table/ui/campaign-table-status-dialog.tsx`
- 판단: 타당함
- 이유: `src/shared/ui/dialog.tsx`에 이미 공용 래퍼가 있어서 Radix primitive를 직접 다시 조립할 필요가 적다.
- 권장 방향: 공용 `Dialog`/`DialogContent`/`DialogFooter` 조합으로 교체하고, 상태 변경 다이얼로그의 스타일만 얇게 덮는다.

### 2. 대시보드 fetch 책임 분리
- 파일: `src/entities/dashboard/api/fetch-dashboard-data.ts`
- 판단: 타당함
- 이유: 현재는 대시보드 오케스트레이션 안에서 캠페인 조회와 일간 성과 조회가 함께 섞여 있다.
- 권장 방향: 캠페인 fetch와 일간 성과 fetch를 각각 해당 엔티티 쪽으로 분리하고, 대시보드 쪽은 조합만 담당하게 한다.

### 3. 대시보드 파싱 로직 위치 조정
- 파일: `src/entities/dashboard/api/parse-dashboard-data.ts`
- 판단: 타당함
- 이유: 파싱/정규화는 네트워크 API 구현보다 도메인 정제 로직에 가깝다.
- 권장 방향: `entities/dashboard/lib`로 이동하고, 순수 파싱 함수만 남긴다.

### 4. 동기화 중 UI의 레이아웃 시프트 제거
- 파일: `src/widgets/daily-trend-chart/ui/daily-trend-chart-card.tsx`
- 판단: 타당함
- 이유: `동기화 중` 텍스트가 나타났다 사라지며 카드 레이아웃이 흔들릴 수 있다.
- 권장 방향: 헤더 영역에 고정 슬롯을 두거나, 최소 높이를 확보하거나, 상태 배지를 항상 같은 위치에 둔다.

## 구조 개선 후보

### 5. 캠페인 mutation 훅 위치 정리
- 파일:
  - `src/entities/campaign/api/use-create-campaign.ts`
  - `src/entities/campaign/api/use-update-campaign-statuses.ts`
- 판단: 조건부 타당함
- 이유: `use-*` 훅이 `api` 폴더에 있어 역할이 약간 어색하다.
- 권장 방향: `entities/campaign/hooks` 또는 `entities/campaign/model`로 이동한다.
- 우선순위: 중간

### 6. 대시보드 query key / options 구조 정리
- 파일: `src/entities/dashboard/api/use-dashboard-data.ts`
- 판단: 부분적으로 타당함
- 이유: query key builder는 이미 분리되어 있고, 동일 의미 필터에 대해 안정적으로 동작한다.
- 권장 방향: 파일 위치만 정리할지, query options까지 함께 묶을지 결정한다.
- 우선순위: 낮음

### 7. 플랫폼 성과 집계의 범용 헬퍼 분리
- 파일: `src/entities/platform-performance/lib/aggregate-platform-performance.ts`
- 판단: 부분적으로 타당함
- 이유: `toSafeNumber` 같은 헬퍼는 재사용 가능하지만, 집계 함수 자체는 도메인 전용이다.
- 권장 방향: 정말 공용인 보조 함수만 분리하고, 집계 로직은 현재 엔티티에 유지한다.
- 우선순위: 낮음

## 결론

이 TODO들은 전부 동일한 급은 아니다.

- 지금 손볼 것: 공용 Dialog, dashboard fetch, dashboard parse, daily trend sync UI
- 구조 개선 후보: campaign mutation 훅, dashboard query key/options, 범용 헬퍼 분리
- 보류 판단: 엔티티 전용 로직을 억지로 shared로 올리는 방향
