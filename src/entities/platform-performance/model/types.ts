import type { CampaignPlatform } from "@/entities/global-filter/model/types";

export const unknownPlatformLabel = "알 수 없음" as const;
export type PlatformPerformanceLabel =
	| CampaignPlatform
	| typeof unknownPlatformLabel;

export type PlatformMetricKey =
	| "cost"
	| "impressions"
	| "clicks"
	| "conversions";

export interface AggregatePlatformPerformanceInput {
	campaigns: {
		id: string;
		platform: CampaignPlatform | null;
		rawPlatform?: string | null;
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
	platform: PlatformPerformanceLabel;
	value: number;
	sharePercent: number;
	isSelected: boolean;
}
