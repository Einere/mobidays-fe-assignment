import type { CampaignPlatform } from "@/entities/global-filter/model/types";
import type { PlatformPerformanceSlice } from "@/entities/platform-performance/model/types";
import { getPlatformPerformanceDonutColor } from "@/widgets/platform-performance-chart/model/platform-performance-donut";
import { PlatformPerformanceDonutLegendItem } from "@/widgets/platform-performance-chart/ui/platform-performance-donut-legend-item";

type PlatformPerformanceDonutLegendProps = {
	data: readonly PlatformPerformanceSlice[];
	metricLabel: string;
	formatValue: (value: number) => string;
	onPlatformSelect: (platform: CampaignPlatform) => void;
};

export function PlatformPerformanceDonutLegend({
	data,
	metricLabel,
	formatValue,
	onPlatformSelect,
}: PlatformPerformanceDonutLegendProps) {
	return (
		<fieldset
			className="min-w-0 border-0 p-0 lg:grid lg:gap-2"
			aria-label="플랫폼별 성과 도넛 범례"
		>
			<legend className="sr-only">플랫폼별 성과 도넛 범례</legend>
			<div className="flex gap-2 overflow-x-auto pb-1 lg:grid lg:gap-2 lg:pb-0">
				{data.map((slice, index) => (
					<PlatformPerformanceDonutLegendItem
						key={slice.platform}
						slice={slice}
						metricLabel={metricLabel}
						formatValue={formatValue}
						color={getPlatformPerformanceDonutColor(slice.platform, index)}
						onPlatformSelect={onPlatformSelect}
					/>
				))}
			</div>
		</fieldset>
	);
}
