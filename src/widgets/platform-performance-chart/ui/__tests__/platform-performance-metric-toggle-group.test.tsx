import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PlatformPerformanceMetricToggleGroup } from "@/widgets/platform-performance-chart/ui/platform-performance-metric-toggle-group";

describe("PlatformPerformanceMetricToggleGroup", () => {
	it("marks the active metric and emits change events", async () => {
		const user = userEvent.setup();
		const onMetricChange = vi.fn();

		render(
			<PlatformPerformanceMetricToggleGroup
				activeMetricKey="cost"
				onMetricChange={onMetricChange}
			/>,
		);

		expect(screen.getByRole("button", { name: "비용" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);

		await user.click(screen.getByRole("button", { name: "클릭수" }));

		expect(onMetricChange).toHaveBeenCalledWith("clicks");
	});
});
