import type {
	CampaignPlatform,
	CampaignStatus,
} from "@/entities/global-filter/model/types";
import type { RawCampaign, RawDailyStat } from "@/shared/api/mock/types";

const campaignStatuses = ["active", "paused", "ended"] as const;
const campaignPlatforms = ["Google", "Meta", "Naver"] as const;

function isNonEmptyString(value: unknown): value is string {
	return typeof value === "string" && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): value is number {
	return typeof value === "number" && Number.isFinite(value);
}

function isNullableFiniteNumber(value: unknown): value is number | null {
	return value === null || isFiniteNumber(value);
}

function isDateLikeString(value: unknown): value is string {
	return isNonEmptyString(value) && Number.isFinite(Date.parse(value));
}

function parseEnumValue<Value extends string>(
	value: unknown,
	allowedValues: readonly Value[],
): Value | null {
	return typeof value === "string" && allowedValues.includes(value as Value)
		? (value as Value)
		: null;
}

function parseOptionalString(value: unknown): string | null {
	return typeof value === "string" ? value : null;
}

function parseNullableDateLikeString(value: unknown): string | null {
	if (value === null) {
		return null;
	}

	return isDateLikeString(value) ? value : null;
}

function parseNullableNumber(value: unknown): number | null {
	return isFiniteNumber(value) ? value : null;
}

export interface DashboardCampaign {
	raw: RawCampaign;
	id: string;
	name: string | null;
	platform: CampaignPlatform | null;
	status: CampaignStatus | null;
	budget: number | null;
	startDate: string | null;
	endDate: string | null;
}

export interface DashboardDailyStat {
	raw: RawDailyStat;
	id: string;
	campaignId: string;
	date: string | null;
	impressions: number | null;
	clicks: number | null;
	conversions: number | null;
	cost: number | null;
	conversionsValue: number | null;
}

export function parseCampaignResponse(response: unknown): DashboardCampaign[] {
	if (!Array.isArray(response)) {
		return [];
	}

	return response.flatMap((item) => {
		if (!isNonEmptyString(item?.id)) {
			return [];
		}

		const rawCampaign = item as RawCampaign;

		return [
			{
				raw: rawCampaign,
				id: rawCampaign.id,
				name: parseOptionalString(rawCampaign.name),
				platform: parseEnumValue(rawCampaign.platform, campaignPlatforms),
				status: parseEnumValue(rawCampaign.status, campaignStatuses),
				budget: parseNullableNumber(rawCampaign.budget),
				startDate: parseNullableDateLikeString(rawCampaign.startDate),
				endDate: parseNullableDateLikeString(rawCampaign.endDate),
			},
		];
	});
}

export function parseDailyStatResponse(
	response: unknown,
): DashboardDailyStat[] {
	if (!Array.isArray(response)) {
		return [];
	}

	return response.flatMap((item) => {
		if (!isNonEmptyString(item?.id) || !isNonEmptyString(item?.campaignId)) {
			return [];
		}

		const rawDailyStat = item as RawDailyStat;

		if (
			!isNullableFiniteNumber(rawDailyStat.conversionsValue) ||
			!isNullableFiniteNumber(rawDailyStat.impressions) ||
			!isNullableFiniteNumber(rawDailyStat.clicks) ||
			!isNullableFiniteNumber(rawDailyStat.conversions) ||
			!isNullableFiniteNumber(rawDailyStat.cost)
		) {
			return [];
		}

		return [
			{
				raw: rawDailyStat,
				id: rawDailyStat.id,
				campaignId: rawDailyStat.campaignId,
				date: parseNullableDateLikeString(rawDailyStat.date),
				impressions: rawDailyStat.impressions,
				clicks: rawDailyStat.clicks,
				conversions: rawDailyStat.conversions,
				cost: rawDailyStat.cost,
				conversionsValue: rawDailyStat.conversionsValue,
			},
		];
	});
}
