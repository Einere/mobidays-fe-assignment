import { useCallback, useEffect, useState } from "react";
import type { GlobalDateRange } from "@/entities/global-filter/model/types";
import {
	type GlobalFilterDateRangeResolution,
	resolveGlobalFilterDateRangeResolution,
} from "@/widgets/global-filter/model/global-filter-date-range";

interface UseGlobalFilterDateRangeDraftParams {
	dateRange: GlobalDateRange;
	onCommitDateRange: (nextDateRange: GlobalDateRange) => void;
}

export interface GlobalFilterDateRangeDraftState {
	draftDateRange: GlobalDateRange;
	validationMessage: string | null;
	onStartDateChange: (value: string) => void;
	onEndDateChange: (value: string) => void;
}

function applyDateRangeResolution(
	resolution: GlobalFilterDateRangeResolution,
	nextDateRange: GlobalDateRange,
	onCommitDateRange: (nextDateRange: GlobalDateRange) => void,
) {
	if (!resolution.shouldCommit) {
		return resolution;
	}

	onCommitDateRange(nextDateRange);

	return resolution;
}

export function useGlobalFilterDateRangeDraft({
	dateRange,
	onCommitDateRange,
}: UseGlobalFilterDateRangeDraftParams) {
	const [draftDateRange, setDraftDateRange] = useState(dateRange);
	const [validationMessage, setValidationMessage] = useState<string | null>(
		null,
	);

	useEffect(() => {
		setDraftDateRange(dateRange);
		setValidationMessage(null);
	}, [dateRange]);

	const updateDateRangeDraft = useCallback(
		(nextDateRange: GlobalDateRange) => {
			setDraftDateRange(nextDateRange);

			const resolution = applyDateRangeResolution(
				resolveGlobalFilterDateRangeResolution(nextDateRange),
				nextDateRange,
				onCommitDateRange,
			);

			setValidationMessage(resolution.validationMessage);
		},
		[onCommitDateRange],
	);

	return {
		draftDateRange,
		validationMessage,
		onStartDateChange: useCallback(
			(value: string) => {
				updateDateRangeDraft({
					...draftDateRange,
					startDate: value,
				});
			},
			[draftDateRange, updateDateRangeDraft],
		),
		onEndDateChange: useCallback(
			(value: string) => {
				updateDateRangeDraft({
					...draftDateRange,
					endDate: value,
				});
			},
			[draftDateRange, updateDateRangeDraft],
		),
	} satisfies GlobalFilterDateRangeDraftState;
}
