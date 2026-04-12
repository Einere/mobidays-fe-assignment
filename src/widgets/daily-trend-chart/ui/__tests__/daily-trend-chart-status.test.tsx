import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DailyTrendChartStatus } from "@/widgets/daily-trend-chart/ui/daily-trend-chart-status";

describe("DailyTrendChartStatus", () => {
	it("renders loading, empty, error, stale, and syncing states", () => {
		const { rerender } = render(<DailyTrendChartStatus kind="loading" />);

		expect(screen.getByTestId("daily-trend-loading")).toBeInTheDocument();

		rerender(<DailyTrendChartStatus kind="full-error" />);
		expect(
			screen.getByText("성과 데이터를 불러오지 못했습니다."),
		).toBeInTheDocument();

		rerender(
			<DailyTrendChartStatus
				kind="empty-campaigns"
				message="필터 조건에 맞는 캠페인이 없습니다."
			/>,
		);
		expect(
			screen.getByText("필터 조건에 맞는 캠페인이 없습니다."),
		).toBeInTheDocument();

		rerender(
			<DailyTrendChartStatus
				kind="empty-data"
				message="선택한 캠페인에 표시할 일별 데이터가 없습니다."
			/>,
		);
		expect(
			screen.getByText("선택한 캠페인에 표시할 일별 데이터가 없습니다."),
		).toBeInTheDocument();

		rerender(
			<DailyTrendChartStatus
				kind="stale"
				message="최신 성과 데이터를 불러오지 못해 마지막 성공 결과를 표시 중입니다."
			/>,
		);
		expect(
			screen.getByText(
				"최신 성과 데이터를 불러오지 못해 마지막 성공 결과를 표시 중입니다.",
			),
		).toBeInTheDocument();

		rerender(<DailyTrendChartStatus kind="syncing" />);
		expect(screen.getByText("동기화 중")).toBeInTheDocument();
	});
});
