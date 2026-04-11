import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider, useAtomValue, useSetAtom } from "jotai";
import { HttpResponse, http } from "msw";
import type { PropsWithChildren } from "react";
import { describe, expect, it } from "vitest";
import { server } from "@/app/mock/server";
import { DashboardDataProvider } from "@/entities/dashboard";
import { createInitialGlobalFilterState } from "@/entities/global-filter/model/defaults";
import {
	globalFilterAtom,
	setGlobalFilterAtom,
} from "@/entities/global-filter/model/store";
import { seedMockDb } from "@/shared/api/mock/db";
import { createQueryClient } from "@/shared/api/query-client";
import { GlobalFilterSummary } from "@/widgets/global-filter/ui/global-filter-summary";

const aprilFilter = createInitialGlobalFilterState(new Date("2026-04-15"));

function getCampaignResultCard() {
	return screen.getByText("캠페인 결과").closest("div");
}

function getDateResultCard() {
	return screen.getByText("일별 데이터 결과").closest("div");
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

function DashboardDataTestProvider({ children }: PropsWithChildren) {
	const filter = useAtomValue(globalFilterAtom);

	return (
		<DashboardDataProvider filter={filter}>{children}</DashboardDataProvider>
	);
}

function renderGlobalFilterSummary() {
	const queryClient = createQueryClient();

	render(
		<Provider>
			<QueryClientProvider client={queryClient}>
				<DashboardDataTestProvider>
					<SetMetaOnlyFilterButton />
					<GlobalFilterSummary />
				</DashboardDataTestProvider>
			</QueryClientProvider>
		</Provider>,
	);
}

describe("GlobalFilterSummary", () => {
	it("renders only campaign and daily result cards without a query state card", async () => {
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
					impressions: 10,
					clicks: 1,
					conversions: 0,
					cost: 100,
					conversionsValue: null,
				},
			],
		});

		renderGlobalFilterSummary();

		await screen.findAllByText("1건");

		expect(screen.queryByText("조회 상태")).not.toBeInTheDocument();
		expect(screen.getByText("캠페인 결과")).toBeInTheDocument();
		expect(screen.getByText("일별 데이터 결과")).toBeInTheDocument();
		expect(getCampaignResultCard()?.parentElement?.className).toContain(
			"grid-cols-2",
		);
		expect(screen.queryByText("기간")).not.toBeInTheDocument();
		expect(screen.queryByText("상태")).not.toBeInTheDocument();
		expect(screen.queryByText("매체")).not.toBeInTheDocument();
	});

	it("keeps the previous result visible while a filter update is in flight", async () => {
		const user = userEvent.setup();
		let releaseDelayedCampaignRequest: (() => void) | null = null;
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
					date: "2026-04-02",
					impressions: 10,
					clicks: 1,
					conversions: 0,
					cost: 100,
					conversionsValue: null,
				},
				{
					id: "d2",
					campaignId: "2",
					date: "2026-04-02",
					impressions: 20,
					clicks: 2,
					conversions: 1,
					cost: 200,
					conversionsValue: 300,
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
		);

		renderGlobalFilterSummary();

		await screen.findAllByText("2건");

		await user.click(screen.getByRole("button", { name: "메타만 보기" }));

		expect(
			screen.getByText("최신 필터 결과를 불러오는 중입니다."),
		).toBeInTheDocument();
		expect(
			screen.getByText("현재 값은 마지막 성공 결과입니다."),
		).toBeInTheDocument();
		expect(screen.queryByText("조회 상태")).not.toBeInTheDocument();
		expect(
			within(getCampaignResultCard() as HTMLElement).getByText("2건"),
		).toBeInTheDocument();
		expect(
			within(getDateResultCard() as HTMLElement).getByText("2건"),
		).toBeInTheDocument();

		const releaseRequest = releaseDelayedCampaignRequest;

		if (typeof releaseRequest !== "function") {
			throw new Error(
				"Expected the delayed campaign request to be registered.",
			);
		}

		(releaseRequest as () => void)();

		await waitFor(() => {
			expect(
				within(getCampaignResultCard() as HTMLElement).getByText("1건"),
			).toBeInTheDocument();
		});

		expect(
			within(getDateResultCard() as HTMLElement).getByText("1건"),
		).toBeInTheDocument();
	});

	it("shows the initial error state when the first request fails", async () => {
		server.use(
			http.get("/campaigns", () =>
				HttpResponse.json({ message: "boom" }, { status: 500 }),
			),
		);

		renderGlobalFilterSummary();

		await waitFor(() => {
			expect(
				screen.getByText("필터 결과 요약을 불러오지 못했습니다."),
			).toBeInTheDocument();
		});

		expect(
			screen.queryByText("마지막 성공 결과입니다."),
		).not.toBeInTheDocument();
		expect(screen.queryByText("Request failed: 500")).not.toBeInTheDocument();
		expect(screen.queryByText("조회 상태")).not.toBeInTheDocument();
		expect(screen.queryByText("캠페인 결과")).not.toBeInTheDocument();
		expect(screen.queryByText("일별 데이터 결과")).not.toBeInTheDocument();
	});

	it("keeps the last successful summary visible when a refetch fails", async () => {
		const user = userEvent.setup();

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
					date: "2026-04-02",
					impressions: 10,
					clicks: 1,
					conversions: 0,
					cost: 100,
					conversionsValue: null,
				},
				{
					id: "d2",
					campaignId: "2",
					date: "2026-04-02",
					impressions: 20,
					clicks: 2,
					conversions: 1,
					cost: 200,
					conversionsValue: 300,
				},
			],
		});

		server.use(
			http.get("/campaigns", ({ request }) => {
				const platforms = new URL(request.url).searchParams.get("platforms");

				if (platforms === "Meta") {
					return HttpResponse.json(
						{ message: "metadata unavailable" },
						{ status: 500 },
					);
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
		);

		renderGlobalFilterSummary();

		await screen.findAllByText("2건");

		await user.click(screen.getByRole("button", { name: "메타만 보기" }));

		await waitFor(() => {
			expect(
				screen.getByText("최신 필터 결과를 불러오지 못했습니다."),
			).toBeInTheDocument();
		});
		expect(
			screen.getByText("최신 필터 결과를 불러오지 못했습니다."),
		).toHaveClass("text-status-danger-fg");
		expect(
			screen.getByText("현재 값은 마지막 성공 결과입니다."),
		).toBeInTheDocument();
		expect(screen.getByText("현재 값은 마지막 성공 결과입니다.")).toHaveClass(
			"text-status-danger-fg",
		);
		expect(screen.queryByText("Request failed: 500")).not.toBeInTheDocument();
		expect(
			within(getCampaignResultCard() as HTMLElement).getByText("2건"),
		).toBeInTheDocument();
		expect(
			within(getDateResultCard() as HTMLElement).getByText("2건"),
		).toBeInTheDocument();
	});
});
