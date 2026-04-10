import { describe, expect, it } from "vitest";
import {
	parseCampaignResponse,
	parseDailyStatResponse,
} from "@/entities/dashboard/api/parse-dashboard-data";

describe("parseCampaignResponse", () => {
	it("keeps raw values and avoids coercing invalid enums into known dashboard values", () => {
		const result = parseCampaignResponse([
			{
				id: "META-007",
				name: "이벤트 프로모션",
				status: "running",
				platform: "Facebook",
				budget: "2000000원",
				startDate: "2026/04/12",
				endDate: null,
			},
		]);

		expect(result).toEqual([
			expect.objectContaining({
				id: "META-007",
				status: null,
				platform: null,
				rawPlatform: "Facebook",
				budget: null,
				startDate: "2026/04/12",
				endDate: null,
				raw: expect.objectContaining({
					status: "running",
					platform: "Facebook",
					budget: "2000000원",
				}),
			}),
		]);
	});
});

describe("parseDailyStatResponse", () => {
	it("drops records without the minimum identity fields required by the dashboard", () => {
		const result = parseDailyStatResponse([
			{
				id: "STAT-1",
				campaignId: "CMP-1",
				date: "2026-04-08",
				impressions: 10,
				clicks: 1,
				conversions: 0,
				cost: 1000,
				conversionsValue: 3000,
			},
			{
				id: "",
				campaignId: "CMP-2",
				date: "2026-04-08",
				impressions: 20,
				clicks: 2,
				conversions: 1,
				cost: 2000,
				conversionsValue: 4000,
			},
		]);

		expect(result).toHaveLength(1);
		expect(result[0]?.id).toBe("STAT-1");
	});

	it("drops records when required metric fields are not finite numbers or null", () => {
		const result = parseDailyStatResponse([
			{
				id: "STAT-1",
				campaignId: "CMP-1",
				date: "2026-04-08",
				impressions: 10,
				clicks: 1,
				conversions: 0,
				cost: 1000,
				conversionsValue: 3000,
			},
			{
				id: "STAT-2",
				campaignId: "CMP-2",
				date: "2026-04-08",
				impressions: Number.NaN,
				clicks: 2,
				conversions: 1,
				cost: 2000,
				conversionsValue: 4000,
			},
		]);

		expect(result).toHaveLength(1);
		expect(result[0]?.id).toBe("STAT-1");
	});
});
