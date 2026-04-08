import { useState } from "react";

export type CampaignTableSortKey = "period" | "cost" | "ctr" | "cpc" | "roas";
export type CampaignTableSortDirection = "asc" | "desc";

export interface CampaignTableSortState {
	key: CampaignTableSortKey;
	direction: CampaignTableSortDirection;
}

export interface CampaignTableControls {
	searchTerm: string;
	page: number;
	sort: CampaignTableSortState | null;
	selectedRowIds: string[];
	setSearchTerm: (nextSearchTerm: string) => void;
	setPage: (nextPage: number) => void;
	toggleSort: (nextSortKey: CampaignTableSortKey) => void;
	toggleRowSelection: (rowId: string) => void;
	setSelectedRowIds: (nextSelectedRowIds: string[]) => void;
}

export function useCampaignTableControls() {
	const [searchTerm, setSearchTermState] = useState("");
	const [page, setPageState] = useState(1);
	const [sort, setSort] = useState<CampaignTableSortState | null>(null);
	const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

	function setSearchTerm(nextSearchTerm: string) {
		setSearchTermState(nextSearchTerm);
		setPageState(1);
	}

	function setPage(nextPage: number) {
		setPageState(Math.max(1, nextPage));
	}

	function toggleSort(nextSortKey: CampaignTableSortKey) {
		setSort((currentSort) => {
			if (!currentSort || currentSort.key !== nextSortKey) {
				return {
					key: nextSortKey,
					direction: "asc",
				};
			}

			return {
				key: nextSortKey,
				direction: currentSort.direction === "asc" ? "desc" : "asc",
			};
		});
		setPageState(1);
	}

	function toggleRowSelection(rowId: string) {
		setSelectedRowIds((currentSelectedRowIds) => {
			if (currentSelectedRowIds.includes(rowId)) {
				return currentSelectedRowIds.filter(
					(selectedRowId) => selectedRowId !== rowId,
				);
			}

			return [...currentSelectedRowIds, rowId];
		});
	}

	return {
		searchTerm,
		page,
		sort,
		selectedRowIds,
		setSearchTerm,
		setPage,
		toggleSort,
		toggleRowSelection,
		setSelectedRowIds,
	} satisfies CampaignTableControls;
}
