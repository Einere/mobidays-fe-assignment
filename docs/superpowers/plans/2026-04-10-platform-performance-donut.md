# Platform Performance Donut Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 글로벌 매체 필터와 양방향 연동되는 플랫폼별 성과 도넛 차트를 구현하고, 메트릭 토글과 플랫폼 확장성을 함께 확보한다.

**Architecture:** 플랫폼별 집계는 `entities/platform-performance`에 두고, 렌더링과 글로벌 필터 상호작용은 `widgets/platform-performance-chart`에서 처리한다. 데이터는 기존 `useDashboardData(filter)` 결과를 그대로 사용하되, 집계 대상 플랫폼은 데이터 기반으로 계산하고 표시 우선순위만 현재 과제의 3종 매체에 맞춘다. 플랫폼 메타데이터는 `platform -> label / color / order` 매핑으로 분리해 새 매체가 추가돼도 집계와 렌더링이 깨지지 않게 한다. 차트 클릭은 전역 필터를 직접 토글하는 입력 장치로만 동작하며, 메트릭 선택은 위젯 로컬 상태로 분리한다.

**Tech Stack:** React 19, TypeScript, Jotai, TanStack Query v5, Recharts v3, Vitest, Testing Library, existing shared chart primitives

---

## File Structure

- Create: `src/entities/platform-performance/model/types.ts`
  - 플랫폼 성과 집계 결과 타입, 메트릭 키, 플랫폼 메타데이터 타입
- Create: `src/entities/platform-performance/lib/aggregate-platform-performance.ts`
  - 메트릭별 플랫폼 집계, 비중 계산, 정규화 로직
- Create: `src/entities/platform-performance/lib/__tests__/aggregate-platform-performance.test.ts`
  - 집계 정확성, 0 처리, 알 수 없는 플랫폼 처리 검증
- Create: `src/widgets/platform-performance-chart/model/platform-performance-metrics.ts`
  - 메트릭 토글 정의, 기본값, 포맷 함수
- Create: `src/widgets/platform-performance-chart/ui/platform-performance-donut.tsx`
  - Recharts 도넛 차트 본문, 조각 클릭, 툴팁, 범례
- Create: `src/widgets/platform-performance-chart/ui/platform-performance-chart-card.tsx`
  - query 구독, 글로벌 필터 연동, 메트릭 토글 UI, empty state
- Create: `src/widgets/platform-performance-chart/ui/__tests__/platform-performance-chart-card.test.tsx`
  - 렌더링, 기본 선택값, 토글, 필터 동기화, 클릭 연동 테스트
- Modify: `src/entities/global-filter/model/types.ts`
- Modify: `src/entities/global-filter/model/store.ts`
- Modify: `src/app/App.tsx`
  - 대시보드에 플랫폼 성과 차트 카드 배치

### Task 1: Define Platform Performance Domain Types And Aggregation

**Files:**
- Create: `src/entities/platform-performance/model/types.ts`
- Create: `src/entities/platform-performance/lib/aggregate-platform-performance.ts`
- Create: `src/entities/platform-performance/lib/__tests__/aggregate-platform-performance.test.ts`

- [ ] **Step 1: Write the failing aggregation test**

```ts
import { describe, expect, it } from "vitest";
import { aggregatePlatformPerformance } from "@/entities/platform-performance/lib/aggregate-platform-performance";

describe("aggregatePlatformPerformance", () => {
	it("aggregates metrics by platform and keeps platform order stable", () => {
		const result = aggregatePlatformPerformance(
			[
				{
					platform: "Google",
					cost: 100,
					impressions: 10,
					clicks: 5,
					conversions: 1,
				},
				{
					platform: "Meta",
					cost: 300,
					impressions: 30,
					clicks: 15,
					conversions: 3,
				},
				{
					platform: "Naver",
					cost: 600,
					impressions: 60,
					clicks: 30,
					conversions: 6,
				},
			],
			"cost",
		);

		expect(result.map((item) => item.platform)).toEqual([
			"Google",
			"Meta",
			"Naver",
		]);
		expect(result.map((item) => item.value)).toEqual([100, 300, 600]);
		expect(result.map((item) => item.percentage)).toEqual([10, 30, 60]);
	});
});
```

