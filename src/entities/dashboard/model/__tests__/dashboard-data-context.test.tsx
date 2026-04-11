import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "@/App";
import { useDashboardData } from "@/entities/dashboard/hooks/use-dashboard-data";
import {
	DashboardDataProvider,
	useDashboardDataContext,
} from "@/entities/dashboard/model/dashboard-data-context";

vi.mock("@/entities/dashboard/hooks/use-dashboard-data", () => ({
	useDashboardData: vi.fn(),
}));

vi.mock("@/widgets/global-filter/ui/global-filter-bar", () => ({
	GlobalFilterBar: () => <div>GlobalFilterBar</div>,
}));

vi.mock("@/widgets/global-filter/ui/global-filter-summary", () => ({
	GlobalFilterSummary: () => <div>GlobalFilterSummary</div>,
}));

vi.mock("@/widgets/daily-trend-chart/ui/daily-trend-chart-card", () => ({
	DailyTrendChartCard: () => <div>DailyTrendChartCard</div>,
}));

vi.mock(
	"@/widgets/platform-performance-chart/ui/platform-performance-chart-card",
	() => ({
		PlatformPerformanceChartCard: () => <div>PlatformPerformanceChartCard</div>,
	}),
);

vi.mock(
	"@/widgets/campaign-ranking-top3/ui/campaign-ranking-top3-card",
	() => ({
		CampaignRankingTop3Card: () => <div>CampaignRankingTop3Card</div>,
	}),
);

vi.mock("@/widgets/campaign-table/ui/campaign-table-card", () => ({
	CampaignTableCard: () => <div>CampaignTableCard</div>,
}));

vi.mock("@/shared/ui/sidebar.tsx", () => ({
	SidebarNav: () => <aside>SidebarNav</aside>,
	MobileSidebarNav: () => <aside>MobileSidebarNav</aside>,
}));

function DashboardQueryConsumer() {
	const { query } = useDashboardDataContext();

	return <div>{query.data?.campaigns.length ?? 0}</div>;
}

function DashboardDerivationConsumer() {
	const { derivations } = useDashboardDataContext();

	return <div>{derivations?.tableRows.length ?? 0}</div>;
}

describe("DashboardDataProvider", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("provides one shared dashboard query result to descendants", () => {
		vi.mocked(useDashboardData).mockReturnValue({
			data: {
				campaigns: [],
				dailyStats: [],
			},
			error: null,
			isLoadingError: false,
			isPending: false,
			isRefetchError: false,
			isRefetching: false,
			isPlaceholderData: false,
		} as never);

		render(
			<DashboardDataProvider
				filter={{
					dateRange: { startDate: "2026-04-01", endDate: "2026-04-30" },
					statuses: ["active"],
					platforms: ["Google"],
				}}
			>
				<DashboardQueryConsumer />
				<DashboardQueryConsumer />
				<DashboardDerivationConsumer />
			</DashboardDataProvider>,
		);

		expect(screen.getAllByText("0")).toHaveLength(3);
		expect(useDashboardData).toHaveBeenCalledTimes(1);
	});

	it("keeps the App tree renderable when wrapped by provider", () => {
		vi.mocked(useDashboardData).mockReturnValue({
			data: {
				campaigns: [],
				dailyStats: [],
			},
			error: null,
			isLoadingError: false,
			isPending: false,
			isRefetchError: false,
			isRefetching: false,
			isPlaceholderData: false,
		} as never);

		render(
			<DashboardDataProvider
				filter={{
					dateRange: { startDate: "2026-04-01", endDate: "2026-04-30" },
					statuses: ["active"],
					platforms: ["Google"],
				}}
			>
				<App />
			</DashboardDataProvider>,
		);

		expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
			"캠페인 운영 현황",
		);
	});
});
