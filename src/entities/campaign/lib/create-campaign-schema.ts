import { z } from "zod";
import type { CampaignPlatform } from "@/entities/global-filter/model/types";

const campaignPlatforms = ["Google", "Meta", "Naver"] as const;
const currencyLimitMessage = "10억 원 이하의 정수여야 합니다.";
const budgetValidationMessage = `예산은 100원 이상 ${currencyLimitMessage}`;
const spendValidationMessage = `집행 금액은 0원 이상 ${currencyLimitMessage}`;

function parseIsoDateToUtcMs(value: string): number | null {
	const trimmedValue = value.trim();

	if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
		return null;
	}

	const [yearValue, monthValue, dayValue] = trimmedValue
		.split("-")
		.map((part) => Number(part));

	if (
		!Number.isInteger(yearValue) ||
		!Number.isInteger(monthValue) ||
		!Number.isInteger(dayValue)
	) {
		return null;
	}

	const date = new Date(Date.UTC(yearValue, monthValue - 1, dayValue));

	if (
		date.getUTCFullYear() !== yearValue ||
		date.getUTCMonth() !== monthValue - 1 ||
		date.getUTCDate() !== dayValue
	) {
		return null;
	}

	return date.getTime();
}

function isValidIsoCalendarDate(value: string) {
	return parseIsoDateToUtcMs(value) !== null;
}

function parseIntegerInRange({
	requiredMessage,
	validationMessage,
	min,
	max,
}: {
	requiredMessage: string;
	validationMessage: string;
	min: number;
	max: number;
}) {
	return z
		.string()
		.trim()
		.min(1, requiredMessage)
		.refine((value) => value.length === 0 || /^\d+$/.test(value), {
			message: validationMessage,
		})
		.refine(
			(value) => {
				if (value.length === 0) {
					return true;
				}

				const amount = Number(value);

				return amount >= min && amount <= max;
			},
			{
				message: validationMessage,
			},
		);
}

const platformSchema = z
	.string()
	.trim()
	.refine(
		(value): value is CampaignPlatform =>
			campaignPlatforms.includes(value as CampaignPlatform),
		{
			message: "광고 매체를 선택해주세요.",
		},
	);

const dateSchema = (requiredMessage: string) =>
	z
		.string()
		.trim()
		.min(1, requiredMessage)
		.refine((value) => value.length === 0 || isValidIsoCalendarDate(value), {
			message: requiredMessage,
		});

function applyCreateCampaignCrossFieldValidation(
	values: { budget: number; spend: number; startDate: string; endDate: string },
	ctx: z.RefinementCtx,
) {
	const startDate = parseIsoDateToUtcMs(values.startDate);
	const endDate = parseIsoDateToUtcMs(values.endDate);

	if (startDate !== null && endDate !== null && endDate < startDate) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ["endDate"],
			message: "종료일은 시작일과 같거나 이후여야 합니다.",
		});
	}

	if (values.spend > values.budget) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ["spend"],
			message: "집행 금액은 예산을 초과할 수 없습니다.",
		});
	}
}

export const createCampaignSchema = z
	.object({
		name: z
			.string()
			.trim()
			.min(1, "캠페인명을 입력해주세요.")
			.refine((value) => value.length >= 2 && value.length <= 100, {
				message: "캠페인명은 2자 이상 100자 이하로 입력해주세요.",
			}),
		platform: platformSchema,
		budget: parseIntegerInRange({
			requiredMessage: "예산을 입력해주세요.",
			validationMessage: budgetValidationMessage,
			min: 100,
			max: 1_000_000_000,
		}),
		spend: parseIntegerInRange({
			requiredMessage: "집행 금액을 입력해주세요.",
			validationMessage: spendValidationMessage,
			min: 0,
			max: 1_000_000_000,
		}),
		startDate: dateSchema("시작일을 선택해주세요."),
		endDate: dateSchema("종료일을 선택해주세요."),
	})
	.superRefine((values, ctx) => {
		applyCreateCampaignCrossFieldValidation(
			{
				budget: Number(values.budget),
				spend: Number(values.spend),
				startDate: values.startDate,
				endDate: values.endDate,
			},
			ctx,
		);
	});

export type CreateCampaignFormValues = z.input<typeof createCampaignSchema>;

export const createCampaignInputSchema = z
	.object({
		name: z
			.string()
			.trim()
			.min(1, "캠페인명을 입력해주세요.")
			.refine((value) => value.length >= 2 && value.length <= 100, {
				message: "캠페인명은 2자 이상 100자 이하로 입력해주세요.",
			}),
		platform: platformSchema,
		budget: z
			.number()
			.int(budgetValidationMessage)
			.min(100, budgetValidationMessage)
			.max(1_000_000_000, budgetValidationMessage),
		spend: z
			.number()
			.int(spendValidationMessage)
			.min(0, spendValidationMessage)
			.max(1_000_000_000, spendValidationMessage),
		startDate: dateSchema("시작일을 선택해주세요."),
		endDate: dateSchema("종료일을 선택해주세요."),
	})
	.superRefine((values, ctx) => {
		applyCreateCampaignCrossFieldValidation(values, ctx);
	});

export type CreateCampaignInput = z.output<typeof createCampaignInputSchema>;
