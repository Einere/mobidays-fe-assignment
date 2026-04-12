# Platform Performance Donut Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `platform-performance-donut-chart.tsx` 안에 섞여 있는 순수 로직, 접근성용 요약, 범례 렌더링, 상호작용 섹터를 분리해서 유지보수 가능한 구조로 만든다.

**Architecture:** 순수 계산과 판별 로직은 `model/` 아래로 내리고, Recharts 섹터와 범례/요약 UI는 각각 독립된 `ui/` 컴포넌트로 분리한다. 최종 `platform-performance-donut-chart.tsx` 는 데이터와 이벤트를 조립만 하는 얇은 컴포넌트로 유지하고, 카드 레벨 오케스트레이션은 `platform-performance-chart-card.tsx` 가 계속 맡는다. 기존 테스트는 새 파일 단위의 작은 테스트로 나누고, 통합 테스트는 차트 조립 동작만 확인하도록 줄인다.

**Tech Stack:** React 19, TypeScript, Recharts, Vitest, Testing Library, existing FSD widget structure

---

## File Structure

- Create: `src/widgets/platform-performance-chart/model/platform-performance-donut.ts`
  - 색상 정책, 플랫폼 판별, Pie payload 해석, 차트 config/slice map 생성 같은 순수 로직
- Create: `src/widgets/platform-performance-chart/model/__tests__/platform-performance-donut.test.ts`
  - 색상 fallback, known/unknown platform 판별, payload 추출, config 생성 테스트
- Create: `src/widgets/platform-performance-chart/ui/platform-performance-pie-sector.tsx`
  - Recharts `Sector` 기반의 인터랙티브 섹터만 담당
- Create: `src/widgets/platform-performance-chart/ui/platform-performance-metric-toggle-group.tsx`
  - 메트릭 토글 버튼 그룹만 담당
- Create: `src/widgets/platform-performance-chart/ui/platform-performance-donut-summary-table.tsx`
  - 스크린리더용 요약 테이블만 담당
- Create: `src/widgets/platform-performance-chart/ui/platform-performance-donut-legend-item.tsx`
  - 플랫폼별 범례 카드 한 개의 렌더링만 담당
- Create: `src/widgets/platform-performance-chart/ui/platform-performance-donut-legend.tsx`
  - 범례 리스트와 스크롤/그리드 레이아웃 담당
- Modify: `src/widgets/platform-performance-chart/ui/platform-performance-donut-chart.tsx`
  - 조립 전용 컴포넌트로 축소, 위 컴포넌트 조합만 수행
- Modify: `src/widgets/platform-performance-chart/ui/__tests__/platform-performance-donut-chart.test.tsx`
  - 조립과 사용자 상호작용만 검증하도록 범위 축소
- Create: `src/widgets/platform-performance-chart/ui/__tests__/platform-performance-pie-sector.test.tsx`
  - 섹터 클릭/키보드/포커스/unknown platform 처리 테스트
- Create: `src/widgets/platform-performance-chart/ui/__tests__/platform-performance-metric-toggle-group.test.tsx`
  - 토글 그룹의 선택 상태와 콜백 테스트
- Create: `src/widgets/platform-performance-chart/ui/__tests__/platform-performance-donut-summary-table.test.tsx`
  - 접근성 요약 테이블이 올바른 row/label/value를 노출하는지 테스트
- Create: `src/widgets/platform-performance-chart/ui/__tests__/platform-performance-donut-legend.test.tsx`
  - known/unknown slice 렌더링과 선택 상태, 클릭 연동 테스트

### Task 1: Extract Pure Donut Helpers Into Model Layer

**Files:**
- Create: `src/widgets/platform-performance-chart/model/platform-performance-donut.ts`
- Create: `src/widgets/platform-performance-chart/model/__tests__/platform-performance-donut.test.ts`
- Modify: `src/widgets/platform-performance-chart/ui/platform-performance-donut-chart.tsx`

- [ ] **Step 1: Write failing tests for pure helper behavior**

