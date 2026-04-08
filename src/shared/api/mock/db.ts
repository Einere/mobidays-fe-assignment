import type { Campaign } from "@/entities/campaign/model/types";
import type { DailyStat } from "@/entities/daily-stat/model/types";

interface MockDb {
	campaigns: Campaign[];
	dailyStats: DailyStat[];
}

export const mockDb: MockDb = {
	campaigns: [],
	dailyStats: [],
};

export function seedMockDb(data: MockDb) {
	mockDb.campaigns = [...data.campaigns];
	mockDb.dailyStats = [...data.dailyStats];
}

export function resetMockDb() {
	seedMockDb({ campaigns: [], dailyStats: [] });
}
