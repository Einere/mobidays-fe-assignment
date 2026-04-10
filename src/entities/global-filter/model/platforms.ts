export const campaignPlatformValues = ["Google", "Meta", "Naver"] as const;

export type CampaignPlatform = (typeof campaignPlatformValues)[number];

export interface CampaignPlatformOption {
	value: CampaignPlatform;
	label: string;
}

export function getCampaignPlatformOptions(): CampaignPlatformOption[] {
	return campaignPlatformValues.map((platform) => ({
		value: platform,
		label: platform,
	}));
}
