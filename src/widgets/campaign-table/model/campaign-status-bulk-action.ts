import type { CampaignStatus } from "@/entities/global-filter/model/types";

export interface CampaignStatusBulkActionAvailabilityInput {
	selectedRowCount: number;
	isInteractionBlocked: boolean;
	isSubmitting: boolean;
	pendingStatus: CampaignStatus | null;
}

export interface CampaignStatusBulkActionAvailability {
	canOpenDialog: boolean;
	canConfirm: boolean;
}

export function resolveCampaignStatusBulkActionAvailability({
	selectedRowCount,
	isInteractionBlocked,
	isSubmitting,
	pendingStatus,
}: CampaignStatusBulkActionAvailabilityInput): CampaignStatusBulkActionAvailability {
	const hasSelectedRows = selectedRowCount > 0;
	const hasPendingStatus = pendingStatus !== null;
	const isAvailable =
		!isInteractionBlocked &&
		hasSelectedRows &&
		hasPendingStatus &&
		!isSubmitting;

	return {
		canOpenDialog: isAvailable,
		canConfirm: isAvailable,
	};
}

export function shouldResetPendingStatus({
	selectedRowCount,
	pendingStatus,
}: {
	selectedRowCount: number;
	pendingStatus: CampaignStatus | null;
}) {
	return pendingStatus !== null && selectedRowCount === 0;
}
