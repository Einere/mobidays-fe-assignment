import { isAfter, isValid, parseISO } from "date-fns";
import type { GlobalDateRange } from "@/entities/global-filter/model/types";

export function isValidDateRange(range: GlobalDateRange) {
	const startDate = parseISO(range.startDate);
	const endDate = parseISO(range.endDate);

	return isValid(startDate) && isValid(endDate) && !isAfter(startDate, endDate);
}

export function serializeFilterList(values: string[]) {
	return values.join(",");
}
