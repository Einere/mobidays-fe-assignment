import { Cell, Pie, PieChart } from "recharts";
import type { PlatformPerformanceSlice } from "@/entities/platform-performance/model/types";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/shared/ui/chart";
import { ToggleButton } from "@/shared/ui/toggle-button";
import {
	type PlatformPerformanceMetricDefinition,
	platformPerformanceMetricDefinitions,
} from "@/widgets/platform-performance-chart/model/platform-performance-metrics";

type MetricSelectionProps = {
	activeMetricKey: string;
	onMetricChange: (metricKey: string) => void;
	metricDefinitionLookup?: readonly PlatformPerformanceMetricDefinition[];
};

const percentageFormatter = new Intl.NumberFormat("ko-KR", {
	maximumFractionDigits: 1,
	minimumFractionDigits: 0,
});

const platformColorMap: Record<string, string> = {
	Google: "var(--chart-danger)",
	Meta: "var(--chart-positive)",
	Naver: "var(--chart-warning)",
};

const fallbackPlatformColors = [
	"var(--chart-series-4)",
	"var(--chart-series-5)",
	"var(--chart-series-1)",
	"var(--chart-series-2)",
	"var(--chart-series-3)",
];

function getPlatformColor(platform: string, index: number) {
	return (
		platformColorMap[platform] ??
		fallbackPlatformColors[index % fallbackPlatformColors.length]
	);
}

type PieClickPayload = {
	payload?: {
		platform?: string;
		name?: string;
	};
	name?: string;
	platform?: string;
};

function extractPlatformFromPiePayload(payload: PieClickPayload | unknown) {
	if (typeof payload !== "object" || payload === null) {
		return null;
	}

	const maybe = payload as PieClickPayload;

	return (
		maybe.platform ??
		maybe.name ??
		maybe.payload?.platform ??
		maybe.payload?.name ??
		null
	);
}

export function PlatformPerformanceMetricToggleGroup({
	activeMetricKey,
	onMetricChange,
	metricDefinitionLookup = platformPerformanceMetricDefinitions,
}: MetricSelectionProps) {
	return (
		<fieldset
			className="flex w-max flex-nowrap justify-end gap-2"
			aria-label="플랫폼별 성과 메트릭"
		>
			<legend className="sr-only">플랫폼별 성과 메트릭</legend>
			{metricDefinitionLookup.map((metric) => (
				<ToggleButton
					key={metric.key}
					type="button"
					pressed={metric.key === activeMetricKey}
					onClick={() => onMetricChange(metric.key)}
				>
					{metric.label}
				</ToggleButton>
			))}
		</fieldset>
	);
}

type DonutData = {
	data: PlatformPerformanceSlice[];
	metric: PlatformPerformanceMetricDefinition;
	onPlatformSelect: (platform: string) => void;
};

export function PlatformPerformanceDonut({
	data,
	metric,
	onPlatformSelect,
}: DonutData) {
	const chartConfig = Object.fromEntries(
		data.map((slice, index) => [
			slice.platform,
			{
				label: slice.platform,
				color: getPlatformColor(slice.platform, index),
			},
		]),
	);

	return (
		<div className="grid grid-cols-[minmax(0,1.1fr)_320px] gap-5 items-stretch">
			<div className="relative flex min-w-0 flex-col rounded-card border border-outline-subtle bg-panel p-4">
				<div className="relative h-72">
					<ChartContainer className="absolute inset-0" config={chartConfig}>
						<PieChart>
							<Pie
								data={data}
								dataKey="value"
								nameKey="platform"
								innerRadius={60}
								outerRadius={105}
								paddingAngle={4}
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
										fill={getPlatformColor(slice.platform, index)}
										opacity={slice.isSelected ? 1 : 0.35}
									/>
								))}
							</Pie>
							<ChartTooltip
								content={
									<ChartTooltipContent
										formatter={(_, name) => {
											const matchedSlice = data.find(
												(entry) => entry.platform === name,
											);
											const metricLabel = matchedSlice
												? `${metric.label} ${metric.formatValue(matchedSlice.value)}`
												: "-";
											const share = matchedSlice
												? ` (${percentageFormatter.format(matchedSlice.sharePercent)}%)`
												: "";

											return `${metricLabel}${share}`;
										}}
									/>
								}
							/>
						</PieChart>
					</ChartContainer>
					<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
						<p className="typo-caption text-fg-subtle">현재 기준</p>
						<p className="typo-heading-sm">{metric.label}</p>
					</div>
				</div>
			</div>

			<fieldset
				className="grid min-w-0 gap-2 border-0 p-0"
				aria-label="플랫폼별 성과 도넛 범례"
			>
				<legend className="sr-only">플랫폼별 성과 도넛 범례</legend>
				{data.map((slice, index) => {
					const platformColor = getPlatformColor(slice.platform, index);

					return (
						<div
							key={slice.platform}
							className="rounded-card border border-outline-subtle bg-panel-muted p-3"
						>
							<button
								type="button"
								className="w-full text-left"
								onClick={() => onPlatformSelect(slice.platform)}
								aria-pressed={slice.isSelected}
							>
								<div className="mb-1 flex items-center gap-2">
									<span
										className="size-2 rounded-full"
										style={{ backgroundColor: platformColor }}
										aria-hidden
									/>
									<span className="typo-body-md">{slice.platform}</span>
									<span className="ml-auto typo-caption text-fg-subtle">
										{percentageFormatter.format(slice.sharePercent)}%
									</span>
								</div>
								<div className="typo-body-sm font-medium">
									{metric.label}{" "}
									{Number.isFinite(slice.value)
										? metric.formatValue(slice.value)
										: "-"}
								</div>
							</button>
						</div>
					);
				})}
			</fieldset>
		</div>
	);
}
