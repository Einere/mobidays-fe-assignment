import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider, useAtomValue } from "jotai";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { useDashboardData } from "@/entities/dashboard/hooks/use-dashboard-data";
import { createInitialGlobalFilterState } from "@/entities/global-filter/model/defaults";
import { globalFilterAtom } from "@/entities/global-filter/model/store";
import { seedMockDb } from "@/shared/api/mock/db";
import { server } from "@/shared/api/mock/server";
import { createQueryClient } from "@/shared/api/query-client";
import { GlobalFilterBar } from "@/widgets/global-filter/ui/global-filter-bar";

function FilterStateSnapshot() {
	const filter = useAtomValue(globalFilterAtom);

	return <pre data-testid="global-filter-state">{JSON.stringify(filter)}</pre>;
}

function DashboardQueryProbe() {
	const filter = useAtomValue(globalFilterAtom);
	const query = useDashboardData(filter);

	return (
		<div
			data-fetch-status={query.fetchStatus}
			data-testid="dashboard-query-probe"
		>
			{query.data?.campaigns.length ?? 0}
		</div>
	);
}

function renderGlobalFilterBar() {
	render(
		<Provider>
			<GlobalFilterBar />
			<FilterStateSnapshot />
		</Provider>,
	);
}

function renderGlobalFilterBarWithQuery() {
	const queryClient = createQueryClient();

	render(
		<Provider>
			<QueryClientProvider client={queryClient}>
				<GlobalFilterBar />
				<FilterStateSnapshot />
				<DashboardQueryProbe />
			</QueryClientProvider>
		</Provider>,
	);
}

