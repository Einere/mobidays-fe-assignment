import {
	type DailyTrendMetricKey,
	dailyTrendMetricKeys,
} from "@/entities/daily-stat/model/daily-trend-metrics";
import {
	formatCurrencyWithLocale,
	formatNumberWithLocale,
} from "@/shared/lib/intl/number";

type DailyTrendMetricDefinition = {
	key: DailyTrendMetricKey;
	label: string;
	chartColor: string;
	formatValue: (value: number) => string;
};

function formatCount(value: number) {
	return formatNumberWithLocale(value);
}

function formatCost(value: number) {
	return formatCurrencyWithLocale(value);
}

const dailyTrendMetricRegistry = {
	impressions: {
		key: "impressions",
		label: "노출수",
		chartColor: "var(--chart-positive)",
		formatValue: formatCount,
	},
	clicks: {
		key: "clicks",
		label: "클릭수",
		chartColor: "var(--chart-info)",
		formatValue: formatCount,
	},
	conversions: {
		key: "conversions",
		label: "전환수",
		chartColor: "var(--chart-warning)",
		formatValue: formatCount,
	},
	cost: {
		key: "cost",
		label: "집행비용",
		chartColor: "var(--chart-danger)",
		formatValue: formatCost,
	},
} satisfies Record<DailyTrendMetricKey, DailyTrendMetricDefinition>;

const dailyTrendMetricDefinitions = Object.values(
	dailyTrendMetricRegistry,
) as readonly DailyTrendMetricDefinition[];

const visibleDailyTrendMetricKeys = [
	dailyTrendMetricRegistry.impressions.key,
	dailyTrendMetricRegistry.clicks.key,
] as const;

const defaultDailyTrendMetricKeys = [
	dailyTrendMetricRegistry.impressions.key,
	dailyTrendMetricRegistry.clicks.key,
] as const;

const dailyTrendMetricMap = dailyTrendMetricRegistry;

function getDailyTrendMetric(metricKey: DailyTrendMetricKey) {
	return dailyTrendMetricMap[metricKey];
}

function formatDailyTrendMetricValue(
	metricKey: DailyTrendMetricKey,
	value: number | null,
) {
	if (value === null) {
		return "-";
	}

	return getDailyTrendMetric(metricKey).formatValue(value);
}

export type { DailyTrendMetricDefinition, DailyTrendMetricKey };
export {
	dailyTrendMetricDefinitions,
	dailyTrendMetricKeys,
	dailyTrendMetricMap,
	defaultDailyTrendMetricKeys,
	formatDailyTrendMetricValue,
	getDailyTrendMetric,
	visibleDailyTrendMetricKeys,
};
