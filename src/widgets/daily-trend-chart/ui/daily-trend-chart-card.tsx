import { useAtomValue } from "jotai";
import { useRef, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
	buildDailyTrendSeries,
	type DailyTrendPoint,
} from "@/entities/daily-stat/lib/build-daily-trend-series";
import { useDashboardData } from "@/entities/dashboard/api/use-dashboard-data";
import { globalFilterAtom } from "@/entities/global-filter/model/store";
import { Button } from "@/shared/ui/button";
import {
	ChartContainer,
	ChartLegend,
	ChartTooltip,
	ChartTooltipContent,
} from "@/shared/ui/chart";
import {
	type DailyTrendMetricKey,
	defaultDailyTrendMetricKeys,
	formatDailyTrendMetricValue,
	getDailyTrendMetric,
} from "@/widgets/daily-trend-chart/model/metrics";

type ResolvedChartSnapshot = {
	campaignsCount: number;
	chartData: DailyTrendPoint[];
};

const toggleMetricDefinitions = defaultDailyTrendMetricKeys.map((metricKey) =>
	getDailyTrendMetric(metricKey),
);

const chartConfig = Object.fromEntries(
	toggleMetricDefinitions.map((metric) => [
		metric.key,
		{
			label: metric.label,
			color: metric.chartColor,
		},
	]),
);

const numberFormatter = new Intl.NumberFormat("ko-KR");

function formatDateLabel(value: string) {
	return value.slice(5);
}

function formatYAxisTick(value: number) {
	return numberFormatter.format(value);
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

export function toggleDailyTrendMetricSelection(
	currentMetrics: DailyTrendMetricKey[],
	metricKey: DailyTrendMetricKey,
) {
	const isActive = currentMetrics.includes(metricKey);

	if (isActive && currentMetrics.length === 1) {
		return currentMetrics;
	}

	if (isActive) {
		return currentMetrics.filter(
			(currentMetric) => currentMetric !== metricKey,
		);
	}

	return toggleMetricDefinitions
		.map((metric) => metric.key)
		.filter(
			(candidateMetric) =>
				candidateMetric === metricKey ||
				currentMetrics.includes(candidateMetric),
		);
}

export function DailyTrendChartCard() {
	const filter = useAtomValue(globalFilterAtom);
	const query = useDashboardData(filter);
	const [activeMetrics, setActiveMetrics] = useState<DailyTrendMetricKey[]>([
		...defaultDailyTrendMetricKeys,
	]);
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

	function toggleMetric(metricKey: DailyTrendMetricKey) {
		setActiveMetrics((currentMetrics) =>
			toggleDailyTrendMetricSelection(currentMetrics, metricKey),
		);
	}

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

					<fieldset
						className="flex flex-wrap gap-2"
						aria-label="일별 추이 메트릭"
					>
						{toggleMetricDefinitions.map((metric) => {
							const isActive = activeMetrics.includes(metric.key);

							return (
								<Button
									key={metric.key}
									type="button"
									size="sm"
									variant={isActive ? "secondary" : "outline"}
									aria-pressed={isActive}
									onClick={() => toggleMetric(metric.key)}
								>
									{metric.label}
								</Button>
							);
						})}
					</fieldset>
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
					<ChartContainer className="h-80" config={chartConfig}>
						<LineChart data={currentSnapshot.chartData}>
							<CartesianGrid
								vertical={false}
								stroke="var(--color-outline-subtle)"
							/>
							<XAxis
								axisLine={false}
								dataKey="date"
								minTickGap={24}
								tickFormatter={formatDateLabel}
								tickLine={false}
							/>
							<YAxis
								axisLine={false}
								tickFormatter={formatYAxisTick}
								tickLine={false}
								width={56}
							/>
							<ChartTooltip
								content={
									<ChartTooltipContent
										formatter={(value, metricKey) => {
											if (
												metricKey === "impressions" ||
												metricKey === "clicks"
											) {
												return formatDailyTrendMetricValue(
													metricKey,
													typeof value === "number" ? value : null,
												);
											}

											return "-";
										}}
									/>
								}
							/>
							<ChartLegend />
							{toggleMetricDefinitions
								.filter((metric) => activeMetrics.includes(metric.key))
								.map((metric) => (
									<Line
										key={metric.key}
										type="monotone"
										dataKey={metric.key}
										name={metric.key}
										stroke={`var(--color-${metric.key})`}
										strokeWidth={2}
										dot={false}
										connectNulls={false}
									/>
								))}
						</LineChart>
					</ChartContainer>
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
