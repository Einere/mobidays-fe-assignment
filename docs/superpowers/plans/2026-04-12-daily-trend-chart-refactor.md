# Daily Trend Chart Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `daily-trend-chart-card.tsx` 와 `daily-trend-line-chart.tsx` 에 섞인 오케스트레이션, 상태 UI, 메트릭 토글, 차트 helper 책임을 분리해서 변경 범위를 줄이고 파일별 책임을 명확히 한다.

**Architecture:** 카드 레벨에서는 `viewState.kind` 해석과 상위 레이아웃 조립만 남기고, 상태별 UI는 별도 `DailyTrendChartStatus` 로 이동한다. 차트 레벨에서는 메트릭 토글, scroll area wrapper, line chart 조립을 분리하되, 차트 helper는 `model/daily-trend-chart.ts` 에서 순수 함수로만 제공한다. `daily-trend-chart` 는 `platform-performance-chart` 보다 단순하므로, legend 나 tooltip 을 과도하게 추가 분리하지 않고 현재 변경에 필요한 최소 경계만 만든다.

**Tech Stack:** React 19, TypeScript, Recharts, Vitest, Testing Library, existing FSD widget structure

---

## File Structure

- Create: `src/widgets/daily-trend-chart/model/daily-trend-chart.ts`
  - 차트 config, 날짜/Y축 포맷, tooltip formatter, visible metric definitions helper
- Create: `src/widgets/daily-trend-chart/model/__tests__/daily-trend-chart.test.ts`
  - chart config, tooltip formatter, date/y-axis formatter 테스트
- Create: `src/widgets/daily-trend-chart/ui/daily-trend-metric-toggle-group.tsx`
  - 메트릭 토글 버튼 그룹만 담당
- Create: `src/widgets/daily-trend-chart/ui/daily-trend-chart-frame.tsx`
  - 카드 제목, 설명, actions 슬롯, status 슬롯, children 레이아웃 담당
- Create: `src/widgets/daily-trend-chart/ui/daily-trend-chart-status.tsx`
  - loading, full-error, empty-campaigns, empty-data, stale, syncing 상태 UI 담당
- Create: `src/widgets/daily-trend-chart/ui/daily-trend-chart-content.tsx`
  - `DataDenseScrollArea` 와 `DailyTrendLineChart` 조립 담당
- Create: `src/widgets/daily-trend-chart/ui/__tests__/daily-trend-metric-toggle-group.test.tsx`
- Create: `src/widgets/daily-trend-chart/ui/__tests__/daily-trend-line-chart.test.tsx`
- Create: `src/widgets/daily-trend-chart/ui/__tests__/daily-trend-chart-frame.test.tsx`
- Create: `src/widgets/daily-trend-chart/ui/__tests__/daily-trend-chart-status.test.tsx`
- Create: `src/widgets/daily-trend-chart/ui/__tests__/daily-trend-chart-content.test.tsx`
- Modify: `src/widgets/daily-trend-chart/ui/daily-trend-line-chart.tsx`
  - Recharts 조립 전용으로 축소, helper 의존만 남김
- Modify: `src/widgets/daily-trend-chart/ui/daily-trend-chart-card.tsx`
  - 오케스트레이션만 남기고 frame/status/content 를 조합
- Modify: `src/widgets/daily-trend-chart/ui/__tests__/daily-trend-chart-card.test.tsx`
  - 카드 상태 분기와 App 내 배치만 검증하도록 재정리

### Task 1: Extract Chart Helper Logic Into The Model Layer

**Files:**
- Create: `src/widgets/daily-trend-chart/model/daily-trend-chart.ts`
- Create: `src/widgets/daily-trend-chart/model/__tests__/daily-trend-chart.test.ts`
- Modify: `src/widgets/daily-trend-chart/ui/daily-trend-line-chart.tsx`

- [ ] **Step 1: Write the failing helper test**

