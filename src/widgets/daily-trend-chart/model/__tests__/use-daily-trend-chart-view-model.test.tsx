import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createStore, Provider } from "jotai";
import { afterEach, describe, expect, it } from "vitest";
import { createInitialGlobalFilterState } from "@/entities/global-filter/model/defaults";
import { globalFilterAtom } from "@/entities/global-filter/model/store";
import { seedMockDb } from "@/shared/api/mock/db";
import { createQueryClient } from "@/shared/api/query-client";
import {
	resolveDailyTrendChartViewState,
	useDailyTrendChartViewModel,
} from "@/widgets/daily-trend-chart/model/use-daily-trend-chart-view-model";

const aprilFilter = createInitialGlobalFilterState(new Date("2026-04-15"));
const queryClients: QueryClient[] = [];

afterEach(() => {
	for (const queryClient of queryClients.splice(0)) {
		queryClient.clear();
	}
});

function renderDailyTrendChartViewModel() {
	const queryClient = createQueryClient();
	const store = createStore();

	store.set(globalFilterAtom, aprilFilter);
	queryClients.push(queryClient);

	return renderHook(() => useDailyTrendChartViewModel(), {
		wrapper: ({ children }) => (
			<Provider store={store}>
				<QueryClientProvider client={queryClient}>
					{children}
				</QueryClientProvider>
			</Provider>
		),
	});
}

describe("resolveDailyTrendChartViewState", () => {
	it("maps loading, error, empty, and chart states deterministically", () => {
		expect(
			resolveDailyTrendChartViewState({
				currentDataSnapshot: null,
				errorMessage: null,
				isLoadingError: false,
				isPending: true,
				isRefetchError: false,
				isRefetching: false,
			}),
		).toEqual({ kind: "loading" });

		expect(
			resolveDailyTrendChartViewState({
				currentDataSnapshot: null,
				errorMessage: "boom",
				isLoadingError: true,
				isPending: false,
				isRefetchError: false,
				isRefetching: false,
			}),
		).toEqual({
			kind: "full-error",
			errorMessage: "boom",
		});

		expect(
			resolveDailyTrendChartViewState({
				currentDataSnapshot: {
					campaignsCount: 0,
					chartData: [],
				},
				errorMessage: null,
				isLoadingError: false,
				isPending: false,
				isRefetchError: false,
				isRefetching: false,
			}),
		).toEqual({ kind: "empty-campaigns" });

		expect(
			resolveDailyTrendChartViewState({
				currentDataSnapshot: {
					campaignsCount: 1,
					chartData: [],
				},
				errorMessage: null,
				isLoadingError: false,
				isPending: false,
				isRefetchError: false,
				isRefetching: false,
			}),
		).toEqual({ kind: "empty-data" });
	});
});

describe("useDailyTrendChartViewModel", () => {
	it("exposes the default active metrics and toggles them predictably", async () => {
		seedMockDb({
			campaigns: [
				{
					id: "1",
					name: "Google Active",
					platform: "Google",
					status: "active",
					budget: 1000,
					startDate: "2026-04-01",
					endDate: "2026-04-30",
				},
			],
			daily_stats: [
				{
					id: "d1",
					campaignId: "1",
					date: "2026-04-01",
					impressions: 100,
					clicks: 10,
					conversions: 1,
					cost: 1000,
					conversionsValue: null,
				},
			],
		});

		const { result } = renderDailyTrendChartViewModel();

		await waitFor(() => {
			expect(result.current.viewState.kind).toBe("chart");
		});

		expect(result.current.activeMetrics).toEqual(["impressions", "clicks"]);

		act(() => {
			result.current.toggleMetric("clicks");
		});

		expect(result.current.activeMetrics).toEqual(["impressions"]);
	});
});
