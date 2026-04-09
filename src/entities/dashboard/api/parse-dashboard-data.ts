import { z } from "zod";
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

const nonEmptyStringSchema = z
	.string()
	.refine((value) => value.trim().length > 0);

const nullableFiniteNumberSchema = z.union([z.number().finite(), z.null()]);

const campaignRowSchema = z
	.object({
		id: nonEmptyStringSchema,
	})
	.passthrough();

const dailyStatRowSchema = z
	.object({
		id: nonEmptyStringSchema,
		campaignId: nonEmptyStringSchema,
		impressions: nullableFiniteNumberSchema,
		clicks: nullableFiniteNumberSchema,
		conversions: nullableFiniteNumberSchema,
		cost: nullableFiniteNumberSchema,
		conversionsValue: nullableFiniteNumberSchema,
	})
	.passthrough();

function parseResponseRows<Row extends z.ZodTypeAny>(
	response: unknown,
	rowSchema: Row,
): z.output<Row>[] {
	if (!Array.isArray(response)) {
		return [];
	}

	return response.flatMap((item) => {
		const parsedItem = rowSchema.safeParse(item);

		return parsedItem.success ? [parsedItem.data] : [];
	});
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
	return parseResponseRows(response, campaignRowSchema).map((item) => {
		const rawCampaign = item as unknown as RawCampaign;

		return {
			raw: rawCampaign,
			id: item.id,
			name: parseOptionalString(rawCampaign.name),
			platform: parseEnumValue(rawCampaign.platform, campaignPlatforms),
			status: parseEnumValue(rawCampaign.status, campaignStatuses),
			budget: parseNullableNumber(rawCampaign.budget),
			startDate: parseNullableDateLikeString(rawCampaign.startDate),
			endDate: parseNullableDateLikeString(rawCampaign.endDate),
		};
	});
}

export function parseDailyStatResponse(
	response: unknown,
): DashboardDailyStat[] {
	return parseResponseRows(response, dailyStatRowSchema).map((item) => {
		const rawDailyStat = item as unknown as RawDailyStat;

		return {
			raw: rawDailyStat,
			id: item.id,
			campaignId: item.campaignId,
			date: parseNullableDateLikeString(rawDailyStat.date),
			impressions: item.impressions,
			clicks: item.clicks,
			conversions: item.conversions,
			cost: item.cost,
			conversionsValue: item.conversionsValue,
		};
	});
}
