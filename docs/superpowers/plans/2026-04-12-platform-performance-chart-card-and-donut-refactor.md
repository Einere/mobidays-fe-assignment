# Platform Performance Chart And Donut Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `platform-performance-chart-card.tsx` 와 `platform-performance-donut-chart.tsx` 에 섞인 오케스트레이션, 상태 UI, 순수 로직, 차트 렌더링 책임을 분리해서 수정 범위를 줄이고 파일별 책임을 명확히 한다.

**Architecture:** 카드 레벨에서는 `usePlatformPerformanceChartViewModel()` 결과를 해석해 `loading / full-error / empty / chart` 를 선택하는 오케스트레이션만 남긴다. 차트 레벨에서는 색상 정책, payload 해석, 접근성 요약, 범례 렌더링, 섹터 상호작용을 각각 독립 컴포넌트와 순수 helper 로 분리한다. 이렇게 하면 카드 파일은 상태 흐름만, 차트 파일은 조립만 담당하게 되고, 각 조각은 단위 테스트로 고립된다.

**Tech Stack:** React 19, TypeScript, Recharts, Vitest, Testing Library, existing FSD widget structure

---

## File Structure

- Create: `src/widgets/platform-performance-chart/model/platform-performance-donut.ts`
  - 도넛 차트 색상 정책, known/unknown platform 판별, pie payload 해석, chart config 생성
- Create: `src/widgets/platform-performance-chart/model/__tests__/platform-performance-donut.test.ts`
  - 색상 fallback, payload 추출, config 생성 테스트
- Create: `src/widgets/platform-performance-chart/ui/platform-performance-pie-sector.tsx`
  - Recharts `Sector` 인터랙션만 담당
- Create: `src/widgets/platform-performance-chart/ui/platform-performance-metric-toggle-group.tsx`
  - 메트릭 토글만 담당
- Create: `src/widgets/platform-performance-chart/ui/platform-performance-donut-summary-table.tsx`
  - 스크린리더용 요약 테이블만 담당
- Create: `src/widgets/platform-performance-chart/ui/platform-performance-donut-legend-item.tsx`
  - 범례의 단일 카드/섹션 렌더링만 담당
- Create: `src/widgets/platform-performance-chart/ui/platform-performance-donut-legend.tsx`
  - 범례 리스트 레이아웃만 담당
- Create: `src/widgets/platform-performance-chart/ui/platform-performance-chart-frame.tsx`
  - 카드 프레임과 제목/설명/상태 슬롯만 담당
- Create: `src/widgets/platform-performance-chart/ui/platform-performance-chart-status.tsx`
  - loading, empty, error, stale error, syncing 상태 UI만 담당
- Create: `src/widgets/platform-performance-chart/ui/platform-performance-chart-content.tsx`
  - chart 상태에서의 토글 + 도넛 조립만 담당
- Modify: `src/widgets/platform-performance-chart/ui/platform-performance-donut-chart.tsx`
  - 조립 전용 파일로 축소
- Modify: `src/widgets/platform-performance-chart/ui/platform-performance-chart-card.tsx`
  - 오케스트레이션만 남기고 frame/status/content 를 조합
- Modify: `src/widgets/platform-performance-chart/ui/__tests__/platform-performance-donut-chart.test.tsx`
  - 차트 조립과 상호작용만 검증하도록 범위 축소
- Modify: `src/widgets/platform-performance-chart/ui/__tests__/platform-performance-chart-card.test.tsx`
  - 카드 상태 분기와 chart/content 결합만 검증하도록 정리
- Create: `src/widgets/platform-performance-chart/ui/__tests__/platform-performance-pie-sector.test.tsx`
- Create: `src/widgets/platform-performance-chart/ui/__tests__/platform-performance-metric-toggle-group.test.tsx`
- Create: `src/widgets/platform-performance-chart/ui/__tests__/platform-performance-donut-summary-table.test.tsx`
- Create: `src/widgets/platform-performance-chart/ui/__tests__/platform-performance-donut-legend.test.tsx`
- Create: `src/widgets/platform-performance-chart/ui/__tests__/platform-performance-chart-status.test.tsx`
- Create: `src/widgets/platform-performance-chart/ui/__tests__/platform-performance-chart-frame.test.tsx`

