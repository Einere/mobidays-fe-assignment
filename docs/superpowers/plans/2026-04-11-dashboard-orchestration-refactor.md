# Dashboard Orchestration Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `src/App.tsx` 아래에서 여러 위젯이 각자 dashboard query를 구독하던 구조를 상위 orchestration으로 모으고, 기존 비즈니스 규칙은 그대로 유지한 채 렌더 fan-out, 워터폴, 파생 계산 중복을 줄인다.

**Architecture:** dashboard raw data는 App-level provider에서 한 번만 읽는다. 위젯은 raw query를 직접 구독하지 않고, shared snapshot과 pure derivation 결과만 소비한다. 계산식은 기존 pure function을 재사용하고, 상태 분기와 UI 결과는 그대로 유지한다.

**Tech Stack:** React 19, TypeScript, Vite, TanStack Query v5, Jotai, Testing Library, Vitest, existing FSD layout

---

## File Structure

- Modify: `src/entities/dashboard/api/fetch-dashboard-data.ts`
  - `AbortSignal`을 받아 하위 fetch로 전달한다.
- Modify: `src/entities/campaign/api/fetch-campaigns.ts`
  - stale request 취소를 위해 `fetch`에 `signal`을 전달한다.
- Modify: `src/entities/daily-stat/api/fetch-daily-stats.ts`
  - stale request 취소를 위해 `fetch`에 `signal`을 전달한다.
- Modify: `src/entities/dashboard/hooks/use-dashboard-data.ts`
  - queryFn에서 `signal`을 받아 fetch 함수로 넘긴다.
- Create: `src/entities/dashboard/model/dashboard-data-context.tsx`
  - dashboard raw data를 한 번만 구독하는 provider/context를 만든다.
- Create: `src/entities/dashboard/model/use-dashboard-derivations.ts`
  - dashboard raw data로부터 table/chart/ranking용 derived snapshot을 계산하는 pure builder와 hook wrapper를 제공한다.
- Modify: `src/entities/dashboard/index.ts`
  - provider/context와 derivation hook export를 정리한다.
- Modify: `src/App.tsx`
  - dashboard 섹션을 provider로 감싸고, 위젯은 shared source만 읽게 한다.
- Modify: `src/widgets/global-filter/ui/global-filter-summary.tsx`
  - local query를 제거하고 shared dashboard query를 읽는다.
- Modify: `src/widgets/daily-trend-chart/model/use-daily-trend-chart-view-model.ts`
  - local query를 제거하고 shared derivation 결과를 읽는다.
- Modify: `src/widgets/platform-performance-chart/model/use-platform-performance-chart-view-model.ts`
  - local query를 제거하고 shared derivation 결과를 읽는다.
- Modify: `src/widgets/campaign-ranking-top3/model/use-campaign-ranking-top3.ts`
  - local query를 제거하고 shared derivation 결과를 읽는다.
- Modify: `src/widgets/campaign-table/model/use-campaign-table-data.ts`
  - local query를 제거하고 shared derivation 결과를 읽는다.
- Modify: `src/widgets/campaign-table/ui/campaign-table-table.tsx`
  - columns와 row ReactNode 생성의 불필요한 churn을 줄인다.
- Modify: `src/widgets/global-filter/ui/global-filter-selection-controls.tsx`
  - platform option source를 stable reference로 정리한다.
- Modify: `src/entities/global-filter/model/platforms.ts`
  - platform option 배열을 module-level로 고정한다.
- Create: `src/entities/dashboard/api/__tests__/fetch-dashboard-data.test.ts`
  - signal 전달과 request 취소 가능성을 검증한다.
- Create: `src/entities/dashboard/model/__tests__/dashboard-data-context.test.tsx`
  - provider가 dashboard query를 한 번만 전달하는지 검증한다.
- Create: `src/entities/dashboard/model/__tests__/use-dashboard-derivations.test.ts`
  - shared derivation 결과가 기존 pure calculator와 동일한지 검증한다.
- Modify: `src/widgets/global-filter/ui/__tests__/global-filter-summary.test.tsx`
  - shared source 전환 후에도 loading/error/stale behavior가 유지되는지 확인한다.
- Modify: `src/widgets/daily-trend-chart/ui/__tests__/daily-trend-chart-card.test.tsx`
  - shared source 전환 후에도 chart/empty/error behavior가 유지되는지 확인한다.
