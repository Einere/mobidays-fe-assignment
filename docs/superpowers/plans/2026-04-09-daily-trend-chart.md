# Daily Trend Chart Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 전역 필터와 동기화되는 일별 추이 꺾은선 차트를 `성과 개요` 패널에 구현한다.

**Architecture:** 기존 `useDashboardData(filter)` 조회 결과를 그대로 사용하고, `entities/daily-stat`의 순수 집계 함수가 날짜별 시계열 데이터를 만든다. 차트 표현은 `shared/ui/chart.tsx`의 shadcn 공용 래퍼에 모으고, 실제 UI 조합과 메트릭 토글 상태는 `widgets/daily-trend-chart`에서 관리한다. `App.tsx`는 새 위젯을 배치하도록 레이아웃만 재구성한다.

**Tech Stack:** React 19, TypeScript, Jotai, TanStack Query v5, Recharts v3, shadcn/ui patterns, Vitest, Testing Library

---

## File Structure

- Create: `src/shared/ui/chart.tsx`
  - shadcn 스타일의 공용 차트 컨테이너, 툴팁, 범례 래퍼
- Create: `src/entities/daily-stat/lib/build-daily-trend-series.ts`
  - `DashboardDailyStat[]`를 `DailyTrendPoint[]`로 집계하는 순수 함수
- Create: `src/entities/daily-stat/lib/__tests__/build-daily-trend-series.test.ts`
  - 날짜 정렬, `null` 유지, 합산 규칙 검증
- Create: `src/widgets/daily-trend-chart/model/metrics.ts`
  - 메트릭 정의, 기본 활성 메트릭, 표시 포맷 함수
- Create: `src/widgets/daily-trend-chart/ui/daily-trend-chart-card.tsx`
  - 전역 필터 구독, query 호출, 메트릭 토글, LineChart 렌더링
- Create: `src/widgets/daily-trend-chart/ui/__tests__/daily-trend-chart-card.test.tsx`
  - 위젯 상태와 인터랙션 테스트
- Modify: `src/App.tsx`
  - 상단 넓은 성과 개요 패널에 차트 위젯을 삽입하고 상태 규칙 패널을 하단으로 이동

### Task 1: Add Shared Chart Wrapper And Metric Definitions

**Files:**
- Create: `src/shared/ui/chart.tsx`
- Create: `src/widgets/daily-trend-chart/model/metrics.ts`
- Modify: `src/app/styles/tokens.css`

- [ ] **Step 1: Write the failing smoke test for metric definitions**

```ts
// src/widgets/daily-trend-chart/ui/__tests__/daily-trend-chart-card.test.tsx
import { describe, expect, it } from "vitest";
import {
	defaultDailyTrendMetricKeys,
	dailyTrendMetricDefinitions,
	formatDailyTrendMetricValue,
} from "@/widgets/daily-trend-chart/model/metrics";

describe("daily trend metric definitions", () => {
	it("exposes the default visible metrics in spec order", () => {
		expect(defaultDailyTrendMetricKeys).toEqual(["impressions", "clicks"]);
		expect(dailyTrendMetricDefinitions.map((metric) => metric.key)).toEqual([
			"impressions",
			"clicks",
			"conversions",
			"cost",
		]);
	});

	it("formats null and currency values for chart tooltip content", () => {
		expect(formatDailyTrendMetricValue("impressions", null)).toBe("-");
		expect(formatDailyTrendMetricValue("impressions", 12000)).toBe("12,000");
		expect(formatDailyTrendMetricValue("cost", 123456)).toBe("₩123,456");
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/widgets/daily-trend-chart/ui/__tests__/daily-trend-chart-card.test.tsx`

Expected: FAIL with `Cannot find module '@/widgets/daily-trend-chart/model/metrics'`

- [ ] **Step 3: Write the metric definition module**