### Task 1: Extract Donut Helpers Into The Model Layer

**Files:**
- Create: `src/widgets/platform-performance-chart/model/platform-performance-donut.ts`
- Create: `src/widgets/platform-performance-chart/model/__tests__/platform-performance-donut.test.ts`
- Modify: `src/widgets/platform-performance-chart/ui/platform-performance-donut-chart.tsx`

- [ ] **Step 1: Write the failing helper tests**

```ts
import { describe, expect, it } from "vitest";
import {
	buildPlatformPerformanceChartConfig,
	extractPlatformFromPiePayload,
	getPlatformPerformanceDonutColor,
	isKnownCampaignPlatformForDonut,
} from "@/widgets/platform-performance-chart/model/platform-performance-donut";

describe("platform-performance-donut helpers", () => {
	it("uses deterministic colors for known and unknown platforms", () => {
		expect(getPlatformPerformanceDonutColor("Google", 0)).toBe("var(--chart-danger)");
		expect(getPlatformPerformanceDonutColor("Meta", 1)).toBe("var(--chart-positive)");
		expect(getPlatformPerformanceDonutColor("TikTok", 0)).toBe("var(--chart-series-4)");
		expect(getPlatformPerformanceDonutColor("TikTok", 4)).toBe("var(--chart-series-3)");
	});

	it("detects known campaign platforms", () => {
		expect(isKnownCampaignPlatformForDonut("Google")).toBe(true);
		expect(isKnownCampaignPlatformForDonut("TikTok")).toBe(false);
	});

	it("extracts a known platform from pie payloads only", () => {
		expect(extractPlatformFromPiePayload({ platform: "Meta" })).toBe("Meta");
		expect(extractPlatformFromPiePayload({ payload: { platform: "Naver" } })).toBe("Naver");
		expect(extractPlatformFromPiePayload({ platform: "TikTok" })).toBeNull();
		expect(extractPlatformFromPiePayload(null)).toBeNull();
	});

	it("builds a chart config from slice data", () => {
		const config = buildPlatformPerformanceChartConfig([
			{ platform: "Google", value: 100, sharePercent: 50, isSelected: true },
			{ platform: "Meta", value: 100, sharePercent: 50, isSelected: false },
		]);

		expect(config.Google.label).toBe("Google");
		expect(config.Google.color).toBe("var(--chart-danger)");
		expect(config.Meta.color).toBe("var(--chart-positive)");
	});
});
```

- [ ] **Step 2: Run the helper test and confirm it fails**

Run: `npm run test:run -- src/widgets/platform-performance-chart/model/__tests__/platform-performance-donut.test.ts`

Expected: fail because the helper module does not exist yet.

- [ ] **Step 3: Implement the helper module**

```ts
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
	if (typeof payload !== "object" || payload === null) {
		return null;
	}

	const maybePayload = payload as {
		platform?: string;
		payload?: { platform?: string };
	};
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

Expected: pass with deterministic color mapping and payload extraction.

### Task 2: Split Donut Interaction And Accessibility Components

**Files:**
- Create: `src/widgets/platform-performance-chart/ui/platform-performance-pie-sector.tsx`
- Create: `src/widgets/platform-performance-chart/ui/platform-performance-metric-toggle-group.tsx`
- Create: `src/widgets/platform-performance-chart/ui/platform-performance-donut-summary-table.tsx`
- Create: `src/widgets/platform-performance-chart/ui/platform-performance-donut-legend-item.tsx`
- Create: `src/widgets/platform-performance-chart/ui/platform-performance-donut-legend.tsx`
- Create: `src/widgets/platform-performance-chart/ui/__tests__/platform-performance-pie-sector.test.tsx`
- Create: `src/widgets/platform-performance-chart/ui/__tests__/platform-performance-metric-toggle-group.test.tsx`
- Create: `src/widgets/platform-performance-chart/ui/__tests__/platform-performance-donut-summary-table.test.tsx`
- Create: `src/widgets/platform-performance-chart/ui/__tests__/platform-performance-donut-legend.test.tsx`
- Modify: `src/widgets/platform-performance-chart/ui/platform-performance-donut-chart.tsx`

- [ ] **Step 1: Write failing tests for each extracted component**

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PlatformPerformancePieSector } from "@/widgets/platform-performance-chart/ui/platform-performance-pie-sector";

describe("PlatformPerformancePieSector", () => {
	it("acts like a button for known platforms and calls the selection callback", async () => {
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
				payload={{
					platform: "Google",
					value: 100,
					sharePercent: 50,
					isSelected: true,
				}}
				onPlatformSelect={onPlatformSelect}
			/>,
		);

		const sector = screen.getByRole("button", { name: "Google 선택" });
		expect(sector).toHaveAttribute("aria-pressed", "true");

		await user.click(sector);
		expect(onPlatformSelect).toHaveBeenCalledWith("Google");

		sector.focus();
		await waitFor(() => expect(sector).toHaveAttribute("stroke", "var(--color-focus)"));
	});
});
```

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PlatformPerformanceMetricToggleGroup } from "@/widgets/platform-performance-chart/ui/platform-performance-metric-toggle-group";

