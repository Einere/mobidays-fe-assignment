import { describe, expect, it } from "vitest";
import {
	isValidDateRange,
	serializeFilterList,
} from "@/entities/global-filter/lib/date-range";

describe("date range utils", () => {
	it("accepts same-day and ascending ranges", () => {
		expect(
			isValidDateRange({ startDate: "2026-04-01", endDate: "2026-04-01" }),
		).toBe(true);
		expect(
			isValidDateRange({ startDate: "2026-04-01", endDate: "2026-04-30" }),
		).toBe(true);
	});

	it("rejects descending and invalid ranges", () => {
		expect(
			isValidDateRange({ startDate: "2026-04-30", endDate: "2026-04-01" }),
		).toBe(false);
		expect(
			isValidDateRange({ startDate: "invalid", endDate: "2026-04-01" }),
		).toBe(false);
	});

	it("serializes selected values for query params", () => {
		expect(serializeFilterList(["active", "paused"])).toBe("active,paused");
		expect(serializeFilterList([])).toBe("");
	});
});
