import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { useCallback, useMemo, useState } from "react";
import {
	buildDailyTrendSeries,
	type DailyTrendPoint,
} from "@/entities/daily-stat/lib/build-daily-trend-series";
import { getDashboardDataQueryOptions } from "@/entities/dashboard";
import { globalFilterAtom } from "@/entities/global-filter/model/store";
import { toggleDailyTrendMetricSelection } from "@/widgets/daily-trend-chart/model/daily-trend-metric-selection";
import type { DailyTrendMetricKey } from "@/widgets/daily-trend-chart/model/metrics";
import { defaultDailyTrendMetricKeys } from "@/widgets/daily-trend-chart/model/metrics";

type ResolvedChartSnapshot = {
	campaignsCount: number;
	chartData: DailyTrendPoint[];
};

export type DailyTrendChartViewState =
	| {
			kind: "loading";
	  }
	| {
			kind: "full-error";
			errorMessage: string;
	  }
	| {
			kind: "empty-campaigns";
	  }
	| {
			kind: "empty-data";
	  }
	| {
			kind: "chart";
			chartData: DailyTrendPoint[];
			isSyncing: boolean;
			staleErrorMessage: string | null;
	  };

export interface DailyTrendChartViewModel {
	activeMetrics: DailyTrendMetricKey[];
	toggleMetric: (metricKey: DailyTrendMetricKey) => void;
	viewState: DailyTrendChartViewState;
}

function createResolvedChartSnapshot(
	dailyStats: Parameters<typeof buildDailyTrendSeries>[0],
	campaignsCount: number,
): ResolvedChartSnapshot {
	return {
		campaignsCount,
		chartData: buildDailyTrendSeries(dailyStats),
	};
}

export function resolveDailyTrendChartViewState({
	currentDataSnapshot,
	errorMessage,
	isLoadingError,
	isPending,
	isRefetchError,
	isRefetching,
}: {
	currentDataSnapshot: ResolvedChartSnapshot | null;
	errorMessage: string | null;
	isLoadingError: boolean;
	isPending: boolean;
	isRefetchError: boolean;
	isRefetching: boolean;
}): DailyTrendChartViewState {
	if (currentDataSnapshot === null) {
		if (isPending) {
			return { kind: "loading" };
		}

		if (isLoadingError) {
			return {
				kind: "full-error",
				errorMessage: errorMessage ?? "알 수 없는 오류가 발생했습니다.",
			};
		}

		return { kind: "empty-data" };
	}

	if (currentDataSnapshot.campaignsCount === 0) {
		return { kind: "empty-campaigns" };
	}

	if (currentDataSnapshot.chartData.length === 0) {
		return { kind: "empty-data" };
	}

	return {
		kind: "chart",
		chartData: currentDataSnapshot.chartData,
		isSyncing: isRefetching,
		staleErrorMessage: isRefetchError
			? (errorMessage ?? "알 수 없는 오류가 발생했습니다.")
			: null,
	};
}

export function useDailyTrendChartViewModel() {
	const filter = useAtomValue(globalFilterAtom);
	const [activeMetrics, setActiveMetrics] = useState<DailyTrendMetricKey[]>([
		...defaultDailyTrendMetricKeys,
	]);
	const query = useQuery({
		...getDashboardDataQueryOptions(filter),
		placeholderData: keepPreviousData,
	});
	const toggleMetric = useCallback((metricKey: DailyTrendMetricKey) => {
		setActiveMetrics((currentMetrics) =>
			toggleDailyTrendMetricSelection(currentMetrics, metricKey),
		);
	}, []);
	const currentDataSnapshot = useMemo(
		() =>
			query.data === undefined
				? null
				: createResolvedChartSnapshot(
						query.data.dailyStats,
						query.data.campaigns.length,
					),
		[query.data],
	);
	const viewState = useMemo(
		() =>
			resolveDailyTrendChartViewState({
				currentDataSnapshot,
				errorMessage: query.error?.message ?? null,
				isLoadingError: query.isLoadingError,
				isPending: query.isPending,
				isRefetchError: query.isRefetchError,
				isRefetching: query.isRefetching,
			}),
		[
			currentDataSnapshot,
			query.error?.message,
			query.isLoadingError,
			query.isPending,
			query.isRefetchError,
			query.isRefetching,
		],
	);

	return {
		activeMetrics,
		toggleMetric,
		viewState,
	} satisfies DailyTrendChartViewModel;
}
