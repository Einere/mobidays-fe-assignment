import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PlatformPerformanceSlice } from "@/entities/platform-performance/model/types";
import { platformPerformanceMetricDefinitions } from "@/widgets/platform-performance-chart/model/platform-performance-metrics";
import { PlatformPerformanceDonut } from "@/widgets/platform-performance-chart/ui/platform-performance-donut-chart";

vi.mock("recharts", async () => {
	const actual = await vi.importActual("recharts");

	return {
		...actual,
		ResponsiveContainer: ({
			children,
		}: {
			children: import("react").ReactNode;
		}) => <div data-testid="responsive-container">{children}</div>,
		Cell: ({ name }: { name?: string }) => (
			<div data-testid={`cell-${String(name)}`} />
		),
		Pie: ({ children }: { children: import("react").ReactNode }) => (
			<div data-testid="pie">{children}</div>
		),
		PieChart: ({ children }: { children: import("react").ReactNode }) => (
			<div data-testid="pie-chart">{children}</div>
		),
		Tooltip: () => <div data-testid="tooltip" />,
	};
});

describe("PlatformPerformanceDonut", () => {
	it('does not render the "현재 기준" label block', () => {
		const data: PlatformPerformanceSlice[] = [
			{
				platform: "Google",
				value: 1500,
				sharePercent: 75,
				isSelected: true,
			},
			{
				platform: "Meta",
				value: 500,
				sharePercent: 25,
				isSelected: false,
			},
		];

		render(
			<PlatformPerformanceDonut
				data={data}
				metric={platformPerformanceMetricDefinitions[0]}
				onPlatformSelect={vi.fn()}
			/>,
		);

		expect(screen.queryByText("현재 기준")).not.toBeInTheDocument();
		expect(
			screen.queryByTestId("platform-performance-metric-label"),
		).not.toBeInTheDocument();
	});
});