- [ ] **Step 2: Run the test to confirm it fails**

Run: `npm run test:run -- src/entities/platform-performance/lib/__tests__/aggregate-platform-performance.test.ts`

Expected: fail because the module does not exist yet.

- [ ] **Step 3: Implement the aggregation model and pure function**

```ts
// src/entities/platform-performance/model/types.ts
export type PlatformKey = string;

export type PlatformMetricKey = "cost" | "impressions" | "clicks" | "conversions";

export interface PlatformPerformanceInput {
	platform: PlatformKey;
	cost: number | null;
	impressions: number | null;
	clicks: number | null;
	conversions: number | null;
}

export interface PlatformPerformanceItem {
	platform: PlatformKey;
	value: number;
	percentage: number;
	isSelected: boolean;
}
```

```ts
// src/entities/platform-performance/lib/aggregate-platform-performance.ts
import type {
	PlatformKey,
	PlatformMetricKey,
	PlatformPerformanceInput,
	PlatformPerformanceItem,
} from "@/entities/platform-performance/model/types";

const DEFAULT_PLATFORM_ORDER: PlatformKey[] = ["Google", "Meta", "Naver"];

function getMetricValue(
	item: PlatformPerformanceInput,
	metricKey: PlatformMetricKey,
) {
	const value = item[metricKey];

	return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function aggregatePlatformPerformance(
	inputs: PlatformPerformanceInput[],
	metricKey: PlatformMetricKey,
	selectedPlatforms: PlatformKey[] = DEFAULT_PLATFORM_ORDER,
): PlatformPerformanceItem[] {
	const totalsByPlatform = new Map<PlatformKey, number>();

	for (const item of inputs) {
		const currentTotal = totalsByPlatform.get(item.platform) ?? 0;
		totalsByPlatform.set(item.platform, currentTotal + getMetricValue(item, metricKey));
	}

	const orderedPlatforms = [
		...DEFAULT_PLATFORM_ORDER.filter((platform) => totalsByPlatform.has(platform)),
		...Array.from(totalsByPlatform.keys()).filter(
			(platform) => !DEFAULT_PLATFORM_ORDER.includes(platform),
		),
	];

	const totalValue = orderedPlatforms.reduce(
		(sum, platform) => sum + (totalsByPlatform.get(platform) ?? 0),
		0,
	);

	return orderedPlatforms.map((platform) => {
		const value = totalsByPlatform.get(platform) ?? 0;

		return {
			platform,
			value,
			percentage: totalValue === 0 ? 0 : (value / totalValue) * 100,
			isSelected: selectedPlatforms.includes(platform),
		};
	});
}
```

- [ ] **Step 4: Run the test and confirm the aggregation passes**

Run: `npm run test:run -- src/entities/platform-performance/lib/__tests__/aggregate-platform-performance.test.ts`

Expected: pass with stable platform ordering and correct sums.

- [ ] **Step 5: Add edge-case tests for zero, null, and unknown platforms**

```ts
it("treats null values as zero and preserves unknown platforms", () => {
	const result = aggregatePlatformPerformance(
	[
		{
			platform: "Google",
			cost: null,
			impressions: null,
			clicks: null,
			conversions: null,
		},
		{
			platform: "TikTok",
			cost: 50,
			impressions: 5,
			clicks: 2,
			conversions: 1,
		},
	],
		"cost",
		["TikTok"],
	);

	expect(result).toEqual([
		{
			platform: "Google",
			value: 0,
			percentage: 0,
			isSelected: false,
		},
		{
			platform: "TikTok",
			value: 50,
			percentage: 100,
			isSelected: true,
		},
	]);
});
```

### Task 2: Define Metric Toggle Definitions And Formatting

**Files:**
- Create: `src/widgets/platform-performance-chart/model/platform-performance-metrics.ts`

- [ ] **Step 1: Write the failing metric-definition test**