```ts
// src/widgets/daily-trend-chart/model/metrics.ts
export type DailyTrendMetricKey =
	| "impressions"
	| "clicks"
	| "conversions"
	| "cost";

export interface DailyTrendMetricDefinition {
	key: DailyTrendMetricKey;
	label: string;
	color: string;
}

export const dailyTrendMetricDefinitions: DailyTrendMetricDefinition[] = [
	{
		key: "impressions",
		label: "노출수",
		color: "var(--chart-positive)",
	},
	{
		key: "clicks",
		label: "클릭수",
		color: "var(--chart-info)",
	},
	{
		key: "conversions",
		label: "전환수",
		color: "var(--chart-warning)",
	},
	{
		key: "cost",
		label: "집행비용",
		color: "var(--chart-danger)",
	},
];

export const defaultDailyTrendMetricKeys: DailyTrendMetricKey[] = [
	"impressions",
	"clicks",
];

export function formatDailyTrendMetricValue(
	metricKey: DailyTrendMetricKey,
	value: number | null,
) {
	if (value === null) {
		return "-";
	}

	if (metricKey === "cost") {
		return new Intl.NumberFormat("ko-KR", {
			style: "currency",
			currency: "KRW",
			maximumFractionDigits: 0,
		}).format(value);
	}

	return new Intl.NumberFormat("ko-KR", {
		maximumFractionDigits: 0,
	}).format(value);
}
```

- [ ] **Step 4: Add the shared chart wrapper**

```tsx
// src/shared/ui/chart.tsx
import * as React from "react";
import {
	Legend,
	type LegendProps,
	ResponsiveContainer,
	Tooltip,
	type TooltipProps,
} from "recharts";
import { cn } from "@/shared/lib/utils";

export interface ChartConfigItem {
	label: string;
	color: string;
}

export type ChartConfig = Record<string, ChartConfigItem>;

const ChartContext = React.createContext<ChartConfig | null>(null);

export function ChartContainer({
	children,
	className,
	config,
}: React.ComponentProps<"div"> & {
	config: ChartConfig;
}) {
	return (
		<ChartContext.Provider value={config}>
			<div
				data-slot="chart"
				className={cn(
					"h-[320px] w-full rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-panel-muted)] p-4",
					className,
				)}
			>
				<ResponsiveContainer width="100%" height="100%">
					{children}
				</ResponsiveContainer>
			</div>
		</ChartContext.Provider>
	);
}

export function ChartTooltipContent({
	active,
	label,
	payload,
}: TooltipProps<number, string>) {
	if (!active || !payload?.length) {
		return null;
	}

	return (
		<div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-panel)] px-3 py-2 shadow-[var(--panel-shadow)]">
			<p className="text-[length:var(--type-caption-size)] text-[var(--text-tertiary)]">
				{label}
			</p>
			<div className="mt-2 flex flex-col gap-1">
				{payload.map((entry) => (
					<div
						key={entry.dataKey?.toString()}
						className="flex items-center justify-between gap-3 text-[length:var(--type-body-sm-size)]"
					>
						<span className="text-[var(--text-secondary)]">
							{entry.name}
						</span>
						<span className="font-medium text-[var(--text-primary)]">
							{entry.value}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}

export function ChartTooltip(props: TooltipProps<number, string>) {
	return <Tooltip cursor={false} content={<ChartTooltipContent {...props} />} />;
}

export function ChartLegend(props: LegendProps) {
	return <Legend verticalAlign="top" align="right" iconType="circle" {...props} />;
}
```

- [ ] **Step 5: Add or confirm chart color tokens**

```css
/* src/app/styles/tokens.css */
:root {
	--chart-positive: #3f8cff;
	--chart-info: #19a7a2;
	--chart-warning: #e7a93b;
	--chart-danger: #d95f5f;
}
```

- [ ] **Step 6: Run tests to verify the metric module passes**

Run: `npm run test:run -- src/widgets/daily-trend-chart/ui/__tests__/daily-trend-chart-card.test.tsx`

