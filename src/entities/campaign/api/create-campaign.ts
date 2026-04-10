import type { CreateCampaignInput } from "@/entities/campaign/lib/create-campaign-schema";
import type { Campaign } from "@/entities/campaign/model/types";

/*TODO: shared/api 로 이동해야 하는게 맞는거 아닌가? */
export async function createCampaign(
	input: CreateCampaignInput,
): Promise<Campaign> {
	const response = await fetch(new URL("/campaigns", window.location.origin), {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(input),
	});

	if (!response.ok) {
		throw new Error(`Request failed: ${response.status}`);
	}

	return (await response.json()) as Campaign;
}
