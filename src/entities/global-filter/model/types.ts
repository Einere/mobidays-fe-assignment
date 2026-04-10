import type { CampaignPlatform } from "@/entities/global-filter/model/platforms";

export type CampaignStatus = "active" | "paused" | "ended";

export interface GlobalDateRange {
	startDate: string;
	endDate: string;
}

export interface GlobalFilterState {
	dateRange: GlobalDateRange;
	statuses: CampaignStatus[];
	platforms: CampaignPlatform[];
}
