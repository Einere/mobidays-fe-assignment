# Mobidays Dashboard UX & 접근성 감사

- 상태: 완료
- 대상: `docs/mobidays_data_flow_analysis.md` 5.3 항목 기준
- 범위: 전역 필터, 플랫폼 도넛 차트, 캠페인 테이블, TOP3 랭킹
- 기준: 의미 변환 UX가 실제 접근성 계층까지 전달되는지 점검

## 완료 처리

- 상태: 완료
- 반영 내용: 테이블 정렬 상태 노출, 모바일 필터 accessible name 정리, 미싱 캠페인 선택 라벨 보강, 도넛 차트 포커스/터치 타겟 개선
- 검증: `npm run test:run -- src/shared/ui/__tests__/table.test.tsx src/entities/campaign/lib/__tests__/build-campaign-table-rows.test.ts src/widgets/campaign-table/ui/__tests__/campaign-table-table.test.tsx src/widgets/campaign-table/ui/__tests__/campaign-table-card.test.tsx src/widgets/global-filter/ui/__tests__/global-filter-bar.test.tsx src/widgets/platform-performance-chart/ui/__tests__/platform-performance-donut-chart.test.tsx`

## Anti-Patterns Verdict

- 판정: `pass`
- 과장된 그라데이션 텍스트, 글래스모피즘, 네온 다크 테마, 히어로 메트릭 카드 반복 같은 AI 슬롭 신호는 거의 보이지 않는다.
- 현재 화면들은 표준 대시보드 패턴에 가깝고, 디자인 자체보다 상태 전달과 접근성 계층에서 더 많은 개선 여지가 있다.

## Executive Summary

- 총 5건 발견
- High 1건, Medium 4건, Low 0건
- 핵심 이슈
  - 테이블 정렬 상태가 보조기술에 노출되지 않음
  - 모바일 필터 트리거가 현재 선택 요약을 숨김
  - 누락 캠페인명이 `- 선택`으로 노출되어 식별성이 깨짐
  - 도넛 차트 섹터의 포커스 가시성이 부족함
  - 모바일 터치 타겟이 전반적으로 작음

## Detailed Findings

### High Severity

#### 1. 정렬 상태 미노출

