import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStore, Provider, useSetAtom } from "jotai";
import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "@/App";
import { createInitialGlobalFilterState } from "@/entities/global-filter/model/defaults";
import {
	globalFilterAtom,
	setGlobalFilterAtom,
} from "@/entities/global-filter/model/store";
import { seedMockDb } from "@/shared/api/mock/db";
import { server } from "@/shared/api/mock/server";
import { createQueryClient } from "@/shared/api/query-client";
import {
	DailyTrendChartCard,
	resolveDailyTrendChartViewState,
} from "@/widgets/daily-trend-chart/ui/daily-trend-chart-card";
import { toggleDailyTrendMetricSelection } from "@/widgets/daily-trend-chart/ui/daily-trend-line-chart";

const aprilFilter = createInitialGlobalFilterState(new Date("2026-04-15"));
const queryClients: QueryClient[] = [];

const rechartsState = vi.hoisted(() => ({
	lineChartData: [] as unknown[],
	lineProps: [] as Array<Record<string, unknown>>,
	tooltipLabel: null as null | string,
	tooltipPayload: [] as Array<Record<string, unknown>>,
}));

vi.mock("recharts", async () => {
	const React = await import("react");

	return {
		ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
			<div data-testid="responsive-container">{children}</div>
		),
		Legend: () => <div data-testid="legend" />,
		Tooltip: ({
			content,
		}: {
			content?: React.ReactElement<Record<string, unknown>>;
		}) => (
			<div data-testid="tooltip">
				{React.isValidElement(content)
					? React.cloneElement(content, {
							active: rechartsState.tooltipPayload.length > 0,
							label: rechartsState.tooltipLabel,
							payload: rechartsState.tooltipPayload,
						})
					: null}
			</div>
		),
		CartesianGrid: () => <div data-testid="cartesian-grid" />,
		XAxis: ({ dataKey }: { dataKey?: string }) => (
			<div data-testid="x-axis" data-key={dataKey ?? ""} />
		),
		YAxis: () => <div data-testid="y-axis" />,
		LineChart: ({
			children,
			data,
		}: {
			children: React.ReactNode;
			data?: unknown[];
		}) => {
			rechartsState.lineChartData = Array.isArray(data) ? data : [];

			return <div data-testid="daily-trend-line-chart">{children}</div>;
		},
		Line: (props: Record<string, unknown>) => {
			rechartsState.lineProps.push(props);

			return <div data-testid={`line-${String(props.dataKey)}`} />;
		},
	};
});

afterEach(() => {
	rechartsState.lineChartData = [];
	rechartsState.lineProps = [];
	rechartsState.tooltipLabel = null;
	rechartsState.tooltipPayload = [];

	for (const queryClient of queryClients.splice(0)) {
		queryClient.clear();
	}
});

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

