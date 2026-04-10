# Campaign Ranking Top3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 글로벌 필터 결과를 기준으로 ROAS / CTR / CPC 상위 3개 캠페인을 안정적으로 보여주는 바 차트 위젯을 추가한다.

**Architecture:** 캠페인 랭킹 계산은 `entities/campaign-ranking`의 순수 함수에서 처리하고, 메트릭 토글과 차트 렌더링은 `widgets/campaign-ranking-top3`에서 담당한다. 데이터는 기존 `useDashboardData(filter)` 결과를 그대로 사용하고, 랭킹은 필터 결과를 다시 캠페인 단위로 집계한 뒤 계산 가능한 값만 남겨 상위 3개를 고른다. 표시 포맷은 기존 `entities/campaign/lib/format-campaign-table.ts`를 재사용해 캠페인 현황 테이블과 완전히 통일한다.

**Tech Stack:** React 19, TypeScript, Jotai, TanStack Query v5, Recharts v3, Vitest, Testing Library, existing shared chart primitives

---

## File Structure

- Create: `src/entities/campaign-ranking/model/types.ts`
  - 랭킹 메트릭 키, 집계 결과 타입, rankable row 타입 정의
- Create: `src/entities/campaign-ranking/lib/build-campaign-ranking-top3.ts`
  - 캠페인별 ROAS / CTR / CPC 계산, 동점 처리, Top3 선별
- Create: `src/entities/campaign-ranking/lib/__tests__/build-campaign-ranking-top3.test.ts`
  - 0 나눗셈 제외, 동점 시 입력 순서 유지, 3개 미만 처리 검증
- Create: `src/widgets/campaign-ranking-top3/model/campaign-ranking-metrics.ts`
  - 토글 정의, 기본값, 테이블 포맷 재사용 헬퍼
- Create: `src/widgets/campaign-ranking-top3/model/__tests__/campaign-ranking-metrics.test.ts`
  - 기본 메트릭과 포맷 규칙 검증
- Create: `src/widgets/campaign-ranking-top3/ui/campaign-ranking-top3-bar-chart.tsx`
  - Recharts BarChart 렌더링, 순위 라벨, tooltip
- Create: `src/widgets/campaign-ranking-top3/ui/campaign-ranking-top3-card.tsx`
  - query 구독, 메트릭 토글, 상태 분기, 차트 카드 조합
- Create: `src/widgets/campaign-ranking-top3/ui/__tests__/campaign-ranking-top3-card.test.tsx`
  - 기본값, 토글, 정렬 방향, N/A 제외, App 배치 검증
- Modify: `src/App.tsx`
  - `PlatformPerformanceChartCard`와 `CampaignRankingTop3Card`를 같은 섹션에 배치하고, 모바일은 세로 스택 / 데스크탑은 2열로 표시

### Task 1: Build The Pure Campaign Ranking Aggregation

**Files:**
- Create: `src/entities/campaign-ranking/model/types.ts`
- Create: `src/entities/campaign-ranking/lib/build-campaign-ranking-top3.ts`
- Create: `src/entities/campaign-ranking/lib/__tests__/build-campaign-ranking-top3.test.ts`

- [ ] **Step 1: Write the failing aggregation tests**

```ts
import { describe, expect, it } from "vitest";
import { buildCampaignRankingTop3 } from "@/entities/campaign-ranking/lib/build-campaign-ranking-top3";

describe("buildCampaignRankingTop3", () => {
	it("returns the top 3 valid campaigns and keeps tied values in input order", () => {
		const result = buildCampaignRankingTop3({
			campaigns: [
				{ id: "c-1", name: "Alpha", platform: "Google" },
				{ id: "c-2", name: null, platform: "Meta" },
				{ id: "c-3", name: "Gamma", platform: "Naver" },
				{ id: "c-4", name: "Delta", platform: "Google" },
			],
			dailyStats: [
				{ id: "d-1", campaignId: "c-1", impressions: 100, clicks: 10, conversions: 2, cost: 1000, conversionsValue: 3000 },
				{ id: "d-2", campaignId: "c-2", impressions: 100, clicks: 10, conversions: 2, cost: 1000, conversionsValue: 3000 },
				{ id: "d-3", campaignId: "c-3", impressions: 50, clicks: 0, conversions: 1, cost: 700, conversionsValue: 1400 },
				{ id: "d-4", campaignId: "c-4", impressions: 200, clicks: 20, conversions: 4, cost: 2000, conversionsValue: 5000 },
			],
			metricKey: "roas",
		});

		expect(result.map((row) => row.campaignId)).toEqual(["c-1", "c-2", "c-4"]);
		expect(result.map((row) => row.rank)).toEqual([1, 2, 3]);
	});

	it("excludes campaigns that cannot be ranked because the selected metric is N/A", () => {
		const result = buildCampaignRankingTop3({
			campaigns: [{ id: "c-1", name: "Zero Clicks", platform: "Google" }],
			dailyStats: [
				{ id: "d-1", campaignId: "c-1", impressions: 100, clicks: 0, conversions: 0, cost: 1000, conversionsValue: 0 },
			],
			metricKey: "cpc",
		});

		expect(result).toEqual([]);
	});
});
```

