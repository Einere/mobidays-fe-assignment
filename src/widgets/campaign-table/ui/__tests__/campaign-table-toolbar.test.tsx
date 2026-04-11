import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CampaignTableToolbar } from "@/widgets/campaign-table/ui/campaign-table-toolbar";

describe("CampaignTableToolbar", () => {
	it("delegates search input changes immediately to the caller", () => {
		const onSearchInputChange = vi.fn();

		render(
			<CampaignTableToolbar
				toolbarState={{
					searchInput: "",
					filteredCount: 2,
					totalCount: 2,
					selectedCount: 0,
					pendingStatus: null,
					disabled: false,
					canApplyStatusChange: false,
				}}
				actions={{
					onSearchInputChange,
					onPendingStatusChange: vi.fn(),
					onOpenStatusDialog: vi.fn(),
				}}
			/>,
		);

		fireEvent.change(screen.getByRole("searchbox", { name: "캠페인 검색" }), {
			target: { value: "브랜드" },
		});

		expect(onSearchInputChange).toHaveBeenCalledTimes(1);
		expect(onSearchInputChange).toHaveBeenLastCalledWith("브랜드");
	});

	it("disables the status controls when no rows are selected", () => {
		render(
			<CampaignTableToolbar
				toolbarState={{
					searchInput: "",
					filteredCount: 2,
					totalCount: 2,
					selectedCount: 0,
					pendingStatus: null,
					disabled: false,
					canApplyStatusChange: false,
				}}
				actions={{
					onSearchInputChange: vi.fn(),
					onPendingStatusChange: vi.fn(),
					onOpenStatusDialog: vi.fn(),
				}}
			/>,
		);

		expect(
			screen.getByRole("combobox", { name: "변경할 상태" }),
		).toBeDisabled();
		expect(
			screen.getByRole("combobox", { name: "변경할 상태" }).className,
		).toContain("cursor-not-allowed");
		expect(screen.getByRole("button", { name: "상태 적용" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "상태 적용" })).toHaveAttribute(
			"data-variant",
			"warning",
		);
	});

	it("disables the create button when no create handler is provided", () => {
		render(
			<CampaignTableToolbar
				toolbarState={{
					searchInput: "",
					filteredCount: 2,
					totalCount: 2,
					selectedCount: 1,
					pendingStatus: null,
					disabled: false,
					canApplyStatusChange: false,
				}}
				actions={{
					onSearchInputChange: vi.fn(),
					onPendingStatusChange: vi.fn(),
					onOpenStatusDialog: vi.fn(),
				}}
			/>,
		);

		expect(screen.getByRole("button", { name: "캠페인 등록" })).toBeDisabled();
	});
});
