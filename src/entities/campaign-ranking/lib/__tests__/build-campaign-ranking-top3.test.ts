import { describe, expect, it } from "vitest";
import { buildCampaignRankingTop3 } from "@/entities/campaign-ranking/lib/build-campaign-ranking-top3";
import type {
	CampaignRankingCampaign,
	CampaignRankingDailyStat,
} from "@/entities/campaign-ranking/model/types";

function createCampaign(
	id: string,
	name: string | null = `Campaign ${id}`,
): CampaignRankingCampaign {
	return { id, name };
}

function createStat(
	campaignId: string,
	overrides: Partial<CampaignRankingDailyStat> = {},
): CampaignRankingDailyStat {
	return {
		campaignId,
		impressions: 0,
		clicks: 0,
		cost: 0,
		conversionsValue: 0,
		...overrides,
	};
}

describe("buildCampaignRankingTop3", () => {
	it("returns top 3 rankable campaigns ordered by selected metric", () => {
		const campaigns = [
			createCampaign("cmp-1", "A"),
			createCampaign("cmp-2", "B"),
			createCampaign("cmp-3", "C"),
			createCampaign("cmp-4", "D"),
		];
		const dailyStats = [
			createStat("cmp-1", {
				impressions: 100,
				clicks: 10,
				cost: 50,
				conversionsValue: 100,
			}),
			createStat("cmp-2", {
				impressions: 100,
				clicks: 10,
				cost: 10,
				conversionsValue: 30,
			}),
			createStat("cmp-3", {
				impressions: 100,
				clicks: 5,
				cost: 20,
				conversionsValue: 20,
			}),
			createStat("cmp-4", {
				impressions: 100,
				clicks: 20,
				cost: 100,
				conversionsValue: 400,
			}),
		];

		expect(
			buildCampaignRankingTop3({ campaigns, dailyStats, metricKey: "roas" }),
		).toEqual([
			{ id: "cmp-4", name: "D", roas: 400, ctr: 20, cpc: 5 },
			{ id: "cmp-2", name: "B", roas: 300, ctr: 10, cpc: 1 },
			{ id: "cmp-1", name: "A", roas: 200, ctr: 10, cpc: 5 },
		]);
	});

	it("keeps input order for ties", () => {
		const campaigns = [
			createCampaign("cmp-1", "A"),
			createCampaign("cmp-2", "B"),
			createCampaign("cmp-3", "C"),
			createCampaign("cmp-4", "D"),
		];
		const dailyStats = [
			createStat("cmp-1", { cost: 20, clicks: 10 }),
			createStat("cmp-2", { cost: 10, clicks: 5 }),
			createStat("cmp-3", { cost: 3, clicks: 1 }),
			createStat("cmp-4", { cost: 2, clicks: 1 }),
		];

		expect(
			buildCampaignRankingTop3({ campaigns, dailyStats, metricKey: "cpc" }),
		).toEqual([
			{ id: "cmp-1", name: "A", roas: 0, ctr: null, cpc: 2 },
			{ id: "cmp-2", name: "B", roas: 0, ctr: null, cpc: 2 },
			{ id: "cmp-4", name: "D", roas: 0, ctr: null, cpc: 2 },
		]);
	});

	it("excludes campaigns when selected metric is not rankable (N/A)", () => {
		const campaigns = [
			createCampaign("cmp-1", "A"),
			createCampaign("cmp-2", "B"),
			createCampaign("cmp-3", "C"),
			createCampaign("cmp-4", null),
		];
		const dailyStats = [
			createStat("cmp-1", { cost: 0, conversionsValue: 10 }),
			createStat("cmp-2", { cost: null, conversionsValue: 10 }),
			createStat("cmp-3", { cost: 10, conversionsValue: null }),
			createStat("cmp-4", { cost: 20, conversionsValue: 40 }),
			createStat("cmp-4", {
				cost: Number.POSITIVE_INFINITY,
				conversionsValue: 100,
			}),
			createStat("unknown", { cost: 10, conversionsValue: 100 }),
		];

		expect(
			buildCampaignRankingTop3({ campaigns, dailyStats, metricKey: "roas" }),
		).toEqual([{ id: "cmp-4", name: null, roas: 700, ctr: null, cpc: null }]);
	});

	it("returns empty array when no campaign can be ranked", () => {
		const campaigns = [
			createCampaign("cmp-1", "A"),
			createCampaign("cmp-2", null),
		];
		const dailyStats = [
			createStat("cmp-1", { impressions: 0, clicks: 0 }),
			createStat("cmp-2", { impressions: null, clicks: 10 }),
		];

		expect(
			buildCampaignRankingTop3({ campaigns, dailyStats, metricKey: "ctr" }),
		).toEqual([]);
	});
});
