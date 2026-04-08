import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { fetchDashboardData } from "@/entities/dashboard/api/fetch-dashboard-data";
import { createDashboardDataQueryKey } from "@/entities/dashboard/api/use-dashboard-data";
import { seedMockDb } from "@/shared/api/mock/db";
import { server } from "@/shared/api/mock/server";

describe("fetchDashboardData", () => {
	it("returns campaigns and daily stats filtered on the server", async () => {
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
					budget: 1000,
					startDate: "2026-04-01",
					endDate: "2026-04-30",
				},
			],
			dailyStats: [
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
					conversionsValue: 500,
				},
			],
		});

		const result = await fetchDashboardData({
			dateRange: { startDate: "2026-04-01", endDate: "2026-04-30" },
			statuses: ["active"],
			platforms: ["Google"],
		});

		expect(result.campaigns).toHaveLength(1);
		expect(result.campaigns[0]?.id).toBe("1");
		expect(result.dailyStats).toHaveLength(1);
		expect(result.dailyStats[0]?.campaignId).toBe("1");
	});

	it("throws when the campaigns request returns a non-ok response", async () => {
		server.use(
			http.get("/campaigns", () => {
				return new HttpResponse(null, { status: 500 });
			}),
		);

		await expect(
			fetchDashboardData({
				dateRange: { startDate: "2026-04-01", endDate: "2026-04-30" },
				statuses: ["active"],
				platforms: ["Google"],
			}),
		).rejects.toThrow("Request failed: 500");
	});

	it("builds the same query key for logically identical filters", () => {
		const a = createDashboardDataQueryKey({
			dateRange: { startDate: "2026-04-01", endDate: "2026-04-30" },
			statuses: ["paused", "active"],
			platforms: ["Meta", "Google"],
		});
		const b = createDashboardDataQueryKey({
			dateRange: { startDate: "2026-04-01", endDate: "2026-04-30" },
			statuses: ["active", "paused"],
			platforms: ["Google", "Meta"],
		});

		expect(a).toEqual(b);
	});
});
