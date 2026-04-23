import { useId, useMemo } from "react";
import { Cell, Pie, PieChart } from "recharts";
import type { CampaignPlatform } from "@/entities/global-filter/model/types";
import type { PlatformPerformanceSlice } from "@/entities/platform-performance/model/types";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/shared/ui/chart";
import {
	buildPlatformPerformanceChartConfig,
	extractPlatformFromPiePayload,
	getPlatformPerformanceDonutColor,
	isKnownCampaignPlatformForDonut,
	percentageFormatter,
} from "@/widgets/platform-performance-chart/model/platform-performance-donut";
import type { PlatformPerformanceMetricDefinition } from "@/widgets/platform-performance-chart/model/platform-performance-metrics";
import { PlatformPerformanceDonutLegend } from "@/widgets/platform-performance-chart/ui/platform-performance-donut-legend";
import { PlatformPerformanceDonutSummaryTable } from "@/widgets/platform-performance-chart/ui/platform-performance-donut-summary-table";
import { PlatformPerformancePieSector } from "@/widgets/platform-performance-chart/ui/platform-performance-pie-sector";

type DonutData = {
	data: PlatformPerformanceSlice[];
	metric: PlatformPerformanceMetricDefinition;
	onPlatformSelect: (platform: CampaignPlatform) => void;
};

export function PlatformPerformanceDonut({
	data,
	metric,
	onPlatformSelect,
}: DonutData) {
	const summaryId = useId();
	const chartConfig = useMemo(
		() => buildPlatformPerformanceChartConfig(data),
		[data],
	);
	const sliceByPlatform = useMemo(
		() =>
			new Map<string, PlatformPerformanceSlice>(
				data.map((slice) => [slice.platform, slice]),
			),
		[data],
	);
	const tooltipFormatter = useMemo(
		() => (_: unknown, name: string | number) => {
			const matchedSlice = sliceByPlatform.get(String(name));
			const metricLabel = matchedSlice
				? `${metric.label} ${metric.formatValue(matchedSlice.value)}`
				: "-";
			const share = matchedSlice
				? ` (${percentageFormatter.format(matchedSlice.sharePercent)})`
				: "";

			return `${metricLabel}${share}`;
		},
		[metric, sliceByPlatform],
	);

	return (
		<div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[minmax(0,1.1fr)_220px] lg:gap-5">
			<PlatformPerformanceDonutSummaryTable
				id={summaryId}
				data={data}
				metricLabel={metric.label}
				formatValue={metric.formatValue}
			/>
			<div className="relative flex min-w-0 flex-col rounded-card border border-outline-subtle bg-panel p-3 sm:p-4">
				<div
					className="relative h-64 sm:h-72"
					aria-describedby={summaryId}
					role="img"
					aria-label={`플랫폼별 ${metric.label} 도넛 차트`}
				>
					<ChartContainer className="absolute inset-0" config={chartConfig}>
						<PieChart>
							<Pie
								data={data}
								dataKey="value"
								nameKey="platform"
								innerRadius={60}
								outerRadius={105}
								paddingAngle={4}
								shape={
									<PlatformPerformancePieSector
										onPlatformSelect={onPlatformSelect}
									/>
								}
								onClick={(payload: unknown) => {
									const platform = extractPlatformFromPiePayload(payload);

									if (platform !== null) {
										onPlatformSelect(platform);
									}
								}}
							>
								{data.map((slice, index) => (
									<Cell
										key={slice.platform}
										name={slice.platform}
										fill={getPlatformPerformanceDonutColor(
											slice.platform,
											index,
										)}
										opacity={
											isKnownCampaignPlatformForDonut(slice.platform)
												? slice.isSelected
													? 1
													: 0.35
												: 1
										}
									/>
								))}
							</Pie>
							<ChartTooltip
								content={<ChartTooltipContent formatter={tooltipFormatter} />}
							/>
						</PieChart>
					</ChartContainer>
					<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
						<p className="typo-caption text-fg-subtle">현재 기준</p>
						<p className="typo-heading-sm">{metric.label}</p>
					</div>
				</div>
			</div>
			<PlatformPerformanceDonutLegend
				data={data}
				metricLabel={metric.label}
				formatValue={metric.formatValue}
				onPlatformSelect={onPlatformSelect}
			/>
		</div>
	);
}

export { PlatformPerformanceMetricToggleGroup } from "@/widgets/platform-performance-chart/ui/platform-performance-metric-toggle-group";
export { PlatformPerformancePieSector } from "@/widgets/platform-performance-chart/ui/platform-performance-pie-sector";