- Modify: `src/widgets/platform-performance-chart/ui/__tests__/platform-performance-chart-card.test.tsx`
  - shared source 전환 후에도 chart/empty/error behavior가 유지되는지 확인한다.
- Modify: `src/widgets/campaign-ranking-top3/ui/__tests__/campaign-ranking-top3-card.test.tsx`
  - shared source 전환 후에도 chart/empty/error behavior가 유지되는지 확인한다.
- Modify: `src/widgets/campaign-table/ui/__tests__/campaign-table-card.test.tsx`
  - shared source 전환 후에도 loading/error/table behavior가 유지되는지 확인한다.
- Create: `src/widgets/global-filter/ui/__tests__/global-filter-selection-controls.test.tsx`
  - platform option source가 stable reference를 유지하는지 검증한다.

## Parallel Execution Strategy

- Worker A: `AbortSignal` 전파와 dashboard fetch/query option 수정, 관련 테스트를 담당한다.
- Worker B: dashboard provider/context와 shared derivation layer를 담당한다.
- Worker C: widget consumer migration을 담당한다.
- Worker D: table/filter churn 정리와 최종 검증을 담당한다.

작업 간 write scope가 겹치는 지점은 `src/entities/dashboard/index.ts`와 `src/App.tsx`이므로, provider/context와 widget migration은 순서를 맞춰 진행한다.

---

### Task 1: dashboard fetch에 AbortSignal을 연결하고 stale request를 취소 가능하게 만든다

**Files:**
- Modify: `src/entities/dashboard/hooks/use-dashboard-data.ts`
- Modify: `src/entities/dashboard/api/fetch-dashboard-data.ts`
- Modify: `src/entities/campaign/api/fetch-campaigns.ts`
- Modify: `src/entities/daily-stat/api/fetch-daily-stats.ts`
- Create: `src/entities/dashboard/api/__tests__/fetch-dashboard-data.test.ts`

- [ ] **Step 1: signal 전달을 검증하는 failing test를 작성한다**

```ts
import { describe, expect, it, vi } from "vitest";
import { fetchDashboardData } from "@/entities/dashboard/api/fetch-dashboard-data";
import { fetchCampaigns } from "@/entities/campaign/api/fetch-campaigns";
import { fetchDailyStats } from "@/entities/daily-stat/api/fetch-daily-stats";

vi.mock("@/entities/campaign/api/fetch-campaigns", () => ({
	fetchCampaigns: vi.fn(),
}));

vi.mock("@/entities/daily-stat/api/fetch-daily-stats", () => ({
	fetchDailyStats: vi.fn(),
}));

describe("fetchDashboardData", () => {
	it("passes the same AbortSignal to campaigns and daily stats requests", async () => {
		const signal = new AbortController().signal;

		vi.mocked(fetchCampaigns).mockResolvedValue([
			{
				id: "campaign-1",
			},
		]);
		vi.mocked(fetchDailyStats).mockResolvedValue([]);

		await fetchDashboardData(
			{
				dateRange: { startDate: "2026-04-01", endDate: "2026-04-30" },
				statuses: ["active"],
				platforms: ["Google"],
			},
			signal,
		);

		expect(vi.mocked(fetchCampaigns)).toHaveBeenCalledWith(
			expect.objectContaining({
				dateRange: { startDate: "2026-04-01", endDate: "2026-04-30" },
			}),
			signal,
		);
		expect(vi.mocked(fetchDailyStats)).toHaveBeenCalledWith(
			{
				startDate: "2026-04-01",
				endDate: "2026-04-30",
				campaignIds: ["campaign-1"],
			},
			signal,
		);
	});
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npm run test:run -- src/entities/dashboard/api/__tests__/fetch-dashboard-data.test.ts`

Expected: `FAIL` because `signal` is not threaded through yet.

- [ ] **Step 3: fetch 함수와 queryFn에 signal 파이프를 추가한다**

```ts
export async function fetchDashboardData(
	filter: GlobalFilterState,
	signal?: AbortSignal,
): Promise<DashboardData> {
	const campaigns = await fetchCampaigns(filter, signal);
	const dailyStats = await fetchDailyStats(
		{
			startDate: filter.dateRange.startDate,
			endDate: filter.dateRange.endDate,
			campaignIds: campaigns.map((campaign) => campaign.id),
		},
		signal,
	);

	return { campaigns, dailyStats };
}
```

