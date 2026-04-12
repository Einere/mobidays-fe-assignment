import { describe, expect, it } from "vitest";
import { resolveGlobalFilterSummaryViewState } from "@/widgets/global-filter/model/use-global-filter-summary-view-model";

describe("resolveGlobalFilterSummaryViewState", () => {
	it("returns a full error state and ignores stale data when the query fails", () => {
		expect(
			resolveGlobalFilterSummaryViewState({
				data: {
					campaigns: [{ id: "1" }] as never,
					dailyStats: [{ id: "d1" }] as never,
				},
				error: new Error("Request failed: 500"),
				isError: true,
				isPending: false,
				isPlaceholderData: false,
			}),
		).toEqual({
			kind: "full-error",
			errorMessage: "Request failed: 500",
		});
	});

	it("returns summary counts and stale status while a refetch is in flight", () => {
		expect(
			resolveGlobalFilterSummaryViewState({
				data: {
					campaigns: [{ id: "1" }, { id: "2" }] as never,
					dailyStats: [{ id: "d1" }, { id: "d2" }] as never,
				},
				error: null,
				isError: false,
				isPending: true,
				isPlaceholderData: false,
			}),
		).toEqual({
			kind: "summary",
			campaignsCount: 2,
			dailyStatsCount: 2,
			staleStatusMessage: "최신 필터 결과를 불러오는 중입니다.",
		});
	});
});
