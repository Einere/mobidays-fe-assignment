import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStore, Provider, useAtomValue } from "jotai";
import type { PropsWithChildren } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "@/App";
import { DashboardDataProvider } from "@/entities/dashboard";
import { createInitialGlobalFilterState } from "@/entities/global-filter/model/defaults";
import { globalFilterAtom } from "@/entities/global-filter/model/store";
import { seedMockDb } from "@/shared/api/mock/db";
import { createQueryClient } from "@/shared/api/query-client";
import { CampaignRankingTop3Card } from "@/widgets/campaign-ranking-top3/ui/campaign-ranking-top3-card";

const aprilFilter = createInitialGlobalFilterState(new Date("2026-04-15"));
const queryClients: QueryClient[] = [];

const rechartsState = vi.hoisted(() => ({
	barChartData: [] as unknown[],
}));

vi.mock("recharts", async () => {
	const actual = await vi.importActual("recharts");

	return {
		...actual,
		ResponsiveContainer: ({
			children,
		}: {
			children: import("react").ReactNode;
		}) => <div data-testid="campaign-ranking-responsive">{children}</div>,
		BarChart: ({
			children,
			data,
		}: {
			children: import("react").ReactNode;
			data?: unknown[];
		}) => {
			rechartsState.barChartData = Array.isArray(data) ? data : [];

			return <div data-testid="campaign-ranking-bar-chart">{children}</div>;
		},
		Bar: ({ children }: { children?: import("react").ReactNode }) => (
			<div data-testid="campaign-ranking-bar">{children}</div>
		),
		CartesianGrid: () => <div data-testid="campaign-ranking-grid" />,
		XAxis: () => <div data-testid="campaign-ranking-x-axis" />,
		YAxis: () => <div data-testid="campaign-ranking-y-axis" />,
		LabelList: () => <div data-testid="campaign-ranking-label-list" />,
		Tooltip: () => <div data-testid="campaign-ranking-tooltip" />,
	};
});

afterEach(() => {
	rechartsState.barChartData = [];

	for (const queryClient of queryClients.splice(0)) {
		queryClient.clear();
	}
});

function renderCampaignRankingTop3Card() {
	const queryClient = createQueryClient();
	const store = createStore();

	store.set(globalFilterAtom, aprilFilter);
	queryClients.push(queryClient);

	render(
		<Provider store={store}>
			<QueryClientProvider client={queryClient}>
				<DashboardDataTestProvider>
					<CampaignRankingTop3Card />
				</DashboardDataTestProvider>
			</QueryClientProvider>
		</Provider>,
	);
}

function renderApp() {
	const queryClient = createQueryClient();
	const store = createStore();

	store.set(globalFilterAtom, aprilFilter);
	queryClients.push(queryClient);

	render(
		<Provider store={store}>
			<QueryClientProvider client={queryClient}>
				<App />
			</QueryClientProvider>
		</Provider>,
	);
}

function DashboardDataTestProvider({ children }: PropsWithChildren) {
	const filter = useAtomValue(globalFilterAtom);

	return (
		<DashboardDataProvider filter={filter}>{children}</DashboardDataProvider>
	);
}

