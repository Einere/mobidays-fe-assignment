import { formatNumberWithLocale } from "@/shared/lib/intl/number";

export function formatIntegerInputValue(value: string, locale = "ko-KR") {
	if (!value) {
		return "";
	}

	const normalizedValue = normalizeIntegerInputValue(value);

	if (!normalizedValue) {
		return "";
	}

	return formatNumberWithLocale(Number(normalizedValue), locale);
}

export function normalizeIntegerInputValue(value: string) {
	return value.replace(/\D/g, "");
}
