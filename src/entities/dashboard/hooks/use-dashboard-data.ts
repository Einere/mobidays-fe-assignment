import { useQuery } from "@tanstack/react-query";
import { fetchDashboardData } from "@/entities/dashboard/api/fetch-dashboard-data";
import { createDashboardDataQueryKey } from "@/entities/dashboard/hooks/dashboard-data-query-key";
import type { GlobalFilterState } from "@/entities/global-filter/model/types";

export { createDashboardDataQueryKey } from "@/entities/dashboard/hooks/dashboard-data-query-key";

export function getDashboardDataQueryOptions(filter: GlobalFilterState) {
	return {
		queryKey: createDashboardDataQueryKey(filter),
		queryFn: () => fetchDashboardData(filter),
	};
}

export function useDashboardData(filter: GlobalFilterState) {
	return useQuery(getDashboardDataQueryOptions(filter));
}
