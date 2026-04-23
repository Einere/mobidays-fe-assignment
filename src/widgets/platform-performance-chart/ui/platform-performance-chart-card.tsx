import type { ReactNode } from "react";
import { SyncingIndicator } from "@/shared/ui/syncing-indicator";
import { usePlatformPerformanceChartViewModel } from "@/widgets/platform-performance-chart/model/use-platform-performance-chart-view-model";
import { PlatformPerformanceChartContent } from "@/widgets/platform-performance-chart/ui/platform-performance-chart-content";
import { PlatformPerformanceChartFrame } from "@/widgets/platform-performance-chart/ui/platform-performance-chart-frame";
import { PlatformPerformanceChartStatus } from "@/widgets/platform-performance-chart/ui/platform-performance-chart-status";

function resolvePlatformPerformanceChartStatus(
	state: ReturnType<typeof usePlatformPerformanceChartViewModel>["state"],
): ReactNode {
	switch (state.kind) {
		case "loading":
			return <PlatformPerformanceChartStatus kind="loading" />;
		case "full-error":
			return (
				<PlatformPerformanceChartStatus
					kind="full-error"
					errorMessage={state.errorMessage}
				/>
			);
		case "empty-campaigns":
			return (
				<PlatformPerformanceChartStatus
					kind="empty-campaigns"
					message="필터 조건에 맞는 캠페인이 없습니다."
				/>
			);
		case "empty-data":
			return (
				<PlatformPerformanceChartStatus
					kind="empty-data"
					message="표시할 데이터가 없습니다."
				/>
			);
		case "chart":
			return (
				<>
					{state.staleErrorMessage ? (
						<PlatformPerformanceChartStatus
							kind="stale"
							message="최신 성과 데이터를 불러오지 못해 마지막 성공 결과를 표시 중입니다."
						/>
					) : null}
				</>
			);
	}
}

export function PlatformPerformanceChartCard() {
	const {
		activeMetricKey,
		handlePlatformSelection,
		metricDefinition,
		state,
		toggleMetric,
	} = usePlatformPerformanceChartViewModel();

	const isSyncing = state.kind === "chart" && state.isSyncing;
	const status = resolvePlatformPerformanceChartStatus(state);

	return (
		<PlatformPerformanceChartFrame
			status={status}
			titleTrailing={isSyncing ? <SyncingIndicator /> : null}
		>
			{state.kind === "chart" ? (
				<PlatformPerformanceChartContent
					activeMetricKey={activeMetricKey}
					toggleMetric={toggleMetric}
					metricDefinition={metricDefinition}
					slices={state.slices}
					onPlatformSelect={handlePlatformSelection}
				/>
			) : null}
		</PlatformPerformanceChartFrame>
	);
}
