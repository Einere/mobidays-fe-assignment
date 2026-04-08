export interface DailyStat {
	id: string;
	campaignId: string;
	date: string;
	impressions: number;
	clicks: number;
	conversions: number;
	cost: number;
	conversionsValue: number | null;
}
