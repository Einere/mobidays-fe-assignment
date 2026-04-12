import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PlatformPerformanceDonutLegend } from "@/widgets/platform-performance-chart/ui/platform-performance-donut-legend";

describe("PlatformPerformanceDonutLegend", () => {
	it("renders known slices as buttons and unknown slices as disabled sections", () => {
		render(
			<PlatformPerformanceDonutLegend
				data={[
					{
						platform: "Google",
						value: 100,
						sharePercent: 75,
						isSelected: true,
					},
					{
						platform: "알 수 없음",
						value: 25,
						sharePercent: 25,
						isSelected: false,
					},
				]}
				metricLabel="비용"
				formatValue={(value) => `₩${value}`}
				onPlatformSelect={vi.fn()}
			/>,
		);

		expect(screen.getByRole("button", { name: /Google/ })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
		expect(screen.getByLabelText("알 수 없음")).toHaveAttribute(
			"aria-disabled",
			"true",
		);
	});
});
