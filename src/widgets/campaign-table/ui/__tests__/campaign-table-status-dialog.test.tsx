import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CampaignTableStatusDialog } from "@/widgets/campaign-table/ui/campaign-table-status-dialog";

describe("CampaignTableStatusDialog", () => {
	it("uses danger tone for the caution copy and confirm action", () => {
		render(
			<CampaignTableStatusDialog
				open
				selectedCount={2}
				statusLabel="종료"
				errorMessage={null}
				isSubmitting={false}
				canConfirm
				onOpenChange={vi.fn()}
				onConfirm={vi.fn()}
			/>,
		);

		expect(
			screen.getByText(
				"변경을 적용하면 선택한 캠페인 전체에 같은 상태가 반영됩니다.",
			).className,
		).toContain("border-status-danger-border");
		expect(
			screen.getByText(
				"변경을 적용하면 선택한 캠페인 전체에 같은 상태가 반영됩니다.",
			).className,
		).toContain("bg-status-danger/30");
		expect(
			screen
				.getByRole("button", { name: "변경 적용" })
				.getAttribute("data-variant"),
		).toBe("destructive");
	});
});
