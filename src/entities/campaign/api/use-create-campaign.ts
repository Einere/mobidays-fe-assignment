import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createCampaign } from "@/entities/campaign/api/create-campaign";
import type { CreateCampaignInput } from "@/entities/campaign/lib/create-campaign-schema";

export const CREATE_CAMPAIGN_ERROR_MESSAGE =
	"캠페인을 등록하지 못했습니다. 잠시 후 다시 시도해주세요.";

/*TODO: 적절한 위치의 hooks 로 이동해야 함. entities/campaign/hooks 정도..? */
export function useCreateCampaign() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: CreateCampaignInput) => createCampaign(input),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: ["dashboard-data"],
			});
			toast.success("캠페인이 등록되었습니다.");
		},
		onError: () => {
			toast.error(CREATE_CAMPAIGN_ERROR_MESSAGE);
		},
	});
}
