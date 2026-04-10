export const campaignPlatformValues = ["Google", "Meta", "Naver"] as const;

export type KnownCampaignPlatform = (typeof campaignPlatformValues)[number];

export type CampaignPlatform = string;

export function isKnownCampaignPlatform(
	value: string,
): value is KnownCampaignPlatform {
	return campaignPlatformValues.includes(value as KnownCampaignPlatform);
}

export function mergeCampaignPlatformValues(
	selectedValues: CampaignPlatform[],
): CampaignPlatform[] {
	const mergedValues: CampaignPlatform[] = [...campaignPlatformValues];
	const knownPlatformSet = new Set<string>(campaignPlatformValues);

	for (const selectedValue of selectedValues) {
		if (
			selectedValue.trim().length === 0 ||
			knownPlatformSet.has(selectedValue)
		) {
			continue;
		}

		mergedValues.push(selectedValue);
		knownPlatformSet.add(selectedValue);
	}

	return mergedValues;
}