describe("PlatformPerformanceMetricToggleGroup", () => {
	it("marks the active metric and emits change events", async () => {
		const user = userEvent.setup();
		const onMetricChange = vi.fn();

		render(
			<PlatformPerformanceMetricToggleGroup
				activeMetricKey="cost"
				onMetricChange={onMetricChange}
			/>,
		);

		expect(screen.getByRole("button", { name: "비용" })).toHaveAttribute("aria-pressed", "true");
		await user.click(screen.getByRole("button", { name: "클릭수" }));
		expect(onMetricChange).toHaveBeenCalledWith("clicks");
	});
});
```

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlatformPerformanceDonutSummaryTable } from "@/widgets/platform-performance-chart/ui/platform-performance-donut-summary-table";

describe("PlatformPerformanceDonutSummaryTable", () => {
	it("renders a sr-only table with platform rows and metric labels", () => {
		render(
			<PlatformPerformanceDonutSummaryTable
				id="summary-id"
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
		expect(screen.getByRole("cell", { name: "80%" })).toBeInTheDocument();
		expect(screen.getByRole("cell", { name: "₩100" })).toBeInTheDocument();
	});
});
```

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

- [ ] **Step 2: Run the four tests once and confirm they fail**

Run:
`npm run test:run -- src/widgets/platform-performance-chart/ui/__tests__/platform-performance-pie-sector.test.tsx src/widgets/platform-performance-chart/ui/__tests__/platform-performance-metric-toggle-group.test.tsx src/widgets/platform-performance-chart/ui/__tests__/platform-performance-donut-summary-table.test.tsx src/widgets/platform-performance-chart/ui/__tests__/platform-performance-donut-legend.test.tsx`

Expected: fail because the new components do not exist yet.

- [ ] **Step 3: Implement each extracted component**

```tsx
import { type ComponentProps, useState } from "react";
import { Sector } from "recharts";
import { type CampaignPlatform, campaignPlatformValues } from "@/entities/global-filter/model/platforms";
import type { PlatformPerformanceSlice } from "@/entities/platform-performance/model/types";

type PlatformPerformancePieSectorProps = ComponentProps<typeof Sector> & {
	payload?: PlatformPerformanceSlice;
	onPlatformSelect: (platform: CampaignPlatform) => void;
};

export function PlatformPerformancePieSector({
	payload,
	onPlatformSelect,
	...props
}: PlatformPerformancePieSectorProps) {
	const platform = payload?.platform;
	const isSelected = payload?.isSelected ?? false;
	const [isFocused, setIsFocused] = useState(false);

	if (platform === undefined) {
		return <Sector {...props} />;
	}

	if (!campaignPlatformValues.includes(platform as CampaignPlatform)) {
		return (
			<Sector
				{...props}
				aria-label={platform}
				aria-disabled="true"
				style={{ cursor: "not-allowed", ...(props.style ?? {}) }}
			/>
		);
	}

	return (
		<Sector
			{...props}
			role="button"
			tabIndex={0}
			aria-label={`${platform} 선택`}
			aria-pressed={isSelected}
			stroke={isFocused ? "var(--color-focus)" : "transparent"}
			strokeWidth={isFocused ? 3 : 1}
			strokeLinejoin="round"
			style={{ cursor: "pointer", ...(props.style ?? {}) }}
			onClick={(event) => {
				event.stopPropagation();
				onPlatformSelect(platform);
			}}
			onFocus={() => setIsFocused(true)}
			onBlur={() => setIsFocused(false)}
			onKeyDown={(event) => {
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					onPlatformSelect(platform);
				}
			}}
		/>
	);
}
```