Expected: PASS for the metric-definition assertions and remaining widget assertions skipped or pending because the component is not implemented yet

- [ ] **Step 7: Commit**

```bash
git add src/shared/ui/chart.tsx src/widgets/daily-trend-chart/model/metrics.ts src/app/styles/tokens.css src/widgets/daily-trend-chart/ui/__tests__/daily-trend-chart-card.test.tsx
git commit -m "feat: add reusable chart primitives"
```

### Task 2: Build The Daily Trend Series Aggregation

**Files:**
- Create: `src/entities/daily-stat/lib/build-daily-trend-series.ts`
- Create: `src/entities/daily-stat/lib/__tests__/build-daily-trend-series.test.ts`

- [ ] **Step 1: Write the failing unit tests for aggregation rules**

```ts
// src/entities/daily-stat/lib/__tests__/build-daily-trend-series.test.ts
import { describe, expect, it } from "vitest";
import { buildDailyTrendSeries } from "@/entities/daily-stat/lib/build-daily-trend-series";
import type { DashboardDailyStat } from "@/entities/dashboard/api/parse-dashboard-data";

const stats: DashboardDailyStat[] = [
	{
		raw: {} as DashboardDailyStat["raw"],
		id: "a-1",
		campaignId: "a",
		date: "2026-04-02",
		impressions: 100,
		clicks: null,
		conversions: 1,
		cost: 1000,
		conversionsValue: null,
	},
	{
		raw: {} as DashboardDailyStat["raw"],
		id: "b-1",
		campaignId: "b",
		date: "2026-04-02",
		impressions: 50,
		clicks: 10,
		conversions: null,
		cost: null,
		conversionsValue: null,
	},
	{
		raw: {} as DashboardDailyStat["raw"],
		id: "b-2",
		campaignId: "b",
		date: "2026-04-01",
		impressions: 0,
		clicks: 0,
		conversions: 0,
		cost: 0,
		conversionsValue: null,
	},
	{
		raw: {} as DashboardDailyStat["raw"],
		id: "b-3",
		campaignId: "b",
		date: null,
		impressions: 999,
		clicks: 999,
		conversions: 999,
		cost: 999,
		conversionsValue: null,
	},
];

describe("buildDailyTrendSeries", () => {
	it("sorts by date and aggregates only valid numeric values", () => {
		expect(buildDailyTrendSeries(stats)).toEqual([
			{
				date: "2026-04-01",
				impressions: 0,
				clicks: 0,
				conversions: 0,
				cost: 0,
			},
			{
				date: "2026-04-02",
				impressions: 150,
				clicks: 10,
				conversions: 1,
				cost: 1000,
			},
		]);
	});

	it("keeps a metric null when a date group has no numeric value for that metric", () => {
		expect(
			buildDailyTrendSeries([
				{
					raw: {} as DashboardDailyStat["raw"],
					id: "x-1",
					campaignId: "x",
					date: "2026-04-03",
					impressions: null,
					clicks: null,
					conversions: null,
					cost: null,
					conversionsValue: null,
				},
			]),
		).toEqual([
			{
				date: "2026-04-03",
				impressions: null,
				clicks: null,
				conversions: null,
				cost: null,
			},
		]);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/entities/daily-stat/lib/__tests__/build-daily-trend-series.test.ts`

Expected: FAIL with `Cannot find module '@/entities/daily-stat/lib/build-daily-trend-series'`

- [ ] **Step 3: Implement the aggregation function**

