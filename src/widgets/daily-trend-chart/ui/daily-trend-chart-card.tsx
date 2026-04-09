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

function createResolvedChartSnapshot(
	dailyStats: Parameters<typeof buildDailyTrendSeries>[0],
	campaignsCount: number,
): ResolvedChartSnapshot {
	return {
		campaignsCount,
		chartData: buildDailyTrendSeries(dailyStats),
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
	const isInitialLoading = query.isPending && currentSnapshot === null;
	const isSyncing = query.isFetching && currentSnapshot !== null;
	const shouldShowFullError = query.isError && currentSnapshot === null;
	const shouldShowSecondaryError = query.isError && currentSnapshot !== null;

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

				{shouldShowFullError ? (
					<div className="rounded-card border border-status-danger-border bg-status-danger/30 px-4 py-5 text-body-sm text-status-danger-fg">
						<p>성과 데이터를 불러오지 못했습니다.</p>
						<p className="mt-1 text-caption">{query.error.message}</p>
					</div>
				) : isInitialLoading ? (
					<div
						className="h-80 rounded-card border border-outline-subtle bg-panel-muted"
						data-testid="daily-trend-loading"
					/>
				) : currentSnapshot?.campaignsCount === 0 ? (
					<div className="flex h-80 items-center justify-center rounded-card border border-outline-subtle bg-panel-muted px-4 text-body-sm text-fg-muted">
						필터 조건에 맞는 캠페인이 없습니다.
					</div>
				) : currentSnapshot === null ||
					currentSnapshot.chartData.length === 0 ? (
					<div className="flex h-80 items-center justify-center rounded-card border border-outline-subtle bg-panel-muted px-4 text-body-sm text-fg-muted">
						선택한 캠페인에 표시할 일별 데이터가 없습니다.
					</div>
				) : (
					<DailyTrendLineChart data={currentSnapshot.chartData} />
				)}

				{shouldShowSecondaryError ? (
					<div className="rounded-card border border-status-danger-border bg-status-danger/30 px-4 py-3 text-body-sm text-status-danger-fg">
						<p>
							최신 성과 데이터를 불러오지 못해 마지막 성공 결과를 표시 중입니다.
						</p>
						<p className="mt-1 text-caption">{query.error.message}</p>
					</div>
				) : null}

				{isSyncing ? (
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
