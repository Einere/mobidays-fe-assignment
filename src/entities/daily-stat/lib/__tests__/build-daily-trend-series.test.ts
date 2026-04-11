import { describe, expect, it } from "vitest";
import { buildDailyTrendSeries } from "@/entities/daily-stat/lib/build-daily-trend-series";
import type { DashboardDailyStat } from "@/shared/api/contracts/dashboard-data";

function createDailyStat(
	id: string,
	date: string,
	overrides: Partial<DashboardDailyStat> = {},
): DashboardDailyStat {
	return {
		raw: {
			id,
			campaignId: "cmp-1",
			date,
			impressions: 0,
			clicks: 0,
			conversions: 0,
			cost: 0,
			conversionsValue: 0,
		},
		id,
		campaignId: "cmp-1",
		date,
		impressions: 0,
		clicks: 0,
		conversions: 0,
		cost: 0,
		conversionsValue: 0,
		...overrides,
	};
}

describe("buildDailyTrendSeries", () => {
	it("groups KST dates and orders them chronologically", () => {
		expect(
			buildDailyTrendSeries([
				createDailyStat("d2", "2026-04-02", {
					impressions: 10,
					clicks: 1,
					conversions: 0,
					cost: 100,
					conversionsValue: 300,
				}),
				createDailyStat("d1", "2026-04-01", {
					impressions: 5,
					clicks: 1,
					conversions: 0,
					cost: 50,
					conversionsValue: 100,
				}),
				createDailyStat("d3", "2026/04/03", {
					impressions: 999,
				}),
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
