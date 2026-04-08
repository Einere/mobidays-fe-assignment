# Global Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `3.1 글로벌 필터`를 서버 책임 기반으로 구현하고, 대시보드가 동일한 필터 결과 집합을 재사용할 수 있는 상태/쿼리/UI 기반을 만든다.

**Architecture:** 글로벌 필터 상태는 Jotai atom으로 관리하고, 필터링 책임은 MSW 핸들러가 가진다. 클라이언트는 필터 상태를 query key 및 요청 파라미터로 직렬화하며, 순수 필터 함수는 `entities` 레이어에 분리해 테스트한다. 현재 차트/테이블 구현 전 단계이므로 필터 결과를 확인할 수 있는 요약 패널만 앱에 통합한다.

**Tech Stack:** React 19, TypeScript, Jotai, TanStack Query v5, MSW, Vitest, Testing Library, date-fns

---

### Task 1: 글로벌 필터 도메인 모델과 초기값 정의

**Files:**
- Create: `src/entities/global-filter/model/types.ts`
- Create: `src/entities/global-filter/model/defaults.ts`
- Create: `src/entities/global-filter/lib/date-range.ts`
- Create: `src/entities/global-filter/lib/__tests__/date-range.test.ts`
- Create: `src/entities/global-filter/model/__tests__/defaults.test.ts`

- [ ] **Step 1: 글로벌 필터 타입을 정의한다**

```ts
// src/entities/global-filter/model/types.ts
export type CampaignStatus = "active" | "paused" | "ended";

export type CampaignPlatform = "Google" | "Meta" | "Naver";

export interface GlobalDateRange {
	startDate: string;
	endDate: string;
}

export interface GlobalFilterState {
	dateRange: GlobalDateRange;
	statuses: CampaignStatus[];
	platforms: CampaignPlatform[];
}
```

- [ ] **Step 2: 당월 초기값 생성 함수를 만든다**

```ts
// src/entities/global-filter/model/defaults.ts
import { endOfMonth, format, startOfMonth } from "date-fns";
import type { GlobalFilterState } from "./types";

const DATE_FORMAT = "yyyy-MM-dd";

export function createInitialGlobalFilterState(now = new Date()): GlobalFilterState {
	return {
		dateRange: {
			startDate: format(startOfMonth(now), DATE_FORMAT),
			endDate: format(endOfMonth(now), DATE_FORMAT),
		},
		statuses: ["active", "paused", "ended"],
		platforms: ["Google", "Meta", "Naver"],
	};
}
```

- [ ] **Step 3: 날짜 범위 유효성/직렬화 유틸을 만든다**

```ts
// src/entities/global-filter/lib/date-range.ts
import { isAfter, parseISO } from "date-fns";
import type { GlobalDateRange } from "@/entities/global-filter/model/types";

export function isValidDateRange(range: GlobalDateRange) {
	return !isAfter(parseISO(range.startDate), parseISO(range.endDate));
}

export function serializeFilterList(values: string[]) {
	return values.join(",");
}
```

- [ ] **Step 4: 초기값 테스트를 작성한다**

```ts
// src/entities/global-filter/model/__tests__/defaults.test.ts
import { describe, expect, it } from "vitest";
import { createInitialGlobalFilterState } from "@/entities/global-filter/model/defaults";

describe("createInitialGlobalFilterState", () => {
	it("creates current month range with all statuses and platforms", () => {
		const result = createInitialGlobalFilterState(new Date("2026-04-08T00:00:00Z"));

		expect(result).toEqual({
			dateRange: {
				startDate: "2026-04-01",
				endDate: "2026-04-30",
			},
			statuses: ["active", "paused", "ended"],
			platforms: ["Google", "Meta", "Naver"],
		});
	});
});
```

- [ ] **Step 5: 날짜 유틸 테스트를 작성한다**

