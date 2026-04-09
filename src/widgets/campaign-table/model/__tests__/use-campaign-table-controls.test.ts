import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useCampaignTableControls } from "@/widgets/campaign-table/model/use-campaign-table-controls";

describe("useCampaignTableControls", () => {
	it("keeps table-only search, page, and sort state isolated", () => {
		const { result } = renderHook(() => useCampaignTableControls());

		expect(result.current.searchTerm).toBe("");
		expect(result.current.page).toBe(1);
		expect(result.current.sort).toBeNull();
		expect(result.current.selectedRowIds).toEqual([]);
		expect(result.current.pendingStatus).toBeNull();

		act(() => {
			result.current.setPage(3);
		});

		expect(result.current.page).toBe(3);

		act(() => {
			result.current.setPage(3.8);
		});

		expect(result.current.page).toBe(3);

		act(() => {
			result.current.setPage(0);
		});

		expect(result.current.page).toBe(1);

		act(() => {
			result.current.setPage(Number.NaN);
		});

		expect(result.current.page).toBe(1);

		act(() => {
			result.current.setPage(Number.POSITIVE_INFINITY);
		});

		expect(result.current.page).toBe(1);

		act(() => {
			result.current.setSearchTerm("브랜드");
		});

		expect(result.current.searchTerm).toBe("브랜드");
		expect(result.current.page).toBe(1);

		act(() => {
			result.current.toggleSort("ctr");
		});

		expect(result.current.sort).toEqual({
			key: "ctr",
			direction: "asc",
		});
		expect(result.current.page).toBe(1);

		act(() => {
			result.current.toggleSort("ctr");
		});

		expect(result.current.sort).toEqual({
			key: "ctr",
			direction: "desc",
		});

		act(() => {
			result.current.toggleSort("roas");
		});

		expect(result.current.sort).toEqual({
			key: "roas",
			direction: "asc",
		});

		act(() => {
			result.current.toggleRowSelection("campaign-1");
		});

		expect(result.current.selectedRowIds).toEqual(["campaign-1"]);
		expect(result.current.page).toBe(1);

		act(() => {
			result.current.toggleRowSelection("campaign-1");
		});

		expect(result.current.selectedRowIds).toEqual([]);

		act(() => {
			result.current.setPendingStatus("paused");
		});

		expect(result.current.pendingStatus).toBe("paused");
	});
});