```ts
import { describe, expect, it } from "vitest";
import {
	buildPlatformPerformanceChartConfig,
	extractPlatformFromPiePayload,
	getPlatformPerformanceDonutColor,
	isKnownCampaignPlatformForDonut,
} from "@/widgets/platform-performance-chart/model/platform-performance-donut";

describe("platform-performance-donut helpers", () => {
	it("falls back to deterministic colors for unknown platforms", () => {
		expect(getPlatformPerformanceDonutColor("Google", 0)).toBe("var(--chart-danger)");
		expect(getPlatformPerformanceDonutColor("TikTok", 0)).toBe("var(--chart-series-4)");
		expect(getPlatformPerformanceDonutColor("TikTok", 4)).toBe("var(--chart-series-3)");
	});

	it("extracts known platform values from pie payloads only", () => {
		expect(extractPlatformFromPiePayload({ platform: "Meta" })).toBe("Meta");
		expect(extractPlatformFromPiePayload({ payload: { platform: "Naver" } })).toBe("Naver");
		expect(extractPlatformFromPiePayload({ platform: "TikTok" })).toBeNull();
		expect(extractPlatformFromPiePayload(null)).toBeNull();
	});

	it("builds chart config from slice data", () => {
		const config = buildPlatformPerformanceChartConfig([
			{ platform: "Google", value: 100, sharePercent: 50, isSelected: true },
			{ platform: "Meta", value: 100, sharePercent: 50, isSelected: false },
		]);

		expect(config.Google.label).toBe("Google");
		expect(config.Meta.color).toBe("var(--chart-positive)");
	});
});
```

- [ ] **Step 2: Run the helper test and confirm it fails**

Run: `npm run test:run -- src/widgets/platform-performance-chart/model/__tests__/platform-performance-donut.test.ts`

Expected: fail because the new helper module does not exist yet.

- [ ] **Step 3: Implement the helper module**

```ts
// src/widgets/platform-performance-chart/model/platform-performance-donut.ts
import { type CampaignPlatform, campaignPlatformValues } from "@/entities/global-filter/model/platforms";
import { unknownPlatformLabel } from "@/entities/platform-performance/model/types";
import type { PlatformPerformanceSlice } from "@/entities/platform-performance/model/types";

export const platformPerformanceDonutFallbackColors = [
	"var(--chart-series-4)",
	"var(--chart-series-5)",
	"var(--chart-series-1)",
	"var(--chart-series-2)",
	"var(--chart-series-3)",
] as const;

export const platformPerformanceDonutColorMap: Record<string, string> = {
	Google: "var(--chart-danger)",
	Meta: "var(--chart-positive)",
	Naver: "var(--chart-warning)",
	[unknownPlatformLabel]: "var(--chart-series-4)",
};

export function getPlatformPerformanceDonutColor(platform: string, index: number) {
	return (
		platformPerformanceDonutColorMap[platform] ??
		platformPerformanceDonutFallbackColors[index % platformPerformanceDonutFallbackColors.length]
	);
}

export function isKnownCampaignPlatformForDonut(
	platform: string,
): platform is CampaignPlatform {
	return campaignPlatformValues.includes(platform as CampaignPlatform);
}

export function extractPlatformFromPiePayload(payload: unknown) {
	if (typeof payload !== "object" || payload === null) return null;

	const maybePayload = payload as { platform?: string; payload?: { platform?: string } };
	const platform = maybePayload.platform ?? maybePayload.payload?.platform;

	return platform && campaignPlatformValues.includes(platform as CampaignPlatform)
		? (platform as CampaignPlatform)
		: null;
}

export function buildPlatformPerformanceChartConfig(
	data: readonly PlatformPerformanceSlice[],
) {
	return Object.fromEntries(
		data.map((slice, index) => [
			slice.platform,
			{
				label: slice.platform,
				color: getPlatformPerformanceDonutColor(slice.platform, index),
			},
		]),
	);
}
```

- [ ] **Step 4: Run the helper test and confirm it passes**

Run: `npm run test:run -- src/widgets/platform-performance-chart/model/__tests__/platform-performance-donut.test.ts`

Expected: pass with stable color mapping and payload extraction.

### Task 2: Split Interaction, Toggle, And Accessibility Components

**Files:**
- Create: `src/widgets/platform-performance-chart/ui/platform-performance-pie-sector.tsx`
- Create: `src/widgets/platform-performance-chart/ui/platform-performance-metric-toggle-group.tsx`
- Create: `src/widgets/platform-performance-chart/ui/platform-performance-donut-summary-table.tsx`
- Create: `src/widgets/platform-performance-chart/ui/__tests__/platform-performance-pie-sector.test.tsx`
- Create: `src/widgets/platform-performance-chart/ui/__tests__/platform-performance-metric-toggle-group.test.tsx`
- Create: `src/widgets/platform-performance-chart/ui/__tests__/platform-performance-donut-summary-table.test.tsx`
- Modify: `src/widgets/platform-performance-chart/ui/platform-performance-donut-chart.tsx`

