import type { GlobalFilterState } from "@/entities/global-filter/model/types";
import type { CampaignTableSortState } from "@/widgets/campaign-table/model/campaign-table-sort";

type CampaignTableSelectionResetFilter = Pick<
	GlobalFilterState,
	"dateRange" | "statuses" | "platforms"
>;

interface BuildCampaignTableSelectionResetKeyParams {
	filter: CampaignTableSelectionResetFilter;
	page: number;
	searchTerm: string;
	sort: CampaignTableSortState | null;
}

export function buildCampaignTableSelectionResetKey({
	filter,
	page,
	searchTerm,
	sort,
}: BuildCampaignTableSelectionResetKeyParams) {
	const sortKey = sort ? `${sort.key}:${sort.direction}` : "none";
	const normalizedSearchTerm = searchTerm.trim();

	return [
		`date:${filter.dateRange.startDate}~${filter.dateRange.endDate}`,
		`statuses:${filter.statuses.join(",")}`,
		`platforms:${filter.platforms.join(",")}`,
		`page:${page}`,
		`search:${normalizedSearchTerm}`,
		`sort:${sortKey}`,
	].join("|");
}
