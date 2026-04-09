import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStore, Provider, useAtomValue, useSetAtom } from "jotai";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { createDashboardDataQueryKey } from "@/entities/dashboard/api/use-dashboard-data";
import { createInitialGlobalFilterState } from "@/entities/global-filter/model/defaults";
import {
	globalFilterAtom,
	setGlobalFilterAtom,
} from "@/entities/global-filter/model/store";
import { seedMockDb } from "@/shared/api/mock/db";
import { server } from "@/shared/api/mock/server";
import { createQueryClient } from "@/shared/api/query-client";
import { CampaignTableCard } from "@/widgets/campaign-table/ui/campaign-table-card";

const aprilFilter = createInitialGlobalFilterState(new Date("2026-04-15"));
const mayFilter = {
	...aprilFilter,
	dateRange: {
		startDate: "2026-05-01",
		endDate: "2026-05-31",
	},
};

function SetMayFilterButton() {
	const setFilter = useSetAtom(setGlobalFilterAtom);

	return (
		<button type="button" onClick={() => setFilter(mayFilter)}>
			5월 필터 적용
		</button>
	);
}

function RefetchCurrentFilterButton() {
	const queryClient = useQueryClient();
	const filter = useAtomValue(globalFilterAtom);

	return (
		<button
			type="button"
			onClick={() =>
				queryClient.invalidateQueries({
					queryKey: createDashboardDataQueryKey(filter),
				})
			}
		>
			현재 필터 새로고침
		</button>
	);
}

function renderCampaignTableCard(options?: {
	withMayFilterButton?: boolean;
	withRefetchButton?: boolean;
}) {
	const queryClient = createQueryClient();
	const store = createStore();

	store.set(globalFilterAtom, aprilFilter);

	render(
		<Provider store={store}>
			<QueryClientProvider client={queryClient}>
				{options?.withMayFilterButton ? <SetMayFilterButton /> : null}
				{options?.withRefetchButton ? <RefetchCurrentFilterButton /> : null}
				<CampaignTableCard />
			</QueryClientProvider>
		</Provider>,
	);
}

function seedDefaultCampaignRows() {
	seedMockDb({
		campaigns: [
			{
				id: "campaign-1",
				name: "브랜드 검색",
				platform: "Google",
				status: "active",
				budget: 1000000,
				startDate: "2026-04-01",
				endDate: "2026-04-30",
			},
			{
				id: "campaign-2",
				name: "리타겟팅 세트",
				platform: "Meta",
				status: "paused",
				budget: 600000,
				startDate: "2026-04-10",
				endDate: null,
			},
		],
		daily_stats: [
			{
				id: "daily-1",
				campaignId: "campaign-1",
				date: "2026-04-01",
				impressions: 1000,
				clicks: 25,
				conversions: 3,
				cost: 120000,
				conversionsValue: 360000,
			},
			{
				id: "daily-2",
				campaignId: "campaign-2",
				date: "2026-04-10",
				impressions: 500,
				clicks: 10,
				conversions: 1,
				cost: 70000,
				conversionsValue: 100000,
			},
		],
	});
}

function seedPaginatedCampaignRows() {
	seedMockDb({
		campaigns: Array.from({ length: 12 }, (_, index) => {
			const order = index + 1;
			const label = String(order).padStart(2, "0");

			return {
				id: `campaign-${label}`,
				name: `캠페인 ${label}`,
				platform: order % 2 === 0 ? "Meta" : "Google",
				status: order % 3 === 0 ? "paused" : "active",
				budget: 100000 * order,
				startDate: `2026-04-${String(order).padStart(2, "0")}`,
				endDate: "2026-04-30",
			};
		}),
		daily_stats: Array.from({ length: 12 }, (_, index) => {
			const order = index + 1;
			const label = String(order).padStart(2, "0");
			const descendingCost = (13 - order) * 10000;

			return {
				id: `daily-${label}`,
				campaignId: `campaign-${label}`,
				date: `2026-04-${String(order).padStart(2, "0")}`,
				impressions: 1000 + order,
				clicks: 10 + order,
				conversions: order % 4,
				cost: descendingCost,
				conversionsValue: descendingCost * 2,
			};
		}),
	});
}

