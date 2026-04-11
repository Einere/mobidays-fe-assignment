import { isValidDateRange } from "@/entities/global-filter/lib/date-range";
import type { GlobalDateRange } from "@/entities/global-filter/model/types";

export const invalidGlobalFilterDateRangeMessage =
	"시작일은 종료일보다 늦을 수 없습니다.";

export interface GlobalFilterDateRangeResolution {
	validationMessage: string | null;
	shouldCommit: boolean;
}

export function resolveGlobalFilterDateRangeResolution(
	nextDateRange: GlobalDateRange,
): GlobalFilterDateRangeResolution {
	if (!nextDateRange.startDate || !nextDateRange.endDate) {
		return {
			validationMessage: null,
			shouldCommit: false,
		};
	}

	if (!isValidDateRange(nextDateRange)) {
		return {
			validationMessage: invalidGlobalFilterDateRangeMessage,
			shouldCommit: false,
		};
	}

	return {
		validationMessage: null,
		shouldCommit: true,
	};
}