describe("CampaignRankingTop3Card", () => {
	it("renders with the default metric set to ROAS", async () => {
		seedMockDb({
			campaigns: [
				{
					id: "cmp-1",
					name: "Google 브랜딩",
					platform: "Google",
					status: "active",
					budget: 1000,
					startDate: "2026-04-01",
					endDate: "2026-04-30",
				},
				{
					id: "cmp-2",
					name: "Meta 리타겟팅",
					platform: "Meta",
					status: "active",
					budget: 1000,
					startDate: "2026-04-01",
					endDate: "2026-04-30",
				},
			],
			daily_stats: [
				{
					id: "d-1",
					campaignId: "cmp-1",
					date: "2026-04-01",
					impressions: 100,
					clicks: 10,
					conversions: 1,
					cost: 1000,
					conversionsValue: 2000,
				},
				{
					id: "d-2",
					campaignId: "cmp-2",
					date: "2026-04-01",
					impressions: 100,
					clicks: 20,
					conversions: 2,
					cost: 1000,
					conversionsValue: 1500,
				},
			],
		});

		renderCampaignRankingTop3Card();

		expect(
			await screen.findByRole("heading", { name: "캠페인 TOP 3" }),
		).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "ROAS" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
		expect(screen.getByRole("button", { name: "CTR" })).toHaveAttribute(
			"aria-pressed",
			"false",
		);
		expect(screen.getByRole("button", { name: "CPC" })).toHaveAttribute(
			"aria-pressed",
			"false",
		);
		await waitFor(() => {
			expect(rechartsState.barChartData).toHaveLength(2);
		});

		expect(
			await screen.findByRole("table", { name: "캠페인 TOP 3 요약" }),
		).toBeInTheDocument();

		expect(
			screen.queryByRole("status", { name: "동기화 중" }),
		).not.toBeInTheDocument();

		const firstRow = rechartsState.barChartData[0] as {
			campaignLabel: string;
			metricValue: number;
		};

		expect(firstRow.campaignLabel).toBe("1위 Google 브랜딩");
		expect(firstRow.metricValue).toBe(200);
	});

	it("switches metric and rebuilds ranking rows", async () => {
		const user = userEvent.setup();

		seedMockDb({
			campaigns: [
				{
					id: "cmp-1",
					name: "Google 브랜딩",
					platform: "Google",
					status: "active",
					budget: 1000,
					startDate: "2026-04-01",
					endDate: "2026-04-30",
				},
				{
					id: "cmp-2",
					name: "Meta 리타겟팅",
					platform: "Meta",
					status: "active",
					budget: 1000,
					startDate: "2026-04-01",
					endDate: "2026-04-30",
				},
			],
			daily_stats: [
				{
					id: "d-1",
					campaignId: "cmp-1",
					date: "2026-04-01",
					impressions: 100,
					clicks: 10,
					conversions: 1,
					cost: 1000,
					conversionsValue: 2000,
				},
				{
					id: "d-2",
					campaignId: "cmp-2",
					date: "2026-04-01",
					impressions: 100,
					clicks: 20,
					conversions: 2,
					cost: 1000,
					conversionsValue: 1500,
				},
			],
		});

		renderCampaignRankingTop3Card();

		await waitFor(() => {
			expect(rechartsState.barChartData).toHaveLength(2);
		});

		await user.click(screen.getByRole("button", { name: "CPC" }));

		await waitFor(() => {
			const firstRow = rechartsState.barChartData[0] as {
				campaignLabel: string;
				metricValue: number;
			};

			expect(firstRow.campaignLabel).toBe("1위 Meta 리타겟팅");
			expect(firstRow.metricValue).toBe(50);
		});

		expect(screen.getByRole("button", { name: "ROAS" })).toHaveAttribute(
			"aria-pressed",
			"false",
		);
		expect(screen.getByRole("button", { name: "CPC" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
	});

	it("uses rank-prefixed labels so unnamed campaigns stay distinguishable", async () => {
		seedMockDb({
			campaigns: [
				{
					id: "cmp-1",
					name: null,
					platform: "Google",
					status: "active",
					budget: 1000,
					startDate: "2026-04-01",
					endDate: "2026-04-30",
				},
				{
					id: "cmp-2",
					name: "   ",
					platform: "Meta",
					status: "active",
					budget: 1000,
					startDate: "2026-04-01",
					endDate: "2026-04-30",
				},
			],
			daily_stats: [
				{
					id: "d-1",
					campaignId: "cmp-1",
					date: "2026-04-01",
					impressions: 100,
					clicks: 10,
					conversions: 1,
					cost: 1000,
					conversionsValue: 2000,
				},
				{
					id: "d-2",
					campaignId: "cmp-2",
					date: "2026-04-01",
					impressions: 100,
					clicks: 20,
					conversions: 2,
					cost: 1000,
					conversionsValue: 1500,
				},
			],
		});

		renderCampaignRankingTop3Card();

		await waitFor(() => {
			expect(rechartsState.barChartData).toHaveLength(2);
		});

		expect(rechartsState.barChartData).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					campaignLabel: "1위 이름 없음",
				}),
				expect.objectContaining({
					campaignLabel: "2위 이름 없음",
				}),
			]),
		);
	});

	it("excludes N/A rows and shows empty state when the selected metric has no valid values", async () => {
		seedMockDb({
			campaigns: [
				{
					id: "cmp-1",
					name: "Google 브랜딩",
					platform: "Google",
					status: "active",
					budget: 1000,
					startDate: "2026-04-01",
					endDate: "2026-04-30",
				},
				{
					id: "cmp-2",
					name: "Meta 리타겟팅",
					platform: "Meta",
					status: "active",
					budget: 1000,
					startDate: "2026-04-01",
					endDate: "2026-04-30",
				},
			],
			daily_stats: [
				{
					id: "d-1",
					campaignId: "cmp-1",
					date: "2026-04-01",
					impressions: 100,
					clicks: 20,
					conversions: 2,
					cost: 0,
					conversionsValue: 3000,
				},
				{
					id: "d-2",
					campaignId: "cmp-2",
					date: "2026-04-01",
					impressions: 100,
					clicks: 10,
					conversions: 1,
					cost: null,
					conversionsValue: 1500,
				},
			],
		});

		renderCampaignRankingTop3Card();

		const emptyState = await screen.findByText(
			"선택한 메트릭에 표시할 데이터가 없습니다.",
		);
		expect(emptyState.closest("div")).toHaveAttribute("role", "status");
		expect(
			screen.queryByTestId("campaign-ranking-top3-chart"),
		).not.toBeInTheDocument();
	});

	it("renders the bar chart in the basic success path", async () => {
		seedMockDb({
			campaigns: [
				{
					id: "cmp-1",
					name: "Google 브랜딩",
					platform: "Google",
					status: "active",
					budget: 1000,
					startDate: "2026-04-01",
					endDate: "2026-04-30",
				},
			],
			daily_stats: [
				{
					id: "d-1",
					campaignId: "cmp-1",
					date: "2026-04-01",
					impressions: 100,
					clicks: 10,
					conversions: 1,
					cost: 1000,
					conversionsValue: 1200,
				},
			],
		});

		renderCampaignRankingTop3Card();

		expect(
			await screen.findByTestId("campaign-ranking-top3-chart"),
		).toBeInTheDocument();
		expect(
			screen.getByTestId("campaign-ranking-bar-chart"),
		).toBeInTheDocument();
	});
});

