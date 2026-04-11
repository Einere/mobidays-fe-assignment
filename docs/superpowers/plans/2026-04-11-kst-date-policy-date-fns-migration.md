# KST Date Policy and `date-fns` Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `Asia/Seoul` the canonical business timezone for dashboard dates and replace ad-hoc native `Date` handling in production code with shared `date-fns`-based utilities.

**Architecture:** Introduce a single shared KST date helper as the source of truth for parsing, formatting, comparison, and month-boundary calculation. Production code should stop interpreting `YYYY-MM-DD` values through ambient runtime timezone rules and instead flow through that helper. Keep `Date` only as a low-level input source for "now" and in test fixtures; all business-date logic should be timezone-explicit.

**Tech Stack:** TypeScript, `date-fns` v4, `@date-fns/tz`, Vitest, Testing Library, Vite

---

### Task 1: Add a shared KST date helper

**Files:**
- Create: `src/shared/lib/date/kst.ts`
- Create: `src/shared/lib/date/__tests__/kst.test.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import {
	formatKstDate,
	getKstMonthRange,
	isKstDateString,
	parseKstDateString,
} from "@/shared/lib/date/kst";

describe("KST date helpers", () => {
	it("formats an instant using Asia/Seoul calendar rules", () => {
		expect(formatKstDate(new Date("2026-03-31T15:00:00.000Z"))).toBe("2026-04-01");
	});

	it("validates only canonical YYYY-MM-DD strings", () => {
		expect(isKstDateString("2026-04-01")).toBe(true);
		expect(isKstDateString("2026/04/01")).toBe(false);
		expect(isKstDateString("2026-02-30")).toBe(false);
	});

	it("parses a KST date string into a stable Date object", () => {
		expect(parseKstDateString("2026-04-01")?.toISOString()).toBe("2026-03-31T15:00:00.000Z");
	});

	it("returns month boundaries in KST", () => {
		expect(getKstMonthRange(new Date("2026-04-08T00:00:00.000Z"))).toEqual({
			startDate: "2026-04-01",
			endDate: "2026-04-30",
		});
	});
});
```

- [ ] **Step 2: Run the test to confirm it fails**

Run: `npm run test:run -- src/shared/lib/date/__tests__/kst.test.ts`

Expected: fail because `src/shared/lib/date/kst.ts` does not exist yet.

- [ ] **Step 3: Add the dependency and implement the helper**

Run: `npm install @date-fns/tz`

Implement `src/shared/lib/date/kst.ts` so it exposes:
- `KST_TIME_ZONE = "Asia/Seoul"`
- `isKstDateString(value: unknown): value is string`
- `parseKstDateString(value: string): Date | null`
- `formatKstDate(date: Date | number, pattern = "yyyy-MM-dd"): string`
- `getKstMonthRange(now: Date): { startDate: string; endDate: string }`

Use `date-fns` for pure date operations and `@date-fns/tz` to force calculations into `Asia/Seoul`.

- [ ] **Step 4: Run the test to confirm it passes**

Run: `npm run test:run -- src/shared/lib/date/__tests__/kst.test.ts`

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/shared/lib/date
git commit -m "feat: add kst date helpers"
```

### Task 2: Migrate global filter and campaign form date logic to the KST helper

**Files:**
- Modify: `src/entities/global-filter/lib/date-range.ts`
- Modify: `src/entities/global-filter/model/defaults.ts`
- Modify: `src/entities/campaign/lib/create-campaign-schema.ts`
- Modify: `src/widgets/campaign-table/model/use-campaign-create-dialog.ts`
- Modify: `src/entities/global-filter/lib/__tests__/date-range.test.ts`
- Modify: `src/entities/global-filter/model/__tests__/defaults.test.ts`
- Modify: `src/entities/campaign/lib/__tests__/create-campaign-schema.test.ts`
- Create: `src/widgets/campaign-table/model/__tests__/use-campaign-create-dialog.test.ts`

- [ ] **Step 1: Write the failing tests**

Add assertions that verify the KST policy instead of ambient `Date` behavior:

```ts
import { describe, expect, it } from "vitest";
import { isValidDateRange } from "@/entities/global-filter/lib/date-range";