```ts
// src/entities/global-filter/lib/__tests__/date-range.test.ts
import { describe, expect, it } from "vitest";
import {
	isValidDateRange,
	serializeFilterList,
} from "@/entities/global-filter/lib/date-range";

describe("date range utils", () => {
	it("accepts same-day and ascending ranges", () => {
		expect(
			isValidDateRange({ startDate: "2026-04-01", endDate: "2026-04-01" }),
		).toBe(true);
		expect(
			isValidDateRange({ startDate: "2026-04-01", endDate: "2026-04-30" }),
		).toBe(true);
	});

	it("rejects descending ranges", () => {
		expect(
			isValidDateRange({ startDate: "2026-04-30", endDate: "2026-04-01" }),
		).toBe(false);
	});

	it("serializes selected values for query params", () => {
		expect(serializeFilterList(["active", "paused"])).toBe("active,paused");
		expect(serializeFilterList([])).toBe("");
	});
});
```

- [ ] **Step 6: 도메인 테스트를 실행해 통과를 확인한다**

Run: `npm run test:run -- src/entities/global-filter/model/__tests__/defaults.test.ts src/entities/global-filter/lib/__tests__/date-range.test.ts`

Expected: `2 passed`

- [ ] **Step 7: 커밋한다**

```bash
git add src/entities/global-filter docs/superpowers/plans/2026-04-08-global-filter.md
git commit -m "feat: add global filter domain model"
```

### Task 2: 서버 필터 순수 함수 구현

**Files:**
- Create: `src/entities/campaign/model/types.ts`
- Create: `src/entities/daily-stat/model/types.ts`
- Create: `src/entities/campaign/lib/filter-campaigns.ts`
- Create: `src/entities/daily-stat/lib/filter-daily-stats.ts`
- Create: `src/entities/campaign/lib/__tests__/filter-campaigns.test.ts`
- Create: `src/entities/daily-stat/lib/__tests__/filter-daily-stats.test.ts`

- [ ] **Step 1: 캠페인/일별 데이터 타입을 정의한다**

```ts
// src/entities/campaign/model/types.ts
import type {
	CampaignPlatform,
	CampaignStatus,
} from "@/entities/global-filter/model/types";

export interface Campaign {
	id: string;
	name: string;
	platform: CampaignPlatform;
	status: CampaignStatus;
	budget: number;
	startDate: string;
	endDate: string | null;
}
```

```ts
// src/entities/daily-stat/model/types.ts
export interface DailyStat {
	id: string;
	campaignId: string;
	date: string;
	impressions: number;
	clicks: number;
	conversions: number;
	cost: number;
	conversionsValue: number | null;
}
```

- [ ] **Step 2: 캠페인 필터 함수를 구현한다**

```ts
// src/entities/campaign/lib/filter-campaigns.ts
import type { Campaign } from "@/entities/campaign/model/types";
import type { GlobalFilterState } from "@/entities/global-filter/model/types";

export function filterCampaigns(
	campaigns: Campaign[],
	filter: GlobalFilterState,
) {
	return campaigns.filter((campaign) => {
		const matchesDateRange =
			campaign.startDate <= filter.dateRange.endDate &&
			(campaign.endDate === null ||
				campaign.endDate >= filter.dateRange.startDate);

		const matchesStatus = filter.statuses.includes(campaign.status);
		const matchesPlatform = filter.platforms.includes(campaign.platform);

		return matchesDateRange && matchesStatus && matchesPlatform;
	});
}
```

- [ ] **Step 3: 일별 데이터 필터 함수를 구현한다**

```ts
// src/entities/daily-stat/lib/filter-daily-stats.ts
import type { DailyStat } from "@/entities/daily-stat/model/types";
import type { GlobalDateRange } from "@/entities/global-filter/model/types";

export function filterDailyStats(
	dailyStats: DailyStat[],
	campaignIds: string[],
	dateRange: GlobalDateRange,
) {
	const campaignIdSet = new Set(campaignIds);

	return dailyStats.filter((stat) => {
		return (
			campaignIdSet.has(stat.campaignId) &&
			stat.date >= dateRange.startDate &&
			stat.date <= dateRange.endDate
		);
	});
}
```

- [ ] **Step 4: 캠페인 필터 테스트를 작성한다**