describe("App dashboard layout", () => {
	it("renders platform performance and ranking cards in a shared responsive grid section", async () => {
		seedMockDb({
			campaigns: [
				{
					id: "cmp-1",
					name: "Google 브랜딩",
					platform: "Google",
					status: "active",
					budget: 1000,
					startDate: "2026-04-01",
					endDate: "2026-04-30",
				},
			],
			daily_stats: [
				{
					id: "d-1",
					campaignId: "cmp-1",
					date: "2026-04-01",
					impressions: 100,
					clicks: 10,
					conversions: 1,
					cost: 1000,
					conversionsValue: 1500,
				},
			],
		});

		renderApp();

		const platformHeading = await screen.findByRole("heading", {
			name: "플랫폼별 성과",
		});
		const rankingHeading = await screen.findByRole("heading", {
			name: "캠페인 TOP 3",
		});
		const platformCard = platformHeading.closest("section");
		const rankingCard = rankingHeading.closest("section");
		const sharedLayoutSection = platformCard?.parentElement;

		expect(platformCard).not.toBeNull();
		expect(rankingCard).not.toBeNull();
		expect(sharedLayoutSection).toBe(rankingCard?.parentElement);
		expect(sharedLayoutSection).toHaveClass("grid");
		expect(sharedLayoutSection).toHaveClass("lg:grid-cols-2");
		expect(sharedLayoutSection?.children[0]).toBe(platformCard);
		expect(sharedLayoutSection?.children[1]).toBe(rankingCard);
	});

	it("keeps the dashboard section order as filters, daily trend, platform+ranking, and campaign table", async () => {
		seedMockDb({
			campaigns: [
				{
					id: "cmp-1",
					name: "Google 브랜딩",
					platform: "Google",
					status: "active",
					budget: 1000,
					startDate: "2026-04-01",
					endDate: "2026-04-30",
				},
			],
			daily_stats: [
				{
					id: "d-1",
					campaignId: "cmp-1",
					date: "2026-04-01",
					impressions: 100,
					clicks: 10,
					conversions: 1,
					cost: 1000,
					conversionsValue: 1500,
				},
			],
		});

		renderApp();

		const dailyTrendHeading = await screen.findByRole("heading", {
			name: "성과 개요",
		});
		const platformHeading = await screen.findByRole("heading", {
			name: "플랫폼별 성과",
		});
		const rankingHeading = await screen.findByRole("heading", {
			name: "캠페인 TOP 3",
		});
		const campaignTableHeading = await screen.findByRole("heading", {
			name: "캠페인 현황",
		});

		expect(dailyTrendHeading.compareDocumentPosition(platformHeading)).toBe(
			Node.DOCUMENT_POSITION_FOLLOWING,
		);
		expect(platformHeading.compareDocumentPosition(rankingHeading)).toBe(
			Node.DOCUMENT_POSITION_FOLLOWING,
		);
		expect(rankingHeading.compareDocumentPosition(campaignTableHeading)).toBe(
			Node.DOCUMENT_POSITION_FOLLOWING,
		);
	});
});
