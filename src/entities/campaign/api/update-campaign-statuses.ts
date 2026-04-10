import type { CampaignStatus } from "@/entities/global-filter/model/types";

export interface UpdateCampaignStatusesParams {
	ids: string[];
	status: CampaignStatus;
}

/*TODO: shared/api 로 이동해야 하는게 맞는거 아닌가? */
export async function updateCampaignStatuses({
	ids,
	status,
}: UpdateCampaignStatusesParams): Promise<void> {
	const response = await fetch(
		new URL("/campaigns/status", window.location.origin),
		{
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				ids,
				status,
			}),
		},
	);

	if (!response.ok) {
		throw new Error(`Request failed: ${response.status}`);
	}
}