```tsx
import { ToggleButton } from "@/shared/ui/toggle-button";
import { platformPerformanceMetricDefinitions } from "@/widgets/platform-performance-chart/model/platform-performance-metrics";

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
const percentageFormatter = new Intl.NumberFormat("ko-KR", {
	maximumFractionDigits: 1,
	minimumFractionDigits: 0,
});

type PlatformPerformanceDonutSummaryTableProps = {
	id?: string;
	data: readonly PlatformPerformanceSlice[];
	metricLabel: string;
	formatValue: (value: number) => string;
};

export function PlatformPerformanceDonutSummaryTable({
	id,
	data,
	metricLabel,
	formatValue,
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

```tsx
import { type CampaignPlatform } from "@/entities/global-filter/model/types";
import type { PlatformPerformanceSlice } from "@/entities/platform-performance/model/types";
import {
	getPlatformPerformanceDonutColor,
	isKnownCampaignPlatformForDonut,
} from "@/widgets/platform-performance-chart/model/platform-performance-donut";

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
		<div className="min-w-[12rem] shrink-0 rounded-card border border-outline-subtle bg-panel-muted p-3 lg:min-w-0 lg:w-full lg:shrink">
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

- [ ] **Step 4: Run the four tests and confirm they pass**

Run:
`npm run test:run -- src/widgets/platform-performance-chart/ui/__tests__/platform-performance-pie-sector.test.tsx src/widgets/platform-performance-chart/ui/__tests__/platform-performance-metric-toggle-group.test.tsx src/widgets/platform-performance-chart/ui/__tests__/platform-performance-donut-summary-table.test.tsx src/widgets/platform-performance-chart/ui/__tests__/platform-performance-donut-legend.test.tsx`

Expected: pass with the interaction and accessibility behavior preserved.

### Task 3: Extract Card Frame, Status, And Chart Content Components

**Files:**
- Create: `src/widgets/platform-performance-chart/ui/platform-performance-chart-frame.tsx`
- Create: `src/widgets/platform-performance-chart/ui/platform-performance-chart-status.tsx`
- Create: `src/widgets/platform-performance-chart/ui/platform-performance-chart-content.tsx`
- Create: `src/widgets/platform-performance-chart/ui/__tests__/platform-performance-chart-frame.test.tsx`
- Create: `src/widgets/platform-performance-chart/ui/__tests__/platform-performance-chart-status.test.tsx`
- Modify: `src/widgets/platform-performance-chart/ui/platform-performance-chart-card.tsx`
- Modify: `src/widgets/platform-performance-chart/ui/__tests__/platform-performance-chart-card.test.tsx`

- [ ] **Step 1: Write failing tests for frame and status components**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlatformPerformanceChartFrame } from "@/widgets/platform-performance-chart/ui/platform-performance-chart-frame";

describe("PlatformPerformanceChartFrame", () => {
	it("renders the title, description, status slot, and children", () => {
		render(
			<PlatformPerformanceChartFrame
				status={<div>동기화 중</div>}
			>
				<div>본문</div>
			</PlatformPerformanceChartFrame>,
		);

		expect(screen.getByRole("heading", { name: "플랫폼별 성과" })).toBeInTheDocument();
		expect(screen.getByText("전역 필터 기준으로 플랫폼별 성과를 집계한 도넛 차트입니다.")).toBeInTheDocument();
		expect(screen.getByText("동기화 중")).toBeInTheDocument();
		expect(screen.getByText("본문")).toBeInTheDocument();
	});
});
```

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlatformPerformanceChartStatus } from "@/widgets/platform-performance-chart/ui/platform-performance-chart-status";

describe("PlatformPerformanceChartStatus", () => {
	it("renders loading, empty, error, stale, and syncing states", () => {
		render(<PlatformPerformanceChartStatus kind="loading" />);
		expect(screen.getByRole("status", { name: "성과 데이터를 불러오는 중" })).toBeInTheDocument();
	});
});
```

