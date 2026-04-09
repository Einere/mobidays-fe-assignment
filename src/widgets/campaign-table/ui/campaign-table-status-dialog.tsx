import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/shared/ui/button";

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
	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px]" />
				<Dialog.Content className="-translate-x-1/2 -translate-y-1/2 fixed top-1/2 left-1/2 z-50 flex w-[min(92vw,480px)] flex-col gap-5 rounded-panel border border-outline bg-panel p-panel shadow-panel focus:outline-none">
					<div className="flex flex-col gap-2">
						<Dialog.Title className="text-heading-md text-fg">
							캠페인 상태 변경
						</Dialog.Title>
						<Dialog.Description className="text-body-sm text-fg-muted">
							선택한 캠페인 {selectedCount}건의 상태를 {statusLabel}로
							변경합니다.
						</Dialog.Description>
					</div>

					<div className="rounded-card border border-outline-subtle bg-panel-muted px-4 py-3 text-body-sm text-fg-muted">
						변경을 적용하면 선택한 캠페인 전체에 같은 상태가 반영됩니다.
					</div>

					{errorMessage ? (
						<div className="rounded-card border border-status-danger-border bg-status-danger/30 px-4 py-3 text-body-sm text-status-danger-fg">
							<p>상태 변경에 실패했습니다.</p>
							<p className="mt-1 text-caption">{errorMessage}</p>
						</div>
					) : null}

					<div className="flex justify-end gap-2">
						<Dialog.Close asChild>
							<Button type="button" variant="outline" disabled={isSubmitting}>
								취소
							</Button>
						</Dialog.Close>
						<Button
							type="button"
							disabled={isSubmitting || !canConfirm}
							onClick={onConfirm}
						>
							{isSubmitting ? "변경 중..." : "변경 적용"}
						</Button>
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
