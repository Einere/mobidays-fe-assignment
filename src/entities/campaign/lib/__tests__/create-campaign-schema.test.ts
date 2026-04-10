import { describe, expect, it } from "vitest";
import { buildCreateCampaignPayload } from "@/entities/campaign/lib/build-create-campaign-payload";
import { createCampaignSchema } from "@/entities/campaign/lib/create-campaign-schema";

describe("createCampaignSchema", () => {
	it("accepts a valid campaign form payload", () => {
		const result = createCampaignSchema.safeParse({
			name: "브랜드 검색 캠페인",
			platform: "Google",
			budget: "100000",
			spend: "50000",
			startDate: "2026-04-10",
			endDate: "2026-04-20",
		});

		expect(result.success).toBe(true);
	});

	it("accepts a same-day end date", () => {
		const result = createCampaignSchema.safeParse({
			name: "브랜드 검색 캠페인",
			platform: "Google",
			budget: "100000",
			spend: "50000",
			startDate: "2026-04-10",
			endDate: "2026-04-10",
		});

		expect(result.success).toBe(true);
	});

	it("builds a numeric create payload from form values", () => {
		const result = buildCreateCampaignPayload({
			name: "  브랜드 검색 캠페인  ",
			platform: "Google",
			budget: "100000",
			spend: "50000",
			startDate: "2026-04-10",
			endDate: "2026-04-20",
		});

		expect(result).toEqual({
			name: "브랜드 검색 캠페인",
			platform: "Google",
			budget: 100000,
			spend: 50000,
			startDate: "2026-04-10",
			endDate: "2026-04-20",
		});
	});

	it("rejects spend larger than budget", () => {
		const result = createCampaignSchema.safeParse({
			name: "브랜드 검색 캠페인",
			platform: "Google",
			budget: "100000",
			spend: "120000",
			startDate: "2026-04-10",
			endDate: "2026-04-10",
		});

		expect(result.success).toBe(false);
		expect(result.error?.flatten().fieldErrors).toMatchObject({
			spend: ["집행 금액은 예산을 초과할 수 없습니다."],
		});
	});

	it("rejects an end date earlier than the start date", () => {
		const result = createCampaignSchema.safeParse({
			name: "브랜드 검색 캠페인",
			platform: "Google",
			budget: "100000",
			spend: "50000",
			startDate: "2026-04-10",
			endDate: "2026-04-09",
		});

		expect(result.success).toBe(false);
		expect(result.error?.flatten().fieldErrors).toMatchObject({
			endDate: ["종료일은 시작일과 같거나 이후여야 합니다."],
		});
	});

	it("rejects invalid normalized dates and non-ISO date formats", () => {
		const result = createCampaignSchema.safeParse({
			name: "브랜드 검색 캠페인",
			platform: "Google",
			budget: "100000",
			spend: "50000",
			startDate: "2026/04/10",
			endDate: "2026-02-30",
		});

		expect(result.success).toBe(false);
		expect(result.error?.flatten().fieldErrors).toMatchObject({
			startDate: ["시작일을 선택해주세요."],
			endDate: ["종료일을 선택해주세요."],
		});
	});
});
