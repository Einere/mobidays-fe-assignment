import type { DailyTrendMetricKey } from "@/widgets/daily-trend-chart/model/metrics";
import { visibleDailyTrendMetricKeys } from "@/widgets/daily-trend-chart/model/metrics";

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

	return visibleDailyTrendMetricKeys
		.filter(
			(candidateMetric) =>
				candidateMetric === metricKey ||
				currentMetrics.includes(candidateMetric),
		)
		.slice();
}
