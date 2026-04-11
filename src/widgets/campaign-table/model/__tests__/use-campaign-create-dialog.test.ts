import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createCampaignDefaultValues } from "@/widgets/campaign-table/model/use-campaign-create-dialog";

describe("createCampaignDefaultValues", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-03-31T15:00:00.000Z"));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("uses the KST calendar date for both start and end defaults", () => {
		expect(createCampaignDefaultValues()).toEqual({
			name: "",
			platform: "",
			budget: "",
			spend: "",
			startDate: "2026-04-01",
			endDate: "2026-04-01",
		});
	});
});
