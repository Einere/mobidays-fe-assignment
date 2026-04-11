import type { GlobalDateRange } from "@/entities/global-filter/model/types";
import { isKstDateRangeValid, isKstDateString } from "@/shared/lib/date/kst";

export function isValidDateRange(range: GlobalDateRange) {
	return (
		isKstDateString(range.startDate) &&
		isKstDateString(range.endDate) &&
		isKstDateRangeValid(range.startDate, range.endDate)
	);
}

export function serializeFilterList(values: string[]) {
	return values.join(",");
}
