import type { CampaignTableRow } from "@/entities/campaign/lib/build-campaign-table-rows";
import { normalizePage, normalizePageSize } from "@/shared/lib/pagination";
import type {
	CampaignTableSortKey,
	CampaignTableSortState,
} from "@/widgets/campaign-table/model/campaign-table-sort";

export interface CampaignTableView {
	totalCount: number;
	filteredCount: number;
	totalPages: number;
	page: number;
	rows: CampaignTableRow[];
}

interface DeriveCampaignTableViewParams {
	rows: CampaignTableRow[];
	searchTerm: string;
	page: number;
	pageSize: number;
	sort: CampaignTableSortState | null;
}

function includesSearchTerm(name: string, searchTerm: string) {
	return name.toLowerCase().includes(searchTerm.toLowerCase());
}

function getSortableValue(left: CampaignTableRow, key: CampaignTableSortKey) {
	if (key === "period") {
		return left.periodSortValue;
	}

	if (key === "cost") {
		return left.cost;
	}

	if (key === "ctr") {
		return left.ctr;
	}

	if (key === "cpc") {
		return left.cpc;
	}

	return left.roas;
}

export function deriveCampaignTableView({
	rows,
	searchTerm,
	page,
	pageSize,
	sort,
}: DeriveCampaignTableViewParams): CampaignTableView {
	const normalizedSearchTerm = searchTerm.trim();
	const filteredRows =
		normalizedSearchTerm.length === 0
			? rows
			: rows.filter((row) =>
					includesSearchTerm(row.name, normalizedSearchTerm),
				);

	const sortedRows =
		sort === null
			? [...filteredRows]
			: [...filteredRows].sort((left, right) => {
					const leftValue = getSortableValue(left, sort.key);
					const rightValue = getSortableValue(right, sort.key);

					if (leftValue === null && rightValue === null) {
						return 0;
					}

					if (leftValue === null) {
						return 1;
					}

					if (rightValue === null) {
						return -1;
					}

					const comparison = leftValue - rightValue;

					return sort.direction === "asc" ? comparison : -comparison;
				});

	const safePageSize = normalizePageSize(pageSize);
	const totalPages = Math.max(1, Math.ceil(sortedRows.length / safePageSize));
	const safePage = Math.min(Math.max(normalizePage(page), 1), totalPages);
	const startIndex = (safePage - 1) * safePageSize;

	return {
		totalCount: rows.length,
		filteredCount: filteredRows.length,
		totalPages,
		page: safePage,
		rows: sortedRows.slice(startIndex, startIndex + safePageSize),
	};
}
