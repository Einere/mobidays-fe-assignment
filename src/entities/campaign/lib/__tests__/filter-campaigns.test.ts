import { describe, expect, it } from "vitest";
import { filterCampaigns } from "@/entities/campaign/lib/filter-campaigns";
import type { Campaign } from "@/entities/campaign/model/types";
import type { GlobalFilterState } from "@/entities/global-filter/model/types";

const campaigns: Campaign[] = [
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
		startDate: "2026-03-10",
		endDate: "2026-04-05",
	},
	{
		id: "3",
		name: "Naver Ended",
		platform: "Naver",
		status: "ended",
		budget: 1000,
		startDate: "2026-05-01",
		endDate: "2026-05-31",
	},
];

describe("filterCampaigns", () => {
	it("keeps campaigns overlapping the selected range and matching status/platform", () => {
		const filter: GlobalFilterState = {
			dateRange: { startDate: "2026-04-03", endDate: "2026-04-10" },
			statuses: ["active", "paused"],
			platforms: ["Google", "Meta"],
		};

		expect(
			filterCampaigns(campaigns, filter).map((campaign) => campaign.id),
		).toEqual(["1", "2"]);
	});

	it("returns an empty array when a filter group is empty", () => {
		const filter: GlobalFilterState = {
			dateRange: { startDate: "2026-04-01", endDate: "2026-04-30" },
			statuses: [],
			platforms: ["Google", "Meta", "Naver"],
		};

		expect(filterCampaigns(campaigns, filter)).toEqual([]);
	});
});
