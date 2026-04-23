import { describe, expect, it } from "vitest";

import {
	formatCurrencyWithLocale,
	formatNumberWithLocale,
	formatPercentWithLocale,
} from "@/shared/lib/intl/number";

describe("number", () => {
	it("formats numbers, currency, and percents consistently across locales", () => {
		expect(formatNumberWithLocale(1234567)).toBe("1,234,567");
		expect(formatCurrencyWithLocale(1234567)).toBe("₩1,234,567");
		expect(formatPercentWithLocale(12.345)).toBe("12.35%");
		expect(formatPercentWithLocale(12.345, { maximumFractionDigits: 1 })).toBe(
			"12.3%",
		);
		expect(formatNumberWithLocale(1234567, "en-US")).toBe("1,234,567");
		expect(formatCurrencyWithLocale(1234567, "en-US")).toBe("₩1,234,567");
		expect(formatPercentWithLocale(12.345, {}, "en-US")).toBe("12.35%");
	});
});
