import {
	type DashboardDailyStat,
	parseDailyStatResponse,
} from "@/shared/api/contracts/dashboard-data";

async function fetchJson<T>(url: URL): Promise<T> {
	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(`Request failed: ${response.status}`);
	}

	return (await response.json()) as T;
}

export interface FetchDailyStatsParams {
	startDate: string;
	endDate: string;
	campaignIds: string[];
}

export async function fetchDailyStats({
	campaignIds,
	endDate,
	startDate,
}: FetchDailyStatsParams): Promise<DashboardDailyStat[]> {
	const dailyStatsUrl = new URL("/daily_stats", window.location.origin);
	dailyStatsUrl.searchParams.set("startDate", startDate);
	dailyStatsUrl.searchParams.set("endDate", endDate);
	dailyStatsUrl.searchParams.set("campaignIds", campaignIds.join(","));

	const dailyStatsResponse = await fetchJson<unknown>(dailyStatsUrl);

	return parseDailyStatResponse(dailyStatsResponse);
}