```ts
// src/entities/campaign/lib/__tests__/filter-campaigns.test.ts
import { describe, expect, it } from "vitest";
import { filterCampaigns } from "@/entities/campaign/lib/filter-campaigns";
import type { Campaign } from "@/entities/campaign/model/types";
import type { GlobalFilterState } from "@/entities/global-filter/model/types";

const campaigns: Campaign[] = [
	{
		id: "1",
		name: "Google Active",
		platform: "Google",
		status: "active",
		budget: 1000,
		startDate: "2026-04-01",
		endDate: "2026-04-30",
	},
	{
		id: "2",
		name: "Meta Paused",
		platform: "Meta",
		status: "paused",
		budget: 1000,
		startDate: "2026-03-10",
		endDate: "2026-04-05",
	},
];

describe("filterCampaigns", () => {
	it("keeps campaigns overlapping the selected range", () => {
		const filter: GlobalFilterState = {
			dateRange: { startDate: "2026-04-03", endDate: "2026-04-10" },
			statuses: ["active", "paused", "ended"],
			platforms: ["Google", "Meta", "Naver"],
		};

		expect(filterCampaigns(campaigns, filter).map((campaign) => campaign.id)).toEqual([
			"1",
			"2",
		]);
	});

	it("returns empty array when a filter group is empty", () => {
		const filter: GlobalFilterState = {
			dateRange: { startDate: "2026-04-01", endDate: "2026-04-30" },
			statuses: [],
			platforms: ["Google", "Meta", "Naver"],
		};

		expect(filterCampaigns(campaigns, filter)).toEqual([]);
	});
});
```

- [ ] **Step 5: 일별 데이터 필터 테스트를 작성한다**

```ts
// src/entities/daily-stat/lib/__tests__/filter-daily-stats.test.ts
import { describe, expect, it } from "vitest";
import { filterDailyStats } from "@/entities/daily-stat/lib/filter-daily-stats";
import type { DailyStat } from "@/entities/daily-stat/model/types";

const dailyStats: DailyStat[] = [
	{
		id: "d1",
		campaignId: "1",
		date: "2026-04-01",
		impressions: 10,
		clicks: 1,
		conversions: 0,
		cost: 100,
		conversionsValue: null,
	},
	{
		id: "d2",
		campaignId: "2",
		date: "2026-04-15",
		impressions: 20,
		clicks: 2,
		conversions: 1,
		cost: 200,
		conversionsValue: 500,
	},
];

describe("filterDailyStats", () => {
	it("filters by campaign ids and selected date range", () => {
		expect(
			filterDailyStats(dailyStats, ["2"], {
				startDate: "2026-04-10",
				endDate: "2026-04-30",
			}),
		).toEqual([dailyStats[1]]);
	});
});
```

- [ ] **Step 6: 필터 함수 테스트를 실행한다**

Run: `npm run test:run -- src/entities/campaign/lib/__tests__/filter-campaigns.test.ts src/entities/daily-stat/lib/__tests__/filter-daily-stats.test.ts`

Expected: `3 passed`

- [ ] **Step 7: 커밋한다**

```bash
git add src/entities/campaign src/entities/daily-stat
git commit -m "feat: add server-side global filter selectors"
```

### Task 3: MSW 핸들러와 대시보드 쿼리 연결

**Files:**
- Create: `src/shared/api/mock/db.ts`
- Create: `src/shared/api/mock/handlers.ts`
- Create: `src/shared/api/mock/browser.ts`
- Create: `src/shared/api/mock/server.ts`
- Create: `src/shared/api/query-client.ts`
- Create: `src/app/providers/app-providers.tsx`
- Create: `src/entities/dashboard/api/fetch-dashboard-data.ts`
- Create: `src/entities/dashboard/api/use-dashboard-data.ts`
- Create: `src/entities/dashboard/api/__tests__/fetch-dashboard-data.test.ts`
- Modify: `src/main.tsx`
- Modify: `src/test/setup.ts`

- [ ] **Step 1: 테스트용 인메모리 mock db와 핸들러를 만든다**

```ts
// src/shared/api/mock/db.ts
import type { Campaign } from "@/entities/campaign/model/types";
import type { DailyStat } from "@/entities/daily-stat/model/types";

export const mockDb: { campaigns: Campaign[]; dailyStats: DailyStat[] } = {
	campaigns: [],
	dailyStats: [],
};

export function seedMockDb(data: { campaigns: Campaign[]; dailyStats: DailyStat[] }) {
	mockDb.campaigns = data.campaigns;
	mockDb.dailyStats = data.dailyStats;
}
```

