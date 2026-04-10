import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { type ReactNode, useCallback, useState } from "react";
import {
	buildDailyTrendSeries,
	type DailyTrendPoint,
} from "@/entities/daily-stat/lib/build-daily-trend-series";
import { getDashboardDataQueryOptions } from "@/entities/dashboard/hooks/use-dashboard-data";
import { globalFilterAtom } from "@/entities/global-filter/model/store";
import { DataDenseScrollArea } from "@/shared/ui/data-dense-scroll-area";
import {
	type DailyTrendMetricKey,
	defaultDailyTrendMetricKeys,
} from "@/widgets/daily-trend-chart/model/metrics";
import {
	DailyTrendLineChart,
	DailyTrendMetricToggleGroup,
	toggleDailyTrendMetricSelection,
} from "@/widgets/daily-trend-chart/ui/daily-trend-line-chart";

type ResolvedChartSnapshot = {
	campaignsCount: number;
	chartData: DailyTrendPoint[];
};

type DailyTrendChartViewState =
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

function createResolvedChartSnapshot(
	dailyStats: Parameters<typeof buildDailyTrendSeries>[0],
	campaignsCount: number,
): ResolvedChartSnapshot {
	return {
		campaignsCount,
		chartData: buildDailyTrendSeries(dailyStats),
	};
}

function DailyTrendChartCardFrame({
	children,
	actions,
	status,
}: {
	children: ReactNode;
	actions?: ReactNode;
	status?: ReactNode;
}) {
	return (
		<section className="rounded-panel border border-outline-subtle bg-panel p-panel shadow-panel">
			<div className="flex flex-col gap-5">
				<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
					<div className="flex flex-col gap-2">
						<h2>성과 개요</h2>
						<p className="typo-body-sm text-fg-muted">
							전역 필터 기준으로 집계한 일별 추이 꺾은선 그래프입니다.
						</p>
					</div>
					{actions ? (
						<div className="-mx-1 overflow-x-auto px-1 lg:mx-0 lg:self-start lg:px-0">
							{actions}
						</div>
					) : null}
				</div>
				<div className="min-h-5">{status ?? null}</div>
				{children}
			</div>
		</section>
	);
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

function renderDailyTrendChartBody(viewState: DailyTrendChartViewState) {
	switch (viewState.kind) {
		case "loading":
			return (
				<div
					className="h-80 rounded-card border border-outline-subtle bg-panel-muted"
					data-testid="daily-trend-loading"
				/>
			);
		case "full-error":
			return (
				<div className="rounded-card border border-status-danger-border bg-status-danger/30 px-4 py-5 typo-body-sm text-status-danger-fg">
					<p>성과 데이터를 불러오지 못했습니다.</p>
				</div>
			);
		case "empty-campaigns":
			return (
				<div className="flex h-80 items-center justify-center rounded-card border border-outline-subtle bg-panel-muted px-4 typo-body-sm text-fg-muted">
					필터 조건에 맞는 캠페인이 없습니다.
				</div>
			);
		case "empty-data":
			return (
				<div className="flex h-80 items-center justify-center rounded-card border border-outline-subtle bg-panel-muted px-4 typo-body-sm text-fg-muted">
					선택한 캠페인에 표시할 일별 데이터가 없습니다.
				</div>
			);
	}
}

function DailyTrendChartCardMeta({
	viewState,
}: {
	viewState: DailyTrendChartViewState;
}) {
	if (viewState.kind !== "chart") {
		return null;
	}

	return (
		<>
			{viewState.staleErrorMessage ? (
				<div className="rounded-card border border-status-danger-border bg-status-danger/30 px-4 py-3 typo-body-sm text-status-danger-fg">
					<p>
						최신 성과 데이터를 불러오지 못해 마지막 성공 결과를 표시 중입니다.
					</p>
				</div>
			) : null}

			{viewState.isSyncing ? (
				<p
					className="typo-body-sm text-fg-muted"
					role="status"
					aria-live="polite"
				>
					동기화 중
				</p>
			) : null}
		</>
	);
}

export function DailyTrendChartCard() {
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
	const currentDataSnapshot =
		query.data === undefined
			? null
			: createResolvedChartSnapshot(
					query.data.dailyStats,
					query.data.campaigns.length,
				);

	const viewState = resolveDailyTrendChartViewState({
		currentDataSnapshot,
		errorMessage: query.error?.message ?? null,
		isLoadingError: query.isLoadingError,
		isPending: query.isPending,
		isRefetchError: query.isRefetchError,
		isRefetching: query.isRefetching,
	});

	return (
		<DailyTrendChartCardFrame
			actions={
				viewState.kind === "chart" ? (
					<DailyTrendMetricToggleGroup
						activeMetrics={activeMetrics}
						metricGroupLabel="일별 추이 메트릭"
						onToggleMetric={toggleMetric}
					/>
				) : null
			}
			status={<DailyTrendChartCardMeta viewState={viewState} />}
		>
			{viewState.kind === "chart" ? (
				<DataDenseScrollArea
					hint="좌우로 스크롤해 추이 전체를 비교하세요."
					className="-mx-2 px-2 sm:mx-0 sm:px-0"
					viewportTestId="daily-trend-scroll-area"
				>
					<DailyTrendLineChart
						activeMetrics={activeMetrics}
						data={viewState.chartData}
					/>
				</DataDenseScrollArea>
			) : (
				renderDailyTrendChartBody(viewState)
			)}
		</DailyTrendChartCardFrame>
	);
}
