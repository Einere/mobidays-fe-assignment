import dbJson from "@/db.json";
import type { CampaignStatus } from "@/entities/global-filter/model/types";
import type { MockDb } from "@/shared/api/mock/types";

function cloneMockDb(data: MockDb): MockDb {
	return structuredClone(data) as MockDb;
}

export const mockDb: MockDb = cloneMockDb(dbJson as MockDb);

let memoryDb = cloneMockDb(mockDb);

export function getMemoryDb(): MockDb {
	return memoryDb;
}

export function seedMemoryDb(data: MockDb): MockDb {
	memoryDb = cloneMockDb(data);

	return memoryDb;
}

export function resetMemoryDb(): MockDb {
	return seedMemoryDb(mockDb);
}

export function updateCampaignStatusesByIds(
	ids: string[],
	status: CampaignStatus,
): MockDb {
	const campaignIds = new Set(ids);

	memoryDb = {
		...memoryDb,
		campaigns: memoryDb.campaigns.map((campaign) => {
			if (typeof campaign.id !== "string" || !campaignIds.has(campaign.id)) {
				return campaign;
			}

			return {
				...campaign,
				status,
			};
		}),
	};

	return memoryDb;
}
