import type {
	CampaignPlatform,
	CampaignStatus,
} from "@/entities/global-filter/model/types";

export interface Campaign {
	id: string;
	name: string;
	platform: CampaignPlatform;
	status: CampaignStatus;
	budget: number;
	startDate: string;
	endDate: string | null;
}
