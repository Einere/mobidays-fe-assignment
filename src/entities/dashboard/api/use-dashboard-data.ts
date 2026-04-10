import { useQuery } from "@tanstack/react-query";
import { fetchDashboardData } from "@/entities/dashboard/api/fetch-dashboard-data";
import type { GlobalFilterState } from "@/entities/global-filter/model/types";

function sortValues(values: string[]) {
	return [...values].sort((a, b) => a.localeCompare(b));
}

/*TODO: 추후 쿼리키 빌더 패턴 도입 */
/*TODO: 적절한 위치로 옮기기. entities/dashboard/hooks 라던지...*/
export function createDashboardDataQueryKey(filter: GlobalFilterState) {
	return [
		"dashboard-data",
		filter.dateRange.startDate,
		filter.dateRange.endDate,
		sortValues(filter.statuses),
		sortValues(filter.platforms),
	] as const;
}

export function getDashboardDataQueryOptions(filter: GlobalFilterState) {
	return {
		queryKey: createDashboardDataQueryKey(filter),
		queryFn: () => fetchDashboardData(filter),
	};
}

export function useDashboardData(filter: GlobalFilterState) {
	return useQuery(getDashboardDataQueryOptions(filter));
}
