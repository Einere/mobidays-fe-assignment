import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createInitialGlobalFilterState } from "@/entities/global-filter/model/defaults";
import { resolveGlobalFilterDateRangeResolution } from "@/widgets/global-filter/model/global-filter-date-range";
import { useGlobalFilterDateRangeDraft } from "@/widgets/global-filter/model/use-global-filter-date-range-draft";

describe("resolveGlobalFilterDateRangeResolution", () => {
	it("does not commit when a date range is incomplete", () => {
		expect(
			resolveGlobalFilterDateRangeResolution({
				startDate: "2026-04-01",
				endDate: "",
			}),
		).toEqual({
			validationMessage: null,
			shouldCommit: false,
		});
	});

	it("returns a validation error for descending date ranges", () => {
		expect(
			resolveGlobalFilterDateRangeResolution({
				startDate: "2026-04-20",
				endDate: "2026-04-01",
			}),
		).toEqual({
			validationMessage: "시작일은 종료일보다 늦을 수 없습니다.",
			shouldCommit: false,
		});
	});

	it("allows valid date ranges to commit", () => {
		expect(
			resolveGlobalFilterDateRangeResolution({
				startDate: "2026-04-01",
				endDate: "2026-04-20",
			}),
		).toEqual({
			validationMessage: null,
			shouldCommit: true,
		});
	});
});

describe("useGlobalFilterDateRangeDraft", () => {
	it("keeps the draft in sync and commits valid ranges", () => {
		const onCommitDateRange = vi.fn();
		const initialFilter = createInitialGlobalFilterState();
		const { result, rerender } = renderHook(
			({ dateRange }) =>
				useGlobalFilterDateRangeDraft({
					dateRange,
					onCommitDateRange,
				}),
			{
				initialProps: {
					dateRange: initialFilter.dateRange,
				},
			},
		);

		expect(result.current.draftDateRange).toEqual(initialFilter.dateRange);
		expect(result.current.validationMessage).toBeNull();

		act(() => {
			result.current.onStartDateChange("2026-04-10");
		});
		expect(onCommitDateRange).toHaveBeenLastCalledWith({
			startDate: "2026-04-10",
			endDate: "2026-04-30",
		});
		expect(onCommitDateRange).toHaveBeenCalledTimes(1);

		act(() => {
			result.current.onEndDateChange("2026-04-20");
		});

		expect(onCommitDateRange).toHaveBeenLastCalledWith({
			startDate: "2026-04-10",
			endDate: "2026-04-20",
		});
		expect(onCommitDateRange).toHaveBeenCalledTimes(2);
		expect(result.current.validationMessage).toBeNull();

		act(() => {
			result.current.onEndDateChange("2026-04-01");
		});

		expect(onCommitDateRange).toHaveBeenCalledTimes(2);
		expect(result.current.validationMessage).toBe(
			"시작일은 종료일보다 늦을 수 없습니다.",
		);

		rerender({
			dateRange: {
				startDate: "2026-04-02",
				endDate: "2026-04-03",
			},
		});

		expect(result.current.draftDateRange).toEqual({
			startDate: "2026-04-02",
			endDate: "2026-04-03",
		});
		expect(result.current.validationMessage).toBeNull();
	});
});
