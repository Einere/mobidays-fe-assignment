import type { ReactNode } from "react";
import { SyncingIndicator } from "@/shared/ui/syncing-indicator";
import type { DailyTrendChartViewState } from "@/widgets/daily-trend-chart/model/use-daily-trend-chart-view-model";
import { useDailyTrendChartViewModel } from "@/widgets/daily-trend-chart/model/use-daily-trend-chart-view-model";
import { DailyTrendChartContent } from "@/widgets/daily-trend-chart/ui/daily-trend-chart-content";
import { DailyTrendChartFrame } from "@/widgets/daily-trend-chart/ui/daily-trend-chart-frame";
import { DailyTrendChartStatus } from "@/widgets/daily-trend-chart/ui/daily-trend-chart-status";
import { DailyTrendMetricToggleGroup } from "@/widgets/daily-trend-chart/ui/daily-trend-metric-toggle-group";

function resolveDailyTrendChartStatus(
	viewState: DailyTrendChartViewState,
): ReactNode {
	switch (viewState.kind) {
		case "loading":
			return <DailyTrendChartStatus kind="loading" />;
		case "full-error":
			return <DailyTrendChartStatus kind="full-error" />;
		case "empty-campaigns":
			return (
				<DailyTrendChartStatus
					kind="empty-campaigns"
					message="필터 조건에 맞는 캠페인이 없습니다."
				/>
			);
		case "empty-data":
			return (
				<DailyTrendChartStatus
					kind="empty-data"
					message="선택한 캠페인에 표시할 일별 데이터가 없습니다."
				/>
			);
		case "chart":
			return (
				<>
					{viewState.staleErrorMessage ? (
						<DailyTrendChartStatus
							kind="stale"
							message="최신 성과 데이터를 불러오지 못해 마지막 성공 결과를 표시 중입니다."
						/>
					) : null}
				</>
			);
	}
}

export function DailyTrendChartCard() {
	const { activeMetrics, toggleMetric, viewState } =
		useDailyTrendChartViewModel();
	const isChartState = viewState.kind === "chart";
	const isSyncing = isChartState && viewState.isSyncing;
	const status = resolveDailyTrendChartStatus(viewState);

	return (
		<DailyTrendChartFrame
			actions={
				isChartState ? (
					<DailyTrendMetricToggleGroup
						activeMetrics={activeMetrics}
						metricGroupLabel="일별 추이 메트릭"
						onToggleMetric={toggleMetric}
					/>
				) : null
			}
			titleTrailing={isSyncing ? <SyncingIndicator /> : null}
			status={status}
		>
			{isChartState ? (
				<DailyTrendChartContent
					activeMetrics={activeMetrics}
					data={viewState.chartData}
				/>
			) : null}
		</DailyTrendChartFrame>
	);
}
