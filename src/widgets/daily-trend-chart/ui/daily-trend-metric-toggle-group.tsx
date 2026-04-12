import { ToggleButton } from "@/shared/ui/toggle-button";
import { dailyTrendVisibleMetricDefinitions } from "@/widgets/daily-trend-chart/model/daily-trend-chart";
import type { DailyTrendMetricKey } from "@/widgets/daily-trend-chart/model/metrics";

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
			className="flex w-max flex-nowrap justify-end gap-2"
			aria-label={metricGroupLabel}
		>
			<legend className="sr-only">{metricGroupLabel}</legend>
			{dailyTrendVisibleMetricDefinitions.map((metric) => {
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
