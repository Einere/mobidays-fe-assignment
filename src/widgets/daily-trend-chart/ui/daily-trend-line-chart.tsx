import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import type { DailyTrendPoint } from "@/entities/daily-stat/lib/build-daily-trend-series";
import {
	ChartContainer,
	ChartLegend,
	ChartTooltip,
	ChartTooltipContent,
} from "@/shared/ui/chart";
import {
	buildDailyTrendChartConfig,
	createDailyTrendTooltipFormatter,
	dailyTrendVisibleMetricDefinitions,
	formatDailyTrendDateLabel,
	formatDailyTrendYAxisTick,
} from "@/widgets/daily-trend-chart/model/daily-trend-chart";
import type { DailyTrendMetricKey } from "@/widgets/daily-trend-chart/model/metrics";

const toggleMetricDefinitions = dailyTrendVisibleMetricDefinitions;
const chartConfig = buildDailyTrendChartConfig(toggleMetricDefinitions);
const tooltipContent = (
	<ChartTooltipContent formatter={createDailyTrendTooltipFormatter()} />
);

export function DailyTrendLineChart({
	data,
	activeMetrics,
}: {
	data: DailyTrendPoint[];
	activeMetrics: DailyTrendMetricKey[];
}) {
	return (
		<ChartContainer
			className="h-80 min-w-[720px] sm:min-w-0"
			config={chartConfig}
		>
			<LineChart data={data} aria-label="일별 추이 차트" role="img">
				<CartesianGrid vertical={false} stroke="var(--color-outline-subtle)" />
				<XAxis
					axisLine={false}
					dataKey="date"
					minTickGap={24}
					tickFormatter={formatDailyTrendDateLabel}
					tickLine={false}
				/>
				<YAxis
					axisLine={false}
					tickFormatter={formatDailyTrendYAxisTick}
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

export { DailyTrendMetricToggleGroup } from "./daily-trend-metric-toggle-group";
