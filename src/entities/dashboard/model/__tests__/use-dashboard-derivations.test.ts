import { describe, expect, it } from "vitest";
import { buildCampaignTableRows } from "@/entities/campaign/lib/build-campaign-table-rows";
import { buildCampaignRankingTop3Candidates } from "@/entities/campaign-ranking/lib/build-campaign-ranking-top3";
import { buildDailyTrendSeries } from "@/entities/daily-stat/lib/build-daily-trend-series";
import type { DashboardData } from "@/entities/dashboard/api/fetch-dashboard-data";
import { buildDashboardDerivations } from "@/entities/dashboard/model/use-dashboard-derivations";
import type { GlobalFilterState } from "@/entities/global-filter/model/types";
import { aggregatePlatformPerformance } from "@/entities/platform-performance/lib/aggregate-platform-performance";

const sampleData: DashboardData = {
	campaigns: [
		{
			id: "campaign-1",
			name: "Campaign A",
			platform: "Google",
			status: "active",
			budget: 1000,
			startDate: "2026-04-01",
			endDate: "2026-04-30",
			rawPlatform: "Google",
		},
	],
	dailyStats: [
		{
			id: "daily-1",
			campaignId: "campaign-1",
			date: "2026-04-01",
			impressions: 100,
			clicks: 10,
			conversions: 2,
			cost: 1000,
			conversionsValue: 2000,
		},
	],
};

const sampleFilter: GlobalFilterState = {
	dateRange: {
		startDate: "2026-04-01",
		endDate: "2026-04-30",
	},
	statuses: ["active", "paused", "ended"],
	platforms: ["Google", "Meta", "Naver"],
};

describe("buildDashboardDerivations", () => {
	it("matches existing pure calculator results", () => {
		expect(buildDashboardDerivations(sampleData, sampleFilter)).toEqual({
			tableRows: buildCampaignTableRows(sampleData),
			dailyTrendSeries: buildDailyTrendSeries(sampleData.dailyStats),
			campaignRankingCandidates: buildCampaignRankingTop3Candidates(sampleData),
			platformPerformanceSlicesByMetricKey: {
				cost: aggregatePlatformPerformance({
					campaigns: sampleData.campaigns,
					dailyStats: sampleData.dailyStats,
					metricKey: "cost",
					selectedPlatforms: sampleFilter.platforms,
				}),
				impressions: aggregatePlatformPerformance({
					campaigns: sampleData.campaigns,
					dailyStats: sampleData.dailyStats,
					metricKey: "impressions",
					selectedPlatforms: sampleFilter.platforms,
				}),
				clicks: aggregatePlatformPerformance({
					campaigns: sampleData.campaigns,
					dailyStats: sampleData.dailyStats,
					metricKey: "clicks",
					selectedPlatforms: sampleFilter.platforms,
				}),
				conversions: aggregatePlatformPerformance({
					campaigns: sampleData.campaigns,
					dailyStats: sampleData.dailyStats,
					metricKey: "conversions",
					selectedPlatforms: sampleFilter.platforms,
				}),
			},
		});
	});

	it("returns null for missing dashboard data", () => {
		expect(buildDashboardDerivations(null, sampleFilter)).toBeNull();
	});
});
