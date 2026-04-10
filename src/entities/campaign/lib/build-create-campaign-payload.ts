import {
	type CreateCampaignFormValues,
	type CreateCampaignInput,
	createCampaignSchema,
} from "@/entities/campaign/lib/create-campaign-schema";

export function buildCreateCampaignPayload(
	values: CreateCampaignFormValues,
): CreateCampaignInput {
	const parsedValues = createCampaignSchema.parse(values);

	return {
		name: parsedValues.name,
		platform: parsedValues.platform,
		budget: Number(parsedValues.budget),
		spend: Number(parsedValues.spend),
		startDate: parsedValues.startDate,
		endDate: parsedValues.endDate,
	};
}
