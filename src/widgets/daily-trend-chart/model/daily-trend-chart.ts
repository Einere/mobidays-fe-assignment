import { formatNumberWithLocale } from "@/shared/lib/intl/number";
import type {
	DailyTrendMetricDefinition,
	DailyTrendMetricKey,
} from "@/widgets/daily-trend-chart/model/metrics";
import {
	dailyTrendMetricDefinitions,
	formatDailyTrendMetricValue,
	getDailyTrendMetric,
	visibleDailyTrendMetricKeys,
} from "@/widgets/daily-trend-chart/model/metrics";

export const dailyTrendVisibleMetricDefinitions =
	visibleDailyTrendMetricKeys.map((metricKey) =>
		getDailyTrendMetric(metricKey),
	);

export function buildDailyTrendChartConfig(
	metricDefinitions: readonly DailyTrendMetricDefinition[] = dailyTrendVisibleMetricDefinitions,
) {
	return Object.fromEntries(
		metricDefinitions.map((metric) => [
			metric.key,
			{
				label: metric.label,
				color: metric.chartColor,
			},
		]),
	);
}

export function formatDailyTrendDateLabel(value: string) {
	return value.slice(5);
}

export function formatDailyTrendYAxisTick(value: number) {
	return formatNumberWithLocale(value);
}

export function createDailyTrendTooltipFormatter(
	metricDefinitions: readonly DailyTrendMetricDefinition[] = dailyTrendMetricDefinitions,
) {
	return (value: unknown, metricKey?: string) => {
		if (metricKey === undefined) {
			return "-";
		}

		const resolvedMetricKey = metricDefinitions.find(
			(metric) => metric.key === metricKey || metric.label === metricKey,
		)?.key;

		if (resolvedMetricKey === undefined) {
			return "-";
		}

		return formatDailyTrendMetricValue(
			resolvedMetricKey as DailyTrendMetricKey,
			typeof value === "number" ? value : null,
		);
	};
}