- [ ] **Step 1: Write failing tests for the extracted components**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PlatformPerformancePieSector } from "@/widgets/platform-performance-chart/ui/platform-performance-pie-sector";

describe("PlatformPerformancePieSector", () => {
	it("acts like an interactive button for known platforms", async () => {
		const user = userEvent.setup();
		const onPlatformSelect = vi.fn();

		render(
			<PlatformPerformancePieSector
				cx={0}
				cy={0}
				innerRadius={0}
				outerRadius={0}
				startAngle={0}
				endAngle={90}
				fill="var(--chart-danger)"
				payload={{ platform: "Google", value: 100, sharePercent: 50, isSelected: true }}
				onPlatformSelect={onPlatformSelect}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Google 선택" }));
		expect(onPlatformSelect).toHaveBeenCalledWith("Google");
	});
});
```

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlatformPerformanceDonutSummaryTable } from "@/widgets/platform-performance-chart/ui/platform-performance-donut-summary-table";

describe("PlatformPerformanceDonutSummaryTable", () => {
	it("renders a sr-only table with platform rows", () => {
		render(
			<PlatformPerformanceDonutSummaryTable
				data={[
					{ platform: "Google", value: 100, sharePercent: 80, isSelected: true },
					{ platform: "Meta", value: 25, sharePercent: 20, isSelected: false },
				]}
				metricLabel="비용"
				formatValue={(value) => `₩${value}`}
			/>,
		);

		expect(screen.getByRole("table", { name: "플랫폼별 성과 요약" })).toBeInTheDocument();
		expect(screen.getByRole("cell", { name: "Google" })).toBeInTheDocument();
	});
});
```

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PlatformPerformanceMetricToggleGroup } from "@/widgets/platform-performance-chart/ui/platform-performance-metric-toggle-group";

describe("PlatformPerformanceMetricToggleGroup", () => {
	it("marks the active metric and emits changes", async () => {
		const user = userEvent.setup();
		const onMetricChange = vi.fn();

		render(
			<PlatformPerformanceMetricToggleGroup
				activeMetricKey="cost"
				onMetricChange={onMetricChange}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "클릭수" }));
		expect(onMetricChange).toHaveBeenCalledWith("clicks");
	});
});
```

- [ ] **Step 2: Run each test once and confirm it fails**

Run:
`npm run test:run -- src/widgets/platform-performance-chart/ui/__tests__/platform-performance-pie-sector.test.tsx src/widgets/platform-performance-chart/ui/__tests__/platform-performance-metric-toggle-group.test.tsx src/widgets/platform-performance-chart/ui/__tests__/platform-performance-donut-summary-table.test.tsx`

Expected: fail because the files do not exist yet.

- [ ] **Step 3: Implement each component as a thin wrapper**

```tsx
// src/widgets/platform-performance-chart/ui/platform-performance-metric-toggle-group.tsx
type PlatformPerformanceMetricToggleGroupProps = {
	activeMetricKey: PlatformMetricKey;
	onMetricChange: (metricKey: PlatformMetricKey) => void;
	metricDefinitionLookup?: readonly PlatformPerformanceMetricDefinition[];
};

export function PlatformPerformanceMetricToggleGroup({
	activeMetricKey,
	onMetricChange,
	metricDefinitionLookup = platformPerformanceMetricDefinitions,
}: PlatformPerformanceMetricToggleGroupProps) {
	return (
		<fieldset className="flex w-max flex-nowrap justify-end gap-2" aria-label="플랫폼별 성과 메트릭">
			<legend className="sr-only">플랫폼별 성과 메트릭</legend>
			{metricDefinitionLookup.map((metric) => (
				<ToggleButton
					key={metric.key}
					type="button"
					pressed={metric.key === activeMetricKey}
					onClick={() => onMetricChange(metric.key)}
				>
					{metric.label}
				</ToggleButton>
			))}
		</fieldset>
	);
}
```

```tsx
// src/widgets/platform-performance-chart/ui/platform-performance-pie-sector.tsx
type PlatformPerformancePieSectorProps = ComponentProps<typeof Sector> & {
	payload?: PlatformPerformanceSlice;
	onPlatformSelect: (platform: CampaignPlatform) => void;
};

