import { describe, expect, it } from "vitest";
import type { GlobalFilterState } from "@/entities/global-filter/model/types";
import { buildCampaignTableSelectionResetKey } from "@/widgets/campaign-table/model/build-campaign-table-selection-reset-key";

const baseFilter: Pick<
	GlobalFilterState,
	"dateRange" | "statuses" | "platforms"
> = {
	dateRange: {
		startDate: "2026-04-01",
		endDate: "2026-04-30",
	},
	statuses: ["active", "paused"],
	platforms: ["Google", "Meta"],
};

describe("buildCampaignTableSelectionResetKey", () => {
	it("returns the same key for value-identical input objects", () => {
		const left = buildCampaignTableSelectionResetKey({
			filter: baseFilter,
			page: 1,
			searchTerm: "brand",
			sort: {
				key: "cost",
				direction: "asc",
			},
		});

		const right = buildCampaignTableSelectionResetKey({
			filter: {
				dateRange: {
					startDate: "2026-04-01",
					endDate: "2026-04-30",
				},
				statuses: ["active", "paused"],
				platforms: ["Google", "Meta"],
			},
			page: 1,
			searchTerm: "brand",
			sort: {
				key: "cost",
				direction: "asc",
			},
		});

		expect(left).toBe(right);
	});

	it("changes the key when page, search term, or sort changes", () => {
		const base = buildCampaignTableSelectionResetKey({
			filter: baseFilter,
			page: 1,
			searchTerm: "brand",
			sort: {
				key: "cost",
				direction: "asc",
			},
		});

		const pageChanged = buildCampaignTableSelectionResetKey({
			filter: baseFilter,
			page: 2,
			searchTerm: "brand",
			sort: {
				key: "cost",
				direction: "asc",
			},
		});
		const searchChanged = buildCampaignTableSelectionResetKey({
			filter: baseFilter,
			page: 1,
			searchTerm: "retargeting",
			sort: {
				key: "cost",
				direction: "asc",
			},
		});
		const sortChanged = buildCampaignTableSelectionResetKey({
			filter: baseFilter,
			page: 1,
			searchTerm: "brand",
			sort: {
				key: "cost",
				direction: "desc",
			},
		});

		expect(pageChanged).not.toBe(base);
		expect(searchChanged).not.toBe(base);
		expect(sortChanged).not.toBe(base);
	});

	it("does not change the key for whitespace-only search term differences", () => {
		const base = buildCampaignTableSelectionResetKey({
			filter: baseFilter,
			page: 1,
			searchTerm: "brand",
			sort: {
				key: "cost",
				direction: "asc",
			},
		});

		const withSurroundingWhitespace = buildCampaignTableSelectionResetKey({
			filter: baseFilter,
			page: 1,
			searchTerm: "  brand  ",
			sort: {
				key: "cost",
				direction: "asc",
			},
		});
		const whitespaceOnly = buildCampaignTableSelectionResetKey({
			filter: baseFilter,
			page: 1,
			searchTerm: "   ",
			sort: {
				key: "cost",
				direction: "asc",
			},
		});
		const empty = buildCampaignTableSelectionResetKey({
			filter: baseFilter,
			page: 1,
			searchTerm: "",
			sort: {
				key: "cost",
				direction: "asc",
			},
		});

		expect(withSurroundingWhitespace).toBe(base);
		expect(whitespaceOnly).toBe(empty);
	});

	it("changes the key when filter values change", () => {
		const base = buildCampaignTableSelectionResetKey({
			filter: baseFilter,
			page: 1,
			searchTerm: "",
			sort: null,
		});

		const dateRangeChanged = buildCampaignTableSelectionResetKey({
			filter: {
				...baseFilter,
				dateRange: {
					startDate: "2026-05-01",
					endDate: "2026-05-31",
				},
			},
			page: 1,
			searchTerm: "",
			sort: null,
		});
		const statusesChanged = buildCampaignTableSelectionResetKey({
			filter: {
				...baseFilter,
				statuses: ["active"],
			},
			page: 1,
			searchTerm: "",
			sort: null,
		});
		const platformsChanged = buildCampaignTableSelectionResetKey({
			filter: {
				...baseFilter,
				platforms: ["Google"],
			},
			page: 1,
			searchTerm: "",
			sort: null,
		});

		expect(dateRangeChanged).not.toBe(base);
		expect(statusesChanged).not.toBe(base);
		expect(platformsChanged).not.toBe(base);
	});
});
