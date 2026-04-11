import { HttpResponse, http } from "msw";
import { createCampaignInputSchema } from "@/entities/campaign/lib/create-campaign-schema";
import { campaignPlatformValues } from "@/entities/global-filter/model/platforms";
import type {
	CampaignPlatform,
	CampaignStatus,
	GlobalFilterState,
} from "@/entities/global-filter/model/types";
import type { RawCampaign, RawDailyStat } from "@/shared/api/contracts/mock-db";
import {
	appendCampaignToMemoryDb,
	getMemoryDb,
	updateCampaignStatusesByIds,
} from "@/shared/api/mock/memory-db";
import { parseKstDateString } from "@/shared/lib/date/kst";

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
	if (typeof value !== "string") {
		return null;
	}

	return parseKstDateString(value)?.getTime() ?? null;
}

function isCampaignStatus(value: unknown): value is CampaignStatus {
	return value === "active" || value === "paused" || value === "ended";
}

function isKnownCampaignPlatform(value: unknown): value is CampaignPlatform {
	return (
		typeof value === "string" &&
		campaignPlatformValues.includes(value as CampaignPlatform)
	);
}

function isUpdateCampaignStatusesBody(
	value: unknown,
): value is { ids: string[]; status: CampaignStatus } {
	if (typeof value !== "object" || value === null) {
		return false;
	}

	const { ids, status } = value as {
		ids?: unknown;
		status?: unknown;
	};

	return (
		Array.isArray(ids) &&
		ids.every((id) => typeof id === "string") &&
		isCampaignStatus(status)
	);
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
	const platformMatches =
		typeof campaign.platform === "string"
			? isKnownCampaignPlatform(campaign.platform)
				? filter.platforms.includes(campaign.platform)
				: true
			: false;

	return (
		matchesCampaignDateRange(campaign, filter) &&
		typeof campaign.status === "string" &&
		filter.statuses.includes(campaign.status as CampaignStatus) &&
		platformMatches
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
		const memoryDb = getMemoryDb();

		return HttpResponse.json(
			memoryDb.campaigns.filter((campaign) =>
				matchesCampaignFilters(campaign, createFilterState(request)),
			),
		);
	}),
	http.get("/daily_stats", ({ request }) => {
		const memoryDb = getMemoryDb();
		const { searchParams } = new URL(request.url);
		const campaignIds = parseListParam(searchParams.get("campaignIds"));
		const filter = createFilterState(request);

		return HttpResponse.json(
			memoryDb.daily_stats.filter((dailyStat) =>
				matchesDailyStatFilters(dailyStat, campaignIds, filter.dateRange),
			),
		);
	}),
	http.post("/campaigns", async ({ request }) => {
		const body = await request.json();
		const parsedBody = createCampaignInputSchema.safeParse(body);

		if (!parsedBody.success) {
			return HttpResponse.json(
				{ message: "Invalid request body" },
				{ status: 400 },
			);
		}

		const validatedBody = parsedBody.data;

		const createdCampaign = appendCampaignToMemoryDb({
			name: validatedBody.name,
			platform: validatedBody.platform,
			budget: validatedBody.budget,
			startDate: validatedBody.startDate,
			endDate: validatedBody.endDate,
		});

		return HttpResponse.json(createdCampaign, { status: 201 });
	}),
	http.patch("/campaigns/status", async ({ request }) => {
		const body = await request.json();

		if (!isUpdateCampaignStatusesBody(body)) {
			return HttpResponse.json(
				{ message: "Invalid request body" },
				{ status: 400 },
			);
		}

		updateCampaignStatusesByIds(body.ids, body.status);

		return new HttpResponse(null, { status: 204 });
	}),
];