```ts
// src/entities/daily-stat/lib/build-daily-trend-series.ts
import type { DashboardDailyStat } from "@/entities/dashboard/api/parse-dashboard-data";
import type { DailyTrendMetricKey } from "@/widgets/daily-trend-chart/model/metrics";

export interface DailyTrendPoint {
	date: string;
	impressions: number | null;
	clicks: number | null;
	conversions: number | null;
	cost: number | null;
}

const metricKeys: DailyTrendMetricKey[] = [
	"impressions",
	"clicks",
	"conversions",
	"cost",
];

export function buildDailyTrendSeries(
	dailyStats: DashboardDailyStat[],
): DailyTrendPoint[] {
	const grouped = new Map<string, DashboardDailyStat[]>();

	for (const stat of dailyStats) {
		if (!stat.date) {
			continue;
		}

		const items = grouped.get(stat.date) ?? [];
		items.push(stat);
		grouped.set(stat.date, items);
	}

	return [...grouped.entries()]
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([date, items]) => {
			const point = {
				date,
				impressions: null,
				clicks: null,
				conversions: null,
				cost: null,
			} satisfies DailyTrendPoint;

			for (const metricKey of metricKeys) {
				const numericValues = items
					.map((item) => item[metricKey])
					.filter((value): value is number => typeof value === "number");

				point[metricKey] =
					numericValues.length > 0
						? numericValues.reduce((sum, value) => sum + value, 0)
						: null;
			}

			return point;
		});
}
```

- [ ] **Step 4: Run the aggregation tests**

Run: `npm run test:run -- src/entities/daily-stat/lib/__tests__/build-daily-trend-series.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/entities/daily-stat/lib/build-daily-trend-series.ts src/entities/daily-stat/lib/__tests__/build-daily-trend-series.test.ts
git commit -m "feat: add daily trend aggregation"
```

### Task 3: Implement The Daily Trend Chart Widget

**Files:**
- Create: `src/widgets/daily-trend-chart/ui/daily-trend-chart-card.tsx`
- Modify: `src/widgets/daily-trend-chart/ui/__tests__/daily-trend-chart-card.test.tsx`

- [ ] **Step 1: Write the failing widget tests**

```tsx
// src/widgets/daily-trend-chart/ui/__tests__/daily-trend-chart-card.test.tsx
import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "jotai";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { createQueryClient } from "@/shared/api/query-client";
import { server } from "@/shared/api/mock/server";
import { DailyTrendChartCard } from "@/widgets/daily-trend-chart/ui/daily-trend-chart-card";

function renderChart() {
	const queryClient = createQueryClient();

	render(
		<Provider>
			<QueryClientProvider client={queryClient}>
				<DailyTrendChartCard />
			</QueryClientProvider>
		</Provider>,
	);
}

describe("DailyTrendChartCard", () => {
	it("renders the line-chart controls with both default metrics selected", async () => {
		renderChart();

		expect(screen.getByRole("heading", { name: "성과 개요" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "노출수" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
		expect(screen.getByRole("button", { name: "클릭수" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
	});

	it("does not allow the last active metric to be toggled off", async () => {
		const user = userEvent.setup();

		renderChart();

		await user.click(screen.getByRole("button", { name: "클릭수" }));
		await user.click(screen.getByRole("button", { name: "노출수" }));

		expect(screen.getByRole("button", { name: "노출수" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
		expect(screen.getByRole("button", { name: "클릭수" })).toHaveAttribute(
			"aria-pressed",
			"false",
		);
	});

	it("renders an empty-state message when no campaigns match the filter", async () => {
		server.use(
			http.get("/campaigns", () => HttpResponse.json([])),
			http.get("/daily_stats", () => HttpResponse.json([])),
		);

		renderChart();

		expect(
			await screen.findByText("필터 조건에 맞는 캠페인이 없습니다."),
		).toBeInTheDocument();
	});

	it("renders an error state when the dashboard query fails", async () => {
		server.use(
			http.get("/campaigns", () => new HttpResponse(null, { status: 500 })),
		);

		renderChart();

		expect(
			await screen.findByText("성과 데이터를 불러오지 못했습니다."),
		).toBeInTheDocument();
	});

	it("renders a line chart when data exists", async () => {
		server.use(
			http.get("/campaigns", () =>
				HttpResponse.json([
					{
						id: "1",
						name: "Google Active",
						platform: "Google",
						status: "active",
						budget: 1000,
						startDate: "2026-04-01",
						endDate: "2026-04-30",
					},
				]),
			),
			http.get("/daily_stats", () =>
				HttpResponse.json([
					{
						id: "d1",
						campaignId: "1",
						date: "2026-04-01",
						impressions: 100,
						clicks: 10,
						conversions: 1,
						cost: 1000,
						conversionsValue: null,
					},
				]),
			),
		);

		renderChart();

		await waitFor(() => {
			expect(screen.getByTestId("daily-trend-line-chart")).toBeInTheDocument();
		});
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/widgets/daily-trend-chart/ui/__tests__/daily-trend-chart-card.test.tsx`