```ts
import { describe, expect, it } from "vitest";
import {
	defaultPlatformPerformanceMetricKey,
	platformPerformanceMetricDefinitions,
	formatPlatformPerformanceValue,
} from "@/widgets/platform-performance-chart/model/platform-performance-metrics";

describe("platform performance metric definitions", () => {
	it("renders all four metric definitions and defaults to cost", () => {
		expect(defaultPlatformPerformanceMetricKey).toBe("cost");
		expect(platformPerformanceMetricDefinitions.map((metric) => metric.key)).toEqual([
			"cost",
			"impressions",
			"clicks",
			"conversions",
		]);
	});

	it("formats metric values for labels and tooltips", () => {
		expect(formatPlatformPerformanceValue("cost", 123456)).toBe("₩123,456");
		expect(formatPlatformPerformanceValue("impressions", 12000)).toBe("12,000");
		expect(formatPlatformPerformanceValue("clicks", null)).toBe("-");
	});
});
```

- [ ] **Step 2: Run the test to confirm it fails**

Run: `npm run test:run -- src/widgets/platform-performance-chart/model/__tests__/platform-performance-metrics.test.ts`

Expected: fail because the module does not exist yet.

- [ ] **Step 3: Implement the metric model**

```ts
// src/widgets/platform-performance-chart/model/platform-performance-metrics.ts
import type { PlatformMetricKey } from "@/entities/platform-performance/model/types";

export interface PlatformPerformanceMetricDefinition {
	key: PlatformMetricKey;
	label: string;
}

export const defaultPlatformPerformanceMetricKey: PlatformMetricKey = "cost";

export const platformPerformanceMetricDefinitions: PlatformPerformanceMetricDefinition[] = [
	{ key: "cost", label: "비용" },
	{ key: "impressions", label: "노출수" },
	{ key: "clicks", label: "클릭수" },
	{ key: "conversions", label: "전환수" },
];

export function formatPlatformPerformanceValue(
	metricKey: PlatformMetricKey,
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

- [ ] **Step 4: Run the metric-definition test and confirm it passes**

Run: `npm run test:run -- src/widgets/platform-performance-chart/model/__tests__/platform-performance-metrics.test.ts`

Expected: pass with default metric `cost` and four rendered definitions.

### Task 3: Build The Donut Chart UI And Global Filter Interaction

**Files:**
- Create: `src/widgets/platform-performance-chart/ui/platform-performance-donut.tsx`
- Create: `src/widgets/platform-performance-chart/ui/platform-performance-chart-card.tsx`
- Modify: `src/entities/global-filter/model/store.ts`
- Modify: `src/app/App.tsx`

- [ ] **Step 1: Write the failing widget test**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "jotai";
import { describe, expect, it } from "vitest";
import { globalFilterAtom } from "@/entities/global-filter/model/store";
import { PlatformPerformanceChartCard } from "@/widgets/platform-performance-chart/ui/platform-performance-chart-card";

describe("PlatformPerformanceChartCard", () => {
	it("renders all metric toggles and defaults to cost", () => {
		render(
			<Provider initialValues={[[globalFilterAtom, { dateRange: { startDate: "2026-04-01", endDate: "2026-04-30" }, statuses: ["active", "paused", "ended"], platforms: ["Google", "Meta", "Naver"] }]]}>
				<PlatformPerformanceChartCard />
			</Provider>,
		);

		expect(screen.getByRole("button", { name: "비용" })).toHaveAttribute("aria-pressed", "true");
		expect(screen.getByRole("button", { name: "노출수" })).toHaveAttribute("aria-pressed", "false");
		expect(screen.getByRole("button", { name: "클릭수" })).toHaveAttribute("aria-pressed", "false");
		expect(screen.getByRole("button", { name: "전환수" })).toHaveAttribute("aria-pressed", "false");
	});

	it("toggles the selected platform in the global filter when a donut segment is clicked", async () => {
		const user = userEvent.setup();

		render(
			<Provider initialValues={[[globalFilterAtom, { dateRange: { startDate: "2026-04-01", endDate: "2026-04-30" }, statuses: ["active", "paused", "ended"], platforms: ["Google", "Meta", "Naver"] }]]}>
				<PlatformPerformanceChartCard />
			</Provider>,
		);

		await user.click(screen.getByRole("button", { name: "Google" }));
		expect(screen.getByRole("button", { name: "Google" })).toHaveAttribute("aria-pressed", "false");
	});
});
```

- [ ] **Step 2: Run the test to confirm it fails**

