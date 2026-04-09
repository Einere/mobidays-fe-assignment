import { useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import type { DailyTrendPoint } from "@/entities/daily-stat/lib/build-daily-trend-series";
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
	visibleDailyTrendMetricKeys,
} from "@/widgets/daily-trend-chart/model/metrics";

const toggleMetricDefinitions = visibleDailyTrendMetricKeys.map((metricKey) =>
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

export function DailyTrendLineChart({
	data,
	metricGroupLabel = "일별 추이 메트릭",
}: {
	data: DailyTrendPoint[];
	metricGroupLabel?: string;
}) {
	const [activeMetrics, setActiveMetrics] = useState<DailyTrendMetricKey[]>([
		...defaultDailyTrendMetricKeys,
	]);

	function toggleMetric(metricKey: DailyTrendMetricKey) {
		setActiveMetrics((currentMetrics) =>
			toggleDailyTrendMetricSelection(currentMetrics, metricKey),
		);
	}

	return (
		<>
			<fieldset className="flex flex-wrap gap-2" aria-label={metricGroupLabel}>
				<legend className="sr-only">{metricGroupLabel}</legend>
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

			<ChartContainer className="h-80" config={chartConfig}>
				<LineChart data={data}>
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
									return formatDailyTrendMetricValue(
										metricKey,
										typeof value === "number" ? value : null,
									);
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
								dot={true}
								connectNulls={false}
							/>
						))}
				</LineChart>
			</ChartContainer>
		</>
	);
}
