import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	type UpdateCampaignStatusesParams,
	updateCampaignStatuses,
} from "@/entities/campaign/api/update-campaign-statuses";

/*TODO: 적절한 위치의 hooks 로 이동해야 함. entities/campaign/hooks 정도..? */
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