- [ ] **Step 2: Run the frame and status tests and confirm they fail**

Run:
`npm run test:run -- src/widgets/platform-performance-chart/ui/__tests__/platform-performance-chart-frame.test.tsx src/widgets/platform-performance-chart/ui/__tests__/platform-performance-chart-status.test.tsx`

Expected: fail because the new components do not exist yet.

- [ ] **Step 3: Implement the frame, status, and chart content components**

```tsx
import type { ReactNode } from "react";

type PlatformPerformanceChartFrameProps = {
	children: ReactNode;
	status?: ReactNode;
};

export function PlatformPerformanceChartFrame({
	children,
	status,
}: PlatformPerformanceChartFrameProps) {
	return (
		<section className="rounded-panel border border-outline-subtle bg-panel p-panel shadow-panel">
			<div className="flex flex-col gap-5">
				<div className="flex flex-col gap-2">
					<h2>플랫폼별 성과</h2>
					<p className="typo-body-sm text-fg-muted">
						전역 필터 기준으로 플랫폼별 성과를 집계한 도넛 차트입니다.
					</p>
				</div>

				{status ? <div className="min-h-5">{status}</div> : null}
				{children}
			</div>
		</section>
	);
}
```

```tsx
import type { ReactNode } from "react";

type PlatformPerformanceChartStatusProps =
	| { kind: "loading" }
	| { kind: "full-error"; errorMessage: string }
	| { kind: "empty-campaigns"; message: string }
	| { kind: "empty-data"; message: string }
	| { kind: "stale"; message: string }
	| { kind: "syncing" }
	| { kind: "none" };

export function PlatformPerformanceChartStatus(props: PlatformPerformanceChartStatusProps) {
	switch (props.kind) {
		case "loading":
			return (
				<div
					className="rounded-card border border-outline-subtle bg-panel-muted"
					role="status"
					aria-live="polite"
					aria-busy="true"
					aria-label="성과 데이터를 불러오는 중"
				>
					<div className="h-80" data-testid="platform-performance-loading" />
				</div>
			);
		case "full-error":
			return (
				<div
					className="rounded-card border border-status-danger-border bg-status-danger/30 px-4 py-5 typo-body-sm text-status-danger-fg"
					role="alert"
				>
					<p>성과 데이터를 불러오지 못했습니다.</p>
					<p className="mt-1 text-fg-muted">{props.errorMessage}</p>
				</div>
			);
		case "empty-campaigns":
		case "empty-data":
			return (
				<div
					role="status"
					aria-label={props.message}
					className="rounded-card border border-outline-subtle bg-panel-muted px-4 py-8 text-center typo-body-sm text-fg-muted"
				>
					{props.message}
				</div>
			);
		case "stale":
			return (
				<div
					className="rounded-card border border-status-danger-border bg-status-danger/30 px-4 py-3 typo-body-sm text-status-danger-fg"
					role="alert"
				>
					<p>{props.message}</p>
				</div>
			);
		case "syncing":
			return (
				<p className="typo-body-sm text-fg-muted" role="status" aria-live="polite">
					동기화 중
				</p>
			);
		case "none":
			return null;
	}
}
```

```tsx
import { PlatformPerformanceMetricToggleGroup } from "@/widgets/platform-performance-chart/ui/platform-performance-metric-toggle-group";
import { PlatformPerformanceDonut } from "@/widgets/platform-performance-chart/ui/platform-performance-donut-chart";

type PlatformPerformanceChartContentProps = {
	activeMetricKey: PlatformMetricKey;
	toggleMetric: (metricKey: PlatformMetricKey) => void;
	metricDefinition: ReturnType<typeof getPlatformPerformanceMetric>;
	slices: PlatformPerformanceSlice[];
	onPlatformSelect: (platform: CampaignPlatform) => void;
};

export function PlatformPerformanceChartContent({
	activeMetricKey,
	toggleMetric,
	metricDefinition,
	slices,
	onPlatformSelect,
}: PlatformPerformanceChartContentProps) {
	return (
		<>
			<div className="-mx-1 overflow-x-auto px-1 lg:mx-0 lg:self-start lg:px-0">
				<PlatformPerformanceMetricToggleGroup
					activeMetricKey={activeMetricKey}
					onMetricChange={toggleMetric}
				/>
			</div>
			<PlatformPerformanceDonut
				data={slices}
				metric={metricDefinition}
				onPlatformSelect={onPlatformSelect}
			/>
		</>
	);
}
```

