import {
	type CampaignPlatform,
	campaignPlatformValues,
} from "@/entities/global-filter/model/platforms";
import type { PlatformPerformanceSlice } from "@/entities/platform-performance/model/types";
import { unknownPlatformLabel } from "@/entities/platform-performance/model/types";

export const percentageFormatter = new Intl.NumberFormat("ko-KR", {
	maximumFractionDigits: 1,
	minimumFractionDigits: 0,
});

export const platformPerformanceDonutFallbackColors = [
	"var(--chart-series-4)",
	"var(--chart-series-5)",
	"var(--chart-series-1)",
	"var(--chart-series-2)",
	"var(--chart-series-3)",
] as const;

export const platformPerformanceDonutColorMap: Record<string, string> = {
	Google: "var(--chart-danger)",
	Meta: "var(--chart-positive)",
	Naver: "var(--chart-warning)",
	[unknownPlatformLabel]: "var(--chart-series-4)",
};

export function getPlatformPerformanceDonutColor(
	platform: string,
	index: number,
) {
	return (
		platformPerformanceDonutColorMap[platform] ??
		platformPerformanceDonutFallbackColors[
			index % platformPerformanceDonutFallbackColors.length
		]
	);
}

export function isKnownCampaignPlatformForDonut(
	platform: string,
): platform is CampaignPlatform {
	return campaignPlatformValues.includes(platform as CampaignPlatform);
}

type PieClickPayload = {
	platform?: string;
	payload?: {
		platform?: string;
	};
};

export function extractPlatformFromPiePayload(payload: unknown) {
	if (typeof payload !== "object" || payload === null) {
		return null;
	}

	const maybePayload = payload as PieClickPayload;
	const platform = maybePayload.platform ?? maybePayload.payload?.platform;

	return platform &&
		campaignPlatformValues.includes(platform as CampaignPlatform)
		? (platform as CampaignPlatform)
		: null;
}

export function buildPlatformPerformanceChartConfig(
	data: readonly PlatformPerformanceSlice[],
) {
	return Object.fromEntries(
		data.map((slice, index) => [
			slice.platform,
			{
				label: slice.platform,
				color: getPlatformPerformanceDonutColor(slice.platform, index),
			},
		]),
	);
}