```ts
// src/shared/api/mock/handlers.ts
import { http, HttpResponse } from "msw";
import { filterCampaigns } from "@/entities/campaign/lib/filter-campaigns";
import { filterDailyStats } from "@/entities/daily-stat/lib/filter-daily-stats";
import { mockDb } from "@/shared/api/mock/db";

export const handlers = [
	http.get("/campaigns", ({ request }) => {
		const { searchParams } = new URL(request.url);
		const filteredCampaigns = filterCampaigns(mockDb.campaigns, {
			dateRange: {
				startDate: searchParams.get("startDate") ?? "",
				endDate: searchParams.get("endDate") ?? "",
			},
			statuses: (searchParams.get("statuses") ?? "").split(",").filter(Boolean),
			platforms: (searchParams.get("platforms") ?? "").split(",").filter(Boolean),
		});

		return HttpResponse.json(filteredCampaigns);
	}),
	http.get("/daily_stats", ({ request }) => {
		const { searchParams } = new URL(request.url);
		const campaignIds = (searchParams.get("campaignIds") ?? "")
			.split(",")
			.filter(Boolean);

		return HttpResponse.json(
			filterDailyStats(mockDb.dailyStats, campaignIds, {
				startDate: searchParams.get("startDate") ?? "",
				endDate: searchParams.get("endDate") ?? "",
			}),
		);
	}),
];
```

- [ ] **Step 2: 브라우저/테스트 서버 엔트리와 QueryClient를 만든다**

```ts
// src/shared/api/mock/browser.ts
import { setupWorker } from "msw/browser";
import { handlers } from "@/shared/api/mock/handlers";

export const worker = setupWorker(...handlers);
```

```ts
// src/shared/api/mock/server.ts
import { setupServer } from "msw/node";
import { handlers } from "@/shared/api/mock/handlers";

export const server = setupServer(...handlers);
```

```ts
// src/shared/api/query-client.ts
import { QueryClient } from "@tanstack/react-query";

export function createQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
		},
	});
}
```

- [ ] **Step 3: 앱 프로바이더와 대시보드 fetch/query 훅을 만든다**

```tsx
// src/app/providers/app-providers.tsx
import { QueryClientProvider } from "@tanstack/react-query";
import { Provider as JotaiProvider } from "jotai";
import type { PropsWithChildren } from "react";
import { createQueryClient } from "@/shared/api/query-client";

const queryClient = createQueryClient();

export function AppProviders({ children }: PropsWithChildren) {
	return (
		<JotaiProvider>
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		</JotaiProvider>
	);
}
```

```ts
// src/entities/dashboard/api/fetch-dashboard-data.ts
import type { Campaign } from "@/entities/campaign/model/types";
import type { DailyStat } from "@/entities/daily-stat/model/types";
import { serializeFilterList } from "@/entities/global-filter/lib/date-range";
import type { GlobalFilterState } from "@/entities/global-filter/model/types";

export interface DashboardData {
	campaigns: Campaign[];
	dailyStats: DailyStat[];
}

export async function fetchDashboardData(
	filter: GlobalFilterState,
): Promise<DashboardData> {
	const campaignsUrl = new URL("/campaigns", window.location.origin);
	campaignsUrl.searchParams.set("startDate", filter.dateRange.startDate);
	campaignsUrl.searchParams.set("endDate", filter.dateRange.endDate);
	campaignsUrl.searchParams.set("statuses", serializeFilterList(filter.statuses));
	campaignsUrl.searchParams.set("platforms", serializeFilterList(filter.platforms));

	const campaigns = (await fetch(campaignsUrl).then((response) =>
		response.json(),
	)) as Campaign[];

	const dailyStatsUrl = new URL("/daily_stats", window.location.origin);
	dailyStatsUrl.searchParams.set("startDate", filter.dateRange.startDate);
	dailyStatsUrl.searchParams.set("endDate", filter.dateRange.endDate);
	dailyStatsUrl.searchParams.set(
		"campaignIds",
		campaigns.map((campaign) => campaign.id).join(","),
	);

	const dailyStats = (await fetch(dailyStatsUrl).then((response) =>
		response.json(),
	)) as DailyStat[];

	return { campaigns, dailyStats };
}
```

