import { useSetAtom } from "jotai";
import { useCallback, useMemo, useState } from "react";
import { useDashboardDataContext } from "@/entities/dashboard/model/dashboard-data-context";
import { toggleGlobalFilterPlatformAtom } from "@/entities/global-filter/model/store";
import type { CampaignPlatform } from "@/entities/global-filter/model/types";
import type {
	PlatformMetricKey,
	PlatformPerformanceSlice,
} from "@/entities/platform-performance/model/types";
import {
	defaultPlatformPerformanceMetricKey,
	getPlatformPerformanceMetric,
} from "@/widgets/platform-performance-chart/model/platform-performance-metrics";

export type PlatformPerformanceChartState =
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
			isSyncing: boolean;
			staleErrorMessage: string | null;
			slices: PlatformPerformanceSlice[];
	  };

export interface PlatformPerformanceChartViewModel {
	activeMetricKey: PlatformMetricKey;
	metricDefinition: ReturnType<typeof getPlatformPerformanceMetric>;
	toggleMetric: (metricKey: PlatformMetricKey) => void;
	handlePlatformSelection: (platform: CampaignPlatform) => void;
	state: PlatformPerformanceChartState;
}

export function resolvePlatformPerformanceChartState({
	campaigns,
	isLoadingError,
	isPending,
	isRefetching,
	isRefetchError,
	err,
	slices,
}: {
	campaigns: unknown[] | null;
	isLoadingError: boolean;
	isPending: boolean;
	isRefetchError: boolean;
	isRefetching: boolean;
	err: Error | null;
	slices: PlatformPerformanceSlice[];
}) {
	if (isLoadingError) {
		return {
			kind: "full-error",
			errorMessage: err?.message ?? "알 수 없는 오류가 발생했습니다.",
		} satisfies PlatformPerformanceChartState;
	}

	if (campaigns === null && isPending) {
		return { kind: "loading" } satisfies PlatformPerformanceChartState;
	}

	if (campaigns === null) {
		return { kind: "empty-data" } satisfies PlatformPerformanceChartState;
	}

	if (campaigns.length === 0) {
		return { kind: "empty-campaigns" } satisfies PlatformPerformanceChartState;
	}

	if (slices.length === 0) {
		return { kind: "empty-data" } satisfies PlatformPerformanceChartState;
	}

	return {
		kind: "chart",
		isSyncing: isRefetching,
		staleErrorMessage: isRefetchError
			? (err?.message ?? "알 수 없는 오류가 발생했습니다.")
			: null,
		slices,
	} satisfies PlatformPerformanceChartState;
}

export function usePlatformPerformanceChartViewModel() {
	const { query, derivations } = useDashboardDataContext();
	const [activeMetricKey, setActiveMetricKey] = useState<PlatformMetricKey>(
		defaultPlatformPerformanceMetricKey,
	);
	const toggleGlobalFilterPlatform = useSetAtom(toggleGlobalFilterPlatformAtom);

	const toggleMetric = useCallback((metricKey: PlatformMetricKey) => {
		setActiveMetricKey(metricKey);
	}, []);

	const handlePlatformSelection = useCallback(
		(platform: CampaignPlatform) => {
			toggleGlobalFilterPlatform(platform);
		},
		[toggleGlobalFilterPlatform],
	);

	const slices = useMemo(() => {
		if (derivations === null) {
			return [] as PlatformPerformanceSlice[];
		}

		return derivations.platformPerformanceSlicesByMetricKey[activeMetricKey];
	}, [activeMetricKey, derivations]);

	const state = useMemo(
		() =>
			resolvePlatformPerformanceChartState({
				campaigns: query.data?.campaigns ?? null,
				isLoadingError: query.isLoadingError,
				isPending: query.isPending,
				isRefetchError: query.isRefetchError,
				isRefetching: query.isRefetching,
				err: query.error as Error | null,
				slices,
			}),
		[
			query.data?.campaigns,
			query.error,
			query.isLoadingError,
			query.isPending,
			query.isRefetchError,
			query.isRefetching,
			slices,
		],
	);

	return {
		activeMetricKey,
		metricDefinition: getPlatformPerformanceMetric(activeMetricKey),
		toggleMetric,
		handlePlatformSelection,
		state,
	} satisfies PlatformPerformanceChartViewModel;
}
