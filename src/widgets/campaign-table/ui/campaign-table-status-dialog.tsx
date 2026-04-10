import { Button } from "@/shared/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/ui/dialog";

interface CampaignTableStatusDialogProps {
	open: boolean;
	selectedCount: number;
	statusLabel: string;
	errorMessage: string | null;
	isSubmitting: boolean;
	canConfirm: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
}

export function CampaignTableStatusDialog({
	open,
	selectedCount,
	statusLabel,
	errorMessage,
	isSubmitting,
	canConfirm,
	onOpenChange,
	onConfirm,
}: CampaignTableStatusDialogProps) {
	function handleOpenChange(nextOpen: boolean) {
		if (isSubmitting && !nextOpen) {
			return;
		}

		onOpenChange(nextOpen);
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent
				className="w-[min(92vw,480px)] gap-5"
				showCloseButton={!isSubmitting}
				onEscapeKeyDown={(event) => {
					if (isSubmitting) {
						event.preventDefault();
					}
				}}
				onInteractOutside={(event) => {
					if (isSubmitting) {
						event.preventDefault();
					}
				}}
			>
				<DialogHeader className="gap-2">
					<DialogTitle className="typo-heading-md text-fg">
						캠페인 상태 변경
					</DialogTitle>
					<DialogDescription className="typo-body-sm text-fg-muted">
						선택한 캠페인 {selectedCount}건의 상태를 {statusLabel}로 변경합니다.
					</DialogDescription>
				</DialogHeader>

				<div className="rounded-card border border-status-warning-border bg-status-warning/30 px-4 py-3 typo-body-sm text-status-warning-fg">
					변경을 적용하면 선택한 캠페인 전체에 같은 상태가 반영됩니다.
				</div>

				{errorMessage ? (
					<div className="rounded-card border border-status-danger-border bg-status-danger/30 px-4 py-3 typo-body-sm text-status-danger-fg">
						<p>상태 변경에 실패했습니다.</p>
					</div>
				) : null}

				<DialogFooter>
					<DialogClose asChild>
						<Button type="button" variant="outline" disabled={isSubmitting}>
							취소
						</Button>
					</DialogClose>
					<Button
						type="button"
						variant="warning"
						disabled={isSubmitting || !canConfirm}
						onClick={onConfirm}
					>
						{isSubmitting ? "변경 중..." : "변경 적용"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