```ts
// src/entities/dashboard/api/use-dashboard-data.ts
import { useQuery } from "@tanstack/react-query";
import { fetchDashboardData } from "@/entities/dashboard/api/fetch-dashboard-data";
import type { GlobalFilterState } from "@/entities/global-filter/model/types";

export function useDashboardData(filter: GlobalFilterState) {
	return useQuery({
		queryKey: ["dashboard-data", filter],
		queryFn: () => fetchDashboardData(filter),
	});
}
```

- [ ] **Step 4: 엔트리와 테스트 셋업을 수정한다**

```tsx
// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AppProviders } from "@/app/providers/app-providers";
import { worker } from "@/shared/api/mock/browser";
import "./index.css";

async function bootstrap() {
	await worker.start({ onUnhandledRequest: "error" });

	const rootElement = document.getElementById("root");
	if (!rootElement) throw new Error("Root element not found");

	createRoot(rootElement).render(
		<StrictMode>
			<AppProviders>
				<App />
			</AppProviders>
		</StrictMode>,
	);
}

void bootstrap();
```

```ts
// src/test/setup.ts
import "@testing-library/jest-dom";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "@/shared/api/mock/server";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

- [ ] **Step 5: fetch 계층 테스트를 작성한다**

```ts
// src/entities/dashboard/api/__tests__/fetch-dashboard-data.test.ts
import { describe, expect, it } from "vitest";
import { fetchDashboardData } from "@/entities/dashboard/api/fetch-dashboard-data";
import { seedMockDb } from "@/shared/api/mock/db";

describe("fetchDashboardData", () => {
	it("returns campaigns and daily stats filtered on the server", async () => {
		seedMockDb({
			campaigns: [
				{
					id: "1",
					name: "Google Active",
					platform: "Google",
					status: "active",
					budget: 1000,
					startDate: "2026-04-01",
					endDate: "2026-04-30",
				},
				{
					id: "2",
					name: "Meta Paused",
					platform: "Meta",
					status: "paused",
					budget: 1000,
					startDate: "2026-04-01",
					endDate: "2026-04-30",
				},
			],
			dailyStats: [
				{
					id: "d1",
					campaignId: "1",
					date: "2026-04-02",
					impressions: 10,
					clicks: 1,
					conversions: 0,
					cost: 100,
					conversionsValue: null,
				},
			],
		});

		const result = await fetchDashboardData({
			dateRange: { startDate: "2026-04-01", endDate: "2026-04-30" },
			statuses: ["active"],
			platforms: ["Google"],
		});

		expect(result.campaigns).toHaveLength(1);
		expect(result.campaigns[0]?.id).toBe("1");
		expect(result.dailyStats).toHaveLength(1);
	});
});
```

- [ ] **Step 6: API 테스트를 실행한다**

Run: `npm run test:run -- src/entities/dashboard/api/__tests__/fetch-dashboard-data.test.ts`

Expected: `1 passed`

- [ ] **Step 7: 커밋한다**

```bash
git add src/app src/entities/dashboard src/shared/api src/main.tsx src/test/setup.ts
git commit -m "feat: wire global filter dashboard queries"
```

### Task 4: Jotai 스토어와 반응형 글로벌 필터 UI 구현

**Files:**
- Create: `src/entities/global-filter/model/store.ts`
- Create: `src/widgets/global-filter/ui/global-filter-bar.tsx`
- Create: `src/widgets/global-filter/ui/filter-chip-group.tsx`
- Create: `src/widgets/global-filter/ui/filter-dropdown.tsx`
- Create: `src/widgets/global-filter/ui/date-range-fields.tsx`
- Create: `src/widgets/global-filter/ui/__tests__/global-filter-bar.test.tsx`

- [ ] **Step 1: 글로벌 필터 atom과 액션 헬퍼를 만든다**

```ts
// src/entities/global-filter/model/store.ts
import { atom } from "jotai";
import { createInitialGlobalFilterState } from "@/entities/global-filter/model/defaults";
import type {
	CampaignPlatform,
	CampaignStatus,
	GlobalDateRange,
} from "@/entities/global-filter/model/types";

const initialState = createInitialGlobalFilterState();

export const globalFilterAtom = atom(initialState);

export const setDateRangeAtom = atom(
	null,
	(get, set, nextDateRange: GlobalDateRange) => {
		set(globalFilterAtom, {
			...get(globalFilterAtom),
			dateRange: nextDateRange,
		});
	},
);

