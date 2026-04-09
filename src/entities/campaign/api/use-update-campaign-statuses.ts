import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	type UpdateCampaignStatusesParams,
	updateCampaignStatuses,
} from "@/entities/campaign/api/update-campaign-statuses";
import { createDashboardDataQueryKey } from "@/entities/dashboard/api/use-dashboard-data";
import type { GlobalFilterState } from "@/entities/global-filter/model/types";

export function useUpdateCampaignStatuses(filter: GlobalFilterState) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (params: UpdateCampaignStatusesParams) =>
			updateCampaignStatuses(params),
		onSuccess: () =>
			queryClient.invalidateQueries({
				queryKey: createDashboardDataQueryKey(filter),
			}),
	});
}