- Location: [src/widgets/campaign-table/ui/campaign-table-table.tsx](/Users/einere/WebstormProjects/mobidays-dashboard/src/widgets/campaign-table/ui/campaign-table-table.tsx#L47), [src/widgets/campaign-table/ui/campaign-table-table.tsx](/Users/einere/WebstormProjects/mobidays-dashboard/src/widgets/campaign-table/ui/campaign-table-table.tsx#L65)
- Severity: High
- Category: Accessibility
- Description: 정렬 가능한 헤더가 버튼과 시각적 화살표로만 상태를 보여주고, 현재 정렬 열/방향이 `aria-sort`나 동적 accessible name으로 전달되지 않는다.
- Impact: 스크린리더 사용자는 어떤 열이 정렬 중인지, 오름차순인지 내림차순인지 알 수 없다. 테이블 탐색의 핵심 상태가 빠져서 정렬 기능의 실사용성이 떨어진다.
- WCAG/Standard: WCAG 1.3.1, 4.1.2
- Recommendation: 정렬된 `th`에 `aria-sort`를 부여하거나, 활성 정렬 버튼의 이름에 현재 방향을 포함시킨다.
- Suggested command: `/clarify`

### Medium Severity

#### 2. 모바일 필터 트리거가 현재 선택 요약을 숨김

- Location: [src/widgets/global-filter/ui/filter-dropdown.tsx](/Users/einere/WebstormProjects/mobidays-dashboard/src/widgets/global-filter/ui/filter-dropdown.tsx#L54), [src/widgets/global-filter/ui/filter-dropdown.tsx](/Users/einere/WebstormProjects/mobidays-dashboard/src/widgets/global-filter/ui/filter-dropdown.tsx#L58), [src/widgets/global-filter/ui/filter-dropdown.tsx](/Users/einere/WebstormProjects/mobidays-dashboard/src/widgets/global-filter/ui/filter-dropdown.tsx#L60)
- Severity: Medium
- Category: Accessibility / UX
- Description: 버튼 안에는 `groupLabel`과 `selectedSummary`가 같이 보이지만, `aria-label={`${groupLabel} 필터 열기`}`가 이를 덮어써서 접근 가능한 이름에서 현재 선택 상태가 사라진다.
- Impact: 시각 사용자는 현재 필터 상태를 바로 읽을 수 있지만, 스크린리더 사용자는 “필터 열기”만 듣는다. `전체 3`, `선택 없음`, `Google 외 1` 같은 핵심 맥락이 빠진다.
- WCAG/Standard: WCAG 4.1.2, 2.4.6
- Recommendation: 트리거의 accessible name에 선택 요약을 포함하거나, `aria-describedby`로 현재 상태를 별도 노출한다.
- Suggested command: `/clarify`

#### 3. 미싱 캠페인명에서 체크박스 라벨이 `- 선택`으로 노출됨

- Location: [src/entities/campaign/lib/build-campaign-table-rows.ts](/Users/einere/WebstormProjects/mobidays-dashboard/src/entities/campaign/lib/build-campaign-table-rows.ts#L107), [src/widgets/campaign-table/ui/campaign-table-table.tsx](/Users/einere/WebstormProjects/mobidays-dashboard/src/widgets/campaign-table/ui/campaign-table-table.tsx#L131)
- Severity: Medium
- Category: Accessibility / UX
- Description: 테이블용 캠페인명이 없을 때 `"-"`로 정규화되고, 그 값이 그대로 체크박스 라벨 `"{row.name} 선택"`에 들어간다.
- Impact: 스크린리더에서 `- 선택`처럼 들려 어떤 행을 선택하는지 식별할 수 없다. 같은 데이터셋의 랭킹 위젯이 `이름 없음`으로 처리하는 것과도 일관되지 않는다.
- WCAG/Standard: WCAG 4.1.2, 2.4.6
- Recommendation: 선택 라벨에는 캠페인 ID, 기간, 상태 같은 추가 식별자를 넣고, 화면용 fallback `-`와 분리한다.
- Suggested command: `/normalize`

#### 4. 도넛 차트 섹터의 포커스 가시성 부족

- Location: [src/widgets/platform-performance-chart/ui/platform-performance-donut-chart.tsx](/Users/einere/WebstormProjects/mobidays-dashboard/src/widgets/platform-performance-chart/ui/platform-performance-donut-chart.tsx#L90), [src/widgets/platform-performance-chart/ui/platform-performance-donut-chart.tsx](/Users/einere/WebstormProjects/mobidays-dashboard/src/widgets/platform-performance-chart/ui/platform-performance-donut-chart.tsx#L228)
- Severity: Medium
- Category: Accessibility
- Description: 인터랙티브 섹터는 `role="button"`과 `tabIndex=0`으로 키보드 포커스가 가능하지만, 별도의 포커스 가시성 스타일이 없다. SVG 섹터 특성상 기본 포커스 링에 의존하기도 어렵다.
- Impact: 키보드 사용자는 현재 어떤 섹터에 포커스가 있는지 알아보기 어렵다. 이 차트는 실제 선택 동작까지 맡고 있어서, 포커스 가시성 부재가 조작 신뢰도를 떨어뜨린다.
- WCAG/Standard: WCAG 2.4.7
- Recommendation: 섹터 자체에 명확한 포커스 스타일을 주거나, legend 버튼 중심으로 재설계한다.
- Suggested command: `/polish`

#### 5. 모바일 터치 타겟이 너무 작음

- Location: [src/widgets/global-filter/ui/filter-dropdown.tsx](/Users/einere/WebstormProjects/mobidays-dashboard/src/widgets/global-filter/ui/filter-dropdown.tsx#L77), [src/widgets/global-filter/ui/filter-dropdown.tsx](/Users/einere/WebstormProjects/mobidays-dashboard/src/widgets/global-filter/ui/filter-dropdown.tsx#L94), [src/widgets/campaign-table/ui/campaign-table-table.tsx](/Users/einere/WebstormProjects/mobidays-dashboard/src/widgets/campaign-table/ui/campaign-table-table.tsx#L130), [src/widgets/campaign-table/ui/campaign-table-table.tsx](/Users/einere/WebstormProjects/mobidays-dashboard/src/widgets/campaign-table/ui/campaign-table-table.tsx#L170)
- Severity: Medium
- Category: Accessibility / Responsive
- Description: 모바일 필터 옵션 버튼은 `px-3 py-2` 수준이고, 테이블 체크박스는 `size-4`다. 둘 다 권장 터치 타겟 기준에 미달한다.
- Impact: 모바일에서 오조작 가능성이 높고, 필터 선택과 행 선택 같은 핵심 상호작용이 밀집된 화면에서 특히 불편하다.
- WCAG/Standard: WCAG 2.5.8 Target Size를 목표로 할 때 미달, 일반 모바일 사용성 저하
- Recommendation: 모바일에서는 버튼과 체크박스의 클릭 영역을 확장하고, 체크박스는 셀 전체 또는 label 래핑으로 히트 영역을 키운다.
- Suggested command: `/adapt`

## Patterns & Systemic Issues

- 의미가 바뀐 데이터의 표현이 위젯마다 조금씩 다르다. 테이블은 `-`, 랭킹은 `이름 없음`, 필터는 숫자 요약 중심이라 fallback semantics가 통일되어 있지 않다.
- 시각적으로는 잘 보이지만, 현재 상태나 선택 맥락이 보조기술에 빠지는 지점이 반복된다.
- 밀도 높은 대시보드 UI라서, 작은 클릭 타겟과 커스텀 SVG 인터랙션이 모바일/키보드 접근성의 취약점으로 이어진다.

## Positive Findings

- [src/widgets/global-filter/ui/date-range-fields.tsx](/Users/einere/WebstormProjects/mobidays-dashboard/src/widgets/global-filter/ui/date-range-fields.tsx#L25) 이후에서 날짜 입력과 오류 메시지가 `aria-describedby`, `aria-invalid`로 잘 연결되어 있다.
- [src/widgets/global-filter/ui/global-filter-summary.tsx](/Users/einere/WebstormProjects/mobidays-dashboard/src/widgets/global-filter/ui/global-filter-summary.tsx#L33) 이후는 `aria-live="polite"`로 결과 수량과 stale 상태를 알린다.
- [src/widgets/campaign-ranking-top3/model/campaign-ranking-top3-card-state.ts](/Users/einere/WebstormProjects/mobidays-dashboard/src/widgets/campaign-ranking-top3/model/campaign-ranking-top3-card-state.ts#L26) 이후는 누락 캠페인명을 `이름 없음`으로 정규화해 테이블보다 더 일관된 fallback을 제공한다.
- [src/widgets/campaign-ranking-top3/ui/campaign-ranking-top3-bar-chart.tsx](/Users/einere/WebstormProjects/mobidays-dashboard/src/widgets/campaign-ranking-top3/ui/campaign-ranking-top3-bar-chart.tsx#L52) 와 [src/widgets/platform-performance-chart/ui/platform-performance-donut-chart.tsx](/Users/einere/WebstormProjects/mobidays-dashboard/src/widgets/platform-performance-chart/ui/platform-performance-donut-chart.tsx#L207) 는 `sr-only` 요약 테이블을 함께 제공해서 차트 정보의 대체 경로를 마련했다.
- [src/widgets/global-filter/ui/filter-chip-group.tsx](/Users/einere/WebstormProjects/mobidays-dashboard/src/widgets/global-filter/ui/filter-chip-group.tsx#L24) 는 `fieldset`/`legend` 구조를 사용해 데스크톱 필터의 의미 구조가 깔끔하다.

## Recommendations by Priority

1. Immediate: 테이블 정렬 상태를 보조기술에 노출한다.
2. Short-term: 모바일 필터의 현재 선택 요약, 미싱 캠페인명 라벨, 도넛 차트 포커스 스타일을 정리한다.
3. Medium-term: 모바일 터치 타겟을 전체적으로 키우고, fallback 라벨 규칙을 위젯 간에 통일한다.
4. Long-term: `이름 없음`, `알 수 없음`, `-` 같은 의미 변환 규칙을 디자인 시스템 수준에서 표준화한다.

## Suggested Commands for Fixes

- `/clarify` to improve accessible names, sort state, and current-value exposure
- `/normalize` to make fallback semantics consistent across widgets
- `/polish` to improve focus visibility on custom chart interaction
- `/adapt` to enlarge mobile touch targets and responsive hit areas
- `/harden` if you want to make the data/interaction semantics more resilient overall

## 완료 처리

- 상태: 완료
- 반영 내용: 테이블 정렬 상태 노출, 모바일 필터 접근성 개선, 캠페인 선택 라벨 정규화, 도넛 차트 포커스/터치 타겟 개선
- 검증: `npm run test:run -- src/shared/ui/__tests__/table.test.tsx src/widgets/campaign-table/ui/__tests__/campaign-table-table.test.tsx src/widgets/global-filter/ui/__tests__/global-filter-bar.test.tsx src/widgets/platform-performance-chart/ui/__tests__/platform-performance-donut-chart.test.tsx src/entities/campaign/lib/__tests__/build-campaign-table-rows.test.ts`
- 결과: `5` files, `22` tests passed
