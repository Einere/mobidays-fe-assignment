export type CampaignRankingMetricKey = "roas" | "ctr" | "cpc";

export interface CampaignRankingCampaign {
	id: string;
	name: string | null;
}

export interface CampaignRankingDailyStat {
	campaignId: string;
	impressions: number | null;
	clicks: number | null;
	cost: number | null;
	conversionsValue: number | null;
}

export interface BuildCampaignRankingTop3Input {
	campaigns: CampaignRankingCampaign[];
	dailyStats: CampaignRankingDailyStat[];
	metricKey: CampaignRankingMetricKey;
}

export interface CampaignRankingTop3Item {
	id: string;
	name: string | null;
	roas: number | null;
	ctr: number | null;
	cpc: number | null;
}
