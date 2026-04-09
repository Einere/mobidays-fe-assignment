const dailyTrendMetricKeys = [
	"impressions",
	"clicks",
	"conversions",
	"cost",
] as const;

type DailyTrendMetricKey = (typeof dailyTrendMetricKeys)[number];

export type { DailyTrendMetricKey };
export { dailyTrendMetricKeys };
