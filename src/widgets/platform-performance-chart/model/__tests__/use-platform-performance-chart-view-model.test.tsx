import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, screen, waitFor } from "@testing-library/react";
import { createStore, Provider, useAtomValue } from "jotai";
import type { PropsWithChildren } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { DashboardDataProvider } from "@/entities/dashboard";
import { createInitialGlobalFilterState } from "@/entities/global-filter/model/defaults";
import { globalFilterAtom } from "@/entities/global-filter/model/store";
import { seedMockDb } from "@/shared/api/mock/db";
import { createQueryClient } from "@/shared/api/query-client";
import {
	resolvePlatformPerformanceChartState,
	usePlatformPerformanceChartViewModel,
} from "@/widgets/platform-performance-chart/model/use-platform-performance-chart-view-model";

const aprilFilter = createInitialGlobalFilterState(new Date("2026-04-15"));
const queryClients: QueryClient[] = [];

afterEach(() => {
	for (const queryClient of queryClients.splice(0)) {
		queryClient.clear();
	}
});

function renderPlatformPerformanceViewModel() {
	const queryClient = createQueryClient();
	const store = createStore();

	store.set(globalFilterAtom, aprilFilter);
	queryClients.push(queryClient);

	return renderHook(() => usePlatformPerformanceChartViewModel(), {
		wrapper: ({ children }) => (
			<Provider store={store}>
				<QueryClientProvider client={queryClient}>
					<DashboardDataTestProvider>
						<FilterStateIndicator />
						{children}
					</DashboardDataTestProvider>
				</QueryClientProvider>
			</Provider>
		),
	});
}

function DashboardDataTestProvider({ children }: PropsWithChildren) {
	const filter = useAtomValue(globalFilterAtom);

	return (
		<DashboardDataProvider filter={filter}>{children}</DashboardDataProvider>
	);
}

function FilterStateIndicator() {
	const filter = useAtomValue(globalFilterAtom);

	return (
		<div data-testid="platform-filter-state">{filter.platforms.join(",")}</div>
	);
}

describe("resolvePlatformPerformanceChartState", () => {
	it("maps loading, error, empty, and chart states", () => {
		expect(
			resolvePlatformPerformanceChartState({
				campaigns: null,
				isLoadingError: false,
				isPending: true,
				isRefetchError: false,
				isRefetching: false,
				err: null,
				slices: [],
			}),
		).toEqual({ kind: "loading" });

		expect(
			resolvePlatformPerformanceChartState({
				campaigns: null,
				isLoadingError: true,
				isPending: false,
				isRefetchError: false,
				isRefetching: false,
				err: new Error("boom"),
				slices: [],
			}),
		).toEqual({
			kind: "full-error",
			errorMessage: "boom",
		});

		expect(
			resolvePlatformPerformanceChartState({
				campaigns: [],
				isLoadingError: false,
				isPending: false,
				isRefetchError: false,
				isRefetching: false,
				err: null,
				slices: [],
			}),
		).toEqual({ kind: "empty-campaigns" });

		expect(
			resolvePlatformPerformanceChartState({
				campaigns: [{ id: "1" }],
				isLoadingError: false,
				isPending: false,
				isRefetchError: false,
				isRefetching: false,
				err: null,
				slices: [],
			}),
		).toEqual({ kind: "empty-data" });
	});
});

describe("usePlatformPerformanceChartViewModel", () => {
	it("exposes the default metric and toggles platform selection through the global filter", async () => {
		seedMockDb({
			campaigns: [
				{
					id: "cmp-1",
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
					id: "d-1",
					campaignId: "cmp-1",
					date: "2026-04-01",
					impressions: 100,
					clicks: 20,
					conversions: 5,
					cost: 1000,
					conversionsValue: null,
				},
			],
		});

		const { result } = renderPlatformPerformanceViewModel();

		await waitFor(() => {
			expect(result.current.state.kind).toBe("chart");
		});

		expect(result.current.activeMetricKey).toBe("cost");
		expect(screen.getByTestId("platform-filter-state")).toHaveTextContent(
			"Google,Meta,Naver",
		);

		act(() => {
			result.current.handlePlatformSelection("Meta");
		});

		await waitFor(() => {
			expect(screen.getByTestId("platform-filter-state")).toHaveTextContent(
				"Google,Naver",
			);
		});

		act(() => {
			result.current.toggleMetric("clicks");
		});

		expect(result.current.activeMetricKey).toBe("clicks");
	});
});