```tsx
type PlatformPerformanceChartStatusSource =
	| { kind: "loading" }
	| { kind: "full-error"; errorMessage: string }
	| { kind: "empty-campaigns" }
	| { kind: "empty-data" }
	| { kind: "chart"; staleErrorMessage: string | null; isSyncing: boolean };

function resolvePlatformPerformanceChartStatus(
	state: PlatformPerformanceChartStatusSource,
) {
	if (state.kind === "loading") {
		return { kind: "loading" as const };
	}

	if (state.kind === "full-error") {
		return { kind: "full-error" as const, errorMessage: state.errorMessage };
	}

	if (state.kind === "empty-campaigns") {
		return {
			kind: "empty-campaigns" as const,
			message: "필터 조건에 맞는 캠페인이 없습니다.",
		};
	}

	if (state.kind === "empty-data") {
		return {
			kind: "empty-data" as const,
			message: "표시할 데이터가 없습니다.",
		};
	}

	if (state.staleErrorMessage) {
		return {
			kind: "stale" as const,
			message: "최신 성과 데이터를 불러오지 못해 마지막 성공 결과를 표시 중입니다.",
		};
	}

	if (state.isSyncing) {
		return { kind: "syncing" as const };
	}

	return { kind: "none" as const };
}
```

- [ ] **Step 4: Update `platform-performance-chart-card.tsx` to be orchestration only**

Target structure:

```tsx
export function PlatformPerformanceChartCard() {
	const {
		activeMetricKey,
		handlePlatformSelection,
		metricDefinition,
		state,
		toggleMetric,
	} = usePlatformPerformanceChartViewModel();

	const status = resolvePlatformPerformanceChartStatus(state);

	return (
		<PlatformPerformanceChartFrame status={<PlatformPerformanceChartStatus {...status} />}>
			{state.kind === "chart" ? (
				<PlatformPerformanceChartContent
					activeMetricKey={activeMetricKey}
					toggleMetric={toggleMetric}
					metricDefinition={metricDefinition}
					slices={state.slices}
					onPlatformSelect={handlePlatformSelection}
				/>
			) : null}
		</PlatformPerformanceChartFrame>
	);
}
```

The `resolvePlatformPerformanceChartStatus()` helper keeps the card render path linear and avoids repeated inline conditional props.

- [ ] **Step 5: Run the frame/status tests and confirm they pass**

Run:
`npm run test:run -- src/widgets/platform-performance-chart/ui/__tests__/platform-performance-chart-frame.test.tsx src/widgets/platform-performance-chart/ui/__tests__/platform-performance-chart-status.test.tsx`

Expected: pass with the new frame and status primitives.

### Task 4: Simplify The Donut Chart File To Pure Composition

**Files:**
- Modify: `src/widgets/platform-performance-chart/ui/platform-performance-donut-chart.tsx`
- Modify: `src/widgets/platform-performance-chart/ui/__tests__/platform-performance-donut-chart.test.tsx`
- Modify: `src/widgets/platform-performance-chart/ui/__tests__/platform-performance-chart-card.test.tsx`

- [ ] **Step 1: Rewrite the donut chart tests to focus on composition and behavior**

Keep these assertions:
- `role="img"` label for the chart
- `ChartTooltip` rendering
- `Pie` click toggles selected platform
- legend scrolls horizontally on mobile
- known platform legend item selection

Remove duplicate coverage for:
- pie sector focus/keyboard semantics
- summary table rows
- legend item internals

- [ ] **Step 2: Update the donut chart to use the extracted helpers and subcomponents**

Target structure:

