import type { CampaignPlatform } from "@/entities/global-filter/model/types";

export type PlatformMetricKey =
	| "cost"
	| "impressions"
	| "clicks"
	| "conversions";

export interface AggregatePlatformPerformanceInput {
	campaigns: {
		id: string;
		platform: CampaignPlatform | null;
	}[];
	dailyStats: {
		campaignId: string;
		impressions: number | null;
		clicks: number | null;
		cost: number | null;
		conversions: number | null;
	}[];
	metricKey: PlatformMetricKey;
	selectedPlatforms: CampaignPlatform[];
}

export interface PlatformPerformanceSlice {
	platform: CampaignPlatform;
	value: number;
	sharePercent: number;
	isSelected: boolean;
}
