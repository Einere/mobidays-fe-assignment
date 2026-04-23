import type { CampaignPlatform } from "@/entities/global-filter/model/types";
import type { PlatformPerformanceSlice } from "@/entities/platform-performance/model/types";
import {
	isKnownCampaignPlatformForDonut,
	percentageFormatter,
} from "@/widgets/platform-performance-chart/model/platform-performance-donut";

type PlatformPerformanceDonutLegendItemProps = {
	slice: PlatformPerformanceSlice;
	metricLabel: string;
	formatValue: (value: number) => string;
	color: string;
	onPlatformSelect: (platform: CampaignPlatform) => void;
};

export function PlatformPerformanceDonutLegendItem({
	slice,
	metricLabel,
	formatValue,
	color,
	onPlatformSelect,
}: PlatformPerformanceDonutLegendItemProps) {
	const isKnownPlatform = isKnownCampaignPlatformForDonut(slice.platform);

	return (
		<div className="min-w-[12rem] shrink-0 rounded-card border border-outline-subtle bg-panel-muted p-3 lg:min-w-0 lg:w-full lg:shrink">
			{isKnownPlatform ? (
				<button
					type="button"
					className="w-full min-h-control-touch cursor-pointer rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
					onClick={() => onPlatformSelect(slice.platform as CampaignPlatform)}
					aria-pressed={slice.isSelected}
				>
					<div className="mb-1 flex items-center gap-2">
						<span
							className="size-2 rounded-full"
							style={{ backgroundColor: color }}
							aria-hidden
						/>
						<span className="typo-body-md">{slice.platform}</span>
						<span className="ml-auto typo-caption text-fg-subtle">
							{percentageFormatter.format(slice.sharePercent)}
						</span>
					</div>
					<div className="typo-body-sm font-medium">
						{metricLabel}&nbsp;
						{Number.isFinite(slice.value) ? formatValue(slice.value) : "-"}
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
							style={{ backgroundColor: color }}
							aria-hidden
						/>
						<span className="typo-body-md">{slice.platform}</span>
						<span className="ml-auto typo-caption text-fg-subtle">
							{percentageFormatter.format(slice.sharePercent)}
						</span>
					</div>
					<div className="typo-body-sm font-medium">
						{metricLabel}&nbsp;
						{Number.isFinite(slice.value) ? formatValue(slice.value) : "-"}
					</div>
				</section>
			)}
		</div>
	);
}
