import {
	type CampaignPlatform,
	campaignPlatformValues,
} from "@/entities/global-filter/model/platforms";
import type {
	AggregatePlatformPerformanceInput,
	PlatformMetricKey,
	PlatformPerformanceLabel,
	PlatformPerformanceSlice,
} from "@/entities/platform-performance/model/types";
import { unknownPlatformLabel } from "@/entities/platform-performance/model/types";

/*TODO: 이런 범용 유틸은 shared/lib 으로 이동 */
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

function normalizePlatformLabel(campaign: {
	platform: CampaignPlatform | null;
	rawPlatform?: string | null;
}): PlatformPerformanceLabel | null {
	if (campaign.platform !== null) {
		return campaign.platform;
	}

	if (typeof campaign.rawPlatform === "string") {
		return campaignPlatformValues.includes(
			campaign.rawPlatform as CampaignPlatform,
		)
			? (campaign.rawPlatform as CampaignPlatform)
			: unknownPlatformLabel;
	}

	return null;
}

export function aggregatePlatformPerformance({
	campaigns,
	dailyStats,
	metricKey,
	selectedPlatforms,
}: AggregatePlatformPerformanceInput): PlatformPerformanceSlice[] {
	const campaignPlatformById = new Map<string, PlatformPerformanceLabel>();
	let hasUnknownPlatform = false;
	for (const campaign of campaigns) {
		const platform = normalizePlatformLabel(campaign);

		if (platform === null) {
			continue;
		}

		if (platform === unknownPlatformLabel) {
			hasUnknownPlatform = true;
		}

		campaignPlatformById.set(campaign.id, platform);
	}

	const platformValues = new Map<PlatformPerformanceLabel, number>(
		campaignPlatformValues.map(
			(platform) => [platform, 0] as [PlatformPerformanceLabel, number],
		),
	);

	if (hasUnknownPlatform) {
		platformValues.set(unknownPlatformLabel, 0);
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
		const isSelected =
			platform === unknownPlatformLabel
				? false
				: selectedPlatforms.includes(platform);

		return {
			platform,
			value,
			sharePercent,
			isSelected,
		};
	});
}
