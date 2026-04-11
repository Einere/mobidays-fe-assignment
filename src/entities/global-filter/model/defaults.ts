import { campaignPlatformValues } from "@/entities/global-filter/model/platforms";
import type { GlobalFilterState } from "@/entities/global-filter/model/types";
import { getKstMonthRange } from "@/shared/lib/date/kst";

export function createInitialGlobalFilterState(
	now = new Date(),
): GlobalFilterState {
	const dateRange = getKstMonthRange(now);

	return {
		dateRange,
		statuses: ["active", "paused", "ended"],
		platforms: [...campaignPlatformValues],
	};
}
