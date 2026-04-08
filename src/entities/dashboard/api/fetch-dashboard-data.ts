import {
	type DashboardCampaign,
	type DashboardDailyStat,
	parseCampaignResponse,
	parseDailyStatResponse,
} from "@/entities/dashboard/api/parse-dashboard-data";
import { serializeFilterList } from "@/entities/global-filter/lib/date-range";
import type { GlobalFilterState } from "@/entities/global-filter/model/types";

export interface DashboardData {
	campaigns: DashboardCampaign[];
	dailyStats: DashboardDailyStat[];
}

async function fetchJson<T>(url: URL): Promise<T> {
	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(`Request failed: ${response.status}`);
	}

	return (await response.json()) as T;
}

export async function fetchDashboardData(
	filter: GlobalFilterState,
): Promise<DashboardData> {
	const campaignsUrl = new URL("/campaigns", window.location.origin);
	campaignsUrl.searchParams.set("startDate", filter.dateRange.startDate);
	campaignsUrl.searchParams.set("endDate", filter.dateRange.endDate);
	campaignsUrl.searchParams.set(
		"statuses",
		serializeFilterList(filter.statuses),
	);
	campaignsUrl.searchParams.set(
		"platforms",
		serializeFilterList(filter.platforms),
	);

	const campaignsResponse = await fetchJson<unknown>(campaignsUrl);
	const campaigns = parseCampaignResponse(campaignsResponse);

	const dailyStatsUrl = new URL("/daily_stats", window.location.origin);
	dailyStatsUrl.searchParams.set("startDate", filter.dateRange.startDate);
	dailyStatsUrl.searchParams.set("endDate", filter.dateRange.endDate);
	dailyStatsUrl.searchParams.set(
		"campaignIds",
		campaigns.map((campaign) => campaign.id).join(","),
	);

	const dailyStatsResponse = await fetchJson<unknown>(dailyStatsUrl);
	const dailyStats = parseDailyStatResponse(dailyStatsResponse);

	return { campaigns, dailyStats };
}
