import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { DailyTrendPoint } from "@/entities/daily-stat/lib/build-daily-trend-series";
import { DailyTrendChartContent } from "@/widgets/daily-trend-chart/ui/daily-trend-chart-content";

vi.mock("@/widgets/daily-trend-chart/ui/daily-trend-line-chart", () => ({
	DailyTrendLineChart: ({
		activeMetrics,
		data,
	}: {
		activeMetrics: string[];
		data: DailyTrendPoint[];
	}) => (
		<div
			data-testid="daily-trend-line-chart"
			data-active-metrics={activeMetrics.join(",")}
			data-row-count={data.length}
		/>
	),
}));

describe("DailyTrendChartContent", () => {
	it("wraps the line chart in the dense scroll area", () => {
		render(
			<DailyTrendChartContent
				activeMetrics={["impressions", "clicks"]}
				data={[{ date: "2026-04-01" } as DailyTrendPoint]}
			/>,
		);

		expect(
			screen.getByText("좌우로 스크롤해 추이 전체를 비교하세요."),
		).toBeInTheDocument();
		expect(screen.getByTestId("daily-trend-scroll-area")).toBeInTheDocument();
		expect(screen.getByTestId("daily-trend-line-chart")).toHaveAttribute(
			"data-active-metrics",
			"impressions,clicks",
		);
		expect(screen.getByTestId("daily-trend-line-chart")).toHaveAttribute(
			"data-row-count",
			"1",
		);
	});
});