export function PlatformPerformancePieSector({
	payload,
	onPlatformSelect,
	...props
}: PlatformPerformancePieSectorProps) {
	// Keep the existing focus, keyboard, and click handling here.
	return <Sector {...props} />;
}
```

```tsx
// src/widgets/platform-performance-chart/ui/platform-performance-donut-summary-table.tsx
type PlatformPerformanceDonutSummaryTableProps = {
	data: readonly PlatformPerformanceSlice[];
	metricLabel: string;
	formatValue: (value: number) => string;
	id?: string;
};

export function PlatformPerformanceDonutSummaryTable({
	data,
	metricLabel,
	formatValue,
	id,
}: PlatformPerformanceDonutSummaryTableProps) {
	return (
		<table id={id} className="sr-only" aria-label="플랫폼별 성과 요약">
			<caption className="sr-only">
				선택한 메트릭 기준 플랫폼별 성과 및 점유율 요약
			</caption>
			<thead>
				<tr>
					<th scope="col">플랫폼</th>
					<th scope="col">점유율</th>
					<th scope="col">{metricLabel}</th>
				</tr>
			</thead>
			<tbody>
				{data.map((slice) => (
					<tr key={slice.platform}>
						<td>{slice.platform}</td>
						<td>{percentageFormatter.format(slice.sharePercent)}%</td>
						<td>{formatValue(slice.value)}</td>
					</tr>
				))}
			</tbody>
		</table>
	);
}
```

- [ ] **Step 4: Run the three tests and confirm they pass**

Run:
`npm run test:run -- src/widgets/platform-performance-chart/ui/__tests__/platform-performance-pie-sector.test.tsx src/widgets/platform-performance-chart/ui/__tests__/platform-performance-metric-toggle-group.test.tsx src/widgets/platform-performance-chart/ui/__tests__/platform-performance-donut-summary-table.test.tsx`

Expected: pass with interaction behavior preserved and the accessibility table still exposed.

### Task 3: Extract Legend Composition And Simplify The Main Donut Chart

**Files:**
- Create: `src/widgets/platform-performance-chart/ui/platform-performance-donut-legend-item.tsx`
- Create: `src/widgets/platform-performance-chart/ui/platform-performance-donut-legend.tsx`
- Modify: `src/widgets/platform-performance-chart/ui/platform-performance-donut-chart.tsx`
- Modify: `src/widgets/platform-performance-chart/ui/__tests__/platform-performance-donut-chart.test.tsx`
- Create: `src/widgets/platform-performance-chart/ui/__tests__/platform-performance-donut-legend.test.tsx`

- [ ] **Step 1: Write failing tests for legend rendering and selection affordance**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PlatformPerformanceDonutLegend } from "@/widgets/platform-performance-chart/ui/platform-performance-donut-legend";

describe("PlatformPerformanceDonutLegend", () => {
	it("renders known slices as buttons and unknown slices as disabled sections", () => {
		render(
			<PlatformPerformanceDonutLegend
				data={[
					{ platform: "Google", value: 100, sharePercent: 75, isSelected: true },
					{ platform: "알 수 없음", value: 25, sharePercent: 25, isSelected: false },
				]}
				metricLabel="비용"
				formatValue={(value) => `₩${value}`}
				onPlatformSelect={vi.fn()}
			/>,
		);

		expect(screen.getByRole("button", { name: /Google/ })).toHaveAttribute("aria-pressed", "true");
		expect(screen.getByLabelText("알 수 없음")).toHaveAttribute("aria-disabled", "true");
	});
});
```

- [ ] **Step 2: Run the legend test and confirm it fails**

Run: `npm run test:run -- src/widgets/platform-performance-chart/ui/__tests__/platform-performance-donut-legend.test.tsx`

Expected: fail because the new legend components do not exist yet.

- [ ] **Step 3: Implement legend item and legend list components**

