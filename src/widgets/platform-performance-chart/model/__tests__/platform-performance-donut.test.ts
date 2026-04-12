import { describe, expect, it } from "vitest";
import {
	buildPlatformPerformanceChartConfig,
	extractPlatformFromPiePayload,
	getPlatformPerformanceDonutColor,
	isKnownCampaignPlatformForDonut,
} from "@/widgets/platform-performance-chart/model/platform-performance-donut";

describe("platform-performance-donut helpers", () => {
	it("uses deterministic colors for known and unknown platforms", () => {
		expect(getPlatformPerformanceDonutColor("Google", 0)).toBe(
			"var(--chart-danger)",
		);
		expect(getPlatformPerformanceDonutColor("Meta", 1)).toBe(
			"var(--chart-positive)",
		);
		expect(getPlatformPerformanceDonutColor("TikTok", 0)).toBe(
			"var(--chart-series-4)",
		);
		expect(getPlatformPerformanceDonutColor("TikTok", 4)).toBe(
			"var(--chart-series-3)",
		);
	});

	it("detects known campaign platforms", () => {
		expect(isKnownCampaignPlatformForDonut("Google")).toBe(true);
		expect(isKnownCampaignPlatformForDonut("TikTok")).toBe(false);
	});

	it("extracts a known platform from pie payloads only", () => {
		expect(extractPlatformFromPiePayload({ platform: "Meta" })).toBe("Meta");
		expect(
			extractPlatformFromPiePayload({ payload: { platform: "Naver" } }),
		).toBe("Naver");
		expect(extractPlatformFromPiePayload({ platform: "TikTok" })).toBeNull();
		expect(extractPlatformFromPiePayload(null)).toBeNull();
	});

	it("builds a chart config from slice data", () => {
		const config = buildPlatformPerformanceChartConfig([
			{ platform: "Google", value: 100, sharePercent: 50, isSelected: true },
			{ platform: "Meta", value: 100, sharePercent: 50, isSelected: false },
		]);

		expect(config.Google.label).toBe("Google");
		expect(config.Google.color).toBe("var(--chart-danger)");
		expect(config.Meta.color).toBe("var(--chart-positive)");
	});
});