Expected: FAIL with `Cannot find module '@/widgets/daily-trend-chart/ui/daily-trend-chart-card'`

- [ ] **Step 3: Implement the widget**

```tsx
// src/widgets/daily-trend-chart/ui/daily-trend-chart-card.tsx
import { useAtomValue } from "jotai";
import { useMemo, useState } from "react";
import {
	CartesianGrid,
	Line,
	LineChart,
	XAxis,
	YAxis,
} from "recharts";
import { buildDailyTrendSeries } from "@/entities/daily-stat/lib/build-daily-trend-series";
import { useDashboardData } from "@/entities/dashboard/api/use-dashboard-data";
import { globalFilterAtom } from "@/entities/global-filter/model/store";
import { Button } from "@/shared/ui/button";
import {
	ChartContainer,
	ChartLegend,
	ChartTooltip,
} from "@/shared/ui/chart";
import {
	dailyTrendMetricDefinitions,
	defaultDailyTrendMetricKeys,
	formatDailyTrendMetricValue,
	type DailyTrendMetricKey,
} from "@/widgets/daily-trend-chart/model/metrics";

function formatDateLabel(value: string) {
	return value.slice(5);
}

export function DailyTrendChartCard() {
	const filter = useAtomValue(globalFilterAtom);
	const query = useDashboardData(filter);
	const [activeMetrics, setActiveMetrics] = useState<DailyTrendMetricKey[]>(
		defaultDailyTrendMetricKeys,
	);

	const chartData = useMemo(
		() => buildDailyTrendSeries(query.data?.dailyStats ?? []),
		[query.data?.dailyStats],
	);

	function toggleMetric(metricKey: DailyTrendMetricKey) {
		setActiveMetrics((current) => {
			const isActive = current.includes(metricKey);

			if (isActive && current.length === 1) {
				return current;
			}

			if (isActive) {
				return current.filter((item) => item !== metricKey);
			}

			return dailyTrendMetricDefinitions
				.map((metric) => metric.key)
				.filter((key) => key === metricKey || current.includes(key));
		});
	}

	if (query.isError) {
		return (
			<section className="rounded-[var(--panel-radius)] border border-[var(--panel-border)] bg-[var(--panel-bg)] p-[var(--layout-panel-padding)] shadow-[var(--panel-shadow)]">
				<h2>성과 개요</h2>
				<p className="mt-2 text-[var(--status-danger-fg)]">
					성과 데이터를 불러오지 못했습니다.
				</p>
			</section>
		);
	}

	return (
		<section className="rounded-[var(--panel-radius)] border border-[var(--panel-border)] bg-[var(--panel-bg)] p-[var(--layout-panel-padding)] shadow-[var(--panel-shadow)]">
			<div className="flex flex-col gap-4">
				<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
					<div>
						<h2>성과 개요</h2>
						<p className="mt-1 text-[length:var(--type-body-md-size)] text-[var(--text-secondary)]">
							전역 필터 기준으로 집계한 일별 추이 꺾은선 그래프입니다.
						</p>
					</div>
					<div className="flex flex-wrap gap-2">
						{dailyTrendMetricDefinitions
							.filter((metric) =>
								defaultDailyTrendMetricKeys.includes(metric.key),
							)
							.map((metric) => (
								<Button
									key={metric.key}
									type="button"
									size="sm"
									variant={
										activeMetrics.includes(metric.key) ? "secondary" : "outline"
									}
									aria-pressed={activeMetrics.includes(metric.key)}
									onClick={() => toggleMetric(metric.key)}
								>
									{metric.label}
								</Button>
							))}
					</div>
				</div>

				{query.isPending ? (
					<div className="h-[320px] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-panel-muted)]" />
				) : query.data && query.data.campaigns.length === 0 ? (
					<div className="flex h-[320px] items-center justify-center rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-panel-muted)] text-[var(--text-secondary)]">
						필터 조건에 맞는 캠페인이 없습니다.
					</div>
				) : chartData.length === 0 ? (
					<div className="flex h-[320px] items-center justify-center rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-panel-muted)] text-[var(--text-secondary)]">
						표시할 일별 데이터가 없습니다.
					</div>
				) : (
					<ChartContainer
						className="min-h-[320px]"
						config={Object.fromEntries(
							dailyTrendMetricDefinitions.map((metric) => [
								metric.key,
								{ label: metric.label, color: metric.color },
							]),
						)}
					>
						<LineChart data={chartData} data-testid="daily-trend-line-chart">
							<CartesianGrid vertical={false} stroke="var(--border-subtle)" />
							<XAxis dataKey="date" tickFormatter={formatDateLabel} />
							<YAxis />
							<ChartTooltip
								formatter={(value, name) => {
									const metric = dailyTrendMetricDefinitions.find(
										(item) => item.label === name,
									);
									return metric
										? formatDailyTrendMetricValue(
												metric.key,
												typeof value === "number" ? value : null,
										  )
										: value;
								}}
							/>
							<ChartLegend />
							{dailyTrendMetricDefinitions
								.filter((metric) => activeMetrics.includes(metric.key))
								.map((metric) => (
									<Line
										key={metric.key}
										type="monotone"
										dataKey={metric.key}
										name={metric.label}
										stroke={metric.color}
										strokeWidth={2}
										dot={false}
										connectNulls={false}
									/>
								))}
						</LineChart>
					</ChartContainer>
				)}

				<p className="text-[length:var(--type-body-sm-size)] text-[var(--text-secondary)]">
					조회 상태: {query.isFetching ? "동기화 중" : "준비됨"}
				</p>
			</div>
		</section>
	);
}
```

