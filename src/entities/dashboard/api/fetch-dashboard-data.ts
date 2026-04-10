import { fetchCampaigns } from "@/entities/campaign/api/fetch-campaigns";
import { fetchDailyStats } from "@/entities/daily-stat/api/fetch-daily-stats";
import type {
	DashboardCampaign,
	DashboardDailyStat,
} from "@/entities/dashboard/lib/parse-dashboard-data";
import type { GlobalFilterState } from "@/entities/global-filter/model/types";

export interface DashboardData {
	campaigns: DashboardCampaign[];
	dailyStats: DashboardDailyStat[];
}

export async function fetchDashboardData(
	filter: GlobalFilterState,
): Promise<DashboardData> {
	const campaigns = await fetchCampaigns(filter);
	const dailyStats = await fetchDailyStats({
		startDate: filter.dateRange.startDate,
		endDate: filter.dateRange.endDate,
		campaignIds: campaigns.map((campaign) => campaign.id),
	});

	return { campaigns, dailyStats };
}