describe("date range utils", () => {
	it("accepts same-day and ascending KST date ranges", () => {
		expect(isValidDateRange({ startDate: "2026-04-01", endDate: "2026-04-01" })).toBe(true);
		expect(isValidDateRange({ startDate: "2026-04-01", endDate: "2026-04-30" })).toBe(true);
	});

	it("rejects descending and malformed ranges", () => {
		expect(isValidDateRange({ startDate: "2026-04-30", endDate: "2026-04-01" })).toBe(false);
		expect(isValidDateRange({ startDate: "2026/04/01", endDate: "2026-04-01" })).toBe(false);
	});
});
```

```ts
import { describe, expect, it } from "vitest";
import { createInitialGlobalFilterState } from "@/entities/global-filter/model/defaults";

describe("createInitialGlobalFilterState", () => {
	it("creates April boundaries in KST from a UTC midnight input", () => {
		expect(createInitialGlobalFilterState(new Date("2026-04-08T00:00:00.000Z"))).toEqual({
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

```ts
import { describe, expect, it } from "vitest";
import { createCampaignSchema } from "@/entities/campaign/lib/create-campaign-schema";

describe("createCampaignSchema", () => {
	it("rejects non-ISO dates and preserves same-day KST ranges", () => {
		expect(
			createCampaignSchema.safeParse({
				name: "브랜드 검색 캠페인",
				platform: "Google",
				budget: "100000",
				spend: "50000",
				startDate: "2026/04/10",
				endDate: "2026-02-30",
			}).success,
		).toBe(false);

		expect(
			createCampaignSchema.safeParse({
				name: "브랜드 검색 캠페인",
				platform: "Google",
				budget: "100000",
				spend: "50000",
				startDate: "2026-04-10",
				endDate: "2026-04-10",
			}).success,
		).toBe(true);
	});
});
```

- [ ] **Step 2: Run the targeted tests and confirm the current behavior is still tied to native `Date`**

Run:
- `npm run test:run -- src/entities/global-filter/lib/__tests__/date-range.test.ts`
- `npm run test:run -- src/entities/global-filter/model/__tests__/defaults.test.ts`
- `npm run test:run -- src/entities/campaign/lib/__tests__/create-campaign-schema.test.ts`

Expected: at least one of these will fail until the helper is wired through the production code.

- [ ] **Step 3: Replace native `Date` logic with the helper**

Update the three production files to use `src/shared/lib/date/kst.ts`:
- `isValidDateRange` should compare parsed KST dates instead of calling `parseISO`/`isAfter` directly.
- `createInitialGlobalFilterState` should derive the current month boundaries through the helper, not `startOfMonth`/`endOfMonth` on a raw `Date`.
- `createCampaignSchema` should validate `YYYY-MM-DD` values through the shared helper and compare start/end dates in KST.
- `useCampaignCreateDialog` should use the shared helper for the default `today` value instead of formatting `new Date()` directly.

- [ ] **Step 4: Run the tests again**

Run:
- `npm run test:run -- src/entities/global-filter/lib/__tests__/date-range.test.ts`
- `npm run test:run -- src/entities/global-filter/model/__tests__/defaults.test.ts`
- `npm run test:run -- src/entities/campaign/lib/__tests__/create-campaign-schema.test.ts`

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/entities/global-filter src/entities/campaign src/widgets/campaign-table
git commit -m "feat: normalize dashboard dates to kst"
```

### Task 3: Migrate dashboard parsing, campaign table sorting, and mock filtering

**Files:**
- Modify: `src/shared/api/contracts/dashboard-data.ts`
- Modify: `src/entities/campaign/lib/build-campaign-table-rows.ts`
- Modify: `src/app/mock/handlers.ts`
- Modify: `src/entities/dashboard/api/__tests__/parse-dashboard-data.test.ts`
- Modify: `src/entities/dashboard/api/__tests__/fetch-dashboard-data.test.ts`
- Modify: `src/entities/campaign/lib/__tests__/build-campaign-table-rows.test.ts`

- [ ] **Step 1: Write the failing tests**

Add assertions that make the KST contract explicit:

```ts
import { describe, expect, it } from "vitest";
import { parseCampaignResponse } from "@/shared/api/contracts/dashboard-data";

describe("parseCampaignResponse", () => {
	it("keeps raw values and validates KST date strings", () => {
		const result = parseCampaignResponse([
			{
				id: "CMP-1",
				name: "이벤트",
				platform: "Facebook",
				status: "running",
				budget: "2000000원",
				startDate: "2026/04/12",
				endDate: null,
			},
		]);

		expect(result[0]).toEqual(expect.objectContaining({
			platform: null,
			raw: expect.objectContaining({ platform: "Facebook" }),
		}));
	});
});
```

```ts
import { describe, expect, it } from "vitest";
import { buildCampaignTableRows } from "@/entities/campaign/lib/build-campaign-table-rows";

describe("buildCampaignTableRows", () => {
	it("derives sortable period values from KST dates", () => {
		const rows = buildCampaignTableRows({
			campaigns: [
				{
					raw: {
						id: "cmp-1",
						name: "Campaign",
						platform: "Google",
						status: "active",
						budget: 1000,
						startDate: "2026-04-01",
						endDate: "2026-04-30",
					},
					id: "cmp-1",
					name: "Campaign",
					platform: "Google",
					status: "active",
					budget: 1000,
					startDate: "2026-04-01",
					endDate: "2026-04-30",
				},
			],
			dailyStats: [],
		});

		expect(rows[0]?.periodSortValue).toBeGreaterThan(0);
	});
});
```

```ts
import { describe, expect, it } from "vitest";
import { server } from "@/app/mock/server";
import { fetchDashboardData } from "@/entities/dashboard";
import { seedMockDb } from "@/shared/api/mock/db";

describe("fetchDashboardData", () => {
	it("preserves unknown platforms and KST date-only values end to end", async () => {
		seedMockDb({
			campaigns: [
				{
					id: "1",
					name: "Unknown Active",
					platform: "TikTok",
					status: "active",
					budget: 1000,
					startDate: "2026-04-01",
					endDate: "2026-04-30",
				},
			],
			daily_stats: [
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
			platforms: ["Google", "Meta", "Naver"],
		});

		expect(result.campaigns[0]).toEqual(expect.objectContaining({
			platform: null,
			rawPlatform: "TikTok",
		}));
		expect(result.dailyStats[0]?.date).toBe("2026-04-02");
	});
});
```

- [ ] **Step 2: Run the targeted tests to confirm the current `Date.parse` behavior is still in play**

Run:
- `npm run test:run -- src/entities/dashboard/api/__tests__/parse-dashboard-data.test.ts`
- `npm run test:run -- src/entities/dashboard/api/__tests__/fetch-dashboard-data.test.ts`
- `npm run test:run -- src/entities/campaign/lib/__tests__/build-campaign-table-rows.test.ts`

Expected: at least one assertion should fail until the production code is switched to the shared helper.

- [ ] **Step 3: Replace production code with the KST helper**

Update the production files so that:
- `parseCampaignResponse` and `parseDailyStatResponse` use the shared helper to validate canonical KST date strings and keep raw payloads untouched.
- `buildCampaignTableRows` uses the helper for `periodSortValue` instead of `Date.parse`.
- `matchesCampaignDateRange` and `matchesDailyStatFilters` in `src/app/mock/handlers.ts` compare dates through the same KST-aware path as the app code.

- [ ] **Step 4: Run the tests again**

Run:
- `npm run test:run -- src/entities/dashboard/api/__tests__/parse-dashboard-data.test.ts`
- `npm run test:run -- src/entities/dashboard/api/__tests__/fetch-dashboard-data.test.ts`
- `npm run test:run -- src/entities/campaign/lib/__tests__/build-campaign-table-rows.test.ts`

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/shared/api/contracts src/entities/campaign src/app/mock src/entities/dashboard
git commit -m "feat: align dashboard data parsing with kst"
```

### Task 4: Migrate daily trend series and finish the native `Date` sweep

**Files:**
- Modify: `src/entities/daily-stat/lib/build-daily-trend-series.ts`
- Modify: `src/entities/global-filter/model/defaults.ts` if any remaining month-boundary logic is still using raw `Date`
- Modify: `src/widgets/campaign-table/model/use-campaign-create-dialog.ts` if any direct `new Date()` formatting remains
- Create or modify: `src/entities/daily-stat/lib/__tests__/build-daily-trend-series.test.ts`
- Modify: `src/shared/lib/date/__tests__/kst.test.ts`
- Modify: `src/entities/global-filter/lib/__tests__/date-range.test.ts`
- Modify: `src/entities/campaign/lib/__tests__/build-campaign-table-rows.test.ts`

- [ ] **Step 1: Write the failing test**

Cover the one place that still depends on UTC-style reconstruction of date-only strings:

```ts
import { describe, expect, it } from "vitest";
import { buildDailyTrendSeries } from "@/entities/daily-stat/lib/build-daily-trend-series";

describe("buildDailyTrendSeries", () => {
	it("groups and orders KST date-only rows consistently", () => {
		expect(
			buildDailyTrendSeries([
				{
					raw: {
						id: "d2",
						campaignId: "cmp-1",
						date: "2026-04-02",
						impressions: 10,
						clicks: 1,
						conversions: 0,
						cost: 100,
						conversionsValue: 300,
					},
					id: "d2",
					campaignId: "cmp-1",
					date: "2026-04-02",
					impressions: 10,
					clicks: 1,
					conversions: 0,
					cost: 100,
					conversionsValue: 300,
				},
				{
					raw: {
						id: "d1",
						campaignId: "cmp-1",
						date: "2026-04-01",
						impressions: 5,
						clicks: 1,
						conversions: 0,
						cost: 50,
						conversionsValue: 100,
					},
					id: "d1",
					campaignId: "cmp-1",
					date: "2026-04-01",
					impressions: 5,
					clicks: 1,
					conversions: 0,
					cost: 50,
					conversionsValue: 100,
				},
			]),
		).toEqual([
			{
				date: "2026-04-01",
				impressions: 5,
				clicks: 1,
				conversions: 0,
				cost: 50,
			},
			{
				date: "2026-04-02",
				impressions: 10,
				clicks: 1,
				conversions: 0,
				cost: 100,
			},
		]);
	});
});
```

- [ ] **Step 2: Run the test and confirm the current logic still relies on native UTC reconstruction**

Run: `npm run test:run -- src/entities/daily-stat/lib/__tests__/build-daily-trend-series.test.ts`

Expected: fail until `buildDailyTrendSeries` uses the shared KST helper.

- [ ] **Step 3: Replace the remaining direct `Date` usage**

Update `buildDailyTrendSeries` to:
- validate incoming `date` values via the shared KST helper
- build the sort timestamp through the same KST-aware path as the rest of the app

Also sweep the repo for remaining production `Date.parse(...)` and `new Date(...)` usage outside the KST helper and the intentional "now" source in `createInitialGlobalFilterState`.
Keep the `now = new Date()` default in `src/entities/global-filter/model/defaults.ts` if it remains the only legitimate runtime clock entry point.

- [ ] **Step 4: Run the full regression set**

Run:
- `npm run test:run -- src/shared/lib/date/__tests__/kst.test.ts src/entities/global-filter/lib/__tests__/date-range.test.ts src/entities/global-filter/model/__tests__/defaults.test.ts src/entities/campaign/lib/__tests__/create-campaign-schema.test.ts src/entities/dashboard/api/__tests__/parse-dashboard-data.test.ts src/entities/dashboard/api/__tests__/fetch-dashboard-data.test.ts src/entities/campaign/lib/__tests__/build-campaign-table-rows.test.ts src/entities/daily-stat/lib/__tests__/build-daily-trend-series.test.ts`
- `npm run lint`
- `npm run build`

Expected: all pass with no remaining business-date reliance on ambient runtime timezone behavior.

- [ ] **Step 5: Commit**

```bash
git add src/entities/daily-stat src/entities/global-filter src/entities/campaign src/shared/lib/date src/app/mock
git commit -m "feat: standardize dashboard dates on kst"
```

### Task 5: Update the architecture note and verify the sweep

**Files:**
- Modify: `docs/tech-decisions.md`

- [ ] **Step 1: Add the policy note**

Record that the dashboard treats `db.json` date values as KST business dates, and that `date-fns` plus `@date-fns/tz` is the approved date stack for this repo.

- [ ] **Step 2: Verify the repository no longer uses ad-hoc production date parsing**

Run:

```bash
rg -n "Date\\.parse\\(|new Date\\(" src/entities src/widgets src/app src/shared | rg -v "__tests__|/test|/tests|src/shared/lib/date/kst.ts|src/entities/global-filter/model/defaults.ts"
```

Expected:
- no production `Date.parse(...)` calls remain outside the shared helper
- `new Date(...)` appears only inside tests/helper code or in the intentional runtime "now" source that the grep excludes

- [ ] **Step 3: Run the final checks**

Run:
- `npm run test:run`
- `npm run lint`

Expected: clean pass.

- [ ] **Step 4: Commit**

```bash
git add docs/tech-decisions.md
git commit -m "docs: record kst date policy"
```
