import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
		expect(sector).toHaveStyle({ cursor: "pointer" });

		await user.click(sector);
		expect(onPlatformSelect).toHaveBeenCalledWith("Google");

		fireEvent.focus(sector);
		await waitFor(() =>
			expect(sector).toHaveAttribute("stroke", "var(--color-focus)"),
		);
		await user.keyboard("{Enter}");
		expect(onPlatformSelect).toHaveBeenCalledTimes(2);
	});

	it("stops click bubbling so the slice is toggled only once", async () => {
		const user = userEvent.setup();
		const onPlatformSelect = vi.fn();
		const onParentClick = vi.fn();

		render(
			<button type="button" onClick={onParentClick}>
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
						isSelected: false,
					}}
					onPlatformSelect={onPlatformSelect}
				/>
			</button>,
		);

		await user.click(screen.getByRole("button", { name: "Google 선택" }));

		expect(onPlatformSelect).toHaveBeenCalledTimes(1);
		expect(onParentClick).not.toHaveBeenCalled();
	});

	it("marks unknown platform slices as disabled with a not-allowed cursor", () => {
		render(
			<PlatformPerformancePieSector
				cx={0}
				cy={0}
				innerRadius={0}
				outerRadius={0}
				startAngle={0}
				endAngle={90}
				fill="var(--chart-series-4)"
				payload={{
					platform: "알 수 없음",
					value: 75,
					sharePercent: 25,
					isSelected: false,
				}}
				onPlatformSelect={vi.fn()}
			/>,
		);

		const sector = screen.getByLabelText("알 수 없음");

		expect(sector).toHaveAttribute("aria-disabled", "true");
		expect(sector).toHaveStyle({ cursor: "not-allowed" });
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

	it("marks legend items with matching interactive affordances", () => {
		render(
			<PlatformPerformanceDonut
				data={[
					{
						platform: "Google",
						value: 100,
						sharePercent: 80,
						isSelected: true,
					},
					{
						platform: "알 수 없음",
						value: 25,
						sharePercent: 20,
						isSelected: false,
					},
				]}
				metric={platformPerformanceMetricDefinitions[0]}
				onPlatformSelect={vi.fn()}
			/>,
		);

		const legendButton = screen.getByRole("button", { name: /Google/ });
		const unknownLegend = screen.getByLabelText("알 수 없음");

		expect(legendButton).toHaveClass("cursor-pointer");
		expect(legendButton).toHaveClass("min-h-control-touch");
		expect(unknownLegend).toHaveAttribute("aria-disabled", "true");
		expect(unknownLegend).toHaveClass("cursor-not-allowed");
	});

	it("provides an accessible textual summary for screen readers", () => {
		render(
			<PlatformPerformanceDonut
				data={[
					{
						platform: "Google",
						value: 100,
						sharePercent: 80,
						isSelected: true,
					},
					{
						platform: "Meta",
						value: 25,
						sharePercent: 20,
						isSelected: false,
					},
				]}
				metric={platformPerformanceMetricDefinitions[0]}
				onPlatformSelect={vi.fn()}
			/>,
		);

		expect(
			screen.getByRole("img", { name: "플랫폼별 비용 도넛 차트" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("table", { name: "플랫폼별 성과 요약" }),
		).toBeInTheDocument();
		expect(screen.getByRole("cell", { name: "Google" })).toBeInTheDocument();
		expect(screen.getByRole("cell", { name: "80%" })).toBeInTheDocument();
		expect(screen.getByRole("cell", { name: "₩100" })).toBeInTheDocument();
	});
});