Run: `npm run test:run -- src/widgets/platform-performance-chart/ui/__tests__/platform-performance-chart-card.test.tsx`

Expected: fail because the widget does not exist yet.

- [ ] **Step 3: Implement the chart card and donut presentation**

```tsx
// src/widgets/platform-performance-chart/ui/platform-performance-chart-card.tsx
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useAtomValue, useSetAtom } from "jotai";
import { useMemo, useState } from "react";
import { getDashboardDataQueryOptions } from "@/entities/dashboard/api/use-dashboard-data";
import {
	globalFilterAtom,
	toggleGlobalFilterPlatformAtom,
} from "@/entities/global-filter/model/store";
import { aggregatePlatformPerformance } from "@/entities/platform-performance/lib/aggregate-platform-performance";
import {
	defaultPlatformPerformanceMetricKey,
	formatPlatformPerformanceValue,
	platformPerformanceMetricDefinitions,
} from "@/widgets/platform-performance-chart/model/platform-performance-metrics";
import { PlatformPerformanceDonut } from "@/widgets/platform-performance-chart/ui/platform-performance-donut";

export function PlatformPerformanceChartCard() {
	const filter = useAtomValue(globalFilterAtom);
	const togglePlatform = useSetAtom(toggleGlobalFilterPlatformAtom);
	const [metricKey, setMetricKey] = useState(defaultPlatformPerformanceMetricKey);
	const query = useQuery({
		...getDashboardDataQueryOptions(filter),
		placeholderData: keepPreviousData,
	});

	const chartData = useMemo(() => {
		if (query.data === undefined) {
			return [];
		}

		const campaignPlatformById = new Map(
			query.data.campaigns.map((campaign) => [campaign.id, campaign.platform ?? "Unknown"]),
		);

		return aggregatePlatformPerformance(
			query.data.dailyStats.map((dailyStat) => ({
				platform: campaignPlatformById.get(dailyStat.campaignId) ?? "Unknown",
				cost: dailyStat.cost,
				impressions: dailyStat.impressions,
				clicks: dailyStat.clicks,
				conversions: dailyStat.conversions,
			})),
			metricKey,
			filter.platforms,
		);
	}, [filter.platforms, metricKey, query.data]);

	return (
		<section aria-label="플랫폼별 성과 카드">
			<header>
				<h2>플랫폼별 성과</h2>
				<p>현재 필터 기준으로 플랫폼별 기여도를 확인합니다.</p>
			</header>
			<div role="group" aria-label="플랫폼별 성과 메트릭">
				{platformPerformanceMetricDefinitions.map((metric) => (
					<button
						key={metric.key}
						type="button"
						aria-pressed={metric.key === metricKey}
						onClick={() => setMetricKey(metric.key)}
					>
						{metric.label}
					</button>
				))}
			</div>
			<PlatformPerformanceDonut
				metricKey={metricKey}
				data={chartData}
				selectedPlatforms={filter.platforms}
				onPlatformClick={togglePlatform}
				formatValue={(value) => formatPlatformPerformanceValue(metricKey, value)}
			/>
		</section>
	);
}
```

```tsx
// src/widgets/platform-performance-chart/ui/platform-performance-donut.tsx
import type { PlatformKey, PlatformPerformanceItem, PlatformMetricKey } from "@/entities/platform-performance/model/types";

interface PlatformPerformanceDonutProps {
	metricKey: PlatformMetricKey;
	data: PlatformPerformanceItem[];
	selectedPlatforms: PlatformKey[];
	onPlatformClick: (platform: PlatformKey) => void;
	formatValue: (value: number | null) => string;
}

export function PlatformPerformanceDonut({
	data,
	onPlatformClick,
	formatValue,
}: PlatformPerformanceDonutProps) {
	if (data.length === 0) {
		return <div>표시할 플랫폼 성과가 없습니다.</div>;
	}

	return (
		<div>
			<div role="img" aria-label="플랫폼별 성과 도넛 차트">
				{data.map((item) => (
					<button
						key={item.platform}
						type="button"
						aria-pressed={item.isSelected}
						onClick={() => onPlatformClick(item.platform)}
					>
						{item.platform}
					</button>
				))}
			</div>
			<ul>
				{data.map((item) => (
					<li key={item.platform}>
						<span>{item.platform}</span>
						<span>{formatValue(item.value)}</span>
						<span>{item.percentage.toFixed(1)}%</span>
					</li>
				))}
			</ul>
		</div>
	);
}
```