- [ ] **Step 4: Run the widget tests**

Run: `npm run test:run -- src/widgets/daily-trend-chart/ui/__tests__/daily-trend-chart-card.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/widgets/daily-trend-chart/ui/daily-trend-chart-card.tsx src/widgets/daily-trend-chart/ui/__tests__/daily-trend-chart-card.test.tsx
git commit -m "feat: add daily trend chart widget"
```

### Task 4: Integrate The Widget Into The Dashboard Layout

**Files:**
- Modify: `src/App.tsx`
- Test: `src/widgets/daily-trend-chart/ui/__tests__/daily-trend-chart-card.test.tsx`

- [ ] **Step 1: Add a layout assertion that the chart heading is rendered inside App**

```tsx
// src/widgets/daily-trend-chart/ui/__tests__/daily-trend-chart-card.test.tsx
import { render, screen } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "jotai";
import App from "@/App";
import { createQueryClient } from "@/shared/api/query-client";

it("renders the daily trend chart in the overview section of App", async () => {
	const queryClient = createQueryClient();

	render(
		<Provider>
			<QueryClientProvider client={queryClient}>
				<App />
			</QueryClientProvider>
		</Provider>,
	);

	expect(
		await screen.findByRole("heading", { name: "성과 개요" }),
	).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify the layout assertion fails**

Run: `npm run test:run -- src/widgets/daily-trend-chart/ui/__tests__/daily-trend-chart-card.test.tsx`

Expected: FAIL because `App` still renders the placeholder overview panel

- [ ] **Step 3: Replace the placeholder overview panel with the chart widget and move the status panel below**

```tsx
// src/App.tsx
import { DailyTrendChartCard } from "@/widgets/daily-trend-chart/ui/daily-trend-chart-card";

