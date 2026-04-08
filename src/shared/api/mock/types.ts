export interface RawCampaign {
	id: unknown;
	name: unknown;
	platform: unknown;
	status: unknown;
	budget: unknown;
	startDate: unknown;
	endDate: unknown;
}

export interface RawDailyStat {
	id: unknown;
	campaignId: unknown;
	date: unknown;
	impressions: unknown;
	clicks: unknown;
	conversions: unknown;
	cost: unknown;
	conversionsValue: unknown;
}

export interface MockDb {
	campaigns: RawCampaign[];
	daily_stats: RawDailyStat[];
	$schema?: string;
}
