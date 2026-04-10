import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStore, Provider, useAtomValue, useSetAtom } from "jotai";
import { HttpResponse, http } from "msw";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createInitialGlobalFilterState } from "@/entities/global-filter/model/defaults";
import {
	globalFilterAtom,
	setGlobalFilterAtom,
} from "@/entities/global-filter/model/store";
import { seedMockDb } from "@/shared/api/mock/db";
import { server } from "@/shared/api/mock/server";
import { createQueryClient } from "@/shared/api/query-client";
import { platformPerformanceMetricDefinitions } from "@/widgets/platform-performance-chart/model/platform-performance-metrics";
import { PlatformPerformanceChartCard } from "@/widgets/platform-performance-chart/ui/platform-performance-chart-card";
import { PlatformPerformanceDonut } from "@/widgets/platform-performance-chart/ui/platform-performance-donut-chart";

const aprilFilter = createInitialGlobalFilterState(new Date("2026-04-15"));
const queryClients: QueryClient[] = [];

const rechartsState = vi.hoisted(() => ({
	pieOnClick: null as null | ((payload: unknown) => void),
	pieData: [] as unknown[],
}));

vi.mock("recharts", async () => {
	const actual = await vi.importActual("recharts");

	return {
		...actual,
		ResponsiveContainer: ({
			children,
		}: {
			children: import("react").ReactNode;
		}) => <div data-testid="platform-responsive-container">{children}</div>,
		Cell: ({ name }: { name?: string }) => (
			<div data-testid={`platform-cell-${String(name)}`} />
		),
		Pie: (props: {
			data?: unknown[];
			children?: import("react").ReactNode;
			onClick?: (payload: unknown) => void;
		}) => {
			rechartsState.pieOnClick = props.onClick ?? null;
			rechartsState.pieData = Array.isArray(props.data) ? props.data : [];

			return <div data-testid="platform-pie">{props.children}</div>;
		},
		PieChart: ({ children }: { children: import("react").ReactNode }) => (
			<div data-testid="platform-pie-chart">{children}</div>
		),
		Tooltip: () => <div data-testid="platform-tooltip" />,
		Legend: () => <div data-testid="platform-legend" />,
	};
});

afterEach(() => {
	rechartsState.pieData = [];
	rechartsState.pieOnClick = null;

	for (const queryClient of queryClients.splice(0)) {
		queryClient.clear();
	}
});

function FilterStateIndicator() {
	const filter = useAtomValue(globalFilterAtom);

	return (
		<div data-testid="platform-filter-state">{filter.platforms.join(",")}</div>
	);
}

function SetMetaOnlyFilterButton() {
	const setFilter = useSetAtom(setGlobalFilterAtom);

	return (
		<button
			type="button"
			onClick={() =>
				setFilter({
					...aprilFilter,
					platforms: ["Meta"],
				})
			}
		>
			메타만 보기
		</button>
	);
}

function renderPlatformCard(options?: { withFilterButton?: boolean }) {
	const queryClient = createQueryClient();
	const store = createStore();

	store.set(globalFilterAtom, aprilFilter);
	queryClients.push(queryClient);

	render(
		<Provider store={store}>
			<QueryClientProvider client={queryClient}>
				{options?.withFilterButton ? <SetMetaOnlyFilterButton /> : null}
				<FilterStateIndicator />
				<PlatformPerformanceChartCard />
			</QueryClientProvider>
		</Provider>,
	);
}