```ts
import { describe, expect, it } from "vitest";
import {
	buildDailyTrendChartConfig,
	createDailyTrendTooltipFormatter,
	dailyTrendVisibleMetricDefinitions,
	formatDailyTrendDateLabel,
	formatDailyTrendYAxisTick,
} from "@/widgets/daily-trend-chart/model/daily-trend-chart";

describe("daily-trend-chart helpers", () => {
	it("builds chart config for visible metrics and formats axis labels", () => {
		expect(dailyTrendVisibleMetricDefinitions.map((metric) => metric.key)).toEqual([
			"impressions",
			"clicks",
		]);

		const config = buildDailyTrendChartConfig();

		expect(config.impressions.label).toBe("노출수");
		expect(config.clicks.color).toBe("var(--chart-info)");
		expect(formatDailyTrendDateLabel("2026-04-02")).toBe("04-02");
		expect(formatDailyTrendYAxisTick(1234)).toBe("1,234");
	});

	it("formats tooltip values for visible and hidden metrics", () => {
		const tooltipFormatter = createDailyTrendTooltipFormatter();

		expect(tooltipFormatter(1234, "clicks")).toBe("1,234");
		expect(tooltipFormatter(3500, "집행비용")).toBe("₩3,500");
		expect(tooltipFormatter(null, "clicks")).toBe("-");
		expect(tooltipFormatter(10, undefined)).toBe("-");
	});
});
```

- [ ] **Step 2: Run the test to confirm it fails**

Run: `npm run test:run -- src/widgets/daily-trend-chart/model/__tests__/daily-trend-chart.test.ts`

Expected: fail because the new helper module does not exist yet.

- [ ] **Step 3: Implement the helper module**

```ts
// src/widgets/daily-trend-chart/model/daily-trend-chart.ts
import type { DailyTrendPoint } from "@/entities/daily-stat/lib/build-daily-trend-series";
import type {
	DailyTrendMetricDefinition,
	DailyTrendMetricKey,
} from "@/widgets/daily-trend-chart/model/metrics";
import {
	dailyTrendMetricDefinitions,
	formatDailyTrendMetricValue,
	getDailyTrendMetric,
	visibleDailyTrendMetricKeys,
} from "@/widgets/daily-trend-chart/model/metrics";

const numberFormatter = new Intl.NumberFormat("ko-KR");

export const dailyTrendVisibleMetricDefinitions = visibleDailyTrendMetricKeys.map(
	(metricKey) => getDailyTrendMetric(metricKey),
);

export function buildDailyTrendChartConfig(
	metricDefinitions: readonly DailyTrendMetricDefinition[] = dailyTrendVisibleMetricDefinitions,
) {
	return Object.fromEntries(
		metricDefinitions.map((metric) => [
			metric.key,
			{
				label: metric.label,
				color: metric.chartColor,
			},
		]),
	);
}

export function formatDailyTrendDateLabel(value: string) {
	return value.slice(5);
}

export function formatDailyTrendYAxisTick(value: number) {
	return numberFormatter.format(value);
}

export function createDailyTrendTooltipFormatter(
	metricDefinitions: readonly DailyTrendMetricDefinition[] = dailyTrendMetricDefinitions,
) {
	return (value: unknown, metricKey?: string) => {
		if (metricKey === undefined) {
			return "-";
		}

		const resolvedMetricKey = metricDefinitions.find(
			(metric) => metric.key === metricKey || metric.label === metricKey,
		)?.key;

		if (resolvedMetricKey === undefined) {
			return "-";
		}

		return formatDailyTrendMetricValue(
			resolvedMetricKey as DailyTrendMetricKey,
			typeof value === "number" ? value : null,
		);
	};
}
```

- [ ] **Step 4: Run the helper test and confirm it passes**

Run: `npm run test:run -- src/widgets/daily-trend-chart/model/__tests__/daily-trend-chart.test.ts`

Expected: pass with stable config and formatter behavior.

### Task 2: Split Metric Toggle And Line Chart Composition

**Files:**
- Create: `src/widgets/daily-trend-chart/ui/daily-trend-metric-toggle-group.tsx`
- Create: `src/widgets/daily-trend-chart/ui/__tests__/daily-trend-metric-toggle-group.test.tsx`
- Create: `src/widgets/daily-trend-chart/ui/__tests__/daily-trend-line-chart.test.tsx`
- Modify: `src/widgets/daily-trend-chart/ui/daily-trend-line-chart.tsx`
- Modify: `src/widgets/daily-trend-chart/ui/daily-trend-chart-card.tsx`

- [ ] **Step 1: Write the failing tests for the extracted components**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DailyTrendMetricToggleGroup } from "@/widgets/daily-trend-chart/ui/daily-trend-metric-toggle-group";