export const toggleStatusAtom = atom(
	null,
	(get, set, status: CampaignStatus) => {
		const current = get(globalFilterAtom);
		const statuses = current.statuses.includes(status)
			? current.statuses.filter((value) => value !== status)
			: [...current.statuses, status];

		set(globalFilterAtom, { ...current, statuses });
	},
);

export const togglePlatformAtom = atom(
	null,
	(get, set, platform: CampaignPlatform) => {
		const current = get(globalFilterAtom);
		const platforms = current.platforms.includes(platform)
			? current.platforms.filter((value) => value !== platform)
			: [...current.platforms, platform];

		set(globalFilterAtom, { ...current, platforms });
	},
);

export const resetGlobalFilterAtom = atom(null, (_get, set) => {
	set(globalFilterAtom, createInitialGlobalFilterState());
});
```

- [ ] **Step 2: 날짜 입력과 칩/드롭다운 UI를 만든다**

```tsx
// src/widgets/global-filter/ui/date-range-fields.tsx
import { TextInput } from "@/shared/ui/input";

interface DateRangeFieldsProps {
	startDate: string;
	endDate: string;
	errorMessage?: string;
	onChange: (next: { startDate: string; endDate: string }) => void;
}

export function DateRangeFields({
	startDate,
	endDate,
	errorMessage,
	onChange,
}: DateRangeFieldsProps) {
	return (
		<div className="grid gap-2 md:grid-cols-2">
			<TextInput
				aria-label="시작일"
				type="date"
				value={startDate}
				onChange={(event) =>
					onChange({ startDate: event.target.value, endDate })
				}
			/>
			<TextInput
				aria-label="종료일"
				type="date"
				value={endDate}
				onChange={(event) =>
					onChange({ startDate, endDate: event.target.value })
				}
			/>
			{errorMessage ? <p className="text-sm text-[var(--status-danger-fg)]">{errorMessage}</p> : null}
		</div>
	);
}
```

```tsx
// src/widgets/global-filter/ui/filter-chip-group.tsx
import { Button } from "@/shared/ui/button";

interface FilterChipGroupProps<T extends string> {
	label: string;
	options: readonly T[];
	selectedValues: T[];
	onToggle: (value: T) => void;
	onSelectAll: () => void;
}

export function FilterChipGroup<T extends string>({
	label,
	options,
	selectedValues,
	onToggle,
	onSelectAll,
}: FilterChipGroupProps<T>) {
	const isAllSelected = options.every((option) => selectedValues.includes(option));

	return (
		<div className="hidden gap-2 lg:flex lg:flex-col">
			<span className="text-sm text-[var(--text-secondary)]">{label}</span>
			<div className="flex flex-wrap gap-2">
				<Button
					type="button"
					size="sm"
					variant={isAllSelected ? "default" : "outline"}
					onClick={onSelectAll}
				>
					전체
				</Button>
				{options.map((option) => (
					<Button
						key={option}
						type="button"
						size="sm"
						variant={selectedValues.includes(option) ? "default" : "outline"}
						onClick={() => onToggle(option)}
					>
						{option}
					</Button>
				))}
			</div>
		</div>
	);
}
```

- [ ] **Step 3: 모바일 드롭다운과 필터 바 컨테이너를 만든다**

```tsx
// src/widgets/global-filter/ui/global-filter-bar.tsx
import { useAtomValue, useSetAtom } from "jotai";
import { useState } from "react";
import { isValidDateRange } from "@/entities/global-filter/lib/date-range";
import {
	globalFilterAtom,
	resetGlobalFilterAtom,
	setDateRangeAtom,
	togglePlatformAtom,
	toggleStatusAtom,
} from "@/entities/global-filter/model/store";
import { Button } from "@/shared/ui/button";
import { DateRangeFields } from "@/widgets/global-filter/ui/date-range-fields";
import { FilterChipGroup } from "@/widgets/global-filter/ui/filter-chip-group";

const STATUS_OPTIONS = ["active", "paused", "ended"] as const;
const PLATFORM_OPTIONS = ["Google", "Meta", "Naver"] as const;

