import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { DailyTrendChartFrame } from "@/widgets/daily-trend-chart/ui/daily-trend-chart-frame";

function renderFrame(props?: { actions?: ReactNode; status?: ReactNode }) {
	return render(
		<DailyTrendChartFrame actions={props?.actions} status={props?.status}>
			<div>본문</div>
		</DailyTrendChartFrame>,
	);
}

describe("DailyTrendChartFrame", () => {
	it("renders the card shell with title, description, actions, and status slots", () => {
		renderFrame({
			actions: <div>액션</div>,
			status: <div>상태</div>,
		});

		expect(
			screen.getByRole("heading", { name: "성과 개요" }),
		).toBeInTheDocument();
		expect(
			screen.getByText(
				"전역 필터 기준으로 집계한 일별 추이 꺾은선 그래프입니다.",
			),
		).toBeInTheDocument();
		expect(screen.getByText("액션")).toBeInTheDocument();
		expect(screen.getByText("상태")).toBeInTheDocument();
		expect(screen.getByText("본문")).toBeInTheDocument();
	});
});
