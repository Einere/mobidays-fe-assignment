import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CampaignTableStatusDialog } from "@/widgets/campaign-table/ui/campaign-table-status-dialog";

describe("CampaignTableStatusDialog", () => {
	it("uses warning tone for the caution copy and confirm action", () => {
		render(
			<CampaignTableStatusDialog
				statusDialogState={{
					open: true,
					selectedCount: 2,
					statusLabel: "종료",
					errorMessage: null,
					isSubmitting: false,
					canConfirm: true,
				}}
				actions={{
					onOpenChange: vi.fn(),
					onConfirm: vi.fn(),
				}}
			/>,
		);

		expect(
			screen.getByText(
				"변경을 적용하면 선택한 캠페인 전체에 같은 상태가 반영됩니다.",
			).className,
		).toContain("border-status-warning-border");
		expect(
			screen.getByText(
				"변경을 적용하면 선택한 캠페인 전체에 같은 상태가 반영됩니다.",
			).className,
		).toContain("bg-status-warning/30");
		expect(
			document.querySelector('[data-slot="dialog-overlay"]')?.className ?? "",
		).toContain("bg-overlay-scrim");
		expect(
			screen
				.getByRole("button", { name: "변경 적용" })
				.getAttribute("data-variant"),
		).toBe("warning");
	});

	it("keeps the dialog open when escape is pressed during submission", async () => {
		const user = userEvent.setup();
		const onOpenChange = vi.fn();

		render(
			<CampaignTableStatusDialog
				statusDialogState={{
					open: true,
					selectedCount: 2,
					statusLabel: "종료",
					errorMessage: null,
					isSubmitting: true,
					canConfirm: false,
				}}
				actions={{
					onOpenChange,
					onConfirm: vi.fn(),
				}}
			/>,
		);

		expect(
			screen.getByRole("dialog", { name: "캠페인 상태 변경" }),
		).toBeInTheDocument();

		await user.keyboard("{Escape}");

		expect(onOpenChange).not.toHaveBeenCalledWith(false);
		expect(
			screen.getByRole("dialog", { name: "캠페인 상태 변경" }),
		).toBeInTheDocument();
	});

	it("closes through the cancel button when the dialog is not submitting", async () => {
		const user = userEvent.setup();
		const onOpenChange = vi.fn();

		render(
			<CampaignTableStatusDialog
				statusDialogState={{
					open: true,
					selectedCount: 2,
					statusLabel: "종료",
					errorMessage: null,
					isSubmitting: false,
					canConfirm: true,
				}}
				actions={{
					onOpenChange,
					onConfirm: vi.fn(),
				}}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "취소" }));

		expect(onOpenChange).toHaveBeenCalledWith(false);
	});
});
