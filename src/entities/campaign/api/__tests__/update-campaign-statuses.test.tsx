import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { describe, expect, it, vi } from "vitest";
import { updateCampaignStatuses } from "@/entities/campaign/api/update-campaign-statuses";
import { useUpdateCampaignStatuses } from "@/entities/campaign/api/use-update-campaign-statuses";
import { createDashboardDataQueryKey } from "@/entities/dashboard/api/use-dashboard-data";
import type { GlobalFilterState } from "@/entities/global-filter/model/types";
import { mockDb, seedMockDb } from "@/shared/api/mock/db";
import {
	getMemoryDb,
	updateCampaignStatusesByIds,
} from "@/shared/api/mock/memory-db";
import { server } from "@/shared/api/mock/server";
import { createQueryClient } from "@/shared/api/query-client";

const filter: GlobalFilterState = {
	dateRange: { startDate: "2026-04-01", endDate: "2026-04-30" },
	statuses: ["active", "paused", "ended"],
	platforms: ["Google", "Meta", "Naver"],
};

describe("campaign status updates", () => {
	it("updates only matching campaign statuses in memory db without mutating the original mock db", () => {
		const targetCampaignId = String(mockDb.campaigns[0]?.id);
		const untouchedCampaignId = String(mockDb.campaigns[1]?.id);
		const originalTargetStatus = mockDb.campaigns[0]?.status;
		const originalUntouchedStatus = mockDb.campaigns[1]?.status;

		updateCampaignStatusesByIds([targetCampaignId], "paused");

		const memoryDb = getMemoryDb();
		const updatedCampaign = memoryDb.campaigns.find(
			(campaign) => campaign.id === targetCampaignId,
		);
		const untouchedCampaign = memoryDb.campaigns.find(
			(campaign) => campaign.id === untouchedCampaignId,
		);

		expect(updatedCampaign?.status).toBe("paused");
		expect(untouchedCampaign?.status).toBe(originalUntouchedStatus);
		expect(mockDb.campaigns[0]?.status).toBe(originalTargetStatus);
		expect(mockDb.campaigns[1]?.status).toBe(originalUntouchedStatus);
	});

	it("persists PATCH /campaigns/status updates in the session memory db for subsequent reads", async () => {
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
					name: "Meta Paused",
					platform: "Meta",
					status: "paused",
					budget: 2000,
					startDate: "2026-04-01",
					endDate: "2026-04-30",
				},
			],
			daily_stats: [],
		});

		await updateCampaignStatuses({
			ids: ["1"],
			status: "ended",
		});

		const campaignsUrl = new URL("/campaigns", window.location.origin);
		campaignsUrl.searchParams.set("startDate", filter.dateRange.startDate);
		campaignsUrl.searchParams.set("endDate", filter.dateRange.endDate);
		campaignsUrl.searchParams.set("statuses", filter.statuses.join(","));
		campaignsUrl.searchParams.set("platforms", filter.platforms.join(","));

		const response = await fetch(campaignsUrl);
		const campaigns = (await response.json()) as Array<{
			id: string;
			status: string;
		}>;

		expect(response.ok).toBe(true);
		expect(campaigns).toEqual([
			expect.objectContaining({ id: "1", status: "ended" }),
			expect.objectContaining({ id: "2", status: "paused" }),
		]);
	});

	it("throws when the status update request returns a non-ok response", async () => {
		server.use(
			http.patch(
				"/campaigns/status",
				() => new HttpResponse(null, { status: 500 }),
			),
		);

		await expect(
			updateCampaignStatuses({
				ids: ["1"],
				status: "paused",
			}),
		).rejects.toThrow("Request failed: 500");
	});

	it("invalidates the matching dashboard query key after a successful mutation", async () => {
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

		const queryClient = createQueryClient();
		const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
		const wrapper = ({ children }: { children: React.ReactNode }) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);

		const { result } = renderHook(() => useUpdateCampaignStatuses(filter), {
			wrapper,
		});

		await act(async () => {
			await result.current.mutateAsync({
				ids: ["1"],
				status: "paused",
			});
		});

		expect(invalidateQueriesSpy).toHaveBeenCalledWith({
			queryKey: createDashboardDataQueryKey(filter),
		});
	});
});
