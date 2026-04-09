import { useEffect, useState } from "react";
import { useUpdateCampaignStatuses } from "@/entities/campaign/api/use-update-campaign-statuses";
import { formatCampaignStatusLabel } from "@/entities/campaign/lib/format-campaign-table";
import type { CampaignStatus } from "@/entities/global-filter/model/types";

interface UseCampaignStatusBulkActionParams {
	selectedRowIds: string[];
	isInteractionBlocked: boolean;
	onClearSelection: () => void;
}

export function useCampaignStatusBulkAction({
	selectedRowIds,
	isInteractionBlocked,
	onClearSelection,
}: UseCampaignStatusBulkActionParams) {
	const [pendingStatus, setPendingStatus] = useState<CampaignStatus | null>(
		null,
	);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const mutation = useUpdateCampaignStatuses();

	const canOpenDialog =
		!isInteractionBlocked &&
		selectedRowIds.length > 0 &&
		pendingStatus !== null &&
		!mutation.isPending;
	const canConfirm =
		!isInteractionBlocked &&
		selectedRowIds.length > 0 &&
		pendingStatus !== null &&
		!mutation.isPending;

	useEffect(() => {
		if (pendingStatus !== null && selectedRowIds.length === 0) {
			setPendingStatus(null);
		}
	}, [pendingStatus, selectedRowIds.length]);

	async function confirm() {
		if (pendingStatus === null || selectedRowIds.length === 0 || !canConfirm) {
			return;
		}

		setErrorMessage(null);

		try {
			await mutation.mutateAsync({
				ids: selectedRowIds,
				status: pendingStatus,
			});
			setIsDialogOpen(false);
			onClearSelection();
			setPendingStatus(null);
		} catch (error) {
			setErrorMessage(
				error instanceof Error
					? error.message
					: "알 수 없는 오류가 발생했습니다.",
			);
		}
	}

	return {
		pendingStatus,
		pendingStatusLabel: formatCampaignStatusLabel(pendingStatus),
		isDialogOpen,
		errorMessage,
		isSubmitting: mutation.isPending,
		canOpenDialog,
		canConfirm,
		setPendingStatus(nextPendingStatus: CampaignStatus | null) {
			setErrorMessage(null);
			setPendingStatus(nextPendingStatus);
		},
		openDialog() {
			if (!canOpenDialog) {
				return;
			}

			setErrorMessage(null);
			setIsDialogOpen(true);
		},
		setDialogOpen(open: boolean) {
			setIsDialogOpen(open);

			if (!open) {
				setErrorMessage(null);
			}
		},
		confirm,
	};
}