- [ ] **Step 2: Run the test to confirm it fails**

Run: `npm run test:run -- src/entities/campaign-ranking/lib/__tests__/build-campaign-ranking-top3.test.ts`

Expected: fail because the module and helper types do not exist yet.

- [ ] **Step 3: Implement the aggregation model and pure function**

```ts
// src/entities/campaign-ranking/model/types.ts
export type CampaignRankingMetricKey = "roas" | "ctr" | "cpc";

export interface CampaignRankingSourceCampaign {
	id: string;
	name: string | null;
	platform?: string | null;
	status?: string | null;
	budget?: number | null;
	startDate?: string | null;
	endDate?: string | null;
}

export interface CampaignRankingSourceDailyStat {
	campaignId: string;
	date?: string | null;
	impressions: number | null;
	clicks: number | null;
	conversions?: number | null;
	cost: number | null;
	conversionsValue: number | null;
}

export interface CampaignRankingCandidate {
	campaignId: string;
	campaignName: string | null;
	value: number;
	sourceIndex: number;
}

export interface CampaignRankingTop3Row extends CampaignRankingCandidate {
	rank: 1 | 2 | 3;
}
```

```ts
// src/entities/campaign-ranking/lib/build-campaign-ranking-top3.ts
import type {
	CampaignRankingMetricKey,
	CampaignRankingSourceCampaign,
	CampaignRankingSourceDailyStat,
	CampaignRankingTop3Row,
} from "@/entities/campaign-ranking/model/types";

function sumMetric(
	stats: CampaignRankingSourceDailyStat[],
	key: "impressions" | "clicks" | "cost" | "conversionsValue",
) {
	return stats.reduce((sum, stat) => {
		const value = stat[key];
		return typeof value === "number" && Number.isFinite(value) ? sum + value : sum;
	}, 0);
}

function calculateMetricValue(
	stats: CampaignRankingSourceDailyStat[],
	metricKey: CampaignRankingMetricKey,
) {
	const impressions = sumMetric(stats, "impressions");
	const clicks = sumMetric(stats, "clicks");
	const cost = sumMetric(stats, "cost");
	const conversionsValue = sumMetric(stats, "conversionsValue");

	if (metricKey === "ctr") {
		return impressions === 0 ? null : (clicks / impressions) * 100;
	}

	if (metricKey === "cpc") {
		return clicks === 0 ? null : cost / clicks;
	}

	return cost === 0 ? null : (conversionsValue / cost) * 100;
}

export function buildCampaignRankingTop3({
	campaigns,
	dailyStats,
	metricKey,
}: {
	campaigns: CampaignRankingSourceCampaign[];
	dailyStats: CampaignRankingSourceDailyStat[];
	metricKey: CampaignRankingMetricKey;
}): CampaignRankingTop3Row[] {
	const dailyStatsByCampaignId = new Map<string, CampaignRankingSourceDailyStat[]>();

	for (const dailyStat of dailyStats) {
		const currentStats = dailyStatsByCampaignId.get(dailyStat.campaignId) ?? [];
		currentStats.push(dailyStat);
		dailyStatsByCampaignId.set(dailyStat.campaignId, currentStats);
	}

	const rankableRows = campaigns.flatMap((campaign, sourceIndex) => {
		const campaignStats = dailyStatsByCampaignId.get(campaign.id) ?? [];
		const value = calculateMetricValue(campaignStats, metricKey);

		if (value === null) {
			return [];
		}

		return [{
			campaignId: campaign.id,
			campaignName: campaign.name ?? null,
			value,
			sourceIndex,
		}];
	});

	const direction = metricKey === "cpc" ? 1 : -1;

	return [...rankableRows]
		.sort((left, right) => {
			const comparison = (left.value - right.value) * direction;
			if (comparison !== 0) {
				return comparison;
			}

			return left.sourceIndex - right.sourceIndex;
		})
		.slice(0, 3)
		.map((row, index) => ({
			...row,
			rank: (index + 1) as 1 | 2 | 3,
		}));
}
```