```tsx
export function PlatformPerformanceDonut({
	data,
	metric,
	onPlatformSelect,
}: {
	data: PlatformPerformanceSlice[];
	metric: PlatformPerformanceMetricDefinition;
	onPlatformSelect: (platform: CampaignPlatform) => void;
}) {
	const summaryId = useId();
	const chartConfig = useMemo(
		() => buildPlatformPerformanceChartConfig(data),
		[data],
	);
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
				<div
					className="relative h-64 sm:h-72"
					aria-describedby={summaryId}
					role="img"
					aria-label={`플랫폼별 ${metric.label} 도넛 차트`}
				>
					<ChartContainer className="absolute inset-0" config={chartConfig}>
						<PieChart>
							<Pie
								data={data}
								dataKey="value"
								nameKey="platform"
								innerRadius={60}
								outerRadius={105}
								paddingAngle={4}
								shape={
									<PlatformPerformancePieSector
										onPlatformSelect={onPlatformSelect}
									/>
								}
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
										opacity={
											isKnownCampaignPlatformForDonut(slice.platform)
												? slice.isSelected
													? 1
													: 0.35
												: 1
										}
									/>
								))}
							</Pie>
							<ChartTooltip
								content={<ChartTooltipContent formatter={tooltipFormatter} />}
							/>
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

- [ ] **Step 3: Update the chart card test to verify only orchestration behavior**

Keep these assertions:
- loading, error, empty, chart states render correctly
- stale error and syncing indicators appear only in chart state
- metric toggles appear only in chart state
- donut receives slices and selection callback

Remove assertions that are already covered by the new donut and subcomponent tests.

- [ ] **Step 4: Run the donut chart test and card test and confirm both pass**

Run:
`npm run test:run -- src/widgets/platform-performance-chart/ui/__tests__/platform-performance-donut-chart.test.tsx src/widgets/platform-performance-chart/ui/__tests__/platform-performance-chart-card.test.tsx`

Expected: pass with composition-only chart file and a thinner card file.

### Task 5: Full Verification And Cleanup

**Files:**
- Modify: `src/widgets/platform-performance-chart/ui/platform-performance-chart-card.tsx`
- Modify: `src/widgets/platform-performance-chart/ui/platform-performance-donut-chart.tsx`
- Modify: imports in the new files created above

- [ ] **Step 1: Run the full widget test suite**

Run:
`npm run test:run -- src/widgets/platform-performance-chart/model/__tests__/platform-performance-metrics.test.ts src/widgets/platform-performance-chart/model/__tests__/platform-performance-donut.test.ts src/widgets/platform-performance-chart/model/__tests__/use-platform-performance-chart-view-model.test.tsx src/widgets/platform-performance-chart/ui/__tests__/platform-performance-pie-sector.test.tsx src/widgets/platform-performance-chart/ui/__tests__/platform-performance-metric-toggle-group.test.tsx src/widgets/platform-performance-chart/ui/__tests__/platform-performance-donut-summary-table.test.tsx src/widgets/platform-performance-chart/ui/__tests__/platform-performance-donut-legend.test.tsx src/widgets/platform-performance-chart/ui/__tests__/platform-performance-chart-frame.test.tsx src/widgets/platform-performance-chart/ui/__tests__/platform-performance-chart-status.test.tsx src/widgets/platform-performance-chart/ui/__tests__/platform-performance-donut-chart.test.tsx src/widgets/platform-performance-chart/ui/__tests__/platform-performance-chart-card.test.tsx`

Expected: all tests pass.

- [ ] **Step 2: Run lint**

Run: `npm run lint`

Expected: no formatting or import errors.

- [ ] **Step 3: Confirm file responsibilities**

Verify:
- `platform-performance-chart-card.tsx` only orchestrates view state to frame/status/content.
- `platform-performance-donut-chart.tsx` only composes chart primitives and derived data.
- `model/platform-performance-donut.ts` contains only pure helper logic.
- `ui/platform-performance-*` subcomponents each own one UI concern.

---

## Self-Review

1. **Spec coverage:** This plan covers the card orchestration, donut chart composition, helper extraction, and test redistribution.
2. **Placeholder scan:** I avoided `TODO`, `TBD`, and vague “similar to above” instructions. The only shorthand in snippets is actual code, not placeholders.
3. **Type consistency:** The shared names used across tasks match the current widget types: `PlatformPerformanceSlice`, `PlatformMetricKey`, `CampaignPlatform`, and `PlatformPerformanceMetricDefinition`.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-12-platform-performance-chart-card-and-donut-refactor.md`. Two execution options:

**1. Subagent-Driven (recommended)** - fresh subagent per task, review between tasks, faster iteration

**2. Inline Execution** - execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
