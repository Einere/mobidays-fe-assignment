const DEFAULT_LOCALE = "ko-KR";

const defaultNumberFormatter = new Intl.NumberFormat(DEFAULT_LOCALE);
const defaultCurrencyFormatter = new Intl.NumberFormat(DEFAULT_LOCALE, {
	style: "currency",
	currency: "KRW",
	maximumFractionDigits: 0,
});

type NumberFormatOptions = Omit<Intl.NumberFormatOptions, "style" | "currency">;

const formatterCache = new Map<string, Intl.NumberFormat>();

function getFormatter(locale: string, options: Intl.NumberFormatOptions) {
	const cacheKey = `${locale}:${JSON.stringify(options)}`;
	const cachedFormatter = formatterCache.get(cacheKey);

	if (cachedFormatter) {
		return cachedFormatter;
	}

	const formatter = new Intl.NumberFormat(locale, options);

	formatterCache.set(cacheKey, formatter);

	return formatter;
}

export function formatNumberWithLocale(value: number, locale = DEFAULT_LOCALE) {
	if (locale === DEFAULT_LOCALE) {
		return defaultNumberFormatter.format(value);
	}

	return getFormatter(locale, {}).format(value);
}

export function formatCurrencyWithLocale(
	value: number,
	locale = DEFAULT_LOCALE,
) {
	if (locale === DEFAULT_LOCALE) {
		return defaultCurrencyFormatter.format(value);
	}

	return getFormatter(locale, {
		style: "currency",
		currency: "KRW",
		maximumFractionDigits: 0,
	}).format(value);
}

export function formatPercentWithLocale(
	value: number,
	options: NumberFormatOptions = {},
	locale = DEFAULT_LOCALE,
) {
	const resolvedOptions = {
		maximumFractionDigits: 2,
		...options,
	};

	return `${getFormatter(locale, resolvedOptions).format(value)}%`;
}