- [ ] **Step 4: Run the test and confirm the aggregation passes**

Run: `npm run test:run -- src/entities/campaign-ranking/lib/__tests__/build-campaign-ranking-top3.test.ts`

Expected: pass with stable ordering, metric-specific sorting, and N/A exclusion.

- [ ] **Step 5: Add a focused edge-case test for empty rankable input**

```ts
it("returns an empty array when every campaign is unrunnable", () => {
	const result = buildCampaignRankingTop3({
		campaigns: [
			{ id: "c-1", name: "A", platform: "Google" },
			{ id: "c-2", name: "B", platform: "Meta" },
		],
		dailyStats: [
			{ id: "d-1", campaignId: "c-1", impressions: 0, clicks: 0, conversions: 0, cost: 0, conversionsValue: 0 },
			{ id: "d-2", campaignId: "c-2", impressions: 0, clicks: 0, conversions: 0, cost: 0, conversionsValue: 0 },
		],
		metricKey: "roas",
	});

	expect(result).toHaveLength(0);
});
```

### Task 2: Build Metric Definitions And The Ranking Card UI

**Files:**
- Create: `src/widgets/campaign-ranking-top3/model/campaign-ranking-metrics.ts`
- Create: `src/widgets/campaign-ranking-top3/ui/campaign-ranking-top3-bar-chart.tsx`
- Create: `src/widgets/campaign-ranking-top3/ui/campaign-ranking-top3-card.tsx`
- Create: `src/widgets/campaign-ranking-top3/ui/__tests__/campaign-ranking-top3-card.test.tsx`

- [ ] **Step 1: Write the failing metric-definition test**

```ts
import { describe, expect, it } from "vitest";
import {
	campaignRankingMetricDefinitions,
	defaultCampaignRankingMetricKey,
	formatCampaignRankingMetricValue,
} from "@/widgets/campaign-ranking-top3/model/campaign-ranking-metrics";

describe("campaignRankingMetricDefinitions", () => {
	it("defaults to ROAS and exposes the three ranking metrics in order", () => {
		expect(defaultCampaignRankingMetricKey).toBe("roas");
		expect(campaignRankingMetricDefinitions.map((metric) => metric.key)).toEqual([
			"roas",
			"ctr",
			"cpc",
		]);
	});

	it("formats values with the same rules as the campaign table", () => {
		expect(formatCampaignRankingMetricValue("roas", 12.345)).toBe("12.35%");
		expect(formatCampaignRankingMetricValue("ctr", 1.2)).toBe("1.2%");
		expect(formatCampaignRankingMetricValue("cpc", 123456)).toBe("₩123,456");
	});
});
```

- [ ] **Step 2: Run the test to confirm it fails**

Run: `npm run test:run -- src/widgets/campaign-ranking-top3/model/__tests__/campaign-ranking-metrics.test.ts`

Expected: fail because the ranking metric module does not exist yet.

- [ ] **Step 3: Implement metric definitions and formatting on top of the existing table helper**

```ts
// src/widgets/campaign-ranking-top3/model/campaign-ranking-metrics.ts
import { formatCampaignMetric } from "@/entities/campaign/lib/format-campaign-table";
import type { CampaignRankingMetricKey } from "@/entities/campaign-ranking/model/types";

export type CampaignRankingMetricDefinition = {
	key: CampaignRankingMetricKey;
	label: string;
};

export const campaignRankingMetricDefinitions: CampaignRankingMetricDefinition[] = [
	{ key: "roas", label: "ROAS" },
	{ key: "ctr", label: "CTR" },
	{ key: "cpc", label: "CPC" },
];

export const defaultCampaignRankingMetricKey: CampaignRankingMetricKey = "roas";

export function formatCampaignRankingMetricValue(
	metricKey: CampaignRankingMetricKey,
	value: number,
) {
	return formatCampaignMetric(value, metricKey === "cpc" ? "currency" : "percent");
}
```