function renderChart(options?: { withFilterButton?: boolean }) {
	const queryClient = createQueryClient();
	const store = createStore();

	store.set(globalFilterAtom, aprilFilter);

	queryClients.push(queryClient);

	render(
		<Provider store={store}>
			<QueryClientProvider client={queryClient}>
				{options?.withFilterButton ? <SetMetaOnlyFilterButton /> : null}
				<DailyTrendChartCard />
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

function getClosestSection(element: HTMLElement) {
	const section = element.closest("section");

	expect(section).not.toBeNull();

	return section as HTMLElement;
}

function expectSectionToPrecede(first: HTMLElement, second: HTMLElement) {
	expect(
		first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING,
	).toBeTruthy();
}

describe("DailyTrendChartCard", () => {
	it("keeps the page constrained and places the chart between filter sections and the campaign table in App", async () => {
		seedMockDb({
			campaigns: [
				{
					id: "1",
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
					id: "d1",
					campaignId: "1",
					date: "2026-04-01",
					impressions: 100,
					clicks: 10,
					conversions: 1,
					cost: 1000,
					conversionsValue: null,
				},
			],
		});

		renderApp();

		expect(screen.getByRole("main").className).toContain("overflow-x-hidden");

		const filterSection = getClosestSection(
			screen.getByRole("heading", { name: "글로벌 필터" }),
		);
		const summarySection = getClosestSection(
			screen.getByRole("heading", { name: "필터 결과 요약" }),
		);
		const chartSection = getClosestSection(
			await screen.findByRole("heading", { name: "성과 개요" }),
		);
		const campaignSection = getClosestSection(
			screen.getByRole("heading", { name: "캠페인 현황" }),
		);

		expect(
			within(chartSection).getByText(
				"전역 필터 기준으로 집계한 일별 추이 꺾은선 그래프입니다.",
			),
		).toBeInTheDocument();
		expect(
			await within(chartSection).findByRole("group", {
				name: "일별 추이 메트릭",
			}),
		).toBeInTheDocument();
		expect(
			within(chartSection).getByRole("button", { name: "노출수" }),
		).toBeInTheDocument();
		expect(
			within(chartSection).getByRole("button", { name: "클릭수" }),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "지난 7일" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "보고서 내보내기" }),
		).not.toBeInTheDocument();
		expect(
			within(chartSection)
				.getByRole("group", { name: "일별 추이 메트릭" })
				.compareDocumentPosition(
					within(chartSection).getByTestId("daily-trend-line-chart"),
				) & Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy();

		expectSectionToPrecede(filterSection, chartSection);
		expectSectionToPrecede(summarySection, chartSection);
		expectSectionToPrecede(chartSection, campaignSection);
	});

	it("uses an in-card horizontal scroll area for the chart on narrow screens", async () => {
		seedMockDb({
			campaigns: [
				{
					id: "1",
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
					id: "d1",
					campaignId: "1",
					date: "2026-04-01",
					impressions: 100,
					clicks: 10,
					conversions: 1,
					cost: 1000,
					conversionsValue: null,
				},
			],
		});

		renderChart();

		const scrollArea = await screen.findByTestId("daily-trend-scroll-area");
		const chart = within(scrollArea).getByTestId(
			"responsive-container",
		).parentElement;

		expect(
			screen.getByText("좌우로 스크롤해 추이 전체를 비교하세요."),
		).toBeInTheDocument();
		expect(scrollArea.className).toContain("overflow-x-auto");
		expect(chart?.className).toContain("min-w-[720px]");
	});

	it("renders a fixed-height loading placeholder during the initial query", async () => {
		let releaseCampaignRequest: (() => void) | null = null;

		server.use(
			http.get("/campaigns", async () => {
				await new Promise<void>((resolve) => {
					releaseCampaignRequest = resolve;
				});

				return HttpResponse.json([]);
			}),
		);

		renderChart();

		const loadingPlaceholder = screen.getByTestId("daily-trend-loading");

		expect(loadingPlaceholder.className).toContain("h-80");

		await waitFor(() => {
			expect(releaseCampaignRequest).not.toBeNull();
		});

		const releaseRequest = releaseCampaignRequest;

		if (typeof releaseRequest !== "function") {
			throw new Error(
				"Expected the delayed campaign request to be registered.",
			);
		}

		(releaseRequest as () => void)();

		await screen.findByText("필터 조건에 맞는 캠페인이 없습니다.");
	});

	it("renders only the supported line-chart controls and keeps both selected by default", async () => {
		rechartsState.tooltipLabel = "2026-04-02";
		rechartsState.tooltipPayload = [
			{
				dataKey: "clicks",
				name: "클릭수",
				value: 1234,
				color: "var(--chart-info)",
			},
		];

		seedMockDb({
			campaigns: [
				{
					id: "1",
					name: "Google Active",
					platform: "Google",
					status: "active",
					budget: 1000,
					startDate: "2026-04-01",
					endDate: "2026-04-30",
				},
				{
					id: "2",
					name: "Meta Active",
					platform: "Meta",
					status: "paused",
					budget: 1500,
					startDate: "2026-04-01",
					endDate: "2026-04-30",
				},
			],
			daily_stats: [
				{
					id: "d1",
					campaignId: "1",
					date: "2026-04-01",
					impressions: 100,
					clicks: 10,
					conversions: 1,
					cost: 1000,
					conversionsValue: null,
				},
				{
					id: "d2",
					campaignId: "2",
					date: "2026-04-01",
					impressions: 200,
					clicks: 20,
					conversions: 2,
					cost: 2500,
					conversionsValue: 4000,
				},
				{
					id: "d3",
					campaignId: "1",
					date: "2026-04-02",
					impressions: null,
					clicks: 5,
					conversions: 0,
					cost: 600,
					conversionsValue: null,
				},
			],
		});

		renderChart();

		await screen.findByTestId("daily-trend-line-chart");

		expect(
			screen.getByRole("heading", { name: "성과 개요" }),
		).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "노출수" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
		expect(screen.getByRole("button", { name: "클릭수" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
		expect(
			screen.queryByRole("button", { name: "전환수" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "집행비용" }),
		).not.toBeInTheDocument();

		await waitFor(() => {
			expect(screen.getByTestId("daily-trend-line-chart")).toBeInTheDocument();
		});

		expect(rechartsState.lineChartData).toEqual([
			{
				date: "2026-04-01",
				impressions: 300,
				clicks: 30,
				conversions: 3,
				cost: 3500,
			},
			{
				date: "2026-04-02",
				impressions: null,
				clicks: 5,
				conversions: 0,
				cost: 600,
			},
		]);
		expect(
			rechartsState.lineProps.slice(-2).map((line) => ({
				dataKey: line.dataKey,
				connectNulls: line.connectNulls,
				dot: line.dot,
			})),
		).toEqual([
			{ dataKey: "impressions", connectNulls: false, dot: true },
			{ dataKey: "clicks", connectNulls: false, dot: true },
		]);
		expect(
			within(screen.getByTestId("tooltip")).getByText("클릭수"),
		).toBeInTheDocument();
		expect(
			within(screen.getByTestId("tooltip")).getByText("1,234"),
		).toBeInTheDocument();
	});

	it("formats tooltip values for non-visible metrics through the shared formatter contract", async () => {
		rechartsState.tooltipLabel = "2026-04-02";
		rechartsState.tooltipPayload = [
			{
				dataKey: "conversions",
				name: "전환수",
				value: 3,
				color: "var(--chart-warning)",
			},
			{
				dataKey: "cost",
				name: "집행비용",
				value: 3500,
				color: "var(--chart-danger)",
			},
		];

		seedMockDb({
			campaigns: [
				{
					id: "1",
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
					id: "d1",
					campaignId: "1",
					date: "2026-04-02",
					impressions: 100,
					clicks: 10,
					conversions: 3,
					cost: 3500,
					conversionsValue: null,
				},
			],
		});

		renderChart();

		await screen.findByTestId("daily-trend-line-chart");

		expect(
			within(screen.getByTestId("tooltip")).getByText("전환수"),
		).toBeInTheDocument();
		expect(
			within(screen.getByTestId("tooltip")).getByText("3"),
		).toBeInTheDocument();
		expect(
			within(screen.getByTestId("tooltip")).getByText("집행비용"),
		).toBeInTheDocument();
		expect(
			within(screen.getByTestId("tooltip")).getByText("₩3,500"),
		).toBeInTheDocument();
	});

	it("keeps at least one metric active when toggling selections", () => {
		expect(
			toggleDailyTrendMetricSelection(["impressions"], "impressions"),
		).toEqual(["impressions"]);
		expect(
			toggleDailyTrendMetricSelection(["impressions", "clicks"], "clicks"),
		).toEqual(["impressions"]);
		expect(toggleDailyTrendMetricSelection(["clicks"], "impressions")).toEqual([
			"impressions",
			"clicks",
		]);
	});

	it("renders an empty-state message when no campaigns match the filter", async () => {
		server.use(
			http.get("/campaigns", () => HttpResponse.json([])),
			http.get("/daily_stats", () => HttpResponse.json([])),
		);

		renderChart();

		expect(
			await screen.findByText("필터 조건에 맞는 캠페인이 없습니다."),
		).toBeInTheDocument();
	});

	it("renders a separate empty state when campaigns exist without chartable daily data", async () => {
		seedMockDb({
			campaigns: [
				{
					id: "1",
					name: "Google Active",
					platform: "Google",
					status: "active",
					budget: 1000,
					startDate: "2026-04-01",
					endDate: "2026-04-30",
				},
			],
			daily_stats: [],
		});

		renderChart();

		expect(
			await screen.findByText("선택한 캠페인에 표시할 일별 데이터가 없습니다."),
		).toBeInTheDocument();
	});

	it("renders an error state when the dashboard query fails", async () => {
		server.use(
			http.get("/campaigns", () =>
				HttpResponse.json({ message: "boom" }, { status: 500 }),
			),
		);

		renderChart();

		expect(
			await screen.findByText("성과 데이터를 불러오지 못했습니다."),
		).toBeInTheDocument();
	});

	it("keeps the current chart visible and shows syncing text while a refetch is in flight", async () => {
		const user = userEvent.setup();
		let campaignsRequestCount = 0;
		let releaseDelayedCampaignRequest: (() => void) | null = null;

		seedMockDb({
			campaigns: [
				{
					id: "1",
					name: "Google Active",
					platform: "Google",
					status: "active",
					budget: 1000,
					startDate: "2026-04-01",
					endDate: "2026-04-30",
				},
				{
					id: "2",
					name: "Meta Active",
					platform: "Meta",
					status: "active",
					budget: 1500,
					startDate: "2026-04-01",
					endDate: "2026-04-30",
				},
			],
			daily_stats: [
				{
					id: "d1",
					campaignId: "1",
					date: "2026-04-01",
					impressions: 100,
					clicks: 10,
					conversions: 1,
					cost: 1000,
					conversionsValue: null,
				},
				{
					id: "d2",
					campaignId: "2",
					date: "2026-04-01",
					impressions: 200,
					clicks: 20,
					conversions: 2,
					cost: 2500,
					conversionsValue: 4000,
				},
			],
		});

		server.use(
			http.get("/campaigns", async ({ request }) => {
				campaignsRequestCount += 1;

				if (campaignsRequestCount === 2) {
					await new Promise<void>((resolve) => {
						releaseDelayedCampaignRequest = resolve;
					});
				}

				const platforms = new URL(request.url).searchParams.get("platforms");

				if (platforms === "Meta") {
					return HttpResponse.json([
						{
							id: "2",
							name: "Meta Active",
							platform: "Meta",
							status: "active",
							budget: 1500,
							startDate: "2026-04-01",
							endDate: "2026-04-30",
						},
					]);
				}

				return HttpResponse.json([
					{
						id: "1",
						name: "Google Active",
						platform: "Google",
						status: "active",
						budget: 1000,
						startDate: "2026-04-01",
						endDate: "2026-04-30",
					},
					{
						id: "2",
						name: "Meta Active",
						platform: "Meta",
						status: "active",
						budget: 1500,
						startDate: "2026-04-01",
						endDate: "2026-04-30",
					},
				]);
			}),
			http.get("/daily_stats", ({ request }) => {
				const campaignIds = new URL(request.url).searchParams.get(
					"campaignIds",
				);

				if (campaignIds === "2") {
					return HttpResponse.json([
						{
							id: "d2",
							campaignId: "2",
							date: "2026-04-01",
							impressions: 200,
							clicks: 20,
							conversions: 2,
							cost: 2500,
							conversionsValue: 4000,
						},
					]);
				}

				return HttpResponse.json([
					{
						id: "d1",
						campaignId: "1",
						date: "2026-04-01",
						impressions: 100,
						clicks: 10,
						conversions: 1,
						cost: 1000,
						conversionsValue: null,
					},
					{
						id: "d2",
						campaignId: "2",
						date: "2026-04-01",
						impressions: 200,
						clicks: 20,
						conversions: 2,
						cost: 2500,
						conversionsValue: 4000,
					},
				]);
			}),
		);

		renderChart({ withFilterButton: true });

		await waitFor(() => {
			expect(rechartsState.lineChartData).toEqual([
				{
					date: "2026-04-01",
					impressions: 300,
					clicks: 30,
					conversions: 3,
					cost: 3500,
				},
			]);
		});

		await user.click(screen.getByRole("button", { name: "메타만 보기" }));

		await waitFor(() => {
			expect(screen.getByText("동기화 중")).toBeInTheDocument();
		});
		expect(screen.getByTestId("daily-trend-line-chart")).toBeInTheDocument();
		expect(rechartsState.lineChartData).toEqual([
			{
				date: "2026-04-01",
				impressions: 300,
				clicks: 30,
				conversions: 3,
				cost: 3500,
			},
		]);

		const releaseRequest = releaseDelayedCampaignRequest;

		if (typeof releaseRequest !== "function") {
			throw new Error(
				"Expected the delayed campaign request to be registered.",
			);
		}

		(releaseRequest as () => void)();

		await waitFor(() => {
			expect(screen.queryByText("동기화 중")).not.toBeInTheDocument();
			expect(rechartsState.lineChartData).toEqual([
				{
					date: "2026-04-01",
					impressions: 200,
					clicks: 20,
					conversions: 2,
					cost: 2500,
				},
			]);
		});
	});

	it("renders a full error state when the next query key fails", async () => {
		const user = userEvent.setup();
		let campaignsRequestCount = 0;

		seedMockDb({
			campaigns: [
				{
					id: "1",
					name: "Google Active",
					platform: "Google",
					status: "active",
					budget: 1000,
					startDate: "2026-04-01",
					endDate: "2026-04-30",
				},
				{
					id: "2",
					name: "Meta Active",
					platform: "Meta",
					status: "active",
					budget: 1500,
					startDate: "2026-04-01",
					endDate: "2026-04-30",
				},
			],
			daily_stats: [
				{
					id: "d1",
					campaignId: "1",
					date: "2026-04-01",
					impressions: 100,
					clicks: 10,
					conversions: 1,
					cost: 1000,
					conversionsValue: null,
				},
				{
					id: "d2",
					campaignId: "2",
					date: "2026-04-01",
					impressions: 200,
					clicks: 20,
					conversions: 2,
					cost: 2500,
					conversionsValue: 4000,
				},
			],
		});

		server.use(
			http.get("/campaigns", ({ request }) => {
				campaignsRequestCount += 1;

				if (campaignsRequestCount === 2) {
					return HttpResponse.json({ message: "boom" }, { status: 500 });
				}

				const platforms = new URL(request.url).searchParams.get("platforms");

				if (platforms === "Meta") {
					return HttpResponse.json([
						{
							id: "2",
							name: "Meta Active",
							platform: "Meta",
							status: "active",
							budget: 1500,
							startDate: "2026-04-01",
							endDate: "2026-04-30",
						},
					]);
				}

				return HttpResponse.json([
					{
						id: "1",
						name: "Google Active",
						platform: "Google",
						status: "active",
						budget: 1000,
						startDate: "2026-04-01",
						endDate: "2026-04-30",
					},
					{
						id: "2",
						name: "Meta Active",
						platform: "Meta",
						status: "active",
						budget: 1500,
						startDate: "2026-04-01",
						endDate: "2026-04-30",
					},
				]);
			}),
			http.get("/daily_stats", () =>
				HttpResponse.json([
					{
						id: "d1",
						campaignId: "1",
						date: "2026-04-01",
						impressions: 100,
						clicks: 10,
						conversions: 1,
						cost: 1000,
						conversionsValue: null,
					},
					{
						id: "d2",
						campaignId: "2",
						date: "2026-04-01",
						impressions: 200,
						clicks: 20,
						conversions: 2,
						cost: 2500,
						conversionsValue: 4000,
					},
				]),
			),
		);

		renderChart({ withFilterButton: true });

		await waitFor(() => {
			expect(rechartsState.lineChartData).toEqual([
				{
					date: "2026-04-01",
					impressions: 300,
					clicks: 30,
					conversions: 3,
					cost: 3500,
				},
			]);
		});

		await user.click(screen.getByRole("button", { name: "메타만 보기" }));

		await waitFor(() => {
			expect(
				screen.getByText("성과 데이터를 불러오지 못했습니다."),
			).toBeInTheDocument();
		});

		expect(screen.queryByText("Request failed: 500")).not.toBeInTheDocument();
		expect(
			screen.queryByTestId("daily-trend-line-chart"),
		).not.toBeInTheDocument();
	});

	it("resolves empty data when no snapshot or error exists", () => {
		expect(
			resolveDailyTrendChartViewState({
				currentDataSnapshot: null,
				errorMessage: null,
				isLoadingError: false,
				isPending: false,
				isRefetchError: false,
				isRefetching: false,
			}),
		).toEqual({
			kind: "empty-data",
		});
	});

	it("resolves the stale chart state from current query data when a background refetch fails", () => {
		expect(
			resolveDailyTrendChartViewState({
				currentDataSnapshot: {
					campaignsCount: 2,
					chartData: [
						{
							date: "2026-04-01",
							impressions: 300,
							clicks: 30,
							conversions: 3,
							cost: 3500,
						},
					],
				},
				errorMessage: "Request failed: 500",
				isLoadingError: false,
				isPending: false,
				isRefetchError: true,
				isRefetching: false,
			}),
		).toEqual({
			chartData: [
				{
					date: "2026-04-01",
					impressions: 300,
					clicks: 30,
					conversions: 3,
					cost: 3500,
				},
			],
			kind: "chart",
			staleErrorMessage: "Request failed: 500",
			isSyncing: false,
		});
	});

	it("resolves a full error when the next query key fails without current data", () => {
		expect(
			resolveDailyTrendChartViewState({
				currentDataSnapshot: null,
				errorMessage: "Request failed: 500",
				isLoadingError: true,
				isPending: false,
				isRefetchError: false,
				isRefetching: false,
			}),
		).toEqual({
			kind: "full-error",
			errorMessage: "Request failed: 500",
		});
	});
});
