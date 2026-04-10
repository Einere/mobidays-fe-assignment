import { endOfMonth, format, startOfMonth } from "date-fns";
import { campaignPlatformValues } from "@/entities/global-filter/model/platforms";
import type { GlobalFilterState } from "@/entities/global-filter/model/types";

const DATE_FORMAT = "yyyy-MM-dd";

export function createInitialGlobalFilterState(
	now = new Date(),
): GlobalFilterState {
	return {
		dateRange: {
			startDate: format(startOfMonth(now), DATE_FORMAT),
			endDate: format(endOfMonth(now), DATE_FORMAT),
		},
		statuses: ["active", "paused", "ended"],
		platforms: [...campaignPlatformValues],
	};
}