```tsx
// src/widgets/campaign-ranking-top3/ui/campaign-ranking-top3-bar-chart.tsx
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/shared/ui/chart";
import { formatCampaignRankingMetricValue } from "@/widgets/campaign-ranking-top3/model/campaign-ranking-metrics";

export function CampaignRankingTop3BarChart({
	rows,
	metric,
}: {
	rows: Array<{ campaignName: string; value: number; rank: 1 | 2 | 3 }>;
	metric: { key: "roas" | "ctr" | "cpc"; label: string };
}) {
	return (
		<div className="h-72 rounded-card border border-outline-subtle bg-panel p-3">
			<ChartContainer
				className="h-full"
				config={{
					[metric.key]: {
						label: metric.label,
						color: "var(--chart-info)",
					},
				}}
			>
				<BarChart data={rows} layout="vertical" margin={{ left: 8, right: 16 }}>
					<CartesianGrid vertical={false} stroke="var(--border-subtle)" />
					<XAxis type="number" hide />
					<YAxis dataKey="campaignName" type="category" width={128} />
					<Tooltip
						content={
							<ChartTooltipContent
								formatter={(value) =>
									formatCampaignRankingMetricValue(metric.key, Number(value))
								}
							/>
						}
					/>
					<Bar dataKey="value" fill="var(--chart-info)" radius={[0, 8, 8, 0]} />
				</BarChart>
			</ChartContainer>
		</div>
	);
}
```

```tsx
// src/widgets/campaign-ranking-top3/ui/campaign-ranking-top3-card.tsx
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { useMemo, useState } from "react";
import { globalFilterAtom } from "@/entities/global-filter/model/store";
import { getDashboardDataQueryOptions } from "@/entities/dashboard/api/use-dashboard-data";
import { buildCampaignRankingTop3 } from "@/entities/campaign-ranking/lib/build-campaign-ranking-top3";
import {
	campaignRankingMetricDefinitions,
	defaultCampaignRankingMetricKey,
} from "@/widgets/campaign-ranking-top3/model/campaign-ranking-metrics";
import { CampaignRankingTop3BarChart } from "@/widgets/campaign-ranking-top3/ui/campaign-ranking-top3-bar-chart";

export function CampaignRankingTop3Card() {
	const filter = useAtomValue(globalFilterAtom);
	const [metricKey, setMetricKey] = useState(defaultCampaignRankingMetricKey);
	const query = useQuery({
		...getDashboardDataQueryOptions(filter),
		placeholderData: keepPreviousData,
	});

	const metric =
		campaignRankingMetricDefinitions.find((item) => item.key === metricKey) ??
		campaignRankingMetricDefinitions[0];

	const rows = useMemo(() => {
		if (query.data === undefined) {
			return [];
		}

		return buildCampaignRankingTop3({
			campaigns: query.data.campaigns,
			dailyStats: query.data.dailyStats,
			metricKey,
		}).map((row) => ({
			...row,
			campaignName: row.campaignName ?? "-",
		}));
	}, [metricKey, query.data]);

	return (
		<section className="rounded-panel border border-outline-subtle bg-panel p-panel shadow-panel">
			<div className="flex flex-col gap-5">
				<div className="flex flex-col gap-2">
					<h2>캠페인 랭킹</h2>
					<p className="typo-body-sm text-fg-muted">
						현재 필터 기준 상위 캠페인을 확인합니다.
					</p>
				</div>
				<div className="flex gap-2">
					{campaignRankingMetricDefinitions.map((item) => (
						<button
							key={item.key}
							type="button"
							aria-pressed={item.key === metricKey}
							onClick={() => setMetricKey(item.key)}
						>
							{item.label}
						</button>
					))}
				</div>
				{rows.length > 0 ? (
					<CampaignRankingTop3BarChart rows={rows} metric={metric} />
				) : (
					<div className="rounded-card border border-outline-subtle bg-panel-muted px-4 py-8 text-center typo-body-sm text-fg-muted">
						표시할 랭킹 데이터가 없습니다.
					</div>
				)}
			</div>
		</section>
	);
}
```

