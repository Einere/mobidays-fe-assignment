import {
	type DailyTrendMetricKey,
	dailyTrendMetricKeys,
} from "@/entities/daily-stat/model/daily-trend-metrics";
import type { DashboardDailyStat } from "@/shared/api/contracts/dashboard-data";
import { parseKstDateString } from "@/shared/lib/date/kst";

export interface DailyTrendPoint {
	date: string;
	impressions: number | null;
	clicks: number | null;
	conversions: number | null;
	cost: number | null;
}

type DailyTrendMetricAccumulator = {
	sum: number;
	hasValue: boolean;
};

type DailyTrendPointAccumulator = {
	date: string;
	timestamp: number;
	metrics: Record<DailyTrendMetricKey, DailyTrendMetricAccumulator>;
};

function createMetricAccumulator(): DailyTrendMetricAccumulator {
	return {
		sum: 0,
		hasValue: false,
	};
}

function createPointAccumulator(date: string): DailyTrendPointAccumulator {
	const metrics = {} as Record<
		DailyTrendMetricKey,
		DailyTrendMetricAccumulator
	>;

	for (const metricKey of dailyTrendMetricKeys) {
		metrics[metricKey] = createMetricAccumulator();
	}

	return {
		date,
		timestamp: parseKstDateString(date)?.getTime() ?? Number.NaN,
		metrics,
	};
}

function addMetricValue(
	accumulator: DailyTrendMetricAccumulator,
	value: number | null,
) {
	if (typeof value !== "number" || !Number.isFinite(value)) {
		return;
	}

	accumulator.sum += value;
	accumulator.hasValue = true;
}

export function buildDailyTrendSeries(
	dailyStats: DashboardDailyStat[],
): DailyTrendPoint[] {
	const seriesMap = new Map<string, DailyTrendPointAccumulator>();

	for (const dailyStat of dailyStats) {
		if (typeof dailyStat.date !== "string") {
			continue;
		}

		if (parseKstDateString(dailyStat.date) === null) {
			continue;
		}

		const existingPoint = seriesMap.get(dailyStat.date);
		const point = existingPoint ?? createPointAccumulator(dailyStat.date);

		for (const metricKey of dailyTrendMetricKeys) {
			addMetricValue(point.metrics[metricKey], dailyStat[metricKey]);
		}

		if (!existingPoint) {
			seriesMap.set(dailyStat.date, point);
		}
	}

	return Array.from(seriesMap.values())
		.sort((left, right) => left.timestamp - right.timestamp)
		.map((point) => {
			const result: DailyTrendPoint = {
				date: point.date,
				impressions: null,
				clicks: null,
				conversions: null,
				cost: null,
			};

			for (const metricKey of dailyTrendMetricKeys) {
				result[metricKey] = point.metrics[metricKey].hasValue
					? point.metrics[metricKey].sum
					: null;
			}

			return result;
		});
}
