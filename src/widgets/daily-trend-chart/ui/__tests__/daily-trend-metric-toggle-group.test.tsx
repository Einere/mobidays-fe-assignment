import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DailyTrendMetricToggleGroup } from "@/widgets/daily-trend-chart/ui/daily-trend-metric-toggle-group";

describe("DailyTrendMetricToggleGroup", () => {
	it("renders visible metrics as pressed by default", () => {
		render(
			<DailyTrendMetricToggleGroup
				activeMetrics={["impressions", "clicks"]}
				onToggleMetric={vi.fn()}
			/>,
		);

		expect(screen.getByRole("button", { name: "노출수" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
		expect(screen.getByRole("button", { name: "클릭수" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
	});

	it('calls onToggleMetric("impressions") when "노출수" is clicked', async () => {
		const user = userEvent.setup();
		const onToggleMetric = vi.fn();

		render(
			<DailyTrendMetricToggleGroup
				activeMetrics={["impressions", "clicks"]}
				onToggleMetric={onToggleMetric}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "노출수" }));

		expect(onToggleMetric).toHaveBeenCalledWith("impressions");
	});
});
