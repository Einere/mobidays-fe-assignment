import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { Provider } from "jotai";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { seedMockDb } from "@/shared/api/mock/db";
import { server } from "@/shared/api/mock/server";
import { createQueryClient } from "@/shared/api/query-client";
import { GlobalFilterSummary } from "@/widgets/global-filter/ui/global-filter-summary";

function renderGlobalFilterSummary() {
	const queryClient = createQueryClient();

	render(
		<Provider>
			<QueryClientProvider client={queryClient}>
				<GlobalFilterSummary />
			</QueryClientProvider>
		</Provider>,
	);
}

describe("GlobalFilterSummary", () => {
	it("renders request state as a semantic status badge", async () => {
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

		const stateBadge = await screen.findByText("준비됨");
		const requestStateLabel = screen.getByText("조회 상태");
		const dateRangeLabel = screen.getByText("기간");

		expect(stateBadge.className).toContain("bg-[var(--status-success-bg)]");
		expect(stateBadge.className).toContain("text-[var(--status-success-fg)]");
		expect(requestStateLabel.className).toContain("mb-2");
		expect(dateRangeLabel.className).toContain("mb-2");
		expect(screen.getByText("Google, Meta, Naver")).toBeInTheDocument();
	});

	it("renders error state with danger semantics", async () => {
		server.use(
			http.get("/campaigns", () =>
				HttpResponse.json({ message: "boom" }, { status: 500 }),
			),
		);

		renderGlobalFilterSummary();

		await waitFor(() => {
			expect(screen.getByText("오류")).toBeInTheDocument();
		});

		const stateBadge = screen.getByText("오류");

		expect(stateBadge.className).toContain("bg-[var(--status-danger-bg)]");
		expect(stateBadge.className).toContain("text-[var(--status-danger-fg)]");
	});
});
