import { useAtomValue, useSetAtom } from "jotai";
import {
	globalFilterAtom,
	resetGlobalFilterAtom,
	selectAllGlobalFilterPlatformsAtom,
	selectAllGlobalFilterStatusesAtom,
	setGlobalFilterDateRangeAtom,
	toggleGlobalFilterPlatformAtom,
	toggleGlobalFilterStatusAtom,
} from "@/entities/global-filter/model/store";
import { Button } from "@/shared/ui/button";
import { useGlobalFilterDateRangeDraft } from "@/widgets/global-filter/model/use-global-filter-date-range-draft";
import { DateRangeFields } from "@/widgets/global-filter/ui/date-range-fields";
import { GlobalFilterSelectionControls } from "@/widgets/global-filter/ui/global-filter-selection-controls";

export function GlobalFilterBar() {
	const filter = useAtomValue(globalFilterAtom);
	const setDateRange = useSetAtom(setGlobalFilterDateRangeAtom);
	const toggleStatus = useSetAtom(toggleGlobalFilterStatusAtom);
	const selectAllStatuses = useSetAtom(selectAllGlobalFilterStatusesAtom);
	const togglePlatform = useSetAtom(toggleGlobalFilterPlatformAtom);
	const selectAllPlatforms = useSetAtom(selectAllGlobalFilterPlatformsAtom);
	const resetFilter = useSetAtom(resetGlobalFilterAtom);

	const {
		draftDateRange,
		validationMessage,
		onStartDateChange,
		onEndDateChange,
	} = useGlobalFilterDateRangeDraft({
		dateRange: filter.dateRange,
		onCommitDateRange: setDateRange,
	});

	return (
		<section className="rounded-panel border border-outline-subtle bg-panel p-panel shadow-panel">
			<div className="flex flex-col gap-5">
				<div className="flex items-start justify-between gap-3">
					<div>
						<h2 className="typo-heading-md">글로벌 필터</h2>
					</div>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={() => resetFilter()}
					>
						초기화
					</Button>
				</div>

				<div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
					<DateRangeFields
						startDate={draftDateRange.startDate}
						endDate={draftDateRange.endDate}
						validationMessage={validationMessage}
						onStartDateChange={onStartDateChange}
						onEndDateChange={onEndDateChange}
					/>

					<GlobalFilterSelectionControls
						selectedStatuses={filter.statuses}
						selectedPlatforms={filter.platforms}
						onSelectAllStatuses={selectAllStatuses}
						onSelectAllPlatforms={selectAllPlatforms}
						onToggleStatus={toggleStatus}
						onTogglePlatform={togglePlatform}
					/>
				</div>
			</div>
		</section>
	);
}
