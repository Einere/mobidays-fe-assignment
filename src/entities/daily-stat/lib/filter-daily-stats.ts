import type { DailyStat } from "@/entities/daily-stat/model/types";
import type { GlobalDateRange } from "@/entities/global-filter/model/types";

export function filterDailyStats(
	dailyStats: DailyStat[],
	campaignIds: string[],
	dateRange: GlobalDateRange,
): DailyStat[] {
	const campaignIdSet = new Set(campaignIds);

	return dailyStats.filter((dailyStat) => {
		return (
			campaignIdSet.has(dailyStat.campaignId) &&
			dailyStat.date >= dateRange.startDate &&
			dailyStat.date <= dateRange.endDate
		);
	});
}
