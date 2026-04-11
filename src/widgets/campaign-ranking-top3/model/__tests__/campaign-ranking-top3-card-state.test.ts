import { describe, expect, it } from "vitest";
import {
	buildCampaignRankingTop3DisplayRows,
	resolveCampaignRankingTop3CardState,
} from "@/widgets/campaign-ranking-top3/model/campaign-ranking-top3-card-state";

describe("buildCampaignRankingTop3DisplayRows", () => {
	it("normalizes blank campaign names and filters out rows without metric values", () => {
		const rows = buildCampaignRankingTop3DisplayRows({
			metricKey: "cpc",
			rankedRows: [
				{
					id: "cmp-1",
					name: null,
					cpc: 12,
				},
				{
					id: "cmp-2",
					name: "   ",
					cpc: null,
				},
				{
					id: "cmp-3",
					name: "Meta 리타겟팅",
					cpc: 7.5,
				},
			],
		});

		expect(rows).toEqual([
			{
				id: "cmp-1",
				rankLabel: "1위",
				campaignLabel: "1위 이름 없음",
				metricValue: 12,
				metricDisplayValue: "₩12",
			},
			{
				id: "cmp-3",
				rankLabel: "3위",
				campaignLabel: "3위 Meta 리타겟팅",
				metricValue: 7.5,
				metricDisplayValue: "₩8",
			},
		]);
	});
});

describe("resolveCampaignRankingTop3CardState", () => {
	it("returns loading when campaigns are not loaded yet", () => {
		expect(
			resolveCampaignRankingTop3CardState({
				campaigns: null,
				errorMessage: null,
				isLoadingError: false,
				isPending: true,
				isRefetchError: false,
				isRefetching: false,
				rows: [],
			}),
		).toEqual({ kind: "loading" });
	});

	it("returns stale chart metadata when refetching fails after a successful load", () => {
		expect(
			resolveCampaignRankingTop3CardState({
				campaigns: [{ id: "cmp-1" }],
				errorMessage: "network down",
				isLoadingError: false,
				isPending: false,
				isRefetchError: true,
				isRefetching: true,
				rows: [
					{
						id: "cmp-1",
						rankLabel: "1위",
						campaignLabel: "1위 Google 브랜딩",
						metricValue: 120,
						metricDisplayValue: "$120.00",
					},
				],
			}),
		).toEqual({
			kind: "chart",
			rows: [
				{
					id: "cmp-1",
					rankLabel: "1위",
					campaignLabel: "1위 Google 브랜딩",
					metricValue: 120,
					metricDisplayValue: "$120.00",
				},
			],
			isSyncing: true,
			staleErrorMessage: "network down",
		});
	});
});