```tsx
// src/widgets/platform-performance-chart/ui/platform-performance-donut-legend-item.tsx
type PlatformPerformanceDonutLegendItemProps = {
	slice: PlatformPerformanceSlice;
	metricLabel: string;
	formatValue: (value: number) => string;
	color: string;
	onPlatformSelect: (platform: CampaignPlatform) => void;
};

export function PlatformPerformanceDonutLegendItem({
	slice,
	metricLabel,
	formatValue,
	color,
	onPlatformSelect,
}: PlatformPerformanceDonutLegendItemProps) {
	const isKnownPlatform = isKnownCampaignPlatformForDonut(slice.platform);

	return (
		<div
			className="min-w-[12rem] shrink-0 rounded-card border border-outline-subtle bg-panel-muted p-3 lg:min-w-0 lg:w-full lg:shrink"
		>
			{isKnownPlatform ? (
				<button
					type="button"
					className="w-full min-h-control-touch cursor-pointer rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
					onClick={() => onPlatformSelect(slice.platform as CampaignPlatform)}
					aria-pressed={slice.isSelected}
				>
					<div className="mb-1 flex items-center gap-2">
						<span
							className="size-2 rounded-full"
							style={{ backgroundColor: color }}
							aria-hidden
						/>
						<span className="typo-body-md">{slice.platform}</span>
						<span className="ml-auto typo-caption text-fg-subtle">
							{percentageFormatter.format(slice.sharePercent)}%
						</span>
					</div>
					<div className="typo-body-sm font-medium">
						{metricLabel}&nbsp;
						{Number.isFinite(slice.value) ? formatValue(slice.value) : "-"}
					</div>
				</button>
			) : (
				<section
					className="w-full cursor-not-allowed text-left"
					aria-label="알 수 없음"
					aria-disabled="true"
				>
					<div className="mb-1 flex items-center gap-2">
						<span
							className="size-2 rounded-full"
							style={{ backgroundColor: color }}
							aria-hidden
						/>
						<span className="typo-body-md">{slice.platform}</span>
						<span className="ml-auto typo-caption text-fg-subtle">
							{percentageFormatter.format(slice.sharePercent)}%
						</span>
					</div>
					<div className="typo-body-sm font-medium">
						{metricLabel}&nbsp;
						{Number.isFinite(slice.value) ? formatValue(slice.value) : "-"}
					</div>
				</section>
			)}
		</div>
	);
}
```

```tsx
// src/widgets/platform-performance-chart/ui/platform-performance-donut-legend.tsx
type PlatformPerformanceDonutLegendProps = {
	data: readonly PlatformPerformanceSlice[];
	metricLabel: string;
	formatValue: (value: number) => string;
	onPlatformSelect: (platform: CampaignPlatform) => void;
};

export function PlatformPerformanceDonutLegend({
	data,
	metricLabel,
	formatValue,
	onPlatformSelect,
}: PlatformPerformanceDonutLegendProps) {
	return (
		<fieldset
			className="min-w-0 border-0 p-0 lg:grid lg:gap-2"
			aria-label="플랫폼별 성과 도넛 범례"
		>
			<legend className="sr-only">플랫폼별 성과 도넛 범례</legend>
			<div className="flex gap-2 overflow-x-auto pb-1 lg:grid lg:gap-2 lg:pb-0">
				{data.map((slice, index) => (
					<PlatformPerformanceDonutLegendItem
						key={slice.platform}
						slice={slice}
						metricLabel={metricLabel}
						formatValue={formatValue}
						color={getPlatformPerformanceDonutColor(slice.platform, index)}
						onPlatformSelect={onPlatformSelect}
					/>
				))}
			</div>
		</fieldset>
	);
}
```

- [ ] **Step 4: Rewrite `platform-performance-donut-chart.tsx` to compose the extracted pieces only**

Target shape:

