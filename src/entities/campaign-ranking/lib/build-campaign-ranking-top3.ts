import type {
	BuildCampaignRankingTop3Input,
	CampaignRankingMetricKey,
	CampaignRankingTop3Item,
} from "@/entities/campaign-ranking/model/types";

interface MetricAccumulator {
	sum: number;
	hasValue: boolean;
}

interface CampaignMetrics {
	impressions: MetricAccumulator;
	clicks: MetricAccumulator;
	cost: MetricAccumulator;
	conversionsValue: MetricAccumulator;
}

interface RankableCampaign extends CampaignRankingTop3Item {
	inputIndex: number;
}

function createAccumulator(): MetricAccumulator {
	return {
		sum: 0,
		hasValue: false,
	};
}

function createCampaignMetrics(): CampaignMetrics {
	return {
		impressions: createAccumulator(),
		clicks: createAccumulator(),
		cost: createAccumulator(),
		conversionsValue: createAccumulator(),
	};
}

function addMetricValue(accumulator: MetricAccumulator, value: number | null) {
	if (typeof value !== "number" || !Number.isFinite(value)) {
		return;
	}

	accumulator.sum += value;
	accumulator.hasValue = true;
}

function getMetricValue(accumulator: MetricAccumulator): number | null {
	return accumulator.hasValue ? accumulator.sum : null;
}

function calculateRate(
	numerator: number | null,
	denominator: number | null,
): number | null {
	if (numerator === null || denominator === null || denominator === 0) {
		return null;
	}

	return (numerator / denominator) * 100;
}

function calculateCostPerClick(
	cost: number | null,
	clicks: number | null,
): number | null {
	if (cost === null || clicks === null || clicks === 0) {
		return null;
	}

	return cost / clicks;
}

function getSortDirection(metricKey: CampaignRankingMetricKey) {
	return metricKey === "cpc" ? 1 : -1;
}

export function buildCampaignRankingTop3({
	campaigns,
	dailyStats,
	metricKey,
}: BuildCampaignRankingTop3Input): CampaignRankingTop3Item[] {
	const campaignIds = new Set(campaigns.map((campaign) => campaign.id));
	const metricsByCampaignId = new Map<string, CampaignMetrics>();

	for (const dailyStat of dailyStats) {
		if (!campaignIds.has(dailyStat.campaignId)) {
			continue;
		}

		const metrics =
			metricsByCampaignId.get(dailyStat.campaignId) ?? createCampaignMetrics();

		addMetricValue(metrics.impressions, dailyStat.impressions);
		addMetricValue(metrics.clicks, dailyStat.clicks);
		addMetricValue(metrics.cost, dailyStat.cost);
		addMetricValue(metrics.conversionsValue, dailyStat.conversionsValue);

		if (!metricsByCampaignId.has(dailyStat.campaignId)) {
			metricsByCampaignId.set(dailyStat.campaignId, metrics);
		}
	}

	const rankableCampaigns: RankableCampaign[] = [];
	const sortDirection = getSortDirection(metricKey);

	for (const [index, campaign] of campaigns.entries()) {
		const metrics =
			metricsByCampaignId.get(campaign.id) ?? createCampaignMetrics();
		const impressions = getMetricValue(metrics.impressions);
		const clicks = getMetricValue(metrics.clicks);
		const cost = getMetricValue(metrics.cost);
		const conversionsValue = getMetricValue(metrics.conversionsValue);
		const ctr = calculateRate(clicks, impressions);
		const cpc = calculateCostPerClick(cost, clicks);
		const roas = calculateRate(conversionsValue, cost);

		const row: RankableCampaign = {
			id: campaign.id,
			name: campaign.name,
			roas,
			ctr,
			cpc,
			inputIndex: index,
		};
		const rankValue = row[metricKey];

		if (rankValue === null) {
			continue;
		}

		rankableCampaigns.push(row);
	}

	return rankableCampaigns
		.sort((a, b) => {
			const aMetricValue = a[metricKey] as number;
			const bMetricValue = b[metricKey] as number;
			const metricDiff = (aMetricValue - bMetricValue) * sortDirection;

			if (metricDiff !== 0) {
				return metricDiff;
			}

			return a.inputIndex - b.inputIndex;
		})
		.slice(0, 3)
		.map(({ inputIndex: _inputIndex, ...campaign }) => campaign);
}
