import { useMemo } from "react";
import {
	buildCampaignTableRows,
	type CampaignTableRow,
} from "@/entities/campaign/lib/build-campaign-table-rows";
import {
	buildCampaignRankingTop3Candidates,
	type CampaignRankingTop3Candidate,
} from "@/entities/campaign-ranking/lib/build-campaign-ranking-top3";
import type { DailyTrendPoint } from "@/entities/daily-stat/lib/build-daily-trend-series";
import { buildDailyTrendSeries } from "@/entities/daily-stat/lib/build-daily-trend-series";
import type { DashboardData } from "@/entities/dashboard/api/fetch-dashboard-data";
import type { GlobalFilterState } from "@/entities/global-filter/model/types";
import { aggregatePlatformPerformance } from "@/entities/platform-performance/lib/aggregate-platform-performance";
import type {
	PlatformMetricKey,
	PlatformPerformanceSlice,
} from "@/entities/platform-performance/model/types";

export type DashboardDerivations = {
	tableRows: CampaignTableRow[];
	dailyTrendSeries: DailyTrendPoint[];
	campaignRankingCandidates: CampaignRankingTop3Candidate[];
	platformPerformanceSlicesByMetricKey: Record<
		PlatformMetricKey,
		PlatformPerformanceSlice[]
	>;
};

const platformMetricKeys: PlatformMetricKey[] = [
	"cost",
	"impressions",
	"clicks",
	"conversions",
];

function buildPlatformPerformanceSlicesByMetricKey(
	data: DashboardData,
	filter: GlobalFilterState,
) {
	return {
		cost: aggregatePlatformPerformance({
			campaigns: data.campaigns,
			dailyStats: data.dailyStats,
			metricKey: "cost",
			selectedPlatforms: filter.platforms,
		}),
		impressions: aggregatePlatformPerformance({
			campaigns: data.campaigns,
			dailyStats: data.dailyStats,
			metricKey: "impressions",
			selectedPlatforms: filter.platforms,
		}),
		clicks: aggregatePlatformPerformance({
			campaigns: data.campaigns,
			dailyStats: data.dailyStats,
			metricKey: "clicks",
			selectedPlatforms: filter.platforms,
		}),
		conversions: aggregatePlatformPerformance({
			campaigns: data.campaigns,
			dailyStats: data.dailyStats,
			metricKey: "conversions",
			selectedPlatforms: filter.platforms,
		}),
	} satisfies Record<PlatformMetricKey, PlatformPerformanceSlice[]>;
}

function createPlatformCacheKey(platforms: GlobalFilterState["platforms"]) {
	return [...platforms].sort((a, b) => a.localeCompare(b)).join(",");
}

const derivationsCache = new WeakMap<
	DashboardData,
	Map<string, DashboardDerivations>
>();

export function buildDashboardDerivations(
	data: DashboardData | null,
	filter: GlobalFilterState,
): DashboardDerivations | null {
	if (data === null) {
		return null;
	}

	return {
		tableRows: buildCampaignTableRows({
			campaigns: data.campaigns,
			dailyStats: data.dailyStats,
		}),
		dailyTrendSeries: buildDailyTrendSeries(data.dailyStats),
		campaignRankingCandidates: buildCampaignRankingTop3Candidates({
			campaigns: data.campaigns,
			dailyStats: data.dailyStats,
		}),
		platformPerformanceSlicesByMetricKey:
			buildPlatformPerformanceSlicesByMetricKey(data, filter),
	};
}

export function useDashboardDerivations(
	data: DashboardData | null,
	filter: GlobalFilterState,
) {
	return useMemo(() => {
		if (data === null) {
			return null;
		}

		const platformCacheKey = createPlatformCacheKey(filter.platforms);
		const dataCache = derivationsCache.get(data);

		if (dataCache !== undefined) {
			const cached = dataCache.get(platformCacheKey);

			if (cached !== undefined) {
				return cached;
			}
		}

		const next = buildDashboardDerivations(data, filter);

		if (next === null) {
			return null;
		}

		if (dataCache !== undefined) {
			dataCache.set(platformCacheKey, next);
		} else {
			derivationsCache.set(data, new Map([[platformCacheKey, next]]));
		}

		return next;
	}, [data, filter]);
}

export { platformMetricKeys };
