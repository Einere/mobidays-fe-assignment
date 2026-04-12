import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlatformPerformanceChartFrame } from "@/widgets/platform-performance-chart/ui/platform-performance-chart-frame";

describe("PlatformPerformanceChartFrame", () => {
	it("renders the title, description, status slot, and children", () => {
		render(
			<PlatformPerformanceChartFrame status={<div>동기화 중</div>}>
				<div>본문</div>
			</PlatformPerformanceChartFrame>,
		);

		expect(
			screen.getByRole("heading", { name: "플랫폼별 성과" }),
		).toBeInTheDocument();
		expect(
			screen.getByText(
				"전역 필터 기준으로 플랫폼별 성과를 집계한 도넛 차트입니다.",
			),
		).toBeInTheDocument();
		expect(screen.getByText("동기화 중")).toBeInTheDocument();
		expect(screen.getByText("본문")).toBeInTheDocument();
	});
});
