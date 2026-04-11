import { fetchCampaigns } from "@/entities/campaign";
import { fetchDailyStats } from "@/entities/daily-stat/api/fetch-daily-stats";
import type { GlobalFilterState } from "@/entities/global-filter/model/types";
import type {
	DashboardCampaign,
	DashboardDailyStat,
} from "@/shared/api/contracts/dashboard-data";

export interface DashboardData {
	campaigns: DashboardCampaign[];
	dailyStats: DashboardDailyStat[];
}

export async function fetchDashboardData(
	filter: GlobalFilterState,
	signal?: AbortSignal,
): Promise<DashboardData> {
	const campaigns = await fetchCampaigns(filter, signal);
	const dailyStats = await fetchDailyStats(
		{
			startDate: filter.dateRange.startDate,
			endDate: filter.dateRange.endDate,
			campaignIds: campaigns.map((campaign) => campaign.id),
		},
		signal,
	);

	return { campaigns, dailyStats };
}