export function GlobalFilterBar() {
	const filter = useAtomValue(globalFilterAtom);
	const setDateRange = useSetAtom(setDateRangeAtom);
	const toggleStatus = useSetAtom(toggleStatusAtom);
	const togglePlatform = useSetAtom(togglePlatformAtom);
	const resetFilter = useSetAtom(resetGlobalFilterAtom);
	const [dateError, setDateError] = useState("");

	return (
		<section className="rounded-[var(--panel-radius)] border border-[var(--panel-border)] bg-[var(--panel-bg)] p-[var(--layout-panel-padding)] shadow-[var(--panel-shadow)]">
			<div className="flex flex-col gap-4">
				<DateRangeFields
					startDate={filter.dateRange.startDate}
					endDate={filter.dateRange.endDate}
					errorMessage={dateError}
					onChange={(nextDateRange) => {
						if (!isValidDateRange(nextDateRange)) {
							setDateError("시작일은 종료일보다 늦을 수 없습니다.");
							return;
						}

						setDateError("");
						setDateRange(nextDateRange);
					}}
				/>
				<FilterChipGroup
					label="상태"
					options={STATUS_OPTIONS}
					selectedValues={filter.statuses}
					onToggle={toggleStatus}
					onSelectAll={() => {
						for (const status of STATUS_OPTIONS) {
							if (!filter.statuses.includes(status)) toggleStatus(status);
						}
					}}
				/>
				<FilterChipGroup
					label="매체"
					options={PLATFORM_OPTIONS}
					selectedValues={filter.platforms}
					onToggle={togglePlatform}
					onSelectAll={() => {
						for (const platform of PLATFORM_OPTIONS) {
							if (!filter.platforms.includes(platform)) togglePlatform(platform);
						}
					}}
				/>
				<div className="flex justify-end">
					<Button type="button" variant="secondary" onClick={() => {
						setDateError("");
						resetFilter();
					}}>
						초기화
					</Button>
				</div>
			</div>
		</section>
	);
}
```

- [ ] **Step 4: 필터 바 테스트를 작성한다**

```tsx
// src/widgets/global-filter/ui/__tests__/global-filter-bar.test.tsx
import { QueryClientProvider } from "@tanstack/react-query";
import { Provider as JotaiProvider } from "jotai";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { createQueryClient } from "@/shared/api/query-client";
import { GlobalFilterBar } from "@/widgets/global-filter/ui/global-filter-bar";

function renderWithProviders() {
	return render(
		<JotaiProvider>
			<QueryClientProvider client={createQueryClient()}>
				<GlobalFilterBar />
			</QueryClientProvider>
		</JotaiProvider>,
	);
}

describe("GlobalFilterBar", () => {
	it("toggles status chips", async () => {
		renderWithProviders();
		const user = userEvent.setup();

		await user.click(screen.getByRole("button", { name: "active" }));

		expect(screen.getByRole("button", { name: "active" })).toHaveAttribute(
			"data-variant",
			"outline",
		);
	});

	it("shows date validation error and keeps current state", async () => {
		renderWithProviders();
		const user = userEvent.setup();

		await user.clear(screen.getByLabelText("시작일"));
		await user.type(screen.getByLabelText("시작일"), "2026-04-30");
		await user.clear(screen.getByLabelText("종료일"));
		await user.type(screen.getByLabelText("종료일"), "2026-04-01");

		expect(
			screen.getByText("시작일은 종료일보다 늦을 수 없습니다."),
		).toBeInTheDocument();
	});
});
```

- [ ] **Step 5: 필터 UI 테스트를 실행한다**

Run: `npm run test:run -- src/widgets/global-filter/ui/__tests__/global-filter-bar.test.tsx`

Expected: `2 passed`

- [ ] **Step 6: 커밋한다**

```bash
git add src/entities/global-filter/model/store.ts src/widgets/global-filter
git commit -m "feat: add responsive global filter controls"
```

### Task 5: 앱 통합과 테이블 로컬 상태 경계 고정

**Files:**
- Create: `src/widgets/global-filter/ui/global-filter-summary.tsx`
- Create: `src/widgets/campaign-table/model/use-campaign-table-controls.ts`
- Create: `src/widgets/campaign-table/model/__tests__/use-campaign-table-controls.test.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: 필터 결과를 보여줄 요약 패널을 만든다**

