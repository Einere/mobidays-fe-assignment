export type PlatformMetricKey =
	| "cost"
	| "impressions"
	| "clicks"
	| "conversions";

export const defaultPlatformOrder: readonly string[] = [
	"Google",
	"Meta",
	"Naver",
];

export interface AggregatePlatformPerformanceInput {
	campaigns: {
		id: string;
		platform: string | null;
	}[];
	dailyStats: {
		campaignId: string;
		impressions: number | null;
		clicks: number | null;
		cost: number | null;
		conversions: number | null;
	}[];
	metricKey: PlatformMetricKey;
	selectedPlatforms: string[];
}

export interface PlatformPerformanceSlice {
	platform: string;
	value: number;
	sharePercent: number;
	isSelected: boolean;
}
