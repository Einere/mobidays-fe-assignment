import { TZDate, tz } from "@date-fns/tz";
import { endOfMonth, format, isAfter, isValid, startOfMonth } from "date-fns";

export const KST_TIME_ZONE = "Asia/Seoul";

const kstContext = { in: tz(KST_TIME_ZONE) };
const canonicalDatePattern = "yyyy-MM-dd";

function isValidDateParts(year: number, month: number, day: number) {
	const date = TZDate.tz(KST_TIME_ZONE, year, month - 1, day);

	return (
		date.getFullYear() === year &&
		date.getMonth() === month - 1 &&
		date.getDate() === day
	);
}

export function isKstDateString(value: unknown): value is string {
	if (typeof value !== "string") {
		return false;
	}

	return (
		/^\d{4}-\d{2}-\d{2}$/.test(value) && parseKstDateString(value) !== null
	);
}

export function parseKstDateString(value: string): Date | null {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
	if (match === null) {
		return null;
	}

	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);

	if (
		!Number.isInteger(year) ||
		!Number.isInteger(month) ||
		!Number.isInteger(day) ||
		!isValidDateParts(year, month, day)
	) {
		return null;
	}

	return new Date(TZDate.tz(KST_TIME_ZONE, year, month - 1, day).getTime());
}

export function formatKstDate(
	date: Date | number,
	pattern = canonicalDatePattern,
) {
	return format(date, pattern, kstContext);
}

export function getKstMonthRange(now: Date) {
	const kstNow = TZDate.tz(KST_TIME_ZONE, now);
	const startDate = format(
		startOfMonth(kstNow, kstContext),
		canonicalDatePattern,
		kstContext,
	);
	const endDate = format(
		endOfMonth(kstNow, kstContext),
		canonicalDatePattern,
		kstContext,
	);

	return { startDate, endDate };
}

export function isKstDateRangeValid(startDate: string, endDate: string) {
	const start = parseKstDateString(startDate);
	const end = parseKstDateString(endDate);

	return (
		start !== null &&
		end !== null &&
		isValid(start) &&
		isValid(end) &&
		!isAfter(start, end)
	);
}