```ts
export function getDashboardDataQueryOptions(filter: GlobalFilterState) {
	return {
		queryKey: createDashboardDataQueryKey(filter),
		queryFn: ({ signal }: { signal?: AbortSignal }) =>
			fetchDashboardData(filter, signal),
	};
}
```

```ts
async function fetchJson<T>(url: URL, signal?: AbortSignal): Promise<T> {
	const response = await fetch(url, { signal });

	if (!response.ok) {
		throw new Error(`Request failed: ${response.status}`);
	}

	return (await response.json()) as T;
}
```

- [ ] **Step 4: 테스트를 다시 실행해 통과를 확인한다**

Run: `npm run test:run -- src/entities/dashboard/api/__tests__/fetch-dashboard-data.test.ts`

Expected: `PASS`

---

### Task 2: dashboard raw data를 한 번만 구독하는 provider/context를 추가한다

**Files:**
- Create: `src/entities/dashboard/model/dashboard-data-context.tsx`
- Modify: `src/entities/dashboard/index.ts`
- Create: `src/entities/dashboard/model/__tests__/dashboard-data-context.test.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: provider/context의 failing test를 작성한다**

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DashboardDataProvider, useDashboardDataContext } from "@/entities/dashboard/model/dashboard-data-context";
import { useDashboardData } from "@/entities/dashboard/hooks/use-dashboard-data";

vi.mock("@/entities/dashboard/hooks/use-dashboard-data", () => ({
	useDashboardData: vi.fn(),
}));

function Consumer() {
	const { query } = useDashboardDataContext();

	return <div>{query.data?.campaigns.length ?? 0}</div>;
}

describe("DashboardDataProvider", () => {
	it("exposes one shared dashboard query result to descendants", () => {
		vi.mocked(useDashboardData).mockReturnValue({
			data: {
				campaigns: [],
				dailyStats: [],
			},
			error: null,
			isLoadingError: false,
			isPending: false,
			isRefetchError: false,
			isRefetching: false,
		} as never);

		const { getByText } = render(
			<DashboardDataProvider
				filter={{
					dateRange: { startDate: "2026-04-01", endDate: "2026-04-30" },
					statuses: ["active"],
					platforms: ["Google"],
				}}
			>
				<Consumer />
			</DashboardDataProvider>,
		);

		expect(getByText("0")).toBeInTheDocument();
	});
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npm run test:run -- src/entities/dashboard/model/__tests__/dashboard-data-context.test.tsx`

Expected: `FAIL` because the provider/context does not exist yet.

- [ ] **Step 3: provider/context를 최소 구현한다**

```tsx
const DashboardDataContext = createContext<DashboardDataContextValue | null>(null);

export function DashboardDataProvider({
	filter,
	children,
}: PropsWithChildren<{ filter: GlobalFilterState }>) {
	const query = useDashboardData(filter);

	return (
		<DashboardDataContext.Provider value={{ query }}>
			{children}
		</DashboardDataContext.Provider>
	);
}

export function useDashboardDataContext() {
	const context = useContext(DashboardDataContext);

	if (context === null) {
		throw new Error("DashboardDataProvider is required.");
	}

	return context;
}
```

- [ ] **Step 4: `src/App.tsx`에서 dashboard 섹션을 provider로 감싼다**

```tsx
const filter = useAtomValue(globalFilterAtom);

return (
	<DashboardDataProvider filter={filter}>
		{/* existing dashboard shell */}
	</DashboardDataProvider>
);
```

Expected: dashboard query subscription이 App 트리에서 한 번만 발생한다.

- [ ] **Step 5: provider export를 정리하고 테스트를 통과시킨다**

Run: `npm run test:run -- src/entities/dashboard/model/__tests__/dashboard-data-context.test.tsx`

Expected: `PASS`

---

### Task 3: shared derivation hook으로 위젯별 O(n) 파생 계산을 한 번에 묶는다

