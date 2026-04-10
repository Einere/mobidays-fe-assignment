import {
	type AggregatePlatformPerformanceInput,
	defaultPlatformOrder,
	type PlatformMetricKey,
	type PlatformPerformanceSlice,
} from "@/entities/platform-performance/model/types";

const UNKNOWN_PLATFORM = "Unknown";

function normalizePlatform(platform: string | null): string {
	if (typeof platform !== "string" || platform.trim().length === 0) {
		return UNKNOWN_PLATFORM;
	}

	return platform;
}

function toSafeNumber(value: number | null): number {
	return typeof value === "number" && Number.isFinite(value) && value >= 0
		? value
		: 0;
}

function getMetricValue(
	stat: AggregatePlatformPerformanceInput["dailyStats"][number],
	metricKey: PlatformMetricKey,
): number {
	switch (metricKey) {
		case "impressions":
			return toSafeNumber(stat.impressions);
		case "clicks":
			return toSafeNumber(stat.clicks);
		case "conversions":
			return toSafeNumber(stat.conversions);
		default:
			return toSafeNumber(stat.cost);
	}
}

export function aggregatePlatformPerformance({
	campaigns,
	dailyStats,
	metricKey,
	selectedPlatforms,
}: AggregatePlatformPerformanceInput): PlatformPerformanceSlice[] {
	const campaignPlatformById = new Map<string, string>();
	for (const campaign of campaigns) {
		campaignPlatformById.set(campaign.id, normalizePlatform(campaign.platform));
	}

	const platformValues = new Map<string, number>();
	for (const defaultPlatform of defaultPlatformOrder) {
		platformValues.set(defaultPlatform, 0);
	}

	for (const platform of campaignPlatformById.values()) {
		platformValues.set(platform, platformValues.get(platform) ?? 0);
	}

	for (const selectedPlatform of selectedPlatforms) {
		platformValues.set(selectedPlatform, 0);
	}

	for (const dailyStat of dailyStats) {
		const platform = campaignPlatformById.get(dailyStat.campaignId);
		if (platform === undefined) {
			continue;
		}

		const value = getMetricValue(dailyStat, metricKey);
		const previousValue = platformValues.get(platform) ?? 0;
		platformValues.set(platform, previousValue + value);
	}

	const totalValue = Array.from(platformValues.values()).reduce(
		(sum, value) => sum + value,
		0,
	);

	return Array.from(platformValues.entries()).map(([platform, value]) => {
		const sharePercent =
			totalValue === 0 ? 0 : Number(((value / totalValue) * 100).toFixed(2));

		return {
			platform,
			value,
			sharePercent,
			isSelected: selectedPlatforms.includes(platform),
		};
	});
}
