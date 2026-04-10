import { describe, expect, it } from "vitest";
import { buildCampaignTableRows } from "@/entities/campaign/lib/build-campaign-table-rows";
import {
	formatCampaignMetric,
	formatCampaignPeriod,
	formatCampaignStatusLabel,
} from "@/entities/campaign/lib/format-campaign-table";
import type {
	DashboardCampaign,
	DashboardDailyStat,
} from "@/entities/dashboard/lib/parse-dashboard-data";
import type { RawCampaign, RawDailyStat } from "@/shared/api/mock/types";

function createRawCampaign(overrides: Partial<RawCampaign> = {}): RawCampaign {
	return {
		id: "raw-campaign-id",
		name: "Raw Campaign",
		platform: "Google",
		status: "active",
		budget: 1000,
		startDate: "2026-04-01",
		endDate: "2026-04-30",
		...overrides,
	};
}

function createRawDailyStat(
	overrides: Partial<RawDailyStat> = {},
): RawDailyStat {
	return {
		id: "raw-daily-stat-id",
		campaignId: "cmp-1",
		date: "2026-04-01",
		impressions: 0,
		clicks: 0,
		conversions: 0,
		cost: 0,
		conversionsValue: 0,
		...overrides,
	};
}

describe("buildCampaignTableRows", () => {
	it("aggregates campaign stats into sortable raw row values for campaigns with and without stats", () => {
		const campaigns: DashboardCampaign[] = [
			{
				raw: createRawCampaign({
					id: "cmp-1",
					name: "Campaign One",
					platform: "Google",
					status: "active",
					startDate: "2026-04-01",
					endDate: "2026-04-30",
				}),
				id: "cmp-1",
				name: "Campaign One",
				platform: "Google",
				status: "active",
				budget: 1000,
				startDate: "2026-04-01",
				endDate: "2026-04-30",
			},
			{
				raw: createRawCampaign({
					id: "cmp-2",
					name: null,
					platform: "Meta",
					status: "paused",
					startDate: null,
					endDate: null,
				}),
				id: "cmp-2",
				name: null,
				platform: "Meta",
				status: "paused",
				budget: 500,
				startDate: null,
				endDate: null,
			},
		];

		const dailyStats: DashboardDailyStat[] = [
			{
				raw: createRawDailyStat({
					id: "stat-1",
					campaignId: "cmp-1",
					impressions: 100,
					clicks: 10,
					conversions: 2,
					cost: 40,
					conversionsValue: 120,
				}),
				id: "stat-1",
				campaignId: "cmp-1",
				date: "2026-04-01",
				impressions: 100,
				clicks: 10,
				conversions: 2,
				cost: 40,
				conversionsValue: 120,
			},
			{
				raw: createRawDailyStat({
					id: "stat-2",
					campaignId: "cmp-1",
					date: "2026-04-02",
					impressions: 0,
					clicks: 0,
					conversions: null,
					cost: 0,
					conversionsValue: 0,
				}),
				id: "stat-2",
				campaignId: "cmp-1",
				date: "2026-04-02",
				impressions: 0,
				clicks: 0,
				conversions: null,
				cost: 0,
				conversionsValue: 0,
			},
		];

		expect(buildCampaignTableRows({ campaigns, dailyStats })).toEqual([
			{
				id: "cmp-1",
				name: "Campaign One",
				status: "active",
				platform: "Google",
				startDate: "2026-04-01",
				endDate: "2026-04-30",
				periodSortValue: Date.parse("2026-04-01"),
				cost: 40,
				ctr: 10,
				cpc: 4,
				roas: 300,
			},
			{
				id: "cmp-2",
				name: "-",
				status: "paused",
				platform: "Meta",
				startDate: null,
				endDate: null,
				periodSortValue: null,
				cost: null,
				ctr: null,
				cpc: null,
				roas: null,
			},
		]);
	});

	it("keeps zero distinct from null and returns null on division by zero", () => {
		const campaigns: DashboardCampaign[] = [
			{
				raw: createRawCampaign({
					id: "cmp-1",
					name: "Zero Campaign",
					platform: "Google",
					status: "active",
					startDate: "2026-04-01",
					endDate: "2026-04-30",
				}),
				id: "cmp-1",
				name: "Zero Campaign",
				platform: "Google",
				status: "active",
				budget: 1000,
				startDate: "2026-04-01",
				endDate: "2026-04-30",
			},
		];

		const dailyStats: DashboardDailyStat[] = [
			{
				raw: createRawDailyStat({
					id: "stat-1",
					campaignId: "cmp-1",
					impressions: 0,
					clicks: 0,
					conversions: 0,
					cost: 0,
					conversionsValue: 0,
				}),
				id: "stat-1",
				campaignId: "cmp-1",
				date: "2026-04-01",
				impressions: 0,
				clicks: 0,
				conversions: 0,
				cost: 0,
				conversionsValue: 0,
			},
		];

		expect(buildCampaignTableRows({ campaigns, dailyStats })[0]).toEqual({
			id: "cmp-1",
			name: "Zero Campaign",
			status: "active",
			platform: "Google",
			startDate: "2026-04-01",
			endDate: "2026-04-30",
			periodSortValue: Date.parse("2026-04-01"),
			cost: 0,
			ctr: null,
			cpc: null,
			roas: null,
		});
	});
});

describe("formatCampaignTable helpers", () => {
	it("formats campaign status labels", () => {
		expect(formatCampaignStatusLabel("active")).toBe("진행 중");
		expect(formatCampaignStatusLabel("paused")).toBe("일시중지");
		expect(formatCampaignStatusLabel("ended")).toBe("종료");
		expect(formatCampaignStatusLabel(null)).toBe("-");
	});

	it("formats campaign periods", () => {
		expect(formatCampaignPeriod(null, "2026-04-30")).toBe("-");
		expect(formatCampaignPeriod("2026-04-01", null)).toBe(
			"2026-04-01 ~ 진행 중",
		);
		expect(formatCampaignPeriod("2026-04-01", "2026-04-30")).toBe(
			"2026-04-01 ~ 2026-04-30",
		);
	});

	it("formats campaign metrics", () => {
		expect(formatCampaignMetric(null, "currency")).toBe("-");
		expect(formatCampaignMetric(1000, "currency")).toBe("₩1,000");
		expect(formatCampaignMetric(10, "percent")).toBe("10%");
		expect(formatCampaignMetric(12.345, "percent")).toBe("12.35%");
	});
});
