import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { platformPerformanceMetricDefinitions } from "@/widgets/platform-performance-chart/model/platform-performance-metrics";
import {
	PlatformPerformanceDonut,
	PlatformPerformancePieSector,
} from "@/widgets/platform-performance-chart/ui/platform-performance-donut-chart";

vi.mock("recharts", async () => {
	const actual = await vi.importActual("recharts");

	return {
		...actual,
		Sector: ({
			children,
			...props
		}: {
			children?: import("react").ReactNode;
		} & Record<string, unknown>) => (
			<div data-testid="sector" {...props}>
				{children}
			</div>
		),
		ResponsiveContainer: ({
			children,
		}: {
			children: import("react").ReactNode;
		}) => <div>{children}</div>,
		Pie: ({ children }: { children: import("react").ReactNode }) => (
			<div>{children}</div>
		),
		PieChart: ({ children }: { children: import("react").ReactNode }) => (
			<div>{children}</div>
		),
		Cell: ({ name, opacity }: { name?: string; opacity?: number }) => (
			<div data-testid={`cell-${String(name)}`} data-opacity={opacity} />
		),
		Tooltip: () => null,
		Legend: () => null,
	};
});

describe("PlatformPerformancePieSector", () => {
	it("exposes the slice as an accessible button-like control", async () => {
		const user = userEvent.setup();
		const onPlatformSelect = vi.fn();

		render(
			<PlatformPerformancePieSector
				cx={0}
				cy={0}
				innerRadius={0}
				outerRadius={0}
				startAngle={0}
				endAngle={90}
				fill="var(--chart-danger)"
				payload={{
					platform: "Google",
					value: 1500,
					sharePercent: 75,
					isSelected: true,
				}}
				onPlatformSelect={onPlatformSelect}
			/>,
		);

		const sector = screen.getByRole("button", { name: "Google 선택" });

		expect(sector).toHaveAttribute("aria-pressed", "true");

		await user.click(sector);
		expect(onPlatformSelect).toHaveBeenCalledWith("Google");

		sector.focus();
		await user.keyboard("{Enter}");
		expect(onPlatformSelect).toHaveBeenCalledTimes(2);
	});

	it("renders unknown platform slices as non-interactive data", () => {
		render(
			<PlatformPerformanceDonut
				data={[
					{
						platform: "알 수 없음",
						value: 75,
						sharePercent: 25,
						isSelected: false,
					},
				]}
				metric={platformPerformanceMetricDefinitions[0]}
				onPlatformSelect={vi.fn()}
			/>,
		);

		expect(screen.getByLabelText("알 수 없음")).toHaveAttribute(
			"aria-disabled",
			"true",
		);
		expect(
			screen.queryByRole("button", { name: "알 수 없음" }),
		).not.toBeInTheDocument();
		expect(screen.getByTestId("cell-알 수 없음")).toHaveAttribute(
			"data-opacity",
			"1",
		);
	});
});
