import { describe, expect, it } from "vitest";
import type { CampaignTableRow } from "@/entities/campaign/lib/build-campaign-table-rows";
import { deriveCampaignTableView } from "@/widgets/campaign-table/model/derive-campaign-table-view";

function createRow(overrides: Partial<CampaignTableRow>): CampaignTableRow {
	return {
		id: "campaign-1",
		name: "Campaign",
		status: "active",
		platform: "Google",
		startDate: "2026-04-01",
		endDate: "2026-04-30",
		periodSortValue: Date.parse("2026-04-01"),
		cost: 100,
		ctr: 10,
		cpc: 10,
		roas: 20,
		...overrides,
	};
}

describe("deriveCampaignTableView", () => {
	it("trims search input and matches campaign names case-insensitively", () => {
		const rows = [
			createRow({
				id: "campaign-1",
				name: "Brand Search",
			}),
			createRow({
				id: "campaign-2",
				name: "Performance Max",
			}),
		];

		const view = deriveCampaignTableView({
			rows,
			searchTerm: "  brand  ",
			page: 1,
			pageSize: 10,
			sort: null,
		});

		expect(view.totalCount).toBe(2);
		expect(view.filteredCount).toBe(1);
		expect(view.totalPages).toBe(1);
		expect(view.page).toBe(1);
		expect(view.rows).toEqual([
			expect.objectContaining({
				id: "campaign-1",
				name: "Brand Search",
			}),
		]);
	});

	it("sorts null metric values last for ascending and descending cost sorts", () => {
		const rows = [
			createRow({
				id: "campaign-1",
				name: "Cost Null",
				cost: null,
			}),
			createRow({
				id: "campaign-2",
				name: "Cost Ten",
				cost: 10,
			}),
			createRow({
				id: "campaign-3",
				name: "Cost Twenty",
				cost: 20,
			}),
		];

		const ascendingView = deriveCampaignTableView({
			rows,
			searchTerm: "",
			page: 1,
			pageSize: 10,
			sort: {
				key: "cost",
				direction: "asc",
			},
		});

		expect(ascendingView.rows.map((row) => row.id)).toEqual([
			"campaign-2",
			"campaign-3",
			"campaign-1",
		]);

		const descendingView = deriveCampaignTableView({
			rows,
			searchTerm: "",
			page: 1,
			pageSize: 10,
			sort: {
				key: "cost",
				direction: "desc",
			},
		});

		expect(descendingView.rows.map((row) => row.id)).toEqual([
			"campaign-3",
			"campaign-2",
			"campaign-1",
		]);
	});

	it("clamps page below 1 and above total pages", () => {
		const rows = [
			createRow({
				id: "campaign-1",
				name: "First",
			}),
			createRow({
				id: "campaign-2",
				name: "Second",
			}),
			createRow({
				id: "campaign-3",
				name: "Third",
			}),
		];

		const lowPageView = deriveCampaignTableView({
			rows,
			searchTerm: "",
			page: 0,
			pageSize: 2,
			sort: null,
		});

		expect(lowPageView.page).toBe(1);
		expect(lowPageView.totalPages).toBe(2);
		expect(lowPageView.rows.map((row) => row.id)).toEqual([
			"campaign-1",
			"campaign-2",
		]);

		const highPageView = deriveCampaignTableView({
			rows,
			searchTerm: "",
			page: 5,
			pageSize: 2,
			sort: null,
		});

		expect(highPageView.page).toBe(2);
		expect(highPageView.totalPages).toBe(2);
		expect(highPageView.rows.map((row) => row.id)).toEqual(["campaign-3"]);
	});

	it("floors decimal page values before clamping", () => {
		const rows = [
			createRow({
				id: "campaign-1",
				name: "First",
			}),
			createRow({
				id: "campaign-2",
				name: "Second",
			}),
			createRow({
				id: "campaign-3",
				name: "Third",
			}),
			createRow({
				id: "campaign-4",
				name: "Fourth",
			}),
		];

		const view = deriveCampaignTableView({
			rows,
			searchTerm: "",
			page: 2.7,
			pageSize: 2,
			sort: null,
		});

		expect(view.page).toBe(2);
		expect(view.rows.map((row) => row.id)).toEqual([
			"campaign-3",
			"campaign-4",
		]);
	});

	it("falls back to page size 1 for invalid pageSize values", () => {
		const rows = [
			createRow({
				id: "campaign-1",
				name: "First",
			}),
			createRow({
				id: "campaign-2",
				name: "Second",
			}),
		];

		const zeroPageSizeView = deriveCampaignTableView({
			rows,
			searchTerm: "",
			page: 1,
			pageSize: 0,
			sort: null,
		});

		expect(zeroPageSizeView.totalPages).toBe(2);
		expect(zeroPageSizeView.page).toBe(1);
		expect(zeroPageSizeView.rows.map((row) => row.id)).toEqual(["campaign-1"]);

		const nanPageSizeView = deriveCampaignTableView({
			rows,
			searchTerm: "",
			page: 1,
			pageSize: Number.NaN,
			sort: null,
		});

		expect(nanPageSizeView.totalPages).toBe(2);
		expect(nanPageSizeView.page).toBe(1);
		expect(nanPageSizeView.rows.map((row) => row.id)).toEqual(["campaign-1"]);

		const nanPageView = deriveCampaignTableView({
			rows,
			searchTerm: "",
			page: Number.NaN,
			pageSize: 1,
			sort: null,
		});

		expect(nanPageView.page).toBe(1);
		expect(nanPageView.rows.map((row) => row.id)).toEqual(["campaign-1"]);
	});
});
