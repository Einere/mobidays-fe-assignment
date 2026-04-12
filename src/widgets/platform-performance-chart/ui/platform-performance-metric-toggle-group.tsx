import type { PlatformMetricKey } from "@/entities/platform-performance/model/types";
import { ToggleButton } from "@/shared/ui/toggle-button";
import {
	type PlatformPerformanceMetricDefinition,
	platformPerformanceMetricDefinitions,
} from "@/widgets/platform-performance-chart/model/platform-performance-metrics";

type PlatformPerformanceMetricToggleGroupProps = {
	activeMetricKey: PlatformMetricKey;
	onMetricChange: (metricKey: PlatformMetricKey) => void;
	metricDefinitionLookup?: readonly PlatformPerformanceMetricDefinition[];
};

export function PlatformPerformanceMetricToggleGroup({
	activeMetricKey,
	onMetricChange,
	metricDefinitionLookup = platformPerformanceMetricDefinitions,
}: PlatformPerformanceMetricToggleGroupProps) {
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
