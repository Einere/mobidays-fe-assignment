import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChartContainer, ChartTooltipContent } from "@/shared/ui/chart";

vi.mock("recharts", async () => {
	const actual = await vi.importActual("recharts");

	return {
		...actual,
		ResponsiveContainer: ({
			children,
		}: {
			children: import("react").ReactNode;
		}) => <div data-testid="responsive-container">{children}</div>,
	};
});

describe("ChartTooltipContent", () => {
	it("passes the tooltip item name to formatter for pie chart payloads", () => {
		const formatter = vi.fn((_: unknown, name: string) => {
			return name === "Google" ? "비용 ₩1,500 (75%)" : "-";
		});

		render(
			<ChartContainer
				config={{
					Google: {
						label: "Google",
						color: "var(--chart-danger)",
					},
				}}
			>
				<ChartTooltipContent
					active
					payload={[
						{
							dataKey: "value",
							name: "Google",
							value: 1500,
							color: "var(--chart-danger)",
						},
					]}
					formatter={formatter}
				/>
			</ChartContainer>,
		);

		expect(formatter).toHaveBeenCalledWith(1500, "Google");
		expect(screen.getByText("비용 ₩1,500 (75%)")).toBeInTheDocument();
	});
});
