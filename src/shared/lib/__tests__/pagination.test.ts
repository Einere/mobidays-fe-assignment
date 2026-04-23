import { describe, expect, it } from "vitest";

import { normalizePage, normalizePageSize } from "@/shared/lib/pagination";

describe("pagination", () => {
	it("normalizes page and page size values", () => {
		expect(normalizePageSize(10)).toBe(10);
		expect(normalizePageSize(2.7)).toBe(2);
		expect(normalizePageSize(0)).toBe(1);
		expect(normalizePageSize(Number.NaN)).toBe(1);
		expect(normalizePage(Number.NaN)).toBe(1);
		expect(normalizePage(2.7)).toBe(2);
		expect(normalizePage(0)).toBe(0);
		expect(normalizePage(Number.POSITIVE_INFINITY)).toBe(1);
	});
});
