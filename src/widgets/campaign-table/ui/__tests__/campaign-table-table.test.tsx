import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { CampaignTableRow } from "@/entities/campaign/lib/build-campaign-table-rows";
import { CampaignTableTable } from "@/widgets/campaign-table/ui/campaign-table-table";

function createRow(overrides: Partial<CampaignTableRow>): CampaignTableRow {
	return {
		id: "campaign-1",
		name: "브랜드 검색",
		status: "active",
		platform: "Google",
		startDate: "2026-04-01",
		endDate: "2026-04-30",
		periodSortValue: Date.parse("2026-04-01"),
		cost: 1000,
		ctr: 12,
		cpc: 24,
		roas: 300,
		...overrides,
	};
}

describe("CampaignTableTable", () => {
	it("renders rows and forwards selection, paging, and sort actions", async () => {
		const user = userEvent.setup();
		const onToggleSort = vi.fn();
		const onToggleRowSelection = vi.fn();
		const onTogglePageSelection = vi.fn();
		const onSetPage = vi.fn();

		render(
			<CampaignTableTable
				actions={{
					onSetPage,
					onTogglePageSelection,
					onToggleRowSelection,
					onToggleSort,
				}}
				tableState={{
					areAllVisibleRowsSelected: false,
					isInteractionDisabled: false,
					isPartiallySelected: true,
					selectedRowIds: ["campaign-1"],
					sort: null,
					tableView: {
						filteredCount: 2,
						page: 2,
						rows: [
							createRow({ id: "campaign-1" }),
							createRow({
								id: "campaign-2",
								name: "리타겟팅",
								platform: "Meta",
							}),
						],
						totalCount: 2,
						totalPages: 2,
					},
				}}
			/>,
		);

		expect(
			screen.getByRole("table", { name: "캠페인 현황 표" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("checkbox", { name: "현재 페이지 캠페인 모두 선택" }),
		).toHaveAttribute("aria-checked", "mixed");
		expect(screen.getByText("페이지 2 / 2")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "총 집행금액 정렬" }),
		).toBeVisible();

		await user.click(
			screen.getByRole("checkbox", { name: "현재 페이지 캠페인 모두 선택" }),
		);
		expect(onTogglePageSelection).toHaveBeenCalledWith([
			"campaign-1",
			"campaign-2",
		]);

		await user.click(
			screen.getByRole("checkbox", { name: "브랜드 검색 선택" }),
		);
		expect(onToggleRowSelection).toHaveBeenCalledWith("campaign-1");

		await user.click(screen.getByRole("button", { name: "총 집행금액 정렬" }));
		expect(onToggleSort).toHaveBeenCalledWith("cost");

		await user.click(screen.getByRole("button", { name: "이전" }));
		expect(onSetPage).toHaveBeenCalledWith(1);
	});
});
