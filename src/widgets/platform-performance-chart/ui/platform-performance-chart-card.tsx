import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useMemo, useState } from "react";
import { getDashboardDataQueryOptions } from "@/entities/dashboard/api/use-dashboard-data";
import {
	globalFilterAtom,
	toggleGlobalFilterPlatformAtom,
} from "@/entities/global-filter/model/store";
import { aggregatePlatformPerformance } from "@/entities/platform-performance/lib/aggregate-platform-performance";
import type {
	PlatformMetricKey,
	PlatformPerformanceSlice,
} from "@/entities/platform-performance/model/types";
import {
	defaultPlatformPerformanceMetricKey,
	getPlatformPerformanceMetric,
	platformPerformanceMetricDefinitions,
} from "@/widgets/platform-performance-chart/model/platform-performance-metrics";
import {
	PlatformPerformanceDonut,
	PlatformPerformanceMetricToggleGroup,
} from "@/widgets/platform-performance-chart/ui/platform-performance-donut-chart";

type PlatformPerformanceChartState =
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

function resolvePlatformPerformanceChartState({
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
	if (campaigns === null && isPending) {
		return { kind: "loading" } satisfies PlatformPerformanceChartState;
	}

	if (campaigns === null) {
		return { kind: "empty-data" } satisfies PlatformPerformanceChartState;
	}

	if (isLoadingError) {
		return {
			kind: "full-error",
			errorMessage: err?.message ?? "알 수 없는 오류가 발생했습니다.",
		} satisfies PlatformPerformanceChartState;
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

function PlatformPerformanceLoadingState() {
	return (
		<div className="rounded-card border border-outline-subtle bg-panel-muted">
			<div className="h-80" data-testid="platform-performance-loading" />
		</div>
	);
}

function PlatformPerformanceEmptyState({ message }: { message: string }) {
	return (
		<div
			role="status"
			aria-label={message}
			className="rounded-card border border-outline-subtle bg-panel-muted px-4 py-8 text-center typo-body-sm text-fg-muted"
		>
			{message}
		</div>
	);
}

function PlatformPerformanceErrorState({
	errorMessage,
}: {
	errorMessage: string;
}) {
	return (
		<div className="rounded-card border border-status-danger-border bg-status-danger/30 px-4 py-5 typo-body-sm text-status-danger-fg">
			<p>성과 데이터를 불러오지 못했습니다.</p>
			<p className="mt-1 text-fg-muted">{errorMessage}</p>
		</div>
	);
}

function renderBody(state: PlatformPerformanceChartState) {
	switch (state.kind) {
		case "loading":
			return <PlatformPerformanceLoadingState />;
		case "full-error":
			return (
				<PlatformPerformanceErrorState errorMessage={state.errorMessage} />
			);
		case "empty-campaigns":
			return (
				<PlatformPerformanceEmptyState message="필터 조건에 맞는 캠페인이 없습니다." />
			);
		case "empty-data":
			return (
				<PlatformPerformanceEmptyState message="표시할 데이터가 없습니다." />
			);
		case "chart":
			return null;
	}
}

export function PlatformPerformanceChartCard() {
	const filter = useAtomValue(globalFilterAtom);
	const [activeMetricKey, setActiveMetricKey] = useState<PlatformMetricKey>(
		defaultPlatformPerformanceMetricKey,
	);
	const query = useQuery({
		...getDashboardDataQueryOptions(filter),
		placeholderData: keepPreviousData,
	});
	const toggleGlobalFilterPlatform = useSetAtom(toggleGlobalFilterPlatformAtom);

	const handleMetricChange = useCallback((metricKey: string) => {
		setActiveMetricKey(metricKey as PlatformMetricKey);
	}, []);

	const handlePlatformSelection = useCallback(
		(platform: string) => {
			toggleGlobalFilterPlatform(platform as never);
		},
		[toggleGlobalFilterPlatform],
	);

	const slices = useMemo(() => {
		if (query.data === undefined) {
			return [] as PlatformPerformanceSlice[];
		}

		return aggregatePlatformPerformance({
			campaigns: query.data.campaigns,
			dailyStats: query.data.dailyStats,
			metricKey: activeMetricKey,
			selectedPlatforms: filter.platforms,
		});
	}, [activeMetricKey, filter.platforms, query.data]);

	const state = resolvePlatformPerformanceChartState({
		campaigns: query.data?.campaigns ?? null,
		isLoadingError: query.isLoadingError,
		isPending: query.isPending,
		isRefetchError: query.isRefetchError,
		isRefetching: query.isRefetching,
		err: query.error as Error | null,
		slices,
	});

	const metricDefinition = getPlatformPerformanceMetric(activeMetricKey);

	return (
		<section className="rounded-panel border border-outline-subtle bg-panel p-panel shadow-panel">
			<div className="flex flex-col gap-5">
				<div className="flex flex-col gap-2">
					<h2>플랫폼별 성과</h2>
					<p className="typo-body-sm text-fg-muted">
						전역 필터 기준으로 플랫폼별 성과를 집계한 도넛 차트입니다.
					</p>
				</div>

				{state.kind === "chart" ? (
					<>
						{state.staleErrorMessage ? (
							<div className="rounded-card border border-status-danger-border bg-status-danger/30 px-4 py-3 typo-body-sm text-status-danger-fg">
								<p>
									최신 성과 데이터를 불러오지 못해 마지막 성공 결과를 표시
									중입니다.
								</p>
							</div>
						) : null}

						{state.isSyncing ? (
							<p
								className="typo-body-sm text-fg-muted"
								role="status"
								aria-live="polite"
							>
								동기화 중
							</p>
						) : null}

						<div className="-mx-1 overflow-x-auto px-1 lg:mx-0 lg:self-start lg:px-0">
							<PlatformPerformanceMetricToggleGroup
								activeMetricKey={activeMetricKey}
								onMetricChange={handleMetricChange}
								metricDefinitionLookup={platformPerformanceMetricDefinitions}
							/>
						</div>
						<PlatformPerformanceDonut
							data={state.slices}
							metric={metricDefinition}
							onPlatformSelect={handlePlatformSelection}
						/>
					</>
				) : null}

				{state.kind !== "chart" ? renderBody(state) : null}
			</div>
		</section>
	);
}
