import { HttpResponse, http } from "msw";
import type {
	CampaignPlatform,
	CampaignStatus,
	GlobalFilterState,
} from "@/entities/global-filter/model/types";
import { mockDb } from "@/shared/api/mock/db";
import type { RawCampaign, RawDailyStat } from "@/shared/api/mock/types";

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

function parseDateValue(value: unknown): number | null {
	return typeof value === "string" && Number.isFinite(Date.parse(value))
		? Date.parse(value)
		: null;
}

function matchesCampaignDateRange(
	campaign: RawCampaign,
	filter: GlobalFilterState,
) {
	const startDate = parseDateValue(campaign.startDate);
	const endDate =
		campaign.endDate === null ? null : parseDateValue(campaign.endDate);
	const filterStart = parseDateValue(filter.dateRange.startDate);
	const filterEnd = parseDateValue(filter.dateRange.endDate);

	if (startDate === null || filterStart === null || filterEnd === null) {
		return false;
	}

	return startDate <= filterEnd && (endDate === null || endDate >= filterStart);
}

function matchesCampaignFilters(
	campaign: RawCampaign,
	filter: GlobalFilterState,
) {
	return (
		matchesCampaignDateRange(campaign, filter) &&
		typeof campaign.status === "string" &&
		filter.statuses.includes(campaign.status as CampaignStatus) &&
		typeof campaign.platform === "string" &&
		filter.platforms.includes(campaign.platform as CampaignPlatform)
	);
}

function matchesDailyStatFilters(
	dailyStat: RawDailyStat,
	campaignIds: string[],
	dateRange: GlobalFilterState["dateRange"],
) {
	const filterStart = parseDateValue(dateRange.startDate);
	const filterEnd = parseDateValue(dateRange.endDate);
	const dailyStatDate = parseDateValue(dailyStat.date);

	if (
		filterStart === null ||
		filterEnd === null ||
		dailyStatDate === null ||
		typeof dailyStat.campaignId !== "string"
	) {
		return false;
	}

	return (
		campaignIds.includes(dailyStat.campaignId) &&
		dailyStatDate >= filterStart &&
		dailyStatDate <= filterEnd
	);
}

export const handlers = [
	http.get("/campaigns", ({ request }) => {
		return HttpResponse.json(
			mockDb.campaigns.filter((campaign) =>
				matchesCampaignFilters(campaign, createFilterState(request)),
			),
		);
	}),
	http.get("/daily_stats", ({ request }) => {
		const { searchParams } = new URL(request.url);
		const campaignIds = parseListParam(searchParams.get("campaignIds"));
		const filter = createFilterState(request);

		return HttpResponse.json(
			mockDb.daily_stats.filter((dailyStat) =>
				matchesDailyStatFilters(dailyStat, campaignIds, filter.dateRange),
			),
		);
	}),
];
