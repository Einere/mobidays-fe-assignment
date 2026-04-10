import dbJson from "@/db.json";
import type {
	CampaignPlatform,
	CampaignStatus,
} from "@/entities/global-filter/model/types";
import type { MockDb, RawCampaign } from "@/shared/api/mock/types";

function cloneMockDb(data: MockDb): MockDb {
	return structuredClone(data) as MockDb;
}

export const mockDb: MockDb = cloneMockDb(dbJson as MockDb);

let memoryDb = cloneMockDb(mockDb);

function createCampaignId() {
	return `campaign-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

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

export interface AppendCampaignInput {
	name: string;
	platform: CampaignPlatform;
	budget: number;
	startDate: string;
	endDate: string | null;
}

export function appendCampaignToMemoryDb(
	input: AppendCampaignInput,
): RawCampaign {
	const createdCampaign: RawCampaign = {
		id: createCampaignId(),
		name: input.name,
		platform: input.platform,
		status: "active",
		budget: input.budget,
		startDate: input.startDate,
		endDate: input.endDate,
	};

	memoryDb = {
		...memoryDb,
		campaigns: [...memoryDb.campaigns, createdCampaign],
	};

	return createdCampaign;
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
