import type { CampaignPlatform } from "@/entities/global-filter/model/types";
import type {
	PlatformMetricKey,
	PlatformPerformanceSlice,
} from "@/entities/platform-performance/model/types";
import type { PlatformPerformanceMetricDefinition } from "@/widgets/platform-performance-chart/model/platform-performance-metrics";
import { PlatformPerformanceDonut } from "@/widgets/platform-performance-chart/ui/platform-performance-donut-chart";
import { PlatformPerformanceMetricToggleGroup } from "@/widgets/platform-performance-chart/ui/platform-performance-metric-toggle-group";

type PlatformPerformanceChartContentProps = {
	activeMetricKey: PlatformMetricKey;
	toggleMetric: (metricKey: PlatformMetricKey) => void;
	metricDefinition: PlatformPerformanceMetricDefinition;
	slices: PlatformPerformanceSlice[];
	onPlatformSelect: (platform: CampaignPlatform) => void;
};

export function PlatformPerformanceChartContent({
	activeMetricKey,
	toggleMetric,
	metricDefinition,
	slices,
	onPlatformSelect,
}: PlatformPerformanceChartContentProps) {
	return (
		<>
			<div className="-mx-1 px-1 lg:mx-0 lg:self-start lg:px-0">
				<PlatformPerformanceMetricToggleGroup
					activeMetricKey={activeMetricKey}
					onMetricChange={toggleMetric}
				/>
			</div>
			<PlatformPerformanceDonut
				data={slices}
				metric={metricDefinition}
				onPlatformSelect={onPlatformSelect}
			/>
		</>
	);
}
