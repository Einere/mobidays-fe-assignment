import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlatformPerformanceChartStatus } from "@/widgets/platform-performance-chart/ui/platform-performance-chart-status";

describe("PlatformPerformanceChartStatus", () => {
	it("renders loading, error, empty, stale, syncing, and none states", () => {
		render(<PlatformPerformanceChartStatus kind="loading" />);
		expect(
			screen.getByRole("status", { name: "성과 데이터를 불러오는 중" }),
		).toBeInTheDocument();
	});

	it("renders a stale error message", () => {
		render(
			<PlatformPerformanceChartStatus
				kind="stale"
				message="최신 성과 데이터를 불러오지 못해 마지막 성공 결과를 표시 중입니다."
			/>,
		);

		expect(
			screen.getByText(
				"최신 성과 데이터를 불러오지 못해 마지막 성공 결과를 표시 중입니다.",
			),
		).toBeInTheDocument();
	});
});
