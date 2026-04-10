import type { ComponentProps } from "react";
import { Cell, Pie, PieChart, Sector } from "recharts";
import {
	type CampaignPlatform,
	campaignPlatformValues,
} from "@/entities/global-filter/model/platforms";
import type {
	PlatformMetricKey,
	PlatformPerformanceSlice,
} from "@/entities/platform-performance/model/types";
import { unknownPlatformLabel } from "@/entities/platform-performance/model/types";
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
	activeMetricKey: PlatformMetricKey;
	onMetricChange: (metricKey: PlatformMetricKey) => void;
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
	[unknownPlatformLabel]: "var(--chart-series-4)",
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

function isKnownCampaignPlatform(
	platform: string,
): platform is CampaignPlatform {
	return campaignPlatformValues.includes(platform as CampaignPlatform);
}

type PlatformPerformanceSectorProps = ComponentProps<typeof Sector> & {
	payload?: PlatformPerformanceSlice;
	onPlatformSelect: (platform: CampaignPlatform) => void;
};

export function PlatformPerformancePieSector({
	payload,
	onPlatformSelect,
	...props
}: PlatformPerformanceSectorProps) {
	const platform = payload?.platform;
	const isSelected = payload?.isSelected ?? false;

	if (platform === undefined) {
		return <Sector {...props} />;
	}

	if (!isKnownCampaignPlatform(platform)) {
		return (
			<Sector
				{...props}
				aria-label={platform}
				aria-disabled="true"
				style={{ cursor: "not-allowed", ...(props.style ?? {}) }}
			/>
		);
	}

	return (
		<Sector
			{...props}
			role="button"
			tabIndex={0}
			aria-label={`${platform} 선택`}
			aria-pressed={isSelected}
			style={{ cursor: "pointer", ...(props.style ?? {}) }}
			onClick={(event) => {
				event.stopPropagation();
				onPlatformSelect(platform);
			}}
			onKeyDown={(event) => {
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					onPlatformSelect(platform);
				}
			}}
		/>
	);
}

type PieClickPayload = {
	platform?: string;
	payload?: {
		platform?: string;
	};
};

function extractPlatformFromPiePayload(payload: PieClickPayload | unknown) {
	if (typeof payload !== "object" || payload === null) {
		return null;
	}

	const maybe = payload as PieClickPayload;
	const platform = maybe.platform ?? maybe.payload?.platform;

	return platform &&
		campaignPlatformValues.includes(platform as CampaignPlatform)
		? (platform as CampaignPlatform)
		: null;
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
	onPlatformSelect: (platform: CampaignPlatform) => void;
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
		<div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[minmax(0,1.1fr)_320px] lg:gap-5">
			<div className="relative flex min-w-0 flex-col rounded-card border border-outline-subtle bg-panel p-3 sm:p-4">
				<div className="relative h-64 sm:h-72">
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
										fill={getPlatformColor(slice.platform, index)}
										opacity={
											isKnownCampaignPlatform(slice.platform)
												? slice.isSelected
													? 1
													: 0.35
												: 1
										}
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
				className="min-w-0 border-0 p-0 lg:grid lg:gap-2"
				aria-label="플랫폼별 성과 도넛 범례"
			>
				<legend className="sr-only">플랫폼별 성과 도넛 범례</legend>
				<div className="flex gap-2 overflow-x-auto pb-1 lg:grid lg:gap-2 lg:pb-0">
					{data.map((slice, index) => {
						const platformColor = getPlatformColor(slice.platform, index);
						const isKnownPlatform = isKnownCampaignPlatform(slice.platform);

						return (
								<div
									key={slice.platform}
									className="min-w-[12rem] shrink-0 rounded-card border border-outline-subtle bg-panel-muted p-3 lg:min-w-0 lg:shrink"
								>
									{isKnownPlatform ? (
										<button
											type="button"
											className="w-full cursor-pointer text-left"
											onClick={() =>
												onPlatformSelect(slice.platform as CampaignPlatform)
											}
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
									) : (
										<section
											className="w-full cursor-not-allowed text-left"
											aria-label="알 수 없음"
											aria-disabled="true"
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
									</section>
								)}
							</div>
						);
					})}
				</div>
			</fieldset>
		</div>
	);
}