- [ ] **Step 4: Run the test and confirm the metric module passes**

Run: `npm run test:run -- src/widgets/campaign-ranking-top3/model/__tests__/campaign-ranking-metrics.test.ts`

Expected: pass with ROAS default and table-consistent formatting.

- [ ] **Step 5: Add the widget tests for default state, metric switching, and N/A exclusion**

```ts
import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { createStore, Provider } from "jotai";
import { afterEach, describe, expect, it } from "vitest";
import { createInitialGlobalFilterState } from "@/entities/global-filter/model/defaults";
import { globalFilterAtom } from "@/entities/global-filter/model/store";
import { seedMockDb } from "@/shared/api/mock/db";
import { createQueryClient } from "@/shared/api/query-client";
import userEvent from "@testing-library/user-event";
import { CampaignRankingTop3Card } from "@/widgets/campaign-ranking-top3/ui/campaign-ranking-top3-card";

const aprilFilter = createInitialGlobalFilterState(new Date("2026-04-15"));
const queryClients: QueryClient[] = [];

afterEach(() => {
	for (const queryClient of queryClients.splice(0)) {
		queryClient.clear();
	}
});

function renderRankingCard() {
	const queryClient = createQueryClient();
	const store = createStore();

	store.set(globalFilterAtom, aprilFilter);
	queryClients.push(queryClient);

	render(
		<Provider store={store}>
			<QueryClientProvider client={queryClient}>
				<CampaignRankingTop3Card />
			</QueryClientProvider>
		</Provider>,
	);
}

describe("CampaignRankingTop3Card", () => {
	it("renders ROAS by default and switches to CPC order when toggled", async () => {
		seedMockDb({
			campaigns: [
				{ id: "c-1", name: "Alpha", platform: "Google", status: "active", budget: 1000, startDate: "2026-04-01", endDate: "2026-04-30" },
				{ id: "c-2", name: "Beta", platform: "Meta", status: "active", budget: 1000, startDate: "2026-04-01", endDate: "2026-04-30" },
				{ id: "c-3", name: "Gamma", platform: "Naver", status: "active", budget: 1000, startDate: "2026-04-01", endDate: "2026-04-30" },
			],
			daily_stats: [
				{ id: "d-1", campaignId: "c-1", date: "2026-04-01", impressions: 100, clicks: 10, conversions: 2, cost: 1000, conversionsValue: 3000 },
				{ id: "d-2", campaignId: "c-2", date: "2026-04-01", impressions: 100, clicks: 20, conversions: 2, cost: 500, conversionsValue: 1000 },
				{ id: "d-3", campaignId: "c-3", date: "2026-04-01", impressions: 100, clicks: 0, conversions: 0, cost: 0, conversionsValue: null },
			],
		});

		renderRankingCard();

		expect(screen.getByRole("button", { name: "ROAS" })).toHaveAttribute("aria-pressed", "true");
		expect(screen.getByRole("button", { name: "CTR" })).toHaveAttribute("aria-pressed", "false");
		expect(screen.getByRole("button", { name: "CPC" })).toHaveAttribute("aria-pressed", "false");

		await userEvent.click(screen.getByRole("button", { name: "CPC" }));
		expect(screen.getByRole("button", { name: "CPC" })).toHaveAttribute("aria-pressed", "true");
	});

	it("omits campaigns that resolve to N/A and falls back to empty state when needed", async () => {
		seedMockDb({
			campaigns: [
				{ id: "c-1", name: "Zero Clicks", platform: "Google", status: "active", budget: 1000, startDate: "2026-04-01", endDate: "2026-04-30" },
			],
			daily_stats: [
				{ id: "d-1", campaignId: "c-1", date: "2026-04-01", impressions: 100, clicks: 0, conversions: 0, cost: 1000, conversionsValue: 0 },
			],
		});

		renderRankingCard();

		expect(await screen.findByText("표시할 랭킹 데이터가 없습니다.")).toBeInTheDocument();
	});
});
```