**Files:**
- Create: `src/entities/dashboard/model/use-dashboard-derivations.ts`
- Create: `src/entities/dashboard/model/__tests__/use-dashboard-derivations.test.ts`
- Modify: `src/widgets/global-filter/ui/global-filter-summary.tsx`
- Modify: `src/widgets/daily-trend-chart/model/use-daily-trend-chart-view-model.ts`
- Modify: `src/widgets/platform-performance-chart/model/use-platform-performance-chart-view-model.ts`
- Modify: `src/widgets/campaign-ranking-top3/model/use-campaign-ranking-top3.ts`
- Modify: `src/widgets/campaign-table/model/use-campaign-table-data.ts`

- [ ] **Step 1: shared derivation 결과를 고정하는 failing test를 작성한다**

```ts
import { describe, expect, it } from "vitest";
import { buildCampaignRankingTop3Candidates } from "@/entities/campaign-ranking/lib/build-campaign-ranking-top3";
import { buildCampaignTableRows } from "@/entities/campaign/lib/build-campaign-table-rows";
import { buildDailyTrendSeries } from "@/entities/daily-stat/lib/build-daily-trend-series";
import { aggregatePlatformPerformance } from "@/entities/platform-performance/lib/aggregate-platform-performance";
import { buildDashboardDerivations } from "@/entities/dashboard/model/use-dashboard-derivations";

const sampleData = {
	campaigns: [
		{
			id: "campaign-1",
			name: "Campaign A",
			status: "active",
			platform: "Google",
			startDate: "2026-04-01",
			endDate: "2026-04-30",
			rawPlatform: "Google",
		},
	],
	dailyStats: [
		{
			id: "daily-1",
			campaignId: "campaign-1",
			date: "2026-04-01",
			impressions: 100,
			clicks: 10,
			conversions: 2,
			cost: 1000,
			conversionsValue: 2000,
		},
	],
};

const sampleFilter = {
	dateRange: { startDate: "2026-04-01", endDate: "2026-04-30" },
	statuses: ["active"],
	platforms: ["Google"],
};

describe("buildDashboardDerivations", () => {
	it("reuses the same business rules as the current pure calculators", () => {
		expect(buildDashboardDerivations(sampleData, sampleFilter)).toEqual({
			tableRows: buildCampaignTableRows(sampleData),
			dailyTrendSeries: buildDailyTrendSeries(sampleData.dailyStats),
			platformPerformanceBase: aggregatePlatformPerformance({
				campaigns: sampleData.campaigns,
				dailyStats: sampleData.dailyStats,
				metricKey: "cost",
				selectedPlatforms: sampleFilter.platforms,
			}),
			campaignRankingCandidates: buildCampaignRankingTop3Candidates(sampleData),
		});
	});
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npm run test:run -- src/entities/dashboard/model/__tests__/use-dashboard-derivations.test.ts`

Expected: `FAIL` because the shared derivation export does not exist yet.

- [ ] **Step 3: pure builder와 memo wrapper를 추가한다**

```ts
export function buildDashboardDerivations(
	data: DashboardData | null,
	filter: GlobalFilterState,
) {
	if (data === null) {
		return null;
	}

	return {
		tableRows: buildCampaignTableRows(data),
		dailyTrendSeries: buildDailyTrendSeries(data.dailyStats),
		platformPerformanceBase: aggregatePlatformPerformance({
			campaigns: data.campaigns,
			dailyStats: data.dailyStats,
			metricKey: "cost",
			selectedPlatforms: filter.platforms,
		}),
		campaignRankingCandidates: buildCampaignRankingTop3Candidates(data),
	};
}

export function useDashboardDerivations(
	data: DashboardData | null,
	filter: GlobalFilterState,
) {
	return useMemo(
		() => buildDashboardDerivations(data, filter),
		[data, filter.platforms],
	);
}
```

Expected: business logic stays identical because the existing pure calculators remain the source of truth.

- [ ] **Step 4: widget hooks가 shared derivation hook을 읽도록 바꾼다**

```ts
const { query } = useDashboardDataContext();
const derivations = useDashboardDerivations(query.data ?? null, filter);
```

Expected: each widget can still render its own loading/error/empty states, but expensive scans run from one shared memoized source per dashboard update.

- [ ] **Step 5: shared derivation과 기존 widget 테스트를 함께 실행한다**

