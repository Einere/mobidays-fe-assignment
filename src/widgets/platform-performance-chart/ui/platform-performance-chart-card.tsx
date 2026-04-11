import type { ReactNode } from "react";
import { usePlatformPerformanceChartViewModel } from "@/widgets/platform-performance-chart/model/use-platform-performance-chart-view-model";
import {
	PlatformPerformanceDonut,
	PlatformPerformanceMetricToggleGroup,
} from "@/widgets/platform-performance-chart/ui/platform-performance-donut-chart";

function PlatformPerformanceLoadingState() {
	return (
		<div
			className="rounded-card border border-outline-subtle bg-panel-muted"
			role="status"
			aria-live="polite"
			aria-busy="true"
			aria-label="성과 데이터를 불러오는 중"
		>
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
		<div
			className="rounded-card border border-status-danger-border bg-status-danger/30 px-4 py-5 typo-body-sm text-status-danger-fg"
			role="alert"
		>
			<p>성과 데이터를 불러오지 못했습니다.</p>
			<p className="mt-1 text-fg-muted">{errorMessage}</p>
		</div>
	);
}

function PlatformPerformanceChartCardFrame({
	children,
	status,
}: {
	children: ReactNode;
	status?: ReactNode;
}) {
	return (
		<section className="rounded-panel border border-outline-subtle bg-panel p-panel shadow-panel">
			<div className="flex flex-col gap-5">
				<div className="flex flex-col gap-2">
					<h2>플랫폼별 성과</h2>
					<p className="typo-body-sm text-fg-muted">
						전역 필터 기준으로 플랫폼별 성과를 집계한 도넛 차트입니다.
					</p>
				</div>

				{status ? <div className="min-h-5">{status}</div> : null}
				{children}
			</div>
		</section>
	);
}

function renderBody(
	state: ReturnType<typeof usePlatformPerformanceChartViewModel>["state"],
) {
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
	const {
		activeMetricKey,
		handlePlatformSelection,
		metricDefinition,
		state,
		toggleMetric,
	} = usePlatformPerformanceChartViewModel();

	return (
		<PlatformPerformanceChartCardFrame
			status={
				state.kind === "chart" ? (
					<>
						{state.staleErrorMessage ? (
							<div
								className="rounded-card border border-status-danger-border bg-status-danger/30 px-4 py-3 typo-body-sm text-status-danger-fg"
								role="alert"
							>
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
					</>
				) : null
			}
		>
			{state.kind === "chart" ? (
				<>
					<div className="-mx-1 overflow-x-auto px-1 lg:mx-0 lg:self-start lg:px-0">
						<PlatformPerformanceMetricToggleGroup
							activeMetricKey={activeMetricKey}
							onMetricChange={toggleMetric}
						/>
					</div>
					<PlatformPerformanceDonut
						data={state.slices}
						metric={metricDefinition}
						onPlatformSelect={handlePlatformSelection}
					/>
				</>
			) : (
				renderBody(state)
			)}
		</PlatformPerformanceChartCardFrame>
	);
}
