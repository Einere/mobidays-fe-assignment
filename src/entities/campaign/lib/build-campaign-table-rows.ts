import type {
	DashboardCampaign,
	DashboardDailyStat,
} from "@/shared/api/contracts/dashboard-data";

export interface CampaignTableRow {
	id: string;
	name: string;
	status: DashboardCampaign["status"];
	platform: DashboardCampaign["platform"];
	startDate: string | null;
	endDate: string | null;
	periodSortValue: number | null;
	cost: number | null;
	ctr: number | null;
	cpc: number | null;
	roas: number | null;
}

interface MetricAccumulator {
	sum: number;
	hasValue: boolean;
}

interface CampaignTableRowMetrics {
	impressions: MetricAccumulator;
	clicks: MetricAccumulator;
	cost: MetricAccumulator;
	conversionsValue: MetricAccumulator;
}

interface BuildCampaignTableRowsParams {
	campaigns: DashboardCampaign[];
	dailyStats: DashboardDailyStat[];
}

function createAccumulator(): MetricAccumulator {
	return {
		sum: 0,
		hasValue: false,
	};
}

function createMetrics(): CampaignTableRowMetrics {
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

export function buildCampaignTableRows({
	campaigns,
	dailyStats,
}: BuildCampaignTableRowsParams): CampaignTableRow[] {
	const metricsByCampaignId = new Map<string, CampaignTableRowMetrics>();

	for (const dailyStat of dailyStats) {
		const metrics =
			metricsByCampaignId.get(dailyStat.campaignId) ?? createMetrics();

		addMetricValue(metrics.impressions, dailyStat.impressions);
		addMetricValue(metrics.clicks, dailyStat.clicks);
		addMetricValue(metrics.cost, dailyStat.cost);
		addMetricValue(metrics.conversionsValue, dailyStat.conversionsValue);

		if (!metricsByCampaignId.has(dailyStat.campaignId)) {
			metricsByCampaignId.set(dailyStat.campaignId, metrics);
		}
	}

	return campaigns.map((campaign) => {
		const metrics = metricsByCampaignId.get(campaign.id) ?? createMetrics();
		const impressions = getMetricValue(metrics.impressions);
		const clicks = getMetricValue(metrics.clicks);
		const cost = getMetricValue(metrics.cost);
		const conversionsValue = getMetricValue(metrics.conversionsValue);

		return {
			id: campaign.id,
			name: campaign.name ?? "-",
			status: campaign.status,
			platform: campaign.platform,
			startDate: campaign.startDate,
			endDate: campaign.endDate,
			periodSortValue:
				campaign.startDate === null ? null : Date.parse(campaign.startDate),
			cost,
			ctr: calculateRate(clicks, impressions),
			cpc:
				cost === null || clicks === null || clicks === 0 ? null : cost / clicks,
			roas: calculateRate(conversionsValue, cost),
		};
	});
}
