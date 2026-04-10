import { describe, expect, it } from "vitest";
import {
	defaultPlatformPerformanceMetricKey,
	formatPlatformPerformanceMetricValue,
	platformPerformanceMetricDefinitions,
	platformPerformanceMetricKeys,
} from "@/widgets/platform-performance-chart/model/platform-performance-metrics";

describe("platform-performance-metrics", () => {
	it("renders all 4 platform performance metrics", () => {
		const renderedMetricKeys = platformPerformanceMetricDefinitions.map(
			(metric) => metric.key,
		);

		expect(renderedMetricKeys).toEqual([
			"cost",
			"impressions",
			"clicks",
			"conversions",
		]);
	});

	it("uses cost as the default metric", () => {
		expect(defaultPlatformPerformanceMetricKey).toBe("cost");
	});

	it("formats metric values with required output rules", () => {
		const cases = [
			{ key: "cost" as const, value: 1234567, expected: "₩1,234,567" },
			{
				key: "impressions" as const,
				value: 1234567,
				expected: "1,234,567",
			},
			{ key: "clicks" as const, value: 9876, expected: "9,876" },
			{
				key: "conversions" as const,
				value: 0,
				expected: "0",
			},
		] as const;

		for (const { key, value, expected } of cases) {
			expect(formatPlatformPerformanceMetricValue(key, value)).toBe(expected);
		}

		for (const key of platformPerformanceMetricKeys) {
			expect(formatPlatformPerformanceMetricValue(key, null)).toBe("-");
		}
	});
});
