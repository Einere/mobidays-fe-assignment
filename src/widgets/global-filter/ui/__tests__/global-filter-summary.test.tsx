import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider, useSetAtom } from "jotai";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { createInitialGlobalFilterState } from "@/entities/global-filter/model/defaults";
import { setGlobalFilterAtom } from "@/entities/global-filter/model/store";
import { seedMockDb } from "@/shared/api/mock/db";
import { server } from "@/shared/api/mock/server";
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

function renderGlobalFilterSummary() {
	const queryClient = createQueryClient();

	render(
		<Provider>
			<QueryClientProvider client={queryClient}>
				<SetMetaOnlyFilterButton />
				<GlobalFilterSummary />
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

		const dateRangeLabel = screen.getByText("기간");

		expect(screen.queryByText("조회 상태")).not.toBeInTheDocument();
		expect(screen.getByText("캠페인 결과")).toBeInTheDocument();
		expect(screen.getByText("일별 데이터 결과")).toBeInTheDocument();
		expect(dateRangeLabel.className).toContain("mb-2");
		expect(screen.getByText("Google, Meta, Naver")).toBeInTheDocument();
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

		await waitFor(() => {
			expect(screen.getByText("Meta")).toBeInTheDocument();
		});

		expect(screen.queryByText("조회 상태")).not.toBeInTheDocument();
		expect(
			within(getCampaignResultCard() as HTMLElement).getByText("2건"),
		).toBeInTheDocument();
		expect(
			within(getDateResultCard() as HTMLElement).getByText("2건"),
		).toBeInTheDocument();

		releaseDelayedCampaignRequest?.();

		await waitFor(() => {
			expect(
				within(getCampaignResultCard() as HTMLElement).getByText("1건"),
			).toBeInTheDocument();
		});

		expect(
			within(getDateResultCard() as HTMLElement).getByText("1건"),
		).toBeInTheDocument();
	});

	it("renders an inline error message without reviving the removed status card", async () => {
		server.use(
			http.get("/campaigns", () =>
				HttpResponse.json({ message: "boom" }, { status: 500 }),
			),
		);

		renderGlobalFilterSummary();

		await waitFor(() => {
			expect(screen.getByText("Request failed: 500")).toBeInTheDocument();
		});

		expect(screen.queryByText("조회 상태")).not.toBeInTheDocument();
		expect(screen.getByText("캠페인 결과")).toBeInTheDocument();
		expect(screen.getByText("일별 데이터 결과")).toBeInTheDocument();
	});
});
