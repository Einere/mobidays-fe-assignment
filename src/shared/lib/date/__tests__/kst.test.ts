import { describe, expect, it } from "vitest";
import {
	formatKstDate,
	getKstMonthRange,
	isKstDateString,
	parseKstDateString,
} from "@/shared/lib/date/kst";

describe("KST date helpers", () => {
	it("formats an instant using Asia/Seoul calendar rules", () => {
		expect(formatKstDate(new Date("2026-03-31T15:00:00.000Z"))).toBe(
			"2026-04-01",
		);
	});

	it("validates only canonical YYYY-MM-DD strings", () => {
		expect(isKstDateString("2026-04-01")).toBe(true);
		expect(isKstDateString("2026/04/01")).toBe(false);
		expect(isKstDateString("2026-02-30")).toBe(false);
	});

	it("parses a KST date string into a stable Date object", () => {
		expect(parseKstDateString("2026-04-01")?.toISOString()).toBe(
			"2026-03-31T15:00:00.000Z",
		);
	});

	it("returns month boundaries in KST", () => {
		expect(getKstMonthRange(new Date("2026-04-08T00:00:00.000Z"))).toEqual({
			startDate: "2026-04-01",
			endDate: "2026-04-30",
		});
	});
});
