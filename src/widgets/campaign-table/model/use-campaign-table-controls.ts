import { useState } from "react";
import type { CampaignStatus } from "@/entities/global-filter/model/types";

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
	pendingStatus: CampaignStatus | null;
	setSearchTerm: (nextSearchTerm: string) => void;
	setPage: (nextPage: number) => void;
	toggleSort: (nextSortKey: CampaignTableSortKey) => void;
	toggleRowSelection: (rowId: string) => void;
	togglePageSelection: (pageRowIds: string[]) => void;
	setSelectedRowIds: (nextSelectedRowIds: string[]) => void;
	setPendingStatus: (nextPendingStatus: CampaignStatus | null) => void;
}

export function useCampaignTableControls() {
	const [searchTerm, setSearchTermState] = useState("");
	const [page, setPageState] = useState(1);
	const [sort, setSort] = useState<CampaignTableSortState | null>(null);
	const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
	const [pendingStatus, setPendingStatus] = useState<CampaignStatus | null>(
		null,
	);

	function setSearchTerm(nextSearchTerm: string) {
		setSearchTermState(nextSearchTerm);
		setPageState(1);
	}

	function setPage(nextPage: number) {
		const normalizedPage = Number.isFinite(nextPage) ? Math.floor(nextPage) : 1;

		setPageState(Math.max(1, normalizedPage));
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

	function togglePageSelection(pageRowIds: string[]) {
		setSelectedRowIds((currentSelectedRowIds) => {
			const areAllPageRowsSelected =
				pageRowIds.length > 0 &&
				pageRowIds.every((rowId) => currentSelectedRowIds.includes(rowId));

			if (areAllPageRowsSelected) {
				return currentSelectedRowIds.filter(
					(selectedRowId) => !pageRowIds.includes(selectedRowId),
				);
			}

			return Array.from(new Set([...currentSelectedRowIds, ...pageRowIds]));
		});
	}

	return {
		searchTerm,
		page,
		sort,
		selectedRowIds,
		pendingStatus,
		setSearchTerm,
		setPage,
		toggleSort,
		toggleRowSelection,
		togglePageSelection,
		setSelectedRowIds,
		setPendingStatus,
	} satisfies CampaignTableControls;
}
