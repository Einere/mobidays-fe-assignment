import { serializeFilterList } from "@/entities/global-filter/lib/date-range";
import type { GlobalFilterState } from "@/entities/global-filter/model/types";
import {
	type DashboardCampaign,
	parseCampaignResponse,
} from "@/shared/api/contracts/dashboard-data";

async function fetchJson<T>(url: URL): Promise<T> {
	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(`Request failed: ${response.status}`);
	}

	return (await response.json()) as T;
}

export async function fetchCampaigns(
	filter: GlobalFilterState,
): Promise<DashboardCampaign[]> {
	const campaignsUrl = new URL("/campaigns", window.location.origin);
	campaignsUrl.searchParams.set("startDate", filter.dateRange.startDate);
	campaignsUrl.searchParams.set("endDate", filter.dateRange.endDate);
	campaignsUrl.searchParams.set(
		"statuses",
		serializeFilterList(filter.statuses),
	);
	campaignsUrl.searchParams.set(
		"platforms",
		serializeFilterList(filter.platforms),
	);

	const campaignsResponse = await fetchJson<unknown>(campaignsUrl);

	return parseCampaignResponse(campaignsResponse);
}
