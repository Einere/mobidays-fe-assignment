export type CampaignStatus = "active" | "paused" | "ended";

export type CampaignPlatform = "Google" | "Meta" | "Naver";

export interface GlobalDateRange {
	startDate: string;
	endDate: string;
}

export interface GlobalFilterState {
	dateRange: GlobalDateRange;
	statuses: CampaignStatus[];
	platforms: CampaignPlatform[];
}
