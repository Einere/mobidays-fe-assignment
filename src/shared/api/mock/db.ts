import dbJson from "@/db.json";
import type { MockDb } from "@/shared/api/mock/types";

export const mockDb: MockDb = {
	campaigns: [],
	daily_stats: [],
};

export function seedMockDb(data: MockDb) {
	mockDb.campaigns = [...data.campaigns];
	mockDb.daily_stats = [...data.daily_stats];
}

export function resetMockDb() {
	seedMockDb({
		campaigns: [...dbJson.campaigns],
		daily_stats: [...dbJson.daily_stats],
	});
}

resetMockDb();
