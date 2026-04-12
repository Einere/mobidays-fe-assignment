import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { DailyTrendPoint } from "@/entities/daily-stat/lib/build-daily-trend-series";
import type { DailyTrendMetricKey } from "@/widgets/daily-trend-chart/model/metrics";
import type { DailyTrendChartViewModel } from "@/widgets/daily-trend-chart/model/use-daily-trend-chart-view-model";
import { useDailyTrendChartViewModel } from "@/widgets/daily-trend-chart/model/use-daily-trend-chart-view-model";
import { DailyTrendChartCard } from "@/widgets/daily-trend-chart/ui/daily-trend-chart-card";

vi.mock(
	"@/widgets/daily-trend-chart/model/use-daily-trend-chart-view-model",
	async () => {
		const actual = await vi.importActual(
			"@/widgets/daily-trend-chart/model/use-daily-trend-chart-view-model",
		);

		return {
			...actual,
			useDailyTrendChartViewModel: vi.fn(),
		};
	},
);

vi.mock("@/widgets/daily-trend-chart/ui/daily-trend-chart-content", () => ({
	DailyTrendChartContent: ({
		activeMetrics,
		data,
	}: {
		activeMetrics: DailyTrendMetricKey[];
		data: DailyTrendPoint[];
	}) => (
		<div
			data-testid="daily-trend-chart-content"
			data-active-metrics={activeMetrics.join(",")}
			data-chart-row-count={data.length}
		/>
	),
}));

vi.mock(
	"@/widgets/daily-trend-chart/ui/daily-trend-metric-toggle-group",
	() => ({
		DailyTrendMetricToggleGroup: ({
			activeMetrics,
			metricGroupLabel,
			onToggleMetric,
		}: {
			activeMetrics: DailyTrendMetricKey[];
			metricGroupLabel?: string;
			onToggleMetric: (metricKey: DailyTrendMetricKey) => void;
		}) => (
			<fieldset aria-label={metricGroupLabel}>
				<legend className="sr-only">{metricGroupLabel}</legend>
				<div data-testid="daily-trend-card-metrics">
					{activeMetrics.join(",")}
				</div>
				<button type="button" onClick={() => onToggleMetric("impressions")}>
					노출수 토글
				</button>
			</fieldset>
		),
	}),
);

const mockedUseDailyTrendChartViewModel = vi.mocked(
	useDailyTrendChartViewModel,
);

function createChartData(
	overrides?: Partial<DailyTrendPoint>,
): DailyTrendPoint {
	return {
		date: "2026-04-01",
		impressions: 100,
		clicks: 10,
		conversions: 1,
		cost: 1000,
		...overrides,
	};
}

function createViewModel(
	overrides?: Partial<DailyTrendChartViewModel>,
): DailyTrendChartViewModel {
	return {
		activeMetrics: ["impressions", "clicks"],
		toggleMetric: vi.fn(),
		viewState: {
			kind: "chart",
			chartData: [createChartData()],
			isSyncing: false,
			staleErrorMessage: null,
		},
		...overrides,
	};
}

function renderCard(viewModel: DailyTrendChartViewModel) {
	mockedUseDailyTrendChartViewModel.mockReturnValue(viewModel);

	return render(<DailyTrendChartCard />);
}

describe("DailyTrendChartCard", () => {
	it("renders frame/action/content in chart state", () => {
		renderCard(createViewModel());

		expect(
			screen.getByRole("heading", { name: "성과 개요" }),
		).toBeInTheDocument();
		expect(
			screen.getByText(
				"전역 필터 기준으로 집계한 일별 추이 꺾은선 그래프입니다.",
			),
		).toBeInTheDocument();
		expect(
			screen.getByRole("group", { name: "일별 추이 메트릭" }),
		).toBeInTheDocument();
		expect(screen.getByTestId("daily-trend-chart-content")).toBeInTheDocument();
		expect(screen.queryByTestId("daily-trend-loading")).not.toBeInTheDocument();
	});

	it("forwards active metrics and toggle callback to child components", async () => {
		const user = userEvent.setup();
		const toggleMetric = vi.fn();

		renderCard(
			createViewModel({
				activeMetrics: ["impressions"],
				toggleMetric,
				viewState: {
					kind: "chart",
					chartData: [
						createChartData(),
						createChartData({
							date: "2026-04-02",
							impressions: null,
							clicks: 5,
						}),
					],
					isSyncing: false,
					staleErrorMessage: null,
				},
			}),
		);

		expect(screen.getByTestId("daily-trend-card-metrics")).toHaveTextContent(
			"impressions",
		);
		expect(screen.getByTestId("daily-trend-chart-content")).toHaveAttribute(
			"data-active-metrics",
			"impressions",
		);
		expect(screen.getByTestId("daily-trend-chart-content")).toHaveAttribute(
			"data-chart-row-count",
			"2",
		);

		await user.click(screen.getByRole("button", { name: "노출수 토글" }));

		expect(toggleMetric).toHaveBeenCalledWith("impressions");
	});

	it("renders stale and syncing statuses while keeping chart content visible", () => {
		renderCard(
			createViewModel({
				viewState: {
					kind: "chart",
					chartData: [createChartData()],
					isSyncing: true,
					staleErrorMessage: "Request failed: 500",
				},
			}),
		);

		expect(
			screen.getByText(
				"최신 성과 데이터를 불러오지 못해 마지막 성공 결과를 표시 중입니다.",
			),
		).toBeInTheDocument();
		expect(screen.getByText("동기화 중")).toBeInTheDocument();
		expect(screen.getByTestId("daily-trend-chart-content")).toBeInTheDocument();
	});

	it("renders loading status without actions or content", () => {
		renderCard(
			createViewModel({
				viewState: {
					kind: "loading",
				},
			}),
		);

		expect(screen.getByTestId("daily-trend-loading")).toBeInTheDocument();
		expect(
			screen.queryByRole("group", { name: "일별 추이 메트릭" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByTestId("daily-trend-chart-content"),
		).not.toBeInTheDocument();
	});

	it("renders full error status without chart content", () => {
		renderCard(
			createViewModel({
				viewState: {
					kind: "full-error",
					errorMessage: "Request failed: 500",
				},
			}),
		);

		expect(
			screen.getByText("성과 데이터를 불러오지 못했습니다."),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("group", { name: "일별 추이 메트릭" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByTestId("daily-trend-chart-content"),
		).not.toBeInTheDocument();
	});

	it("renders empty campaigns status without chart content", () => {
		renderCard(
			createViewModel({
				viewState: {
					kind: "empty-campaigns",
				},
			}),
		);

		expect(
			screen.getByText("필터 조건에 맞는 캠페인이 없습니다."),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("group", { name: "일별 추이 메트릭" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByTestId("daily-trend-chart-content"),
		).not.toBeInTheDocument();
	});

	it("renders empty data status without chart content", () => {
		renderCard(
			createViewModel({
				viewState: {
					kind: "empty-data",
				},
			}),
		);

		expect(
			screen.getByText("선택한 캠페인에 표시할 일별 데이터가 없습니다."),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("group", { name: "일별 추이 메트릭" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByTestId("daily-trend-chart-content"),
		).not.toBeInTheDocument();
	});
});
