import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider, useSetAtom } from "jotai";
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
import { DailyTrendChartCard } from "@/widgets/daily-trend-chart/ui/daily-trend-chart-card";
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

	queryClients.push(queryClient);

	render(
		<Provider initialValues={[[globalFilterAtom, aprilFilter]]}>
			<QueryClientProvider client={queryClient}>
				{options?.withFilterButton ? <SetMetaOnlyFilterButton /> : null}
				<DailyTrendChartCard />
			</QueryClientProvider>
		</Provider>,
	);
}

function renderApp() {
	const queryClient = createQueryClient();

	queryClients.push(queryClient);

	render(
		<Provider initialValues={[[globalFilterAtom, aprilFilter]]}>
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
	it("keeps filter sections above the chart and the chart ahead of status and campaign sections in App", async () => {
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

		const filterSection = getClosestSection(
			screen.getByRole("heading", { name: "글로벌 필터" }),
		);
		const summarySection = getClosestSection(
			screen.getByRole("heading", { name: "필터 결과 요약" }),
		);
		const chartSection = getClosestSection(
			await screen.findByRole("heading", { name: "성과 개요" }),
		);
		const statusSection = getClosestSection(
			screen.getByRole("heading", { name: "운영 상태" }),
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

		expectSectionToPrecede(filterSection, chartSection);
		expectSectionToPrecede(summarySection, chartSection);
		expectSectionToPrecede(chartSection, statusSection);
		expectSectionToPrecede(statusSection, campaignSection);
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

		releaseCampaignRequest?.();

		await screen.findByText("필터 조건에 맞는 캠페인이 없습니다.");
	});

	it("renders the line-chart controls with only default metrics exposed and both selected", async () => {
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

		releaseDelayedCampaignRequest?.();

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

	it("keeps the last successful chart visible when a refetch fails", async () => {
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
				screen.getByText(
					"최신 성과 데이터를 불러오지 못해 마지막 성공 결과를 표시 중입니다.",
				),
			).toBeInTheDocument();
		});

		expect(screen.getByTestId("daily-trend-line-chart")).toBeInTheDocument();
		expect(screen.getByText("Request failed: 500")).toBeInTheDocument();
		expect(rechartsState.lineChartData).toEqual([
			{
				date: "2026-04-01",
				impressions: 300,
				clicks: 30,
				conversions: 3,
				cost: 3500,
			},
		]);
		expect(
			screen.queryByText("성과 데이터를 불러오지 못했습니다."),
		).not.toBeInTheDocument();
	});
});
