import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlatformPerformanceDonutSummaryTable } from "@/widgets/platform-performance-chart/ui/platform-performance-donut-summary-table";

describe("PlatformPerformanceDonutSummaryTable", () => {
	it("renders a sr-only table with platform rows and metric labels", () => {
		render(
			<PlatformPerformanceDonutSummaryTable
				id="summary-id"
				data={[
					{
						platform: "Google",
						value: 100,
						sharePercent: 80,
						isSelected: true,
					},
					{ platform: "Meta", value: 25, sharePercent: 20, isSelected: false },
				]}
				metricLabel="비용"
				formatValue={(value) => `₩${value}`}
			/>,
		);

		expect(
			screen.getByRole("table", { name: "플랫폼별 성과 요약" }),
		).toBeInTheDocument();
		expect(screen.getByRole("cell", { name: "Google" })).toBeInTheDocument();
		expect(screen.getByRole("cell", { name: "80%" })).toBeInTheDocument();
		expect(screen.getByRole("cell", { name: "₩100" })).toBeInTheDocument();
	});
});