describe("GlobalFilterBar", () => {
	it("toggles desktop chips using the shared filter semantics", async () => {
		const user = userEvent.setup();

		renderGlobalFilterBar();

		const statusGroup = screen.getByRole("group", { name: "상태 필터" });
		const allChip = within(statusGroup).getByRole("button", { name: "전체" });
		const activeChip = within(statusGroup).getByRole("button", {
			name: "운영 중",
		});
		const statusLegend = within(statusGroup).getByText("상태");

		expect(activeChip).toHaveAttribute("aria-pressed", "true");
		expect(statusLegend.className).toContain("mb-2");
		expect(activeChip.className).toContain("hover:border-brand-strong");
		expect(activeChip.className).toContain("hover:bg-selected-hover");

		await user.click(activeChip);

		expect(activeChip).toHaveAttribute("aria-pressed", "false");
		expect(allChip).toHaveAttribute("aria-pressed", "false");
		expect(screen.getByTestId("global-filter-state")).toHaveTextContent(
			'"statuses":["paused","ended"]',
		);

		await user.click(allChip);

		expect(activeChip).toHaveAttribute("aria-pressed", "true");
		expect(allChip).toHaveAttribute("aria-pressed", "true");
		expect(screen.getByTestId("global-filter-state")).toHaveTextContent(
			'"statuses":["active","paused","ended"]',
		);
	});

	it("keeps mobile dropdown checkboxes synced with the same atom state", async () => {
		const user = userEvent.setup();

		renderGlobalFilterBar();

		expect(
			screen.getByText("글로벌 필터").closest("div")?.parentElement?.className,
		).toContain("justify-between");
		expect(
			screen.getByLabelText("시작일").closest("div")?.parentElement?.className,
		).toContain("grid-cols-2");

		const mobileTrigger = screen.getByRole("button", {
			name: "매체 필터 열기",
		});
		expect(screen.getByTestId("mobile-filter-grid").className).toContain(
			"grid-cols-2",
		);

		expect(mobileTrigger).toHaveTextContent("전체 3");

		await user.click(mobileTrigger);

		const dropdown = await screen.findByRole("dialog", { name: "매체 필터" });
		const googleOption = within(dropdown).getByRole("button", {
			name: "Google",
		});

		expect(googleOption).toHaveAttribute("aria-pressed", "true");

		await user.click(googleOption);

		await waitFor(() => {
			expect(mobileTrigger).toHaveTextContent("Meta, Naver");
			expect(screen.getByTestId("global-filter-state")).toHaveTextContent(
				'"platforms":["Meta","Naver"]',
			);
		});

		await waitFor(() => {
			expect(googleOption).toHaveAttribute("aria-pressed", "false");
		});
	});

	it("uses a focusable mobile row button as the interactive toggle target", async () => {
		const user = userEvent.setup();

		renderGlobalFilterBar();

		await user.click(screen.getByRole("button", { name: "매체 필터 열기" }));

		const dropdown = await screen.findByRole("dialog", { name: "매체 필터" });
		const googleOption = within(dropdown).getByRole("button", {
			name: "Google",
		});

		await user.tab();

		expect(googleOption).toHaveFocus();
		expect(googleOption.className).toContain("focus-visible:ring-focus");
		expect(googleOption).toHaveAttribute("aria-pressed", "true");

		await user.keyboard("[Space]");

		await waitFor(() => {
			expect(googleOption).toHaveAttribute("aria-pressed", "false");
			expect(screen.getByTestId("global-filter-state")).toHaveTextContent(
				'"platforms":["Meta","Naver"]',
			);
		});
	});

	it("shows a validation message and keeps the last valid atom state for descending dates", async () => {
		const user = userEvent.setup();

		renderGlobalFilterBar();

		const startDateInput = screen.getByLabelText("시작일");
		const endDateInput = screen.getByLabelText("종료일");

		await user.clear(startDateInput);
		await user.type(startDateInput, "2026-04-10");
		await user.clear(endDateInput);
		await user.type(endDateInput, "2026-04-20");

		expect(screen.getByTestId("global-filter-state")).toHaveTextContent(
			'"startDate":"2026-04-10"',
		);
		expect(screen.getByTestId("global-filter-state")).toHaveTextContent(
			'"endDate":"2026-04-20"',
		);

		await user.clear(endDateInput);
		await user.type(endDateInput, "2026-04-01");

		expect(
			screen.getByText("시작일은 종료일보다 늦을 수 없습니다."),
		).toBeInTheDocument();
		expect(startDateInput.className).toContain(
			"aria-invalid:border-status-danger-border",
		);
		expect(startDateInput).toHaveValue("2026-04-10");
		expect(endDateInput).toHaveValue("2026-04-01");
		expect(screen.getByTestId("global-filter-state")).toHaveTextContent(
			'"startDate":"2026-04-10"',
		);
		expect(screen.getByTestId("global-filter-state")).toHaveTextContent(
			'"endDate":"2026-04-20"',
		);
	});

	it("restores date, status, and platform defaults when reset is clicked", async () => {
		const user = userEvent.setup();
		const initialFilter = createInitialGlobalFilterState();

		renderGlobalFilterBar();

		const startDateInput = screen.getByLabelText("시작일");
		const endDateInput = screen.getByLabelText("종료일");
		const statusGroup = screen.getByRole("group", { name: "상태 필터" });
		const platformGroup = screen.getByRole("group", { name: "매체 필터" });

		await user.clear(startDateInput);
		await user.type(startDateInput, "2026-04-10");
		await user.clear(endDateInput);
		await user.type(endDateInput, "2026-04-20");
		await user.click(
			within(statusGroup).getByRole("button", { name: "운영 중" }),
		);
		await user.click(
			within(platformGroup).getByRole("button", { name: "Google" }),
		);
		await user.click(screen.getByRole("button", { name: "초기화" }));

		expect(startDateInput).toHaveValue(initialFilter.dateRange.startDate);
		expect(endDateInput).toHaveValue(initialFilter.dateRange.endDate);
		expect(screen.getByTestId("global-filter-state")).toHaveTextContent(
			`"statuses":${JSON.stringify(initialFilter.statuses)}`,
		);
		expect(screen.getByTestId("global-filter-state")).toHaveTextContent(
			`"platforms":${JSON.stringify(initialFilter.platforms)}`,
		);
	});

	it("does not trigger a new query when a descending date range is entered", async () => {
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

		server.use(
			http.get("/campaigns", ({ request }) => {
				campaignsRequestCount += 1;
				const { searchParams } = new URL(request.url);

				return HttpResponse.json([
					{
						id: "1",
						name: `campaign-${searchParams.get("startDate")}`,
						platform: "Google",
						status: "active",
						budget: 1000,
						startDate: "2026-04-01",
						endDate: "2026-04-30",
					},
				]);
			}),
		);

		renderGlobalFilterBarWithQuery();

		await waitFor(() => {
			expect(screen.getByTestId("dashboard-query-probe")).toHaveTextContent(
				"1",
			);
		});
		expect(campaignsRequestCount).toBe(1);

		const startDateInput = screen.getByLabelText("시작일");
		const endDateInput = screen.getByLabelText("종료일");

		await user.clear(startDateInput);
		await user.type(startDateInput, "2026-04-10");
		await user.clear(endDateInput);
		await user.type(endDateInput, "2026-04-20");

		await waitFor(() => {
			expect(campaignsRequestCount).toBe(3);
		});
		const requestCountBeforeInvalidRange = campaignsRequestCount;

		await waitFor(() => {
			expect(screen.getByTestId("global-filter-state")).toHaveTextContent(
				'"startDate":"2026-04-10"',
			);
		});

		await user.clear(endDateInput);
		await user.type(endDateInput, "2026-04-01");

		expect(
			screen.getByText("시작일은 종료일보다 늦을 수 없습니다."),
		).toBeInTheDocument();
		await waitFor(() => {
			expect(campaignsRequestCount).toBe(requestCountBeforeInvalidRange);
		});
	});
});
