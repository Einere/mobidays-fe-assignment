import { describe, expect, it } from "vitest";
import { aggregatePlatformPerformance } from "@/entities/platform-performance/lib/aggregate-platform-performance";
import type {
	AggregatePlatformPerformanceInput,
	PlatformMetricKey,
} from "@/entities/platform-performance/model/types";

type PlatformCampaign = AggregatePlatformPerformanceInput["campaigns"][number];
type PlatformDailyStat =
	AggregatePlatformPerformanceInput["dailyStats"][number];

function createCampaign(id: string, platform: string | null): PlatformCampaign {
	return { id, platform };
}

function createStat(
	campaignId: string,
	overrides: Partial<PlatformDailyStat> = {},
): PlatformDailyStat {
	return {
		campaignId,
		impressions: 0,
		clicks: 0,
		conversions: 0,
		cost: 0,
		...overrides,
	};
}

const campaigns: PlatformCampaign[] = [
	createCampaign("cmp-1", "Google"),
	createCampaign("cmp-2", "Meta"),
	createCampaign("cmp-3", "Naver"),
	createCampaign("cmp-4", "TikTok"),
];

describe("aggregatePlatformPerformance", () => {
	it("aggregates selected metric by platform and computes share percentages", () => {
		const dailyStats: PlatformDailyStat[] = [
			createStat("cmp-1", { cost: 100 }),
			createStat("cmp-1", { cost: 150 }),
			createStat("cmp-2", { cost: 200 }),
			createStat("cmp-3", { cost: 150 }),
			createStat("cmp-4", { cost: 100 }),
		];

		expect(
			aggregatePlatformPerformance({
				campaigns,
				dailyStats,
				metricKey: "cost",
				selectedPlatforms: ["Google", "TikTok"],
			}),
		).toEqual([
			{
				platform: "Google",
				value: 250,
				sharePercent: 35.71,
				isSelected: true,
			},
			{
				platform: "Meta",
				value: 200,
				sharePercent: 28.57,
				isSelected: false,
			},
			{
				platform: "Naver",
				value: 150,
				sharePercent: 21.43,
				isSelected: false,
			},
			{
				platform: "TikTok",
				value: 100,
				sharePercent: 14.29,
				isSelected: true,
			},
		]);
	});

	it("handles non-numeric and null metric values as zero", () => {
		const dailyStats: PlatformDailyStat[] = [
			createStat("cmp-1", { cost: 100 }),
			{
				campaignId: "cmp-2",
				impressions: "invalid" as unknown as number,
				clicks: NaN,
				conversions: -10,
				cost: Number.POSITIVE_INFINITY,
			},
		];

		expect(
			aggregatePlatformPerformance({
				campaigns,
				dailyStats,
				metricKey: "cost",
				selectedPlatforms: ["Google", "Meta"],
			}),
		).toEqual([
			{
				platform: "Google",
				value: 100,
				sharePercent: 100,
				isSelected: true,
			},
			{
				platform: "Meta",
				value: 0,
				sharePercent: 0,
				isSelected: true,
			},
			{
				platform: "Naver",
				value: 0,
				sharePercent: 0,
				isSelected: false,
			},
			{
				platform: "TikTok",
				value: 0,
				sharePercent: 0,
				isSelected: false,
			},
		]);
	});

	it("keeps unknown platform rows and marks selection by selectedPlatforms", () => {
		const dailyStats: PlatformDailyStat[] = [
			createStat("cmp-4", { cost: 100 }),
		];

		expect(
			aggregatePlatformPerformance({
				campaigns,
				dailyStats,
				metricKey: "cost",
				selectedPlatforms: ["TikTok"],
			}),
		).toEqual([
			{
				platform: "Google",
				value: 0,
				sharePercent: 0,
				isSelected: false,
			},
			{
				platform: "Meta",
				value: 0,
				sharePercent: 0,
				isSelected: false,
			},
			{
				platform: "Naver",
				value: 0,
				sharePercent: 0,
				isSelected: false,
			},
			{
				platform: "TikTok",
				value: 100,
				sharePercent: 100,
				isSelected: true,
			},
		]);
	});

	it("supports all metric keys", () => {
		const metricKeys: PlatformMetricKey[] = [
			"cost",
			"impressions",
			"clicks",
			"conversions",
		];
		const dailyStats: PlatformDailyStat[] = [
			createStat("cmp-1", {
				impressions: 100,
				clicks: 10,
				cost: 1000,
				conversions: 5,
			}),
		];

		expect(
			metricKeys.map((metricKey) =>
				aggregatePlatformPerformance({
					campaigns: [campaigns[0]],
					dailyStats,
					metricKey,
					selectedPlatforms: ["Google"],
				}),
			),
		).toEqual([
			[
				{
					platform: "Google",
					value: 1000,
					sharePercent: 100,
					isSelected: true,
				},
				{
					platform: "Meta",
					value: 0,
					sharePercent: 0,
					isSelected: false,
				},
				{
					platform: "Naver",
					value: 0,
					sharePercent: 0,
					isSelected: false,
				},
			],
			[
				{
					platform: "Google",
					value: 100,
					sharePercent: 100,
					isSelected: true,
				},
				{
					platform: "Meta",
					value: 0,
					sharePercent: 0,
					isSelected: false,
				},
				{
					platform: "Naver",
					value: 0,
					sharePercent: 0,
					isSelected: false,
				},
			],
			[
				{
					platform: "Google",
					value: 10,
					sharePercent: 100,
					isSelected: true,
				},
				{
					platform: "Meta",
					value: 0,
					sharePercent: 0,
					isSelected: false,
				},
				{
					platform: "Naver",
					value: 0,
					sharePercent: 0,
					isSelected: false,
				},
			],
			[
				{
					platform: "Google",
					value: 5,
					sharePercent: 100,
					isSelected: true,
				},
				{
					platform: "Meta",
					value: 0,
					sharePercent: 0,
					isSelected: false,
				},
				{
					platform: "Naver",
					value: 0,
					sharePercent: 0,
					isSelected: false,
				},
			],
		]);
	});
});
