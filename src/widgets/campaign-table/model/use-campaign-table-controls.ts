import { useCallback, useState } from "react";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import type {
	CampaignTableSortKey,
	CampaignTableSortState,
} from "@/widgets/campaign-table/model/campaign-table-sort";

export interface CampaignTableControls {
	searchInput: string;
	searchTerm: string;
	page: number;
	sort: CampaignTableSortState | null;
	setSearchInput: (nextSearchInput: string) => void;
	setPage: (nextPage: number) => void;
	toggleSort: (nextSortKey: CampaignTableSortKey) => void;
}

export function useCampaignTableControls() {
	const [searchInput, setSearchInputState] = useState("");
	const [page, setPageState] = useState(1);
	const [sort, setSort] = useState<CampaignTableSortState | null>(null);
	const searchTerm = useDebouncedValue(searchInput, 300);

	const setSearchInput = useCallback((nextSearchInput: string) => {
		setSearchInputState(nextSearchInput);
		setPageState(1);
	}, []);

	const setPage = useCallback((nextPage: number) => {
		const normalizedPage = Number.isFinite(nextPage) ? Math.floor(nextPage) : 1;

		setPageState(Math.max(1, normalizedPage));
	}, []);

	const toggleSort = useCallback((nextSortKey: CampaignTableSortKey) => {
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
	}, []);

	return {
		searchInput,
		searchTerm,
		page,
		sort,
		setSearchInput,
		setPage,
		toggleSort,
	} satisfies CampaignTableControls;
}
