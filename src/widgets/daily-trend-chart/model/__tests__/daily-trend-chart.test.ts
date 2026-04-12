import { describe, expect, it } from "vitest";

import {
	buildDailyTrendChartConfig,
	createDailyTrendTooltipFormatter,
	dailyTrendVisibleMetricDefinitions,
	formatDailyTrendDateLabel,
	formatDailyTrendYAxisTick,
} from "@/widgets/daily-trend-chart/model/daily-trend-chart";

describe("daily-trend-chart helpers", () => {
	it("builds chart config for visible metrics and formats axis labels", () => {
		expect(
			dailyTrendVisibleMetricDefinitions.map((metric) => metric.key),
		).toEqual(["impressions", "clicks"]);

		const config = buildDailyTrendChartConfig();

		expect(config.impressions.label).toBe("노출수");
		expect(config.clicks.color).toBe("var(--chart-info)");
		expect(formatDailyTrendDateLabel("2026-04-02")).toBe("04-02");
		expect(formatDailyTrendYAxisTick(1234)).toBe("1,234");
	});

	it("formats tooltip values for visible and hidden metrics", () => {
		const tooltipFormatter = createDailyTrendTooltipFormatter();

		expect(tooltipFormatter(1234, "clicks")).toBe("1,234");
		expect(tooltipFormatter(3500, "집행비용")).toBe("₩3,500");
		expect(tooltipFormatter(3500, "unknown")).toBe("-");
		expect(tooltipFormatter(null, "clicks")).toBe("-");
		expect(tooltipFormatter(10, undefined)).toBe("-");
	});
});
