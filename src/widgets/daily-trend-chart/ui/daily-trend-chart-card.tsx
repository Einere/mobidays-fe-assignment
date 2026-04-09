import { useAtomValue } from "jotai";
import { useRef } from "react";
import {
	buildDailyTrendSeries,
	type DailyTrendPoint,
} from "@/entities/daily-stat/lib/build-daily-trend-series";
import { useDashboardData } from "@/entities/dashboard/api/use-dashboard-data";
import { globalFilterAtom } from "@/entities/global-filter/model/store";
import { DailyTrendLineChart } from "@/widgets/daily-trend-chart/ui/daily-trend-line-chart";

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

export function resolveDailyTrendChartViewState({
	currentSnapshot,
	errorMessage,
	isError,
	isFetching,
	isPending,
}: {
	currentSnapshot: ResolvedChartSnapshot | null;
	errorMessage: string | null;
	isError: boolean;
	isFetching: boolean;
	isPending: boolean;
}): DailyTrendChartViewState {
	if (currentSnapshot === null) {
		if (isPending) {
			return { kind: "loading" };
		}

		if (isError) {
			return {
				kind: "full-error",
				errorMessage: errorMessage ?? "알 수 없는 오류가 발생했습니다.",
			};
		}

		return { kind: "empty-data" };
	}

	if (currentSnapshot.campaignsCount === 0) {
		return { kind: "empty-campaigns" };
	}

	if (currentSnapshot.chartData.length === 0) {
		return { kind: "empty-data" };
	}

	return {
		kind: "chart",
		chartData: currentSnapshot.chartData,
		isSyncing: isFetching,
		staleErrorMessage: isError
			? (errorMessage ?? "알 수 없는 오류가 발생했습니다.")
			: null,
	};
}

export function DailyTrendChartCard() {
	const filter = useAtomValue(globalFilterAtom);
	const query = useDashboardData(filter);
	const lastSuccessfulSnapshotRef = useRef<ResolvedChartSnapshot | null>(null);

	const successfulSnapshot =
		query.data === undefined
			? null
			: createResolvedChartSnapshot(
					query.data.dailyStats,
					query.data.campaigns.length,
				);

	if (successfulSnapshot !== null) {
		lastSuccessfulSnapshotRef.current = successfulSnapshot;
	}

	const currentSnapshot =
		successfulSnapshot ?? lastSuccessfulSnapshotRef.current;
	const viewState = resolveDailyTrendChartViewState({
		currentSnapshot,
		errorMessage: query.error?.message ?? null,
		isError: query.isError,
		isFetching: query.isFetching && currentSnapshot !== null,
		isPending: query.isPending,
	});

	return (
		<section className="rounded-panel border border-outline-subtle bg-panel p-panel shadow-panel">
			<div className="flex flex-col gap-5">
				<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
					<div className="flex flex-col gap-2">
						<h2 className="text-heading-lg">성과 개요</h2>
						<p className="text-body-sm text-fg-muted">
							전역 필터 기준으로 집계한 일별 추이 꺾은선 그래프입니다.
						</p>
					</div>
				</div>

				{viewState.kind === "loading" ? (
					<div
						className="h-80 rounded-card border border-outline-subtle bg-panel-muted"
						data-testid="daily-trend-loading"
					/>
				) : viewState.kind === "full-error" ? (
					<div className="rounded-card border border-status-danger-border bg-status-danger/30 px-4 py-5 text-body-sm text-status-danger-fg">
						<p>성과 데이터를 불러오지 못했습니다.</p>
						<p className="mt-1 text-caption">{viewState.errorMessage}</p>
					</div>
				) : viewState.kind === "empty-campaigns" ? (
					<div className="flex h-80 items-center justify-center rounded-card border border-outline-subtle bg-panel-muted px-4 text-body-sm text-fg-muted">
						필터 조건에 맞는 캠페인이 없습니다.
					</div>
				) : viewState.kind === "empty-data" ? (
					<div className="flex h-80 items-center justify-center rounded-card border border-outline-subtle bg-panel-muted px-4 text-body-sm text-fg-muted">
						선택한 캠페인에 표시할 일별 데이터가 없습니다.
					</div>
				) : (
					<DailyTrendLineChart data={viewState.chartData} />
				)}

				{viewState.kind === "chart" && viewState.staleErrorMessage ? (
					<div className="rounded-card border border-status-danger-border bg-status-danger/30 px-4 py-3 text-body-sm text-status-danger-fg">
						<p>
							최신 성과 데이터를 불러오지 못해 마지막 성공 결과를 표시 중입니다.
						</p>
						<p className="mt-1 text-caption">{viewState.staleErrorMessage}</p>
					</div>
				) : null}

				{viewState.kind === "chart" && viewState.isSyncing ? (
					<p
						className="text-body-sm text-fg-muted"
						role="status"
						aria-live="polite"
					>
						동기화 중
					</p>
				) : null}
			</div>
		</section>
	);
}