```tsx
export function PlatformPerformanceDonut({ data, metric, onPlatformSelect }: Props) {
	const summaryId = useId();
	const chartConfig = useMemo(() => buildPlatformPerformanceChartConfig(data), [data]);
	const sliceByPlatform = useMemo(
		() => new Map<string, PlatformPerformanceSlice>(data.map((slice) => [slice.platform, slice])),
		[data],
	);
	const tooltipFormatter = useMemo(
		() => (_: unknown, name: string | number) => {
			const matchedSlice = sliceByPlatform.get(String(name));

			if (matchedSlice === undefined) {
				return "-";
			}

			return `${metric.label} ${metric.formatValue(matchedSlice.value)} (${percentageFormatter.format(matchedSlice.sharePercent)}%)`;
		},
		[metric, sliceByPlatform],
	);

	return (
		<div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[minmax(0,1.1fr)_220px] lg:gap-5">
			<PlatformPerformanceDonutSummaryTable
				id={summaryId}
				data={data}
				metricLabel={metric.label}
				formatValue={metric.formatValue}
			/>
			<div className="relative flex min-w-0 flex-col rounded-card border border-outline-subtle bg-panel p-3 sm:p-4">
				<div className="relative h-64 sm:h-72" aria-describedby={summaryId} role="img" aria-label={`플랫폼별 ${metric.label} 도넛 차트`}>
					<ChartContainer className="absolute inset-0" config={chartConfig}>
						<PieChart>
							<Pie
								data={data}
								dataKey="value"
								nameKey="platform"
								innerRadius={60}
								outerRadius={105}
								paddingAngle={4}
								shape={<PlatformPerformancePieSector onPlatformSelect={onPlatformSelect} />}
								onClick={(payload: unknown) => {
									const platform = extractPlatformFromPiePayload(payload);

									if (platform !== null) {
										onPlatformSelect(platform);
									}
								}}
							>
								{data.map((slice, index) => (
									<Cell
										key={slice.platform}
										name={slice.platform}
										fill={getPlatformPerformanceDonutColor(slice.platform, index)}
										opacity={isKnownCampaignPlatformForDonut(slice.platform) && !slice.isSelected ? 0.35 : 1}
									/>
								))}
							</Pie>
							<ChartTooltip content={<ChartTooltipContent formatter={tooltipFormatter} />} />
						</PieChart>
					</ChartContainer>
					<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
						<p className="typo-caption text-fg-subtle">현재 기준</p>
						<p className="typo-heading-sm">{metric.label}</p>
					</div>
				</div>
			</div>
			<PlatformPerformanceDonutLegend
				data={data}
				metricLabel={metric.label}
				formatValue={metric.formatValue}
				onPlatformSelect={onPlatformSelect}
			/>
		</div>
	);
}
```

- [ ] **Step 5: Update the main donut chart test to cover composition only**

Keep the existing integration coverage for:
`role="img"` label, `ChartTooltip`, click selection, and responsive layout classes.
Remove assertions that duplicate the new unit tests for sector, summary table, or legend item rendering.

- [ ] **Step 6: Run the donut chart test and confirm it passes**

Run: `npm run test:run -- src/widgets/platform-performance-chart/ui/__tests__/platform-performance-donut-chart.test.tsx`

Expected: pass with the new structure and no behavior regressions.

### Task 4: Final Verification Across The Widget

**Files:**
- Modify: `src/widgets/platform-performance-chart/ui/platform-performance-chart-card.tsx`
- Modify: `src/widgets/platform-performance-chart/ui/platform-performance-donut-chart.tsx`
- Modify: any import sites touched by the refactor

- [ ] **Step 1: Run the full widget test suite**

Run:
`npm run test:run -- src/widgets/platform-performance-chart/model/__tests__/platform-performance-metrics.test.ts src/widgets/platform-performance-chart/model/__tests__/platform-performance-donut.test.ts src/widgets/platform-performance-chart/model/__tests__/use-platform-performance-chart-view-model.test.tsx src/widgets/platform-performance-chart/ui/__tests__/platform-performance-pie-sector.test.tsx src/widgets/platform-performance-chart/ui/__tests__/platform-performance-metric-toggle-group.test.tsx src/widgets/platform-performance-chart/ui/__tests__/platform-performance-donut-summary-table.test.tsx src/widgets/platform-performance-chart/ui/__tests__/platform-performance-donut-legend.test.tsx src/widgets/platform-performance-chart/ui/__tests__/platform-performance-donut-chart.test.tsx src/widgets/platform-performance-chart/ui/__tests__/platform-performance-chart-card.test.tsx`

Expected: all tests pass.

- [ ] **Step 2: Run lint**

Run: `npm run lint`

Expected: no formatting or import errors.

- [ ] **Step 3: Inspect the final file responsibilities**

Confirm:
- `platform-performance-donut-chart.tsx` only composes subcomponents and memoizes derived values.
- `model/platform-performance-donut.ts` contains only pure helpers and no React state.
- `platform-performance-chart-card.tsx` still owns orchestration and query-state branching.
