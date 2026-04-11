import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { GlobalFilterState } from "@/entities/global-filter/model/types";
import { buildCampaignTableSelectionResetKey } from "@/widgets/campaign-table/model/build-campaign-table-selection-reset-key";
import { useCampaignTableSelection } from "@/widgets/campaign-table/model/use-campaign-table-selection";

describe("useCampaignTableSelection", () => {
	it("toggles row selection and summarizes current page selection", () => {
		const { result } = renderHook(() =>
			useCampaignTableSelection({
				resetKey: "page-1",
				visibleRowIds: ["campaign-1", "campaign-2"],
			}),
		);

		expect(result.current.selectedRowIds).toEqual([]);
		expect(result.current.areAllVisibleRowsSelected).toBe(false);
		expect(result.current.isPartiallySelected).toBe(false);

		act(() => {
			result.current.toggleRowSelection("campaign-1");
		});

		expect(result.current.selectedRowIds).toEqual(["campaign-1"]);
		expect(result.current.areAllVisibleRowsSelected).toBe(false);
		expect(result.current.isPartiallySelected).toBe(true);

		act(() => {
			result.current.togglePageSelection(["campaign-1", "campaign-2"]);
		});

		expect(result.current.selectedRowIds).toEqual(["campaign-1", "campaign-2"]);
		expect(result.current.areAllVisibleRowsSelected).toBe(true);
		expect(result.current.isPartiallySelected).toBe(false);
	});

	it("clears selection when the reset key changes", () => {
		const filter: GlobalFilterState = {
			dateRange: {
				startDate: "2026-04-01",
				endDate: "2026-04-30",
			},
			statuses: ["active"],
			platforms: ["Google"],
		};
		const baseResetKey = buildCampaignTableSelectionResetKey({
			filter,
			page: 1,
			searchTerm: "brand",
			sort: {
				key: "cost",
				direction: "asc",
			},
		});

		const { result, rerender } = renderHook(
			({
				resetKey,
				visibleRowIds,
			}: {
				resetKey: string;
				visibleRowIds: string[];
			}) => useCampaignTableSelection({ resetKey, visibleRowIds }),
			{
				initialProps: {
					resetKey: baseResetKey,
					visibleRowIds: ["campaign-1", "campaign-2"],
				},
			},
		);

		act(() => {
			result.current.toggleRowSelection("campaign-1");
		});

		expect(result.current.selectedRowIds).toEqual(["campaign-1"]);

		rerender({
			resetKey: buildCampaignTableSelectionResetKey({
				filter,
				page: 1,
				searchTerm: "brand",
				sort: {
					key: "cost",
					direction: "asc",
				},
			}),
			visibleRowIds: ["campaign-2", "campaign-1"],
		});

		expect(result.current.selectedRowIds).toEqual(["campaign-1"]);

		rerender({
			resetKey: buildCampaignTableSelectionResetKey({
				filter,
				page: 1,
				searchTerm: "brand",
				sort: {
					key: "cost",
					direction: "desc",
				},
			}),
			visibleRowIds: ["campaign-2", "campaign-1"],
		});

		expect(result.current.selectedRowIds).toEqual([]);
		expect(result.current.selectedCount).toBe(0);
	});
});
