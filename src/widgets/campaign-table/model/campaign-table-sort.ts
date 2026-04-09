export type CampaignTableSortKey = "period" | "cost" | "ctr" | "cpc" | "roas";
export type CampaignTableSortDirection = "asc" | "desc";

export interface CampaignTableSortState {
	key: CampaignTableSortKey;
	direction: CampaignTableSortDirection;
}
