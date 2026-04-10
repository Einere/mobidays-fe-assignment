import { describe, expect, it } from "vitest";
import { toSafeNumber } from "@/shared/lib/to-safe-number";

describe("toSafeNumber", () => {
	it("returns positive finite numbers as-is and normalizes invalid values to zero", () => {
		expect(toSafeNumber(12)).toBe(12);
		expect(toSafeNumber(0)).toBe(0);
		expect(toSafeNumber(-1)).toBe(0);
		expect(toSafeNumber(Number.NaN)).toBe(0);
		expect(toSafeNumber(Number.POSITIVE_INFINITY)).toBe(0);
		expect(toSafeNumber(null)).toBe(0);
	});
});