describe("PlatformPerformanceChartCard", () => {
	it("keeps the donut chart and legend horizontal on mobile", () => {
		const { container } = render(
			<PlatformPerformanceDonut
				data={[
					{
						platform: "Google",
						value: 100,
						sharePercent: 66.7,
						isSelected: true,
					},
					{
						platform: "Meta",
						value: 50,
						sharePercent: 33.3,
						isSelected: false,
					},
				]}
				metric={platformPerformanceMetricDefinitions[0]}
				onPlatformSelect={vi.fn()}
			/>,
		);

		expect(container.firstElementChild).toHaveClass(
			"grid-cols-[minmax(0,1.1fr)_320px]",
		);
		expect(container.firstElementChild).not.toHaveClass(
			"lg:grid-cols-[minmax(0,1.1fr)_320px]",
		);
		expect(
			screen.queryByTestId("platform-performance-metric-label"),
		).not.toBeInTheDocument();
	});

	it("renders metric toggles and defaults to 비용", async () => {
		seedMockDb({
			campaigns: [
				{
					id: "cmp-1",
					name: "Google Active",
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
					clicks: 20,
					conversions: 5,
					cost: 1000,
					conversionsValue: null,
				},
			],
		});

		renderPlatformCard();

		expect(
			await screen.findByRole("heading", { name: "플랫폼별 성과" }),
		).toBeInTheDocument();
		expect(
			await screen.findByRole("group", { name: "플랫폼별 성과 메트릭" }),
		).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "비용" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
		expect(screen.getByRole("button", { name: "노출수" })).toHaveAttribute(
			"aria-pressed",
			"false",
		);
		expect(screen.getByRole("button", { name: "클릭수" })).toHaveAttribute(
			"aria-pressed",
			"false",
		);
		expect(screen.getByRole("button", { name: "전환수" })).toHaveAttribute(
			"aria-pressed",
			"false",
		);
	});

	it("aggregates selected metric and refreshes results when metric changes", async () => {
		seedMockDb({
			campaigns: [
				{
					id: "cmp-1",
					name: "Google Active",
					platform: "Google",
					status: "active",
					budget: 1000,
					startDate: "2026-04-01",
					endDate: "2026-04-30",
				},
				{
					id: "cmp-2",
					name: "Meta Active",
					platform: "Meta",
					status: "paused",
					budget: 1200,
					startDate: "2026-04-01",
					endDate: "2026-04-30",
				},
				{
					id: "cmp-3",
					name: "Naver Active",
					platform: "Naver",
					status: "ended",
					budget: 800,
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
					conversions: 3,
					cost: 1500,
					conversionsValue: null,
				},
				{
					id: "d-2",
					campaignId: "cmp-2",
					date: "2026-04-01",
					impressions: 200,
					clicks: 10,
					conversions: 2,
					cost: 500,
					conversionsValue: null,
				},
			],
		});

		renderPlatformCard();

		const list = await screen.findByRole("group", {
			name: "플랫폼별 성과 도넛 범례",
		});
		const googleItem = within(list).getByRole("button", { name: /Google/ });
		const metaItem = within(list).getByRole("button", { name: /Meta/ });

		expect(googleItem).toHaveTextContent("75%");
		expect(googleItem).toHaveTextContent("₩1,500");
		expect(metaItem).toHaveTextContent("25%");
		expect(metaItem).toHaveTextContent("₩500");

		await userEvent.click(screen.getByRole("button", { name: "클릭수" }));

		const googleAfter = within(list).getByRole("button", { name: /Google/ });
		const metaAfter = within(list).getByRole("button", { name: /Meta/ });

		expect(googleAfter).toHaveTextContent("66.7%");
		expect(googleAfter).toHaveTextContent("20");
		expect(metaAfter).toHaveTextContent("33.3%");
		expect(metaAfter).toHaveTextContent("10");
	});

	it("toggles global platform filter when chart slice is clicked", async () => {
		seedMockDb({
			campaigns: [
				{
					id: "cmp-1",
					name: "Google Active",
					platform: "Google",
					status: "active",
					budget: 1000,
					startDate: "2026-04-01",
					endDate: "2026-04-30",
				},
				{
					id: "cmp-2",
					name: "Meta Active",
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
					conversionsValue: null,
				},
				{
					id: "d-2",
					campaignId: "cmp-2",
					date: "2026-04-01",
					impressions: 100,
					clicks: 20,
					conversions: 2,
					cost: 2000,
					conversionsValue: null,
				},
			],
		});

		renderPlatformCard();
		expect(
			await screen.findByTestId("platform-filter-state"),
		).toHaveTextContent("Google,Meta,Naver");

		await waitFor(() => {
			expect(rechartsState.pieOnClick).not.toBeNull();
		});

		await act(async () => {
			rechartsState.pieOnClick?.({
				payload: {
					platform: "Meta",
				},
			});
		});

		await waitFor(() => {
			expect(screen.getByTestId("platform-filter-state")).toHaveTextContent(
				"Google,Naver",
			);
		});
	});

	it("reflects external filter changes in platform selection", async () => {
		seedMockDb({
			campaigns: [
				{
					id: "cmp-1",
					name: "Google Active",
					platform: "Google",
					status: "active",
					budget: 1000,
					startDate: "2026-04-01",
					endDate: "2026-04-30",
				},
				{
					id: "cmp-2",
					name: "Meta Active",
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
					conversionsValue: null,
				},
				{
					id: "d-2",
					campaignId: "cmp-2",
					date: "2026-04-01",
					impressions: 100,
					clicks: 20,
					conversions: 2,
					cost: 2000,
					conversionsValue: null,
				},
			],
		});

		renderPlatformCard({ withFilterButton: true });

		const list = await screen.findByRole("group", {
			name: "플랫폼별 성과 도넛 범례",
		});
		const googleItem = within(list).getByRole("button", { name: /Google/ });
		const metaItem = within(list).getByRole("button", { name: /Meta/ });
		const naverItem = within(list).getByRole("button", { name: /Naver/ });

		expect(googleItem).toHaveAttribute("aria-pressed", "true");
		expect(metaItem).toHaveAttribute("aria-pressed", "true");
		expect(naverItem).toHaveAttribute("aria-pressed", "true");

		await userEvent.click(screen.getByRole("button", { name: "메타만 보기" }));

		await waitFor(() => {
			const updatedList = screen.getByRole("group", {
				name: "플랫폼별 성과 도넛 범례",
			});
			const updatedGoogleItem = within(updatedList).getByRole("button", {
				name: /Google/,
			});
			const updatedMetaItem = within(updatedList).getByRole("button", {
				name: /Meta/,
			});
			const updatedNaverItem = within(updatedList).getByRole("button", {
				name: /Naver/,
			});

			expect(screen.getByTestId("platform-filter-state")).toHaveTextContent(
				"Meta",
			);
			expect(updatedGoogleItem).toHaveAttribute("aria-pressed", "false");
			expect(updatedMetaItem).toHaveAttribute("aria-pressed", "true");
			expect(updatedNaverItem).toHaveAttribute("aria-pressed", "false");
		});
	});

	it("renders no-campaign message when campaigns are empty", async () => {
		server.use(
			http.get("/campaigns", () => HttpResponse.json([])),
			http.get("/daily_stats", () => HttpResponse.json([])),
		);

		renderPlatformCard();

		expect(
			await screen.findByText("필터 조건에 맞는 캠페인이 없습니다."),
		).toBeInTheDocument();
	});

	it("renders chart rows when selected metric values are all zero", async () => {
		seedMockDb({
			campaigns: [
				{
					id: "cmp-1",
					name: "Google Active",
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
					impressions: 0,
					clicks: 0,
					conversions: 0,
					cost: 0,
					conversionsValue: null,
				},
			],
		});

		renderPlatformCard();

		const list = await screen.findByRole("group", {
			name: "플랫폼별 성과 도넛 범례",
		});
		const googleItem = within(list).getByRole("button", { name: /Google/ });

		expect(googleItem).toHaveTextContent("₩0");
		expect(googleItem).toHaveTextContent("0%");
	});

	it("shows loading state before first query resolves", async () => {
		let releaseCampaignRequest: (() => void) | null = null;

		server.use(
			http.get("/campaigns", async () => {
				await new Promise<void>((resolve) => {
					releaseCampaignRequest = resolve;
				});

				return HttpResponse.json([]);
			}),
			http.get("/daily_stats", () => HttpResponse.json([])),
		);

		renderPlatformCard();

		expect(
			screen.getByTestId("platform-performance-loading"),
		).toBeInTheDocument();

		await waitFor(() => {
			expect(releaseCampaignRequest).not.toBeNull();
		});

		const release =
			releaseCampaignRequest ??
			(() => {
				throw new Error("Expected delayed campaign request to be registered");
			});

		release();
	});
});
