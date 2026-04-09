import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import type { DailyTrendPoint } from "@/entities/daily-stat/lib/build-daily-trend-series";
import {
	ChartContainer,
	ChartLegend,
	ChartTooltip,
	ChartTooltipContent,
} from "@/shared/ui/chart";
import { ToggleButton } from "@/shared/ui/toggle-button";
import {
	type DailyTrendMetricKey,
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

function tooltipFormatter(value: unknown, metricKey?: string) {
	if (metricKey === undefined) {
		return formatDailyTrendMetricValue("impressions", null);
	}

	return formatDailyTrendMetricValue(
		metricKey as DailyTrendMetricKey,
		typeof value === "number" ? value : null,
	);
}

const tooltipContent = <ChartTooltipContent formatter={tooltipFormatter} />;

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

export function DailyTrendMetricToggleGroup({
	activeMetrics,
	metricGroupLabel = "일별 추이 메트릭",
	onToggleMetric,
}: {
	activeMetrics: DailyTrendMetricKey[];
	metricGroupLabel?: string;
	onToggleMetric: (metricKey: DailyTrendMetricKey) => void;
}) {
	return (
		<fieldset
			className="flex flex-wrap justify-end gap-2"
			aria-label={metricGroupLabel}
		>
			<legend className="sr-only">{metricGroupLabel}</legend>
			{toggleMetricDefinitions.map((metric) => {
				const isActive = activeMetrics.includes(metric.key);

				return (
					<ToggleButton
						key={metric.key}
						type="button"
						pressed={isActive}
						onClick={() => onToggleMetric(metric.key)}
					>
						{metric.label}
					</ToggleButton>
				);
			})}
		</fieldset>
	);
}

export function DailyTrendLineChart({
	data,
	activeMetrics,
}: {
	data: DailyTrendPoint[];
	activeMetrics: DailyTrendMetricKey[];
}) {
	return (
		<ChartContainer className="h-80" config={chartConfig}>
			<LineChart data={data}>
				<CartesianGrid vertical={false} stroke="var(--color-outline-subtle)" />
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
				<ChartTooltip content={tooltipContent} />
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
	);
}
