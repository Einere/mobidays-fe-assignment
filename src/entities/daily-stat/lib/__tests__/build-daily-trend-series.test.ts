import { describe, expect, it } from "vitest";
import { buildDailyTrendSeries } from "@/entities/daily-stat/lib/build-daily-trend-series";
import type { DashboardDailyStat } from "@/entities/dashboard/api/parse-dashboard-data";
import type { RawDailyStat } from "@/shared/api/mock/types";

function createRawDailyStat(
	overrides: Partial<RawDailyStat> = {},
): RawDailyStat {
	return {
		id: "raw-id",
		campaignId: "raw-campaign-id",
		date: "2026-04-01",
		impressions: 0,
		clicks: 0,
		conversions: 0,
		cost: 0,
		conversionsValue: 0,
		...overrides,
	};
}

const dailyStats: DashboardDailyStat[] = [
	{
		raw: createRawDailyStat({
			id: "stat-3",
			campaignId: "cmp-1",
			date: "2026-04-03",
			impressions: 0,
			clicks: null,
			conversions: 1,
			cost: 300,
			conversionsValue: null,
		}),
		id: "stat-3",
		campaignId: "cmp-1",
		date: "2026-04-03",
		impressions: 0,
		clicks: null,
		conversions: 1,
		cost: 300,
		conversionsValue: null,
	},
	{
		raw: createRawDailyStat({
			id: "stat-1",
			campaignId: "cmp-1",
			date: "2026-04-01",
			impressions: 10,
			clicks: null,
			conversions: null,
			cost: null,
			conversionsValue: null,
		}),
		id: "stat-1",
		campaignId: "cmp-1",
		date: "2026-04-01",
		impressions: 10,
		clicks: null,
		conversions: null,
		cost: null,
		conversionsValue: null,
	},
	{
		raw: createRawDailyStat({
			id: "stat-2",
			campaignId: "cmp-2",
			date: "2026-04-01",
			impressions: 5,
			clicks: 2,
			conversions: 0,
			cost: 100,
			conversionsValue: null,
		}),
		id: "stat-2",
		campaignId: "cmp-2",
		date: "2026-04-01",
		impressions: 5,
		clicks: 2,
		conversions: 0,
		cost: 100,
		conversionsValue: null,
	},
	{
		raw: createRawDailyStat({
			id: "stat-4",
			campaignId: "cmp-4",
			date: null,
			impressions: 999,
			clicks: 999,
			conversions: 999,
			cost: 999,
			conversionsValue: null,
		}),
		id: "stat-4",
		campaignId: "cmp-2",
		date: null,
		impressions: 999,
		clicks: 999,
		conversions: 999,
		cost: 999,
		conversionsValue: null,
	},
	{
		raw: createRawDailyStat({
			id: "stat-5",
			campaignId: "cmp-3",
			date: "not-a-date",
			impressions: 999,
			clicks: 999,
			conversions: 999,
			cost: 999,
			conversionsValue: null,
		}),
		id: "stat-5",
		campaignId: "cmp-3",
		date: "not-a-date",
		impressions: 999,
		clicks: 999,
		conversions: 999,
		cost: 999,
		conversionsValue: null,
	},
	{
		raw: createRawDailyStat({
			id: "stat-6",
			campaignId: "cmp-3",
			date: "2026-04-03",
			impressions: null,
			clicks: 4,
			conversions: null,
			cost: null,
			conversionsValue: null,
		}),
		id: "stat-6",
		campaignId: "cmp-3",
		date: "2026-04-03",
		impressions: null,
		clicks: 4,
		conversions: null,
		cost: null,
		conversionsValue: null,
	},
	{
		raw: createRawDailyStat({
			id: "stat-7",
			campaignId: "cmp-4",
			date: "2026-04-04",
			impressions: null,
			clicks: null,
			conversions: null,
			cost: null,
			conversionsValue: null,
		}),
		id: "stat-7",
		campaignId: "cmp-4",
		date: "2026-04-04",
		impressions: null,
		clicks: null,
		conversions: null,
		cost: null,
		conversionsValue: null,
	},
];

const overflowAndInvalidDateStats: DashboardDailyStat[] = [
	{
		raw: createRawDailyStat({
			id: "stat-8",
			campaignId: "cmp-5",
			date: "2026-02-30",
			impressions: 100,
			clicks: 10,
			conversions: 1,
			cost: 1000,
			conversionsValue: null,
		}),
		id: "stat-8",
		campaignId: "cmp-5",
		date: "2026-02-30",
		impressions: 100,
		clicks: 10,
		conversions: 1,
		cost: 1000,
		conversionsValue: null,
	},
	{
		raw: createRawDailyStat({
			id: "stat-9",
			campaignId: "cmp-5",
			date: "2026-02-28",
			impressions: 20,
			clicks: 2,
			conversions: 0,
			cost: 200,
			conversionsValue: null,
		}),
		id: "stat-9",
		campaignId: "cmp-5",
		date: "2026-02-28",
		impressions: 20,
		clicks: 2,
		conversions: 0,
		cost: 200,
		conversionsValue: null,
	},
	{
		raw: createRawDailyStat({
			id: "stat-10",
			campaignId: "cmp-5",
			date: "2026/02/27",
			impressions: 999,
			clicks: 999,
			conversions: 999,
			cost: 999,
			conversionsValue: null,
		}),
		id: "stat-10",
		campaignId: "cmp-5",
		date: "2026/02/27",
		impressions: 999,
		clicks: 999,
		conversions: 999,
		cost: 999,
		conversionsValue: null,
	},
];

describe("buildDailyTrendSeries", () => {
	it("groups by date and sorts ascending", () => {
		expect(buildDailyTrendSeries(dailyStats)).toEqual([
			{
				date: "2026-04-01",
				impressions: 15,
				clicks: 2,
				conversions: 0,
				cost: 100,
			},
			{
				date: "2026-04-03",
				impressions: 0,
				clicks: 4,
				conversions: 1,
				cost: 300,
			},
			{
				date: "2026-04-04",
				impressions: null,
				clicks: null,
				conversions: null,
				cost: null,
			},
		]);
	});

	it("excludes overflow and invalid dates", () => {
		expect(buildDailyTrendSeries(overflowAndInvalidDateStats)).toEqual([
			{
				date: "2026-02-28",
				impressions: 20,
				clicks: 2,
				conversions: 0,
				cost: 200,
			},
		]);
	});

	it("keeps metric values null when a date group has no numeric values", () => {
		expect(
			buildDailyTrendSeries([
				{
					raw: createRawDailyStat({
						id: "stat-11",
						campaignId: "cmp-6",
						date: "2026-04-05",
						impressions: null,
						clicks: null,
						conversions: null,
						cost: null,
						conversionsValue: null,
					}),
					id: "stat-11",
					campaignId: "cmp-6",
					date: "2026-04-05",
					impressions: null,
					clicks: null,
					conversions: null,
					cost: null,
					conversionsValue: null,
				},
			]),
		).toEqual([
			{
				date: "2026-04-05",
				impressions: null,
				clicks: null,
				conversions: null,
				cost: null,
			},
		]);
	});
});