function App() {
	// existing campaign table controls

	return (
		<main className="min-h-screen bg-[var(--surface-canvas)] text-[var(--text-primary)]">
			<section className="mx-auto grid min-h-screen max-w-[var(--layout-page-max)] gap-[var(--layout-panel-gap)] px-[var(--layout-page-gutter)] py-8 lg:grid-cols-[260px_minmax(0,1fr)]">
				<SidebarNav /* unchanged */ />

				<div className="flex flex-col gap-[var(--layout-panel-gap)]">
					<header>{/* unchanged */}</header>

					<section className="grid gap-[var(--layout-panel-gap)] xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.9fr)]">
						<GlobalFilterBar />
						<GlobalFilterSummary />
					</section>

					<DailyTrendChartCard />

					<section className="rounded-[var(--panel-radius)] border border-[var(--panel-border)] bg-[var(--panel-bg)] p-[var(--layout-panel-padding)] shadow-[var(--panel-shadow)]">
						<h2 className="text-[length:var(--type-title-size)] leading-[var(--type-title-line-height)] font-[var(--type-title-weight)]">
							상태 규칙
						</h2>
						{/* existing status badges and progress bars */}
					</section>

					<section className="rounded-[var(--panel-radius)] border border-[var(--panel-border)] bg-[var(--panel-bg)] p-[var(--layout-panel-padding)] shadow-[var(--panel-shadow)]">
						{/* existing campaign table section */}
					</section>
				</div>
			</section>
		</main>
	);
}
```

- [ ] **Step 4: Run targeted tests**

Run: `npm run test:run -- src/entities/daily-stat/lib/__tests__/build-daily-trend-series.test.ts src/widgets/daily-trend-chart/ui/__tests__/daily-trend-chart-card.test.tsx`

Expected: PASS

- [ ] **Step 5: Run the full validation commands**

Run: `npm run test:run`

Expected: PASS

Run: `npm run lint`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/entities/daily-stat/lib/__tests__/build-daily-trend-series.test.ts src/entities/daily-stat/lib/build-daily-trend-series.ts src/shared/ui/chart.tsx src/widgets/daily-trend-chart/model/metrics.ts src/widgets/daily-trend-chart/ui/daily-trend-chart-card.tsx src/widgets/daily-trend-chart/ui/__tests__/daily-trend-chart-card.test.tsx docs/superpowers/specs/2026-04-08-daily-trend-chart-design.md docs/superpowers/plans/2026-04-09-daily-trend-chart.md
git commit -m "feat: add daily trend line chart"
```

## Self-Review

### Spec coverage

- `LineChart` 고정: Task 3 위젯 구현
- 전역 필터 연동: Task 3 위젯 구현
- 날짜별 집계와 `null` 유지: Task 2 집계 함수
- shadcn 공용 차트 래퍼: Task 1
- 상단 레이아웃 재배치: Task 4
- 메트릭 토글 최소 1개 유지: Task 3 테스트와 구현
- 범례/툴팁/빈 상태/오류 상태: Task 3

### Placeholder scan

- 미정 상태를 남기는 placeholder 표현 없음
- 모든 작업에 파일 경로, 코드 예시, 실행 명령 포함

### Type consistency

- 메트릭 키는 `DailyTrendMetricKey`로 통일
- 집계 결과 타입은 `DailyTrendPoint`
- 위젯/툴팁 포맷 함수는 `formatDailyTrendMetricValue`로 통일