describe("CampaignTableCard", () => {
	it("renders campaign rows with search, counts, and sortable columns", async () => {
		seedDefaultCampaignRows();

		renderCampaignTableCard();

		expect(
			await screen.findByRole("heading", { name: "캠페인 현황" }),
		).toBeInTheDocument();
		expect(
			await screen.findByRole("searchbox", { name: "캠페인 검색" }),
		).toBeInTheDocument();
		expect(await screen.findByText("총 2건 중 2건 표시")).toBeInTheDocument();

		const table = screen.getByRole("table", { name: "캠페인 현황 표" });
		const tableScope = within(table);

		expect(
			tableScope.getByRole("columnheader", { name: "캠페인명" }),
		).toBeVisible();
		expect(
			tableScope.getByRole("columnheader", { name: "상태" }),
		).toBeVisible();
		expect(
			tableScope.getByRole("columnheader", { name: "매체" }),
		).toBeVisible();
		expect(
			tableScope.getByRole("button", { name: "집행기간 정렬" }),
		).toBeVisible();
		expect(
			tableScope.getByRole("button", { name: "총 집행금액 정렬" }),
		).toBeVisible();
		expect(tableScope.getByRole("button", { name: "CTR 정렬" })).toBeVisible();
		expect(tableScope.getByRole("button", { name: "CPC 정렬" })).toBeVisible();
		expect(tableScope.getByRole("button", { name: "ROAS 정렬" })).toBeVisible();

		expect(tableScope.getByRole("cell", { name: "브랜드 검색" })).toBeVisible();
		expect(
			tableScope.getByRole("cell", { name: "리타겟팅 세트" }),
		).toBeVisible();
	});

	it("shows a filtered-empty message when no campaigns exist for the global filter", async () => {
		seedMockDb({
			campaigns: [
				{
					id: "campaign-may",
					name: "5월 신규 캠페인",
					platform: "Meta",
					status: "active",
					budget: 800000,
					startDate: "2026-05-01",
					endDate: "2026-05-31",
				},
			],
			daily_stats: [
				{
					id: "daily-may",
					campaignId: "campaign-may",
					date: "2026-05-10",
					impressions: 900,
					clicks: 18,
					conversions: 2,
					cost: 90000,
					conversionsValue: 180000,
				},
			],
		});

		renderCampaignTableCard();

		expect(
			await screen.findByText("조건에 맞는 캠페인이 없습니다."),
		).toBeVisible();
		expect(screen.getByText("총 0건 중 0건 표시")).toBeInTheDocument();
	});

	it("shows a search-empty message when filtered campaigns exist but search yields no results", async () => {
		seedDefaultCampaignRows();
		const user = userEvent.setup();

		renderCampaignTableCard();

		await screen.findByText("총 2건 중 2건 표시");
		await user.type(
			screen.getByRole("searchbox", { name: "캠페인 검색" }),
			"없는 캠페인",
		);

		expect(await screen.findByText("검색 결과가 없습니다.")).toBeVisible();
		expect(screen.getByText("총 2건 중 0건 표시")).toBeInTheDocument();
	});

	it("renders mobile-oriented campaign rows in mobile view", async () => {
		seedDefaultCampaignRows();
		const originalMatchMedia = window.matchMedia;
		const user = userEvent.setup();

		Object.defineProperty(window, "matchMedia", {
			writable: true,
			value: (query: string) => ({
				matches: query === "(max-width: 1023px)",
				media: query,
				onchange: null,
				addEventListener: () => {},
				removeEventListener: () => {},
				addListener: () => {},
				removeListener: () => {},
				dispatchEvent: () => false,
			}),
		});

		try {
			renderCampaignTableCard();

			expect(
				await screen.findByTestId("campaign-mobile-row-campaign-1"),
			).toBeVisible();
			expect(
				screen.getByTestId("campaign-mobile-row-campaign-2"),
			).toBeVisible();

			const rowCheckbox = screen.getByRole("checkbox", {
				name: "브랜드 검색 선택",
			});

			expect(screen.getByText("선택 0건")).toBeInTheDocument();
			expect(rowCheckbox).not.toBeChecked();

			await user.click(rowCheckbox);

			expect(screen.getByText("선택 1건")).toBeInTheDocument();
			expect(
				screen.getByRole("checkbox", { name: "브랜드 검색 선택" }),
			).toBeChecked();
		} finally {
			Object.defineProperty(window, "matchMedia", {
				writable: true,
				value: originalMatchMedia,
			});
		}
	});

	it("keeps the apply action disabled until both rows and a target status are selected", async () => {
		seedDefaultCampaignRows();
		const user = userEvent.setup();

		renderCampaignTableCard();

		const statusSelect = await screen.findByRole("combobox", {
			name: "변경할 상태",
		});
		const applyButton = screen.getByRole("button", {
			name: "상태 적용",
		});

		expect(screen.getByText("선택 0건")).toBeInTheDocument();
		expect(statusSelect).toHaveValue("");
		expect(applyButton).toBeDisabled();
		expect(
			screen.queryByRole("dialog", { name: "캠페인 상태 변경" }),
		).not.toBeInTheDocument();

		await user.click(
			screen.getByRole("checkbox", { name: "브랜드 검색 선택" }),
		);

		expect(screen.getByText("선택 1건")).toBeInTheDocument();
		expect(applyButton).toBeDisabled();

		await user.selectOptions(statusSelect, "ended");

		expect(applyButton).toBeEnabled();

		await user.click(applyButton);

		expect(
			await screen.findByRole("dialog", { name: "캠페인 상태 변경" }),
		).toBeInTheDocument();
		expect(
			screen.getByText("선택한 캠페인 1건의 상태를 종료로 변경합니다."),
		).toBeVisible();
		expect(screen.getByRole("button", { name: "변경 적용" })).toBeEnabled();
	});

	it("confirms the dialog and updates row statuses after invalidation-driven refetch", async () => {
		seedDefaultCampaignRows();
		const user = userEvent.setup();

		renderCampaignTableCard();

		await screen.findByText("브랜드 검색");
		await user.click(
			screen.getByRole("checkbox", { name: "브랜드 검색 선택" }),
		);
		await user.selectOptions(
			screen.getByRole("combobox", { name: "변경할 상태" }),
			"ended",
		);
		await user.click(screen.getByRole("button", { name: "상태 적용" }));

		const dialog = await screen.findByRole("dialog", {
			name: "캠페인 상태 변경",
		});
		expect(
			within(dialog).getByText("선택한 캠페인 1건의 상태를 종료로 변경합니다."),
		).toBeVisible();

		await user.click(within(dialog).getByRole("button", { name: "변경 적용" }));

		await waitFor(() => {
			expect(
				screen.queryByRole("dialog", { name: "캠페인 상태 변경" }),
			).not.toBeInTheDocument();
		});
		await waitFor(() => {
			const table = screen.getByRole("table", { name: "캠페인 현황 표" });
			expect(within(table).getByText("종료")).toBeInTheDocument();
		});
		expect(screen.getByText("선택 0건")).toBeInTheDocument();
		expect(screen.getByRole("combobox", { name: "변경할 상태" })).toHaveValue(
			"",
		);
		expect(screen.getByRole("button", { name: "상태 적용" })).toBeDisabled();
	});

	it("keeps the selection and shows an error message when the status update fails", async () => {
		seedDefaultCampaignRows();
		server.use(
			http.patch(
				"/campaigns/status",
				() => new HttpResponse(null, { status: 500 }),
			),
		);
		const user = userEvent.setup();

		renderCampaignTableCard();

		await screen.findByText("브랜드 검색");
		await user.click(
			screen.getByRole("checkbox", { name: "브랜드 검색 선택" }),
		);
		await user.selectOptions(
			screen.getByRole("combobox", { name: "변경할 상태" }),
			"paused",
		);
		await user.click(screen.getByRole("button", { name: "상태 적용" }));

		const dialog = await screen.findByRole("dialog", {
			name: "캠페인 상태 변경",
		});
		await user.click(within(dialog).getByRole("button", { name: "변경 적용" }));

		expect(
			await within(dialog).findByText("상태 변경에 실패했습니다."),
		).toBeVisible();
		expect(within(dialog).getByText("Request failed: 500")).toBeVisible();
		expect(screen.getByText("선택 1건")).toBeInTheDocument();
		await user.click(within(dialog).getByRole("button", { name: "취소" }));
		expect(
			await screen.findByRole("checkbox", { name: "브랜드 검색 선택" }),
		).toBeChecked();
		expect(screen.getByRole("combobox", { name: "변경할 상태" })).toHaveValue(
			"paused",
		);
		expect(screen.getByRole("button", { name: "상태 적용" })).toBeEnabled();
	});

	it("clears selection and disables apply when the selected rows disappear after a filter change", async () => {
		seedMockDb({
			campaigns: [
				{
					id: "campaign-april",
					name: "4월 브랜드 검색",
					platform: "Google",
					status: "active",
					budget: 1000000,
					startDate: "2026-04-01",
					endDate: "2026-04-30",
				},
				{
					id: "campaign-may",
					name: "5월 신규 캠페인",
					platform: "Meta",
					status: "paused",
					budget: 800000,
					startDate: "2026-05-01",
					endDate: "2026-05-31",
				},
			],
			daily_stats: [
				{
					id: "daily-april",
					campaignId: "campaign-april",
					date: "2026-04-10",
					impressions: 1200,
					clicks: 30,
					conversions: 4,
					cost: 150000,
					conversionsValue: 450000,
				},
				{
					id: "daily-may",
					campaignId: "campaign-may",
					date: "2026-05-10",
					impressions: 900,
					clicks: 18,
					conversions: 2,
					cost: 90000,
					conversionsValue: 180000,
				},
			],
		});
		const user = userEvent.setup();

		renderCampaignTableCard({ withMayFilterButton: true });

		await screen.findByText("4월 브랜드 검색");
		await user.click(
			screen.getByRole("checkbox", { name: "4월 브랜드 검색 선택" }),
		);
		await user.selectOptions(
			screen.getByRole("combobox", { name: "변경할 상태" }),
			"ended",
		);

		expect(screen.getByText("선택 1건")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "상태 적용" })).toBeEnabled();

		screen.getByText("5월 필터 적용").click();

		expect(await screen.findByText("5월 신규 캠페인")).toBeInTheDocument();
		expect(screen.getByText("선택 0건")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "상태 적용" })).toBeDisabled();
	});

	it("does not send a status update request when selection is cleared after a filter change while dialog is open", async () => {
		seedMockDb({
			campaigns: [
				{
					id: "campaign-april",
					name: "4월 브랜드 검색",
					platform: "Google",
					status: "active",
					budget: 1000000,
					startDate: "2026-04-01",
					endDate: "2026-04-30",
				},
				{
					id: "campaign-may",
					name: "5월 신규 캠페인",
					platform: "Meta",
					status: "paused",
					budget: 800000,
					startDate: "2026-05-01",
					endDate: "2026-05-31",
				},
			],
			daily_stats: [
				{
					id: "daily-april",
					campaignId: "campaign-april",
					date: "2026-04-10",
					impressions: 1200,
					clicks: 30,
					conversions: 4,
					cost: 150000,
					conversionsValue: 450000,
				},
				{
					id: "daily-may",
					campaignId: "campaign-may",
					date: "2026-05-10",
					impressions: 900,
					clicks: 18,
					conversions: 2,
					cost: 90000,
					conversionsValue: 180000,
				},
			],
		});
		let patchRequestCount = 0;
		server.use(
			http.patch("/campaigns/status", async () => {
				patchRequestCount += 1;
				return new HttpResponse(null, { status: 204 });
			}),
		);
		const user = userEvent.setup();

		renderCampaignTableCard({ withMayFilterButton: true });

		await screen.findByText("4월 브랜드 검색");
		await user.click(
			screen.getByRole("checkbox", { name: "4월 브랜드 검색 선택" }),
		);
		await user.selectOptions(
			screen.getByRole("combobox", { name: "변경할 상태" }),
			"ended",
		);
		await user.click(screen.getByRole("button", { name: "상태 적용" }));

		const dialog = await screen.findByRole("dialog", {
			name: "캠페인 상태 변경",
		});
		expect(
			within(dialog).getByRole("button", { name: "변경 적용" }),
		).toBeEnabled();

		screen.getByText("5월 필터 적용").click();

		expect(await screen.findByText("5월 신규 캠페인")).toBeInTheDocument();
		const updatedDialog = screen.getByRole("dialog", {
			name: "캠페인 상태 변경",
		});
		expect(
			within(updatedDialog).getByText(
				"선택한 캠페인 0건의 상태를 종료로 변경합니다.",
			),
		).toBeVisible();
		expect(
			within(updatedDialog).getByRole("button", { name: "변경 적용" }),
		).toBeDisabled();
		expect(patchRequestCount).toBe(0);
	});

	it("sorts rows, paginates 10 per page, and keeps selection across pages", async () => {
		seedPaginatedCampaignRows();
		const user = userEvent.setup();

		renderCampaignTableCard();

		expect(await screen.findByText("총 12건 중 12건 표시")).toBeInTheDocument();
		expect(screen.getByText("페이지 1 / 2")).toBeInTheDocument();
		expect(
			screen.getByRole("checkbox", { name: "캠페인 01 선택" }),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("checkbox", { name: "캠페인 11 선택" }),
		).not.toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: "총 집행금액 정렬" }));

		expect(
			screen.getByRole("checkbox", { name: "캠페인 12 선택" }),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("checkbox", { name: "캠페인 01 선택" }),
		).not.toBeInTheDocument();

		const pageSelectAllCheckbox = screen.getByRole("checkbox", {
			name: "현재 페이지 캠페인 모두 선택",
		});

		await user.click(screen.getByRole("checkbox", { name: "캠페인 12 선택" }));

		expect(screen.getByText("선택 1건")).toBeInTheDocument();
		expect(pageSelectAllCheckbox).toHaveAttribute("aria-checked", "mixed");

		await user.click(screen.getByRole("button", { name: "다음" }));

		expect(screen.getByText("페이지 2 / 2")).toBeInTheDocument();
		expect(screen.getByText("선택 1건")).toBeInTheDocument();
		expect(pageSelectAllCheckbox).toHaveAttribute("aria-checked", "false");
		expect(
			screen.getByRole("checkbox", { name: "캠페인 02 선택" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("checkbox", { name: "캠페인 01 선택" }),
		).toBeInTheDocument();

		await user.click(pageSelectAllCheckbox);

		expect(screen.getByText("선택 3건")).toBeInTheDocument();
		expect(pageSelectAllCheckbox).toHaveAttribute("aria-checked", "true");

		await user.click(screen.getByRole("button", { name: "이전" }));

		expect(screen.getByText("페이지 1 / 2")).toBeInTheDocument();
		expect(screen.getByText("선택 3건")).toBeInTheDocument();
		expect(pageSelectAllCheckbox).toHaveAttribute("aria-checked", "mixed");
	});

	it("renders an in-card loading state before the initial query resolves", async () => {
		const campaignRequestGate: { release: null | (() => void) } = {
			release: null,
		};

		server.use(
			http.get("/campaigns", async () => {
				await new Promise<void>((resolve) => {
					campaignRequestGate.release = resolve;
				});

				return HttpResponse.json([]);
			}),
		);

		renderCampaignTableCard();

		expect(
			await screen.findByRole("heading", { name: "캠페인 현황" }),
		).toBeVisible();
		expect(screen.getByTestId("campaign-table-loading")).toBeInTheDocument();
		expect(
			screen.queryByRole("searchbox", { name: "캠페인 검색" }),
		).not.toBeInTheDocument();

		await waitFor(() => {
			expect(campaignRequestGate.release).not.toBeNull();
		});

		const releasePendingCampaignRequest = campaignRequestGate.release;

		if (typeof releasePendingCampaignRequest === "function") {
			releasePendingCampaignRequest();
		}
	});

	it("renders an in-card full error state when the initial query fails", async () => {
		server.use(
			http.get("/campaigns", () =>
				HttpResponse.json({ message: "boom" }, { status: 500 }),
			),
		);

		renderCampaignTableCard();

		expect(
			await screen.findByText("캠페인 데이터를 불러오지 못했습니다."),
		).toBeVisible();
		expect(screen.getByText("Request failed: 500")).toBeVisible();
		expect(
			screen.queryByRole("searchbox", { name: "캠페인 검색" }),
		).not.toBeInTheDocument();
	});

	it("keeps the last successful rows and shows stale error messaging on refetch failure", async () => {
		seedDefaultCampaignRows();
		const user = userEvent.setup();

		renderCampaignTableCard({ withRefetchButton: true });

		expect(await screen.findByText("브랜드 검색")).toBeVisible();

		server.use(
			http.get("/campaigns", () =>
				HttpResponse.json({ message: "boom" }, { status: 500 }),
			),
		);

		await user.click(
			screen.getByRole("button", { name: "현재 필터 새로고침" }),
		);

		expect(
			await screen.findByText(
				"최신 캠페인 데이터를 불러오지 못해 마지막 성공 결과를 표시 중입니다.",
			),
		).toBeVisible();
		expect(screen.getByText("Request failed: 500")).toBeVisible();
		expect(screen.getByText("브랜드 검색")).toBeVisible();
	});
});
