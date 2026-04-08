import { describe, expect, it } from "vitest";
import { createInitialGlobalFilterState } from "@/entities/global-filter/model/defaults";

describe("createInitialGlobalFilterState", () => {
	it("creates current month range with all statuses and platforms", () => {
		const result = createInitialGlobalFilterState(new Date("2026-04-08T00:00:00Z"));

		expect(result).toEqual({
			dateRange: {
				startDate: "2026-04-01",
				endDate: "2026-04-30",
			},
			statuses: ["active", "paused", "ended"],
			platforms: ["Google", "Meta", "Naver"],
		});
	});
});
