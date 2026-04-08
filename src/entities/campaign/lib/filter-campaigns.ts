import type { Campaign } from "@/entities/campaign/model/types";
import type { GlobalFilterState } from "@/entities/global-filter/model/types";

export function filterCampaigns(
	campaigns: Campaign[],
	filter: GlobalFilterState,
): Campaign[] {
	return campaigns.filter((campaign) => {
		const matchesDateRange =
			campaign.startDate <= filter.dateRange.endDate &&
			(campaign.endDate === null ||
				campaign.endDate >= filter.dateRange.startDate);
		const matchesStatus = filter.statuses.includes(campaign.status);
		const matchesPlatform = filter.platforms.includes(campaign.platform);

		return matchesDateRange && matchesStatus && matchesPlatform;
	});
}