### Task 3: Mount The Widget In App And Verify Layout Order

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/widgets/campaign-ranking-top3/ui/__tests__/campaign-ranking-top3-card.test.tsx`

- [ ] **Step 1: Write the failing App placement test**

```ts
import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "@/App";
import { render, screen } from "@testing-library/react";
import { createStore, Provider } from "jotai";
import { afterEach } from "vitest";
import { createInitialGlobalFilterState } from "@/entities/global-filter/model/defaults";
import { globalFilterAtom } from "@/entities/global-filter/model/store";
import { seedMockDb } from "@/shared/api/mock/db";
import { createQueryClient } from "@/shared/api/query-client";

const aprilFilter = createInitialGlobalFilterState(new Date("2026-04-15"));
const queryClients: QueryClient[] = [];

afterEach(() => {
	for (const queryClient of queryClients.splice(0)) {
		queryClient.clear();
	}
});

function renderApp() {
	const queryClient = createQueryClient();
	const store = createStore();

	store.set(globalFilterAtom, aprilFilter);
	queryClients.push(queryClient);

	render(
		<Provider store={store}>
			<QueryClientProvider client={queryClient}>
				<App />
			</QueryClientProvider>
		</Provider>,
	);
}

it("places the ranking card between the platform chart and the campaign table", () => {
	seedMockDb({
		campaigns: [
			{ id: "c-1", name: "Alpha", platform: "Google", status: "active", budget: 1000, startDate: "2026-04-01", endDate: "2026-04-30" },
		],
		daily_stats: [
			{ id: "d-1", campaignId: "c-1", date: "2026-04-01", impressions: 100, clicks: 10, conversions: 2, cost: 1000, conversionsValue: 3000 },
		],
	});

	renderApp();

	const platformSection = screen.getByRole("heading", { name: "플랫폼별 성과" }).closest("section");
	const rankingSection = screen.getByRole("heading", { name: "캠페인 랭킹" }).closest("section");
	const campaignSection = screen.getByRole("heading", { name: "캠페인 현황" }).closest("section");

	expect(platformSection?.compareDocumentPosition(rankingSection as Node) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
	expect(rankingSection?.compareDocumentPosition(campaignSection as Node) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
	expect(platformSection?.parentElement).toBe(rankingSection?.parentElement);
	expect(platformSection?.parentElement).toHaveClass("grid");
});
```

- [ ] **Step 2: Run the App placement test to confirm it fails**

Run: `npm run test:run -- src/widgets/campaign-ranking-top3/ui/__tests__/campaign-ranking-top3-card.test.tsx`

Expected: fail because `App` does not render the ranking card yet.

- [ ] **Step 3: Insert the widget into `App.tsx`**

```tsx
// src/App.tsx
import { CampaignRankingTop3Card } from "@/widgets/campaign-ranking-top3/ui/campaign-ranking-top3-card";

function App() {
	return (
		<main className="min-h-screen overflow-x-hidden bg-canvas text-fg">
			<section className="mx-auto grid min-h-screen w-full max-w-page-max gap-panel-gap px-page-gutter py-8 lg:grid-cols-[260px_minmax(0,1fr)]">
				<DailyTrendChartCard />
				<section className="grid min-w-0 gap-panel-gap lg:grid-cols-2">
					<PlatformPerformanceChartCard />
					<CampaignRankingTop3Card />
				</section>
				<CampaignTableCard />
			</section>
		</main>
	);
}
```

- [ ] **Step 4: Run the placement test and confirm it passes**

Run: `npm run test:run -- src/widgets/campaign-ranking-top3/ui/__tests__/campaign-ranking-top3-card.test.tsx`

Expected: pass with the ranking card mounted between the platform chart and the campaign table.

- [ ] **Step 5: Run the focused verification suite before handing off**

Run:

```bash
npm run test:run -- src/entities/campaign-ranking/lib/__tests__/build-campaign-ranking-top3.test.ts
npm run test:run -- src/widgets/campaign-ranking-top3/model/__tests__/campaign-ranking-metrics.test.ts
npm run test:run -- src/widgets/campaign-ranking-top3/ui/__tests__/campaign-ranking-top3-card.test.tsx
npm run test:run -- src/widgets/platform-performance-chart/ui/__tests__/platform-performance-chart-card.test.tsx
npm run lint
```

Expected: all targeted tests pass and lint reports no new issues.
