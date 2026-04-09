import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CampaignTableToolbar } from "@/widgets/campaign-table/ui/campaign-table-toolbar";

describe("CampaignTableToolbar", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("delays search term updates until the debounce delay passes", async () => {
		vi.useFakeTimers();
		const onSearchTermChange = vi.fn();

		render(
			<CampaignTableToolbar
				searchTerm=""
				filteredCount={2}
				totalCount={2}
				selectedCount={0}
				pendingStatus={null}
				disabled={false}
				canApplyStatusChange={false}
				onSearchTermChange={onSearchTermChange}
				onPendingStatusChange={vi.fn()}
				onOpenStatusDialog={vi.fn()}
			/>,
		);

		act(() => {
			fireEvent.change(screen.getByRole("searchbox", { name: "캠페인 검색" }), {
				target: { value: "브랜드" },
			});
		});

		expect(onSearchTermChange).not.toHaveBeenCalled();

		await act(async () => {
			await vi.advanceTimersByTimeAsync(299);
		});

		expect(onSearchTermChange).not.toHaveBeenCalled();

		await act(async () => {
			await vi.advanceTimersByTimeAsync(1);
		});

		expect(onSearchTermChange).toHaveBeenCalledTimes(1);
		expect(onSearchTermChange).toHaveBeenLastCalledWith("브랜드");
	});

	it("disables the status controls when no rows are selected", () => {
		render(
			<CampaignTableToolbar
				searchTerm=""
				filteredCount={2}
				totalCount={2}
				selectedCount={0}
				pendingStatus={null}
				disabled={false}
				canApplyStatusChange={false}
				onSearchTermChange={vi.fn()}
				onPendingStatusChange={vi.fn()}
				onOpenStatusDialog={vi.fn()}
			/>,
		);

		expect(
			screen.getByRole("combobox", { name: "변경할 상태" }),
		).toBeDisabled();
		expect(
			screen.getByRole("combobox", { name: "변경할 상태" }).className,
		).toContain("cursor-not-allowed");
		expect(screen.getByRole("button", { name: "상태 적용" })).toBeDisabled();
	});
});
