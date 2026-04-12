import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DailyTrendPoint } from "@/entities/daily-stat/lib/build-daily-trend-series";
import { DailyTrendLineChart } from "@/widgets/daily-trend-chart/ui/daily-trend-line-chart";

type RechartsLineChartProps = {
	data?: unknown[];
	children?: ReactNode;
	"aria-label"?: string;
	role?: string;
};

type RechartsLineProps = {
	dataKey?: string;
};

const rechartsState = vi.hoisted(() => ({
	lineChartData: [] as unknown[],
	lineDataKeys: [] as string[],
}));

vi.mock("recharts", async () => {
	return {
		CartesianGrid: () => <div data-testid="daily-trend-cartesian-grid" />,
		XAxis: () => <div data-testid="daily-trend-x-axis" />,
		YAxis: () => <div data-testid="daily-trend-y-axis" />,
		LineChart: ({
			children,
			data,
			"aria-label": ariaLabel,
		}: RechartsLineChartProps) => {
			rechartsState.lineChartData = Array.isArray(data) ? data : [];

			return (
				<div
					data-testid="daily-trend-line-chart"
					role="img"
					aria-label={ariaLabel}
				>
					{children}
				</div>
			);
		},
		Line: ({ dataKey }: RechartsLineProps) => {
			if (typeof dataKey === "string") {
				rechartsState.lineDataKeys.push(dataKey);
			}

			return <div data-testid={`line-${String(dataKey)}`} />;
		},
		ResponsiveContainer: ({ children }: { children: ReactNode }) => (
			<div>{children}</div>
		),
		Tooltip: () => <div data-testid="daily-trend-tooltip" />,
		Legend: () => <div data-testid="daily-trend-legend" />,
	};
});

afterEach(() => {
	rechartsState.lineChartData = [];
	rechartsState.lineDataKeys = [];
});

describe("DailyTrendLineChart", () => {
	it("renders only selected metrics and passes chart data", () => {
		const data: DailyTrendPoint[] = [
			{
				date: "2026-04-15",
				impressions: 1_000,
				clicks: 25,
				conversions: 4,
				cost: 5_000,
			},
		];

		render(
			<DailyTrendLineChart
				data={data}
				activeMetrics={["impressions", "clicks"]}
			/>,
		);

		const lineChart = screen.getByRole("img", { name: "일별 추이 차트" });
		expect(lineChart).toBeInTheDocument();
		expect(lineChart).toHaveAttribute("data-testid", "daily-trend-line-chart");

		expect(rechartsState.lineChartData).toHaveLength(1);
		expect(screen.getByTestId("line-impressions")).toBeInTheDocument();
		expect(screen.getByTestId("line-clicks")).toBeInTheDocument();
		expect(screen.queryByTestId("line-conversions")).not.toBeInTheDocument();
		expect(screen.queryByTestId("line-cost")).not.toBeInTheDocument();
		expect(rechartsState.lineDataKeys).toEqual(["impressions", "clicks"]);
	});
});