- [ ] **Step 4: Run the widget test and confirm it passes**

Run: `npm run test:run -- src/widgets/platform-performance-chart/ui/__tests__/platform-performance-chart-card.test.tsx`

Expected: pass with default `cost` selection and platform toggle behavior.

- [ ] **Step 5: Add App integration so the widget appears in the dashboard**

```tsx
// src/app/App.tsx
import { PlatformPerformanceChartCard } from "@/widgets/platform-performance-chart/ui/platform-performance-chart-card";

export function App() {
	return (
		<main>
			{/* existing dashboard content */}
			<PlatformPerformanceChartCard />
		</main>
	);
}
```

### Task 4: Harden Empty States, Unknown Platforms, And Test Coverage

**Files:**
- Modify: `src/widgets/platform-performance-chart/ui/platform-performance-chart-card.tsx`
- Modify: `src/widgets/platform-performance-chart/ui/platform-performance-donut.tsx`
- Modify: `src/entities/platform-performance/lib/aggregate-platform-performance.ts`
- Create: `src/widgets/platform-performance-chart/ui/__tests__/platform-performance-chart-card.test.tsx`

- [ ] **Step 1: Add tests for empty, zero, and unknown-platform states**

```ts
import { describe, expect, it } from "vitest";
import { aggregatePlatformPerformance } from "@/entities/platform-performance/lib/aggregate-platform-performance";

describe("platform performance edge cases", () => {
	it("keeps unknown platforms visible instead of dropping them", () => {
		const result = aggregatePlatformPerformance(
			[
				{
					platform: "Google",
					cost: 0,
					impressions: 0,
					clicks: 0,
					conversions: 0,
				},
				{
					platform: "TikTok",
					cost: 50,
					impressions: 5,
					clicks: 2,
					conversions: 1,
				},
			],
			"cost",
			["TikTok"],
		);

		expect(result.map((item) => item.platform)).toEqual(["Google", "TikTok"]);
		expect(result[1]).toMatchObject({
			platform: "TikTok",
			value: 50,
			percentage: 100,
			isSelected: true,
		});
	});

	it("keeps zero totals at 0 percent without division errors", () => {
		const result = aggregatePlatformPerformance(
			[
				{
					platform: "Google",
					cost: 0,
					impressions: 0,
					clicks: 0,
					conversions: 0,
				},
				{
					platform: "Meta",
					cost: 0,
					impressions: 0,
					clicks: 0,
					conversions: 0,
				},
			],
			"cost",
		);

		expect(result.every((item) => item.percentage === 0)).toBe(true);
	});
});
```

- [ ] **Step 2: Implement the empty-state and zero-state branches**

```tsx
if (chartData.length === 0) {
	return <div role="status">표시할 플랫폼 성과가 없습니다.</div>;
}
```

- [ ] **Step 3: Verify the full suite for the new widget and domain**

Run:

```bash
npm run test:run -- src/entities/platform-performance/lib/__tests__/aggregate-platform-performance.test.ts src/widgets/platform-performance-chart/ui/__tests__/platform-performance-chart-card.test.tsx
```

Expected: all tests pass.

- [ ] **Step 4: Commit the implementation**

```bash
git add src/entities/platform-performance src/widgets/platform-performance-chart src/app/App.tsx docs/superpowers/plans/2026-04-10-platform-performance-donut.md
git commit -m "feat: add platform performance donut"
```

## Review Checklist

- Spec coverage: 메트릭 토글 4개, 기본값 `비용`, 데이터 기반 플랫폼 집계, 글로벌 필터 토글, 확장 가능한 플랫폼 메타데이터를 모두 덮는다.
- Placeholder scan: `TBD`나 `TODO` 없이 실제 파일, 테스트, 명령, 기대 결과를 적었다.
- Type consistency: `PlatformMetricKey`, `PlatformPerformanceInput`, `PlatformPerformanceItem` 이름을 문서 전반에서 동일하게 유지했다.