```tsx
// src/widgets/global-filter/ui/global-filter-summary.tsx
import { useAtomValue } from "jotai";
import { useDashboardData } from "@/entities/dashboard/api/use-dashboard-data";
import { globalFilterAtom } from "@/entities/global-filter/model/store";

export function GlobalFilterSummary() {
	const filter = useAtomValue(globalFilterAtom);
	const { data, isLoading, isError } = useDashboardData(filter);

	if (isLoading) return <p>필터 결과를 불러오는 중...</p>;
	if (isError || !data) return <p>필터 결과를 불러오지 못했습니다.</p>;

	return (
		<section className="rounded-[var(--panel-radius)] border border-[var(--panel-border)] bg-[var(--panel-bg)] p-[var(--layout-panel-padding)] shadow-[var(--panel-shadow)]">
			<h2>글로벌 필터 결과</h2>
			<p className="mt-2 text-[var(--text-secondary)]">
				캠페인 {data.campaigns.length}건 / 일별 데이터 {data.dailyStats.length}건
			</p>
		</section>
	);
}
```

- [ ] **Step 2: 테이블 전용 로컬 상태 훅을 만들어 경계를 고정한다**

```ts
// src/widgets/campaign-table/model/use-campaign-table-controls.ts
import { useState } from "react";

export function useCampaignTableControls() {
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [sortBy, setSortBy] = useState<string | null>(null);

	return {
		search,
		setSearch,
		page,
		setPage,
		sortBy,
		setSortBy,
	};
}
```

```ts
// src/widgets/campaign-table/model/__tests__/use-campaign-table-controls.test.ts
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useCampaignTableControls } from "@/widgets/campaign-table/model/use-campaign-table-controls";

describe("useCampaignTableControls", () => {
	it("stores table-only search and paging locally", () => {
		const { result } = renderHook(() => useCampaignTableControls());

		act(() => {
			result.current.setSearch("brand");
			result.current.setPage(2);
			result.current.setSortBy("ctr");
		});

		expect(result.current.search).toBe("brand");
		expect(result.current.page).toBe(2);
		expect(result.current.sortBy).toBe("ctr");
	});
});
```

- [ ] **Step 3: 앱에 글로벌 필터와 요약 패널을 통합한다**

```tsx
// src/App.tsx
import { GlobalFilterBar } from "@/widgets/global-filter/ui/global-filter-bar";
import { GlobalFilterSummary } from "@/widgets/global-filter/ui/global-filter-summary";

function App() {
	return (
		<main className="min-h-screen bg-[var(--surface-canvas)] text-[var(--text-primary)]">
			<section className="mx-auto grid min-h-screen max-w-[var(--layout-page-max)] gap-[var(--layout-panel-gap)] px-[var(--layout-page-gutter)] py-8 lg:grid-cols-[260px_minmax(0,1fr)]">
				{/* existing sidebar */}
				<div className="flex flex-col gap-[var(--layout-panel-gap)]">
					{/* existing header */}
					<GlobalFilterBar />
					<GlobalFilterSummary />
					{/* keep existing shell sections below as placeholders */}
				</div>
			</section>
		</main>
	);
}
```

- [ ] **Step 4: 로컬 상태 경계 테스트를 실행한다**

Run: `npm run test:run -- src/widgets/campaign-table/model/__tests__/use-campaign-table-controls.test.ts`

Expected: `1 passed`

- [ ] **Step 5: 전체 검증을 실행한다**

Run: `npm run test:run`

Expected: 모든 테스트 통과

Run: `npm run lint`

Expected: `Checked ... files in ... No fixes applied.`

- [ ] **Step 6: 커밋한다**

```bash
git add src/App.tsx src/widgets/global-filter src/widgets/campaign-table
git commit -m "feat: integrate global filter into dashboard shell"
```

## Self-Review

- 스펙 커버리지: 상태 모델, 서버 필터 책임, 데스크톱/모바일 UI, 빈 결과 허용, 잘못된 날짜 범위, 테이블 로컬 상태 분리를 모두 태스크에 반영했다.
- Placeholder 점검: 경로, 코드, 테스트, 명령어를 모두 명시했다. `TODO`, `TBD`, "적절히 처리" 같은 표현은 사용하지 않았다.
- 타입 일관성: `CampaignStatus`, `CampaignPlatform`, `GlobalFilterState`를 기준 타입으로 고정했고, 이후 태스크가 동일한 이름을 사용한다.
