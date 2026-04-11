import type { ReactNode } from "react";
import { DataDenseScrollArea } from "@/shared/ui/data-dense-scroll-area";
import type { DailyTrendChartViewState } from "@/widgets/daily-trend-chart/model/use-daily-trend-chart-view-model";
import { useDailyTrendChartViewModel } from "@/widgets/daily-trend-chart/model/use-daily-trend-chart-view-model";
import {
	DailyTrendLineChart,
	DailyTrendMetricToggleGroup,
} from "@/widgets/daily-trend-chart/ui/daily-trend-line-chart";

export { resolveDailyTrendChartViewState } from "@/widgets/daily-trend-chart/model/use-daily-trend-chart-view-model";

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
	const { activeMetrics, toggleMetric, viewState } =
		useDailyTrendChartViewModel();

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
