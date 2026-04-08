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
	{
		id: "d3",
		campaignId: "2",
		date: "2026-05-01",
		impressions: 30,
		clicks: 3,
		conversions: 2,
		cost: 300,
		conversionsValue: 700,
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

	it("returns an empty array when no campaign ids match", () => {
		expect(
			filterDailyStats(dailyStats, ["999"], {
				startDate: "2026-04-01",
				endDate: "2026-04-30",
			}),
		).toEqual([]);
	});
});
