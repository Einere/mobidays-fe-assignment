import type { CampaignMetricKind } from "@/entities/campaign/lib/format-campaign-table";
import { formatCampaignMetric } from "@/entities/campaign/lib/format-campaign-table";
import type { CampaignRankingMetricKey } from "@/entities/campaign-ranking/model/types";

export type CampaignRankingMetricDefinition = {
	key: CampaignRankingMetricKey;
	label: string;
	metricKind: CampaignMetricKind;
	chartColor: string;
	formatValue: (value: number | null) => string;
};

const metricDefinitionRegistry = {
	roas: {
		key: "roas",
		label: "ROAS",
		metricKind: "percent",
		chartColor: "var(--chart-positive)",
		formatValue: (value) => formatCampaignMetric(value, "percent"),
	},
	ctr: {
		key: "ctr",
		label: "CTR",
		metricKind: "percent",
		chartColor: "var(--chart-info)",
		formatValue: (value) => formatCampaignMetric(value, "percent"),
	},
	cpc: {
		key: "cpc",
		label: "CPC",
		metricKind: "currency",
		chartColor: "var(--chart-warning)",
		formatValue: (value) => formatCampaignMetric(value, "currency"),
	},
} satisfies Record<CampaignRankingMetricKey, CampaignRankingMetricDefinition>;

export const campaignRankingMetricDefinitions = Object.values(
	metricDefinitionRegistry,
) as readonly CampaignRankingMetricDefinition[];

export const defaultCampaignRankingMetricKey: CampaignRankingMetricKey = "roas";

export function getCampaignRankingMetricDefinition(
	metricKey: CampaignRankingMetricKey,
) {
	return metricDefinitionRegistry[metricKey];
}

export function formatCampaignRankingMetricValue(
	metricKey: CampaignRankingMetricKey,
	value: number | null,
) {
	return getCampaignRankingMetricDefinition(metricKey).formatValue(value);
}
