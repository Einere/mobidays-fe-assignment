import { describe, expect, it } from "vitest";
import dbJson from "@/db.json";
import { mockDb, resetMockDb, seedMockDb } from "@/shared/api/mock/db";

describe("mockDb", () => {
	it("resets to the raw db.json shape including daily_stats", () => {
		seedMockDb({
			campaigns: [],
			daily_stats: [],
		});

		resetMockDb();

		expect(mockDb.campaigns).toEqual(dbJson.campaigns);
		expect(mockDb.daily_stats).toEqual(dbJson.daily_stats);
	});
});