describe("DailyTrendMetricToggleGroup", () => {
	it("marks both visible metrics as active by default and toggles them", async () => {
		const user = userEvent.setup();
		const onToggleMetric = vi.fn();

		render(
			<DailyTrendMetricToggleGroup
				activeMetrics={["impressions", "clicks"]}
				onToggleMetric={onToggleMetric}
			/>,
		);

		expect(screen.getByRole("button", { name: "노출수" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
		expect(screen.getByRole("button", { name: "클릭수" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);

		await user.click(screen.getByRole("button", { name: "노출수" }));

		expect(onToggleMetric).toHaveBeenCalledWith("impressions");
	});
});
```

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DailyTrendLineChart } from "@/widgets/daily-trend-chart/ui/daily-trend-line-chart";

vi.mock("recharts", async () => {
	return {
		CartesianGrid: () => <div data-testid="cartesian-grid" />,
		XAxis: ({ dataKey }: { dataKey?: string }) => (
			<div data-testid="x-axis" data-key={dataKey ?? ""} />
		),
		YAxis: () => <div data-testid="y-axis" />,
		LineChart: ({
			children,
			data,
		}: {
			children: import("react").ReactNode;
			data?: unknown[];
		}) => (
			<div data-testid="daily-trend-line-chart" data-count={data?.length ?? 0}>
				{children}
			</div>
		),
		Line: (props: Record<string, unknown>) => (
			<div data-testid={`line-${String(props.dataKey)}`} />
		),
	};
});

describe("DailyTrendLineChart", () => {
	it("renders only selected metric lines and keeps the chart accessible", () => {
		render(
			<DailyTrendLineChart
				data={[
					{
						date: "2026-04-01",
						impressions: 100,
						clicks: 10,
						conversions: 1,
						cost: 1000,
					},
				]}
				activeMetrics={["impressions", "clicks"]}
			/>,
		);

		expect(
			screen.getByRole("img", { name: "일별 추이 차트" }),
		).toBeInTheDocument();
		expect(screen.getByTestId("daily-trend-line-chart")).toHaveAttribute(
			"data-count",
			"1",
		);
		expect(screen.getByTestId("line-impressions")).toBeInTheDocument();
		expect(screen.getByTestId("line-clicks")).toBeInTheDocument();
		expect(screen.queryByTestId("line-conversions")).not.toBeInTheDocument();
		expect(screen.queryByTestId("line-cost")).not.toBeInTheDocument();
	});
});
```

- [ ] **Step 2: Run the tests once and confirm they fail**

Run: `npm run test:run -- src/widgets/daily-trend-chart/ui/__tests__/daily-trend-metric-toggle-group.test.tsx src/widgets/daily-trend-chart/ui/__tests__/daily-trend-line-chart.test.tsx`

Expected: fail because the new toggle-group file does not exist and line chart still contains old responsibilities.

- [ ] **Step 3: Implement the toggle group and simplify the line chart**

```tsx
// src/widgets/daily-trend-chart/ui/daily-trend-metric-toggle-group.tsx
import type { DailyTrendMetricKey } from "@/widgets/daily-trend-chart/model/metrics";
import { ToggleButton } from "@/shared/ui/toggle-button";
import { dailyTrendVisibleMetricDefinitions } from "@/widgets/daily-trend-chart/model/daily-trend-chart";

type DailyTrendMetricToggleGroupProps = {
	activeMetrics: DailyTrendMetricKey[];
	metricGroupLabel?: string;
	onToggleMetric: (metricKey: DailyTrendMetricKey) => void;
};

export function DailyTrendMetricToggleGroup({
	activeMetrics,
	metricGroupLabel = "일별 추이 메트릭",
	onToggleMetric,
}: DailyTrendMetricToggleGroupProps) {
	return (
		<fieldset
			className="flex w-max flex-nowrap justify-end gap-2"
			aria-label={metricGroupLabel}
		>
			<legend className="sr-only">{metricGroupLabel}</legend>
			{dailyTrendVisibleMetricDefinitions.map((metric) => {
				const isActive = activeMetrics.includes(metric.key);

				return (
					<ToggleButton
						key={metric.key}
						type="button"
						pressed={isActive}
						onClick={() => onToggleMetric(metric.key)}
					>
						{metric.label}
					</ToggleButton>
				);
			})}
		</fieldset>
	);
}
```

```tsx
// src/widgets/daily-trend-chart/ui/daily-trend-line-chart.tsx
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import type { DailyTrendPoint } from "@/entities/daily-stat/lib/build-daily-trend-series";
import {
	ChartContainer,
	ChartLegend,
	ChartTooltip,
	ChartTooltipContent,
} from "@/shared/ui/chart";
import {
	buildDailyTrendChartConfig,
	createDailyTrendTooltipFormatter,
	dailyTrendVisibleMetricDefinitions,
	formatDailyTrendDateLabel,
	formatDailyTrendYAxisTick,
} from "@/widgets/daily-trend-chart/model/daily-trend-chart";
import type { DailyTrendMetricKey } from "@/widgets/daily-trend-chart/model/metrics";

const tooltipContent = (
	<ChartTooltipContent formatter={createDailyTrendTooltipFormatter()} />
);

type DailyTrendLineChartProps = {
	data: DailyTrendPoint[];
	activeMetrics: DailyTrendMetricKey[];
};

export function DailyTrendLineChart({
	data,
	activeMetrics,
}: DailyTrendLineChartProps) {
	return (
		<ChartContainer
			className="h-80 min-w-[720px] sm:min-w-0"
			config={buildDailyTrendChartConfig()}
		>
			<LineChart data={data}>
				<CartesianGrid vertical={false} stroke="var(--color-outline-subtle)" />
				<XAxis
					axisLine={false}
					dataKey="date"
					minTickGap={24}
					tickFormatter={formatDailyTrendDateLabel}
					tickLine={false}
				/>
				<YAxis
					axisLine={false}
					tickFormatter={formatDailyTrendYAxisTick}
					tickLine={false}
					width={56}
				/>
				<ChartTooltip content={tooltipContent} />
				<ChartLegend />
				{dailyTrendVisibleMetricDefinitions
					.filter((metric) => activeMetrics.includes(metric.key))
					.map((metric) => (
						<Line
							key={metric.key}
							type="monotone"
							dataKey={metric.key}
							name={metric.key}
							stroke={`var(--color-${metric.key})`}
							strokeWidth={2}
							dot={true}
							connectNulls={false}
						/>
					))}
			</LineChart>
		</ChartContainer>
	);
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npm run test:run -- src/widgets/daily-trend-chart/ui/__tests__/daily-trend-metric-toggle-group.test.tsx src/widgets/daily-trend-chart/ui/__tests__/daily-trend-line-chart.test.tsx`

Expected: pass with toggle behavior preserved and the chart rendered as a pure composition component.

### Task 3: Split Card Frame, Status, And Chart Content Components

**Files:**
- Create: `src/widgets/daily-trend-chart/ui/daily-trend-chart-frame.tsx`
- Create: `src/widgets/daily-trend-chart/ui/daily-trend-chart-status.tsx`
- Create: `src/widgets/daily-trend-chart/ui/daily-trend-chart-content.tsx`
- Create: `src/widgets/daily-trend-chart/ui/__tests__/daily-trend-chart-frame.test.tsx`
- Create: `src/widgets/daily-trend-chart/ui/__tests__/daily-trend-chart-status.test.tsx`
- Create: `src/widgets/daily-trend-chart/ui/__tests__/daily-trend-chart-content.test.tsx`
- Modify: `src/widgets/daily-trend-chart/ui/daily-trend-chart-card.tsx`
- Modify: `src/widgets/daily-trend-chart/ui/__tests__/daily-trend-chart-card.test.tsx`

- [ ] **Step 1: Write the failing tests for frame, status, and content**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DailyTrendChartFrame } from "@/widgets/daily-trend-chart/ui/daily-trend-chart-frame";

describe("DailyTrendChartFrame", () => {
	it("renders the title, description, actions slot, status slot, and children", () => {
		render(
			<DailyTrendChartFrame
				actions={<div>메트릭</div>}
				status={<div>동기화 중</div>}
			>
				<div>본문</div>
			</DailyTrendChartFrame>,
		);

		expect(screen.getByRole("heading", { name: "성과 개요" })).toBeInTheDocument();
		expect(
			screen.getByText("전역 필터 기준으로 집계한 일별 추이 꺾은선 그래프입니다."),
		).toBeInTheDocument();
		expect(screen.getByText("메트릭")).toBeInTheDocument();
		expect(screen.getByText("동기화 중")).toBeInTheDocument();
		expect(screen.getByText("본문")).toBeInTheDocument();
	});
});
```

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DailyTrendChartStatus } from "@/widgets/daily-trend-chart/ui/daily-trend-chart-status";

describe("DailyTrendChartStatus", () => {
	it("renders loading, empty, error, stale, and syncing states", () => {
		render(<DailyTrendChartStatus kind="loading" />);
		expect(screen.getByTestId("daily-trend-loading")).toBeInTheDocument();

		render(
			<DailyTrendChartStatus
				kind="full-error"
				errorMessage="Request failed: 500"
			/>,
		);
		expect(screen.getByText("성과 데이터를 불러오지 못했습니다.")).toBeInTheDocument();
		expect(screen.getByText("Request failed: 500")).toBeInTheDocument();

		render(
			<DailyTrendChartStatus
				kind="empty-campaigns"
				message="필터 조건에 맞는 캠페인이 없습니다."
			/>,
		);
		expect(
			screen.getByText("필터 조건에 맞는 캠페인이 없습니다."),
		).toBeInTheDocument();

		render(
			<DailyTrendChartStatus
				kind="empty-data"
				message="선택한 캠페인에 표시할 일별 데이터가 없습니다."
			/>,
		);
		expect(
			screen.getByText("선택한 캠페인에 표시할 일별 데이터가 없습니다."),
		).toBeInTheDocument();

		render(
			<DailyTrendChartStatus
				kind="stale"
				message="최신 성과 데이터를 불러오지 못해 마지막 성공 결과를 표시 중입니다."
			/>,
		);
		expect(
			screen.getByText("최신 성과 데이터를 불러오지 못해 마지막 성공 결과를 표시 중입니다."),
		).toBeInTheDocument();

		render(<DailyTrendChartStatus kind="syncing" />);
		expect(screen.getByRole("status", { name: "동기화 중" })).toBeInTheDocument();
	});
});
```

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DailyTrendChartContent } from "@/widgets/daily-trend-chart/ui/daily-trend-chart-content";

vi.mock("@/widgets/daily-trend-chart/ui/daily-trend-line-chart", () => ({
	DailyTrendLineChart: () => <div data-testid="daily-trend-line-chart" />,
}));

describe("DailyTrendChartContent", () => {
	it("wraps the chart in the dense scroll area and keeps the viewport test id", () => {
		render(
			<DailyTrendChartContent
				activeMetrics={["impressions", "clicks"]}
				chartData={[
					{
						date: "2026-04-01",
						impressions: 100,
						clicks: 10,
						conversions: 1,
						cost: 1000,
					},
				]}
			/>,
		);

		expect(screen.getByTestId("daily-trend-scroll-area")).toBeInTheDocument();
		expect(screen.getByTestId("daily-trend-line-chart")).toBeInTheDocument();
	});
});
```

- [ ] **Step 2: Run the tests once and confirm they fail**

Run:
`npm run test:run -- src/widgets/daily-trend-chart/ui/__tests__/daily-trend-chart-frame.test.tsx src/widgets/daily-trend-chart/ui/__tests__/daily-trend-chart-status.test.tsx src/widgets/daily-trend-chart/ui/__tests__/daily-trend-chart-content.test.tsx`

Expected: fail because the new frame/status/content files do not exist yet.

- [ ] **Step 3: Implement the frame, status, and content components, then slim the card**

```tsx
// src/widgets/daily-trend-chart/ui/daily-trend-chart-frame.tsx
import type { ReactNode } from "react";

type DailyTrendChartFrameProps = {
	children: ReactNode;
	actions?: ReactNode;
	status?: ReactNode;
};

export function DailyTrendChartFrame({
	children,
	actions,
	status,
}: DailyTrendChartFrameProps) {
	return (
		<section className="rounded-panel border border-outline-subtle bg-panel p-panel shadow-panel">
			<div className="flex flex-col gap-5">
				<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
					<div className="flex flex-col gap-2">
						<h2>성과 개요</h2>
						<p className="typo-body-sm text-fg-muted">
							전역 필터 기준으로 집계한 일별 추이 꺾은선 그래프입니다.
						</p>
					</div>
					{actions ? (
						<div className="-mx-1 overflow-x-auto px-1 lg:mx-0 lg:self-start lg:px-0">
							{actions}
						</div>
					) : null}
				</div>
				<div className="min-h-5">{status ?? null}</div>
				{children}
			</div>
		</section>
	);
}
```

```tsx
// src/widgets/daily-trend-chart/ui/daily-trend-chart-status.tsx
type DailyTrendChartStatusProps =
	| { kind: "loading" }
	| { kind: "full-error"; errorMessage: string }
	| { kind: "empty-campaigns"; message: string }
	| { kind: "empty-data"; message: string }
	| { kind: "stale"; message: string }
	| { kind: "syncing" };

export function DailyTrendChartStatus(props: DailyTrendChartStatusProps) {
	switch (props.kind) {
		case "loading":
			return (
				<div
					className="h-80 rounded-card border border-outline-subtle bg-panel-muted"
					data-testid="daily-trend-loading"
				/>
			);
		case "full-error":
			return (
				<div className="rounded-card border border-status-danger-border bg-status-danger/30 px-4 py-5 typo-body-sm text-status-danger-fg">
					<p>성과 데이터를 불러오지 못했습니다.</p>
					<p className="mt-1 text-fg-muted">{props.errorMessage}</p>
				</div>
			);
		case "empty-campaigns":
			return (
				<div className="flex h-80 items-center justify-center rounded-card border border-outline-subtle bg-panel-muted px-4 typo-body-sm text-fg-muted">
					{props.message}
				</div>
			);
		case "empty-data":
			return (
				<div className="flex h-80 items-center justify-center rounded-card border border-outline-subtle bg-panel-muted px-4 typo-body-sm text-fg-muted">
					{props.message}
				</div>
			);
		case "stale":
			return (
				<div className="rounded-card border border-status-danger-border bg-status-danger/30 px-4 py-3 typo-body-sm text-status-danger-fg">
					<p>{props.message}</p>
				</div>
			);
		case "syncing":
			return (
				<p
					className="typo-body-sm text-fg-muted"
					role="status"
					aria-live="polite"
				>
					동기화 중
				</p>
			);
	}
}
```

```tsx
// src/widgets/daily-trend-chart/ui/daily-trend-chart-content.tsx
import type { DailyTrendPoint } from "@/entities/daily-stat/lib/build-daily-trend-series";
import { DataDenseScrollArea } from "@/shared/ui/data-dense-scroll-area";
import type { DailyTrendMetricKey } from "@/widgets/daily-trend-chart/model/metrics";
import { DailyTrendLineChart } from "@/widgets/daily-trend-chart/ui/daily-trend-line-chart";

type DailyTrendChartContentProps = {
	activeMetrics: DailyTrendMetricKey[];
	chartData: DailyTrendPoint[];
};

export function DailyTrendChartContent({
	activeMetrics,
	chartData,
}: DailyTrendChartContentProps) {
	return (
		<DataDenseScrollArea
			hint="좌우로 스크롤해 추이 전체를 비교하세요."
			className="-mx-2 px-2 sm:mx-0 sm:px-0"
			viewportTestId="daily-trend-scroll-area"
		>
			<DailyTrendLineChart activeMetrics={activeMetrics} data={chartData} />
		</DataDenseScrollArea>
	);
}
```

```tsx
// src/widgets/daily-trend-chart/ui/daily-trend-chart-card.tsx
import type { ReactNode } from "react";
import { useDailyTrendChartViewModel } from "@/widgets/daily-trend-chart/model/use-daily-trend-chart-view-model";
import { DailyTrendMetricToggleGroup } from "@/widgets/daily-trend-chart/ui/daily-trend-metric-toggle-group";
import { DailyTrendChartContent } from "@/widgets/daily-trend-chart/ui/daily-trend-chart-content";
import { DailyTrendChartFrame } from "@/widgets/daily-trend-chart/ui/daily-trend-chart-frame";
import { DailyTrendChartStatus } from "@/widgets/daily-trend-chart/ui/daily-trend-chart-status";

export { resolveDailyTrendChartViewState } from "@/widgets/daily-trend-chart/model/use-daily-trend-chart-view-model";

function resolveDailyTrendChartStatus(
	viewState: ReturnType<typeof useDailyTrendChartViewModel>["viewState"],
): ReactNode {
	switch (viewState.kind) {
		case "loading":
			return <DailyTrendChartStatus kind="loading" />;
		case "full-error":
			return (
				<DailyTrendChartStatus
					kind="full-error"
					errorMessage={viewState.errorMessage}
				/>
			);
		case "empty-campaigns":
			return (
				<DailyTrendChartStatus
					kind="empty-campaigns"
					message="필터 조건에 맞는 캠페인이 없습니다."
				/>
			);
		case "empty-data":
			return (
				<DailyTrendChartStatus
					kind="empty-data"
					message="선택한 캠페인에 표시할 일별 데이터가 없습니다."
				/>
			);
		case "chart":
			return (
				<>
					{viewState.staleErrorMessage ? (
						<DailyTrendChartStatus
							kind="stale"
							message="최신 성과 데이터를 불러오지 못해 마지막 성공 결과를 표시 중입니다."
						/>
					) : null}
					{viewState.isSyncing ? <DailyTrendChartStatus kind="syncing" /> : null}
				</>
			);
	}
}

export function DailyTrendChartCard() {
	const { activeMetrics, toggleMetric, viewState } =
		useDailyTrendChartViewModel();

	return (
		<DailyTrendChartFrame
			actions={
				viewState.kind === "chart" ? (
					<DailyTrendMetricToggleGroup
						activeMetrics={activeMetrics}
						onToggleMetric={toggleMetric}
					/>
				) : null
			}
			status={resolveDailyTrendChartStatus(viewState)}
		>
			{viewState.kind === "chart" ? (
				<DailyTrendChartContent
					activeMetrics={activeMetrics}
					chartData={viewState.chartData}
				/>
			) : null}
		</DailyTrendChartFrame>
	);
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run:
`npm run test:run -- src/widgets/daily-trend-chart/ui/__tests__/daily-trend-metric-toggle-group.test.tsx src/widgets/daily-trend-chart/ui/__tests__/daily-trend-line-chart.test.tsx src/widgets/daily-trend-chart/ui/__tests__/daily-trend-chart-frame.test.tsx src/widgets/daily-trend-chart/ui/__tests__/daily-trend-chart-status.test.tsx src/widgets/daily-trend-chart/ui/__tests__/daily-trend-chart-content.test.tsx src/widgets/daily-trend-chart/ui/__tests__/daily-trend-chart-card.test.tsx src/widgets/daily-trend-chart/model/__tests__/daily-trend-chart.test.ts`

Expected: pass with the card slimmed down and the chart/controls split into focused components.

### Task 4: Final Verification And Cleanup

**Files:**
- Modify: `src/widgets/daily-trend-chart/ui/daily-trend-chart-card.tsx`
- Modify: `src/widgets/daily-trend-chart/ui/daily-trend-line-chart.tsx`
- Modify: any import sites touched by the refactor

- [ ] **Step 1: Run the full widget test suite**

Run:
`npm run test:run -- src/widgets/daily-trend-chart/model/__tests__/daily-trend-chart.test.ts src/widgets/daily-trend-chart/model/__tests__/use-daily-trend-chart-view-model.test.tsx src/widgets/daily-trend-chart/ui/__tests__/daily-trend-metric-toggle-group.test.tsx src/widgets/daily-trend-chart/ui/__tests__/daily-trend-line-chart.test.tsx src/widgets/daily-trend-chart/ui/__tests__/daily-trend-chart-frame.test.tsx src/widgets/daily-trend-chart/ui/__tests__/daily-trend-chart-status.test.tsx src/widgets/daily-trend-chart/ui/__tests__/daily-trend-chart-content.test.tsx src/widgets/daily-trend-chart/ui/__tests__/daily-trend-chart-card.test.tsx`

Expected: all tests pass.

- [ ] **Step 2: Run lint**

Run: `npm run lint`

Expected: no formatting or import errors.

- [ ] **Step 3: Confirm file responsibilities**

Verify:
- `daily-trend-chart-card.tsx` only orchestrates `viewState` to frame/status/content.
- `daily-trend-line-chart.tsx` only composes the line chart primitives.
- `model/daily-trend-chart.ts` contains the reusable format/config helpers.
- `ui/daily-trend-*` subcomponents each own a single UI concern.

---

## Self-Review

1. **Spec coverage:** The plan covers card orchestration, helper extraction, metric toggle separation, line chart simplification, and test redistribution.
2. **Placeholder scan:** No `TODO`, `TBD`, or vague “similar to above” steps remain.
3. **Type consistency:** The names used across tasks match the current codebase: `DailyTrendMetricKey`, `DailyTrendPoint`, `DailyTrendChartViewState`, `DailyTrendChartFrame`, `DailyTrendChartStatus`, and `DailyTrendChartContent`.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-12-daily-trend-chart-refactor.md`. Two execution options:

**1. Subagent-Driven (recommended)** - fresh subagent per task, review between tasks, faster iteration

**2. Inline Execution** - execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
