import { HttpResponse, http } from "msw";
import { filterCampaigns } from "@/entities/campaign/lib/filter-campaigns";
import { filterDailyStats } from "@/entities/daily-stat/lib/filter-daily-stats";
import type {
	CampaignPlatform,
	CampaignStatus,
	GlobalFilterState,
} from "@/entities/global-filter/model/types";
import { mockDb } from "@/shared/api/mock/db";

function parseListParam<Value extends string>(value: string | null): Value[] {
	return (value ?? "").split(",").filter(Boolean) as Value[];
}

function createFilterState(request: Request): GlobalFilterState {
	const { searchParams } = new URL(request.url);

	return {
		dateRange: {
			startDate: searchParams.get("startDate") ?? "",
			endDate: searchParams.get("endDate") ?? "",
		},
		statuses: parseListParam<CampaignStatus>(searchParams.get("statuses")),
		platforms: parseListParam<CampaignPlatform>(searchParams.get("platforms")),
	};
}

export const handlers = [
	http.get("/campaigns", ({ request }) => {
		return HttpResponse.json(
			filterCampaigns(mockDb.campaigns, createFilterState(request)),
		);
	}),
	http.get("/daily_stats", ({ request }) => {
		const { searchParams } = new URL(request.url);
		const campaignIds = parseListParam(searchParams.get("campaignIds"));
		const { dateRange } = createFilterState(request);

		return HttpResponse.json(
			filterDailyStats(mockDb.dailyStats, campaignIds, dateRange),
		);
	}),
];
