import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	type UpdateCampaignStatusesParams,
	updateCampaignStatuses,
} from "@/entities/campaign/api/update-campaign-statuses";

export function useUpdateCampaignStatuses() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (params: UpdateCampaignStatusesParams) =>
			updateCampaignStatuses(params),
		onSuccess: () =>
			queryClient.invalidateQueries({
				queryKey: ["dashboard-data"],
			}),
	});
}