Run: `npm run test:run -- src/entities/dashboard/model/__tests__/use-dashboard-derivations.test.ts src/widgets/global-filter/ui/__tests__/global-filter-summary.test.tsx src/widgets/daily-trend-chart/ui/__tests__/daily-trend-chart-card.test.tsx src/widgets/platform-performance-chart/ui/__tests__/platform-performance-chart-card.test.tsx src/widgets/campaign-ranking-top3/ui/__tests__/campaign-ranking-top3-card.test.tsx src/widgets/campaign-table/ui/__tests__/campaign-table-card.test.tsx`

Expected: `PASS`

---

### Task 4: widget props와 렌더 구조를 정리해 불필요한 reconciliation을 줄인다

**Files:**
- Modify: `src/widgets/global-filter/ui/global-filter-selection-controls.tsx`
- Modify: `src/entities/global-filter/model/platforms.ts`
- Modify: `src/widgets/campaign-table/ui/campaign-table-table.tsx`
- Modify: `src/widgets/campaign-table/ui/campaign-table-card.tsx`
- Modify: `src/widgets/campaign-table/ui/campaign-table-status-dialog.tsx`
- Modify: `src/widgets/campaign-table/ui/campaign-create-dialog.tsx`
- Modify: `src/widgets/global-filter/ui/filter-chip-group.tsx`
- Modify: `src/widgets/global-filter/ui/filter-dropdown.tsx`
- Create: `src/widgets/global-filter/ui/__tests__/global-filter-selection-controls.test.tsx`

- [ ] **Step 1: filter option source의 stable reference를 검증하는 test를 작성한다**

```ts
import { describe, expect, it } from "vitest";
import {
	campaignPlatformOptions,
	getCampaignPlatformOptions,
} from "@/entities/global-filter/model/platforms";

describe("getCampaignPlatformOptions", () => {
	it("returns the shared module-level platform options array", () => {
		expect(getCampaignPlatformOptions()).toBe(campaignPlatformOptions);
	});
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npm run test:run -- src/entities/global-filter/model/__tests__/platforms.test.ts src/widgets/global-filter/ui/__tests__/global-filter-selection-controls.test.tsx`

Expected: `FAIL` only for the new stable-reference assertion until the code is updated.

- [ ] **Step 3: platform option 배열을 module-level로 고정한다**

```ts
export const campaignPlatformOptions = campaignPlatformValues.map((platform) => ({
	value: platform,
	label: platform,
}));

export function getCampaignPlatformOptions(): CampaignPlatformOption[] {
	return campaignPlatformOptions;
}
```

- [ ] **Step 4: campaign table의 columns와 row projection을 memo 경계 안으로 넣는다**

Move the existing `columns` array literal and row projection map into `useMemo` so unrelated parent state changes do not rebuild the entire column definition and ReactNode tree.

Expected: the table still renders the same cells and pagination controls, but `columns` and `tableRows` only re-materialize when table data or selection state changes.

- [ ] **Step 5: dialog subtree는 현재 동작을 유지한 채로, 실제 비용이 확인된 경우에만 추가 분리한다**

Keep the dialogs mounted only if the current form preservation behavior depends on that mount. If profiler data shows no measurable cost, do not split them further.

Expected: no UX regression from closing/opening dialogs, and no change to form reset semantics.

- [ ] **Step 6: table/filter churn 관련 테스트를 다시 실행한다**

Run: `npm run test:run -- src/entities/global-filter/model/__tests__/platforms.test.ts src/widgets/global-filter/ui/__tests__/global-filter-selection-controls.test.tsx src/widgets/campaign-table/ui/__tests__/campaign-table-table.test.tsx src/widgets/campaign-table/ui/__tests__/campaign-table-card.test.tsx`

Expected: `PASS`

---

### Task 5: 최종 검증과 문서 정리

**Files:**
- Modify: `docs/superpowers/plans/2026-04-11-dashboard-orchestration-refactor.md`

- [ ] **Step 1: 전체 test suite를 실행해 dashboard behavior가 유지되는지 확인한다**

Run: `npm run test:run`

Expected: `PASS`

- [ ] **Step 2: lint를 실행해 hook dependency와 import 정렬을 확인한다**

Run: `npm run lint`

Expected: `PASS`

- [ ] **Step 3: plan 문서의 scope와 task order를 마지막으로 점검한다**

Expected: 계획 범위는 dashboard 성능과 구조 정리로 한정되고, business logic이나 visible output 변경 요구가 포함되지 않는다.

