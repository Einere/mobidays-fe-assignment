import type { PlatformMetricKey } from "@/entities/platform-performance/model/types";
import {
	formatCurrencyWithLocale,
	formatNumberWithLocale,
} from "@/shared/lib/intl/number";

export type PlatformPerformanceMetricDefinition = {
	key: PlatformMetricKey;
	label: string;
	chartColor: string;
	formatValue: (value: number) => string;
};

const platformPerformanceMetricRegistry = {
	cost: {
		key: "cost",
		label: "비용",
		chartColor: "var(--chart-danger)",
		formatValue: formatCurrencyWithLocale,
	},
	impressions: {
		key: "impressions",
		label: "노출수",
		chartColor: "var(--chart-positive)",
		formatValue: formatNumberWithLocale,
	},
	clicks: {
		key: "clicks",
		label: "클릭수",
		chartColor: "var(--chart-info)",
		formatValue: formatNumberWithLocale,
	},
	conversions: {
		key: "conversions",
		label: "전환수",
		chartColor: "var(--chart-warning)",
		formatValue: formatNumberWithLocale,
	},
} satisfies Record<PlatformMetricKey, PlatformPerformanceMetricDefinition>;

export const platformPerformanceMetricDefinitions = Object.values(
	platformPerformanceMetricRegistry,
) as readonly PlatformPerformanceMetricDefinition[];

export const platformPerformanceMetricKeys = [
	"cost",
	"impressions",
	"clicks",
	"conversions",
] as const;

export const defaultPlatformPerformanceMetricKey: PlatformMetricKey = "cost";
export const platformPerformanceMetricMap = platformPerformanceMetricRegistry;

export function getPlatformPerformanceMetric(metricKey: PlatformMetricKey) {
	return platformPerformanceMetricRegistry[metricKey];
}

export function formatPlatformPerformanceMetricValue(
	metricKey: PlatformMetricKey,
	value: number | null,
) {
	if (value === null) {
		return "-";
	}

	return getPlatformPerformanceMetric(metricKey).formatValue(value);
}
