import { HttpResponse, http } from "msw";
import { describe, expect, it, vi } from "vitest";
import { server } from "@/app/mock/server";
import * as campaignApi from "@/entities/campaign";
import * as dailyStatApi from "@/entities/daily-stat/api/fetch-daily-stats";
import {
	createDashboardDataQueryKey,
	fetchDashboardData,
	getDashboardDataQueryOptions,
} from "@/entities/dashboard";
import { seedMockDb } from "@/shared/api/mock/db";

describe("fetchDashboardData", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("forwards the same AbortSignal through dashboard query and data fetches", async () => {
		const campaigns = [
			{
				id: "1",
				name: "Google Active",
				platform: "Google",
				status: "active",
				budget: 1000,
				startDate: "2026-04-01",
				endDate: "2026-04-30",
			},
		];

		const dailyStats = [
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
		];

		const signal = new AbortController().signal;
		const dashboardFilter = {
			dateRange: { startDate: "2026-04-01", endDate: "2026-04-30" },
			statuses: ["active"],
			platforms: ["Google"],
		};

		const campaignSpy = vi
			.spyOn(campaignApi, "fetchCampaigns")
			.mockResolvedValue(campaigns as never);
		const dailyStatsSpy = vi
			.spyOn(dailyStatApi, "fetchDailyStats")
			.mockResolvedValue(dailyStats as never);

		const options = getDashboardDataQueryOptions(dashboardFilter);
		const queryFn = options.queryFn as unknown as (context: {
			signal: AbortSignal;
		}) => ReturnType<typeof fetchDashboardData>;

		await expect(queryFn({ signal })).resolves.toEqual({
			campaigns,
			dailyStats,
		});

		expect(campaignSpy).toHaveBeenCalledWith(dashboardFilter, signal);
		expect(dailyStatsSpy).toHaveBeenCalledWith(
			{
				startDate: dashboardFilter.dateRange.startDate,
				endDate: dashboardFilter.dateRange.endDate,
				campaignIds: ["1"],
			},
			signal,
		);
	});

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

	it("fetches campaigns with the dashboard filter shape", async () => {
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

		const campaigns = await campaignApi.fetchCampaigns({
			dateRange: { startDate: "2026-04-01", endDate: "2026-04-30" },
			statuses: ["active"],
			platforms: ["Google"],
		});

		expect(campaigns).toHaveLength(1);
		expect(campaigns[0]?.id).toBe("1");
	});

	it("fetches daily stats for the requested campaign ids", async () => {
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
					conversionsValue: 200,
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

		const dailyStats = await dailyStatApi.fetchDailyStats({
			startDate: "2026-04-01",
			endDate: "2026-04-30",
			campaignIds: ["1"],
		});

		expect(dailyStats).toHaveLength(1);
		expect(dailyStats[0]?.campaignId).toBe("1");
	});

	it("preserves campaigns with unknown platform values for chart-level grouping", async () => {
		seedMockDb({
			campaigns: [
				{
					id: "1",
					name: "Unknown Active",
					platform: "TikTok",
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

		const result = await fetchDashboardData({
			dateRange: { startDate: "2026-04-01", endDate: "2026-04-30" },
			statuses: ["active"],
			platforms: ["Google", "Meta", "Naver"],
		});

		expect(result.campaigns).toEqual([
			expect.objectContaining({
				id: "1",
				platform: null,
				rawPlatform: "TikTok",
			}),
		]);
		expect(result.dailyStats).toHaveLength(1);
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

	it("parses raw responses without coercing invalid dashboard enum values", async () => {
		server.use(
			http.get("/campaigns", () => {
				return HttpResponse.json([
					{
						id: "1",
						name: "Unexpected Platform",
						platform: "Facebook",
						status: "running",
						budget: "2000000원",
						startDate: "2026/04/12",
						endDate: null,
					},
				]);
			}),
			http.get("/daily_stats", () => {
				return HttpResponse.json([
					{
						id: "d1",
						campaignId: "1",
						date: "2026-04-12",
						impressions: 10,
						clicks: 1,
						conversions: 0,
						cost: 100,
						conversionsValue: 300,
					},
				]);
			}),
		);

		const result = await fetchDashboardData({
			dateRange: { startDate: "2026-04-01", endDate: "2026-04-30" },
			statuses: ["active"],
			platforms: ["Google"],
		});

		expect(result.campaigns).toEqual([
			expect.objectContaining({
				id: "1",
				platform: null,
				rawPlatform: "Facebook",
				status: null,
				budget: null,
				startDate: null,
				raw: expect.objectContaining({
					platform: "Facebook",
					status: "running",
				}),
			}),
		]);
		expect(result.dailyStats[0]?.campaignId).toBe("1");
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
