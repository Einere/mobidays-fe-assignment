import type { PlatformMetricKey } from "@/entities/platform-performance/model/types";

export type PlatformPerformanceMetricDefinition = {
	key: PlatformMetricKey;
	label: string;
	chartColor: string;
	formatValue: (value: number) => string;
};

const numberFormatter = new Intl.NumberFormat("ko-KR");
const costFormatter = new Intl.NumberFormat("ko-KR", {
	style: "currency",
	currency: "KRW",
	maximumFractionDigits: 0,
});

const platformPerformanceMetricRegistry = {
	cost: {
		key: "cost",
		label: "비용",
		chartColor: "var(--chart-danger)",
		formatValue: costFormatter.format,
	},
	impressions: {
		key: "impressions",
		label: "노출수",
		chartColor: "var(--chart-positive)",
		formatValue: numberFormatter.format,
	},
	clicks: {
		key: "clicks",
		label: "클릭수",
		chartColor: "var(--chart-info)",
		formatValue: numberFormatter.format,
	},
	conversions: {
		key: "conversions",
		label: "전환수",
		chartColor: "var(--chart-warning)",
		formatValue: numberFormatter.format,
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
