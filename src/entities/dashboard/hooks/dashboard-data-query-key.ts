import type { GlobalFilterState } from "@/entities/global-filter/model/types";

function sortValues(values: string[]) {
	return [...values].sort((a, b) => a.localeCompare(b));
}

export function createDashboardDataQueryKey(filter: GlobalFilterState) {
	return [
		"dashboard-data",
		filter.dateRange.startDate,
		filter.dateRange.endDate,
		sortValues(filter.statuses),
		sortValues(filter.platforms),
	] as const;
}
