import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import { isValidDateRange } from "@/entities/global-filter/lib/date-range";
import {
	campaignPlatformValues,
	globalFilterAtom,
	resetGlobalFilterAtom,
	selectAllGlobalFilterPlatformsAtom,
	selectAllGlobalFilterStatusesAtom,
	setGlobalFilterDateRangeAtom,
	toggleGlobalFilterPlatformAtom,
	toggleGlobalFilterStatusAtom,
} from "@/entities/global-filter/model/store";
import type {
	CampaignPlatform,
	CampaignStatus,
	GlobalDateRange,
} from "@/entities/global-filter/model/types";
import { Button } from "@/shared/ui/button";
import { DateRangeFields } from "@/widgets/global-filter/ui/date-range-fields";
import {
	FilterChipGroup,
	type FilterOption,
} from "@/widgets/global-filter/ui/filter-chip-group";
import { FilterDropdown } from "@/widgets/global-filter/ui/filter-dropdown";

const statusOptions: FilterOption<CampaignStatus>[] = [
	{ value: "active", label: "운영 중" },
	{ value: "paused", label: "일시중지" },
	{ value: "ended", label: "종료" },
];

const platformOptions: FilterOption<CampaignPlatform>[] =
	campaignPlatformValues.map((platform) => ({
		value: platform,
		label: platform,
	}));

const invalidDateRangeMessage = "시작일은 종료일보다 늦을 수 없습니다.";

export function GlobalFilterBar() {
	const filter = useAtomValue(globalFilterAtom);
	const setDateRange = useSetAtom(setGlobalFilterDateRangeAtom);
	const toggleStatus = useSetAtom(toggleGlobalFilterStatusAtom);
	const selectAllStatuses = useSetAtom(selectAllGlobalFilterStatusesAtom);
	const togglePlatform = useSetAtom(toggleGlobalFilterPlatformAtom);
	const selectAllPlatforms = useSetAtom(selectAllGlobalFilterPlatformsAtom);
	const resetFilter = useSetAtom(resetGlobalFilterAtom);

	const [draftDateRange, setDraftDateRange] = useState(filter.dateRange);
	const [validationMessage, setValidationMessage] = useState<string | null>(
		null,
	);

	useEffect(() => {
		setDraftDateRange(filter.dateRange);
		setValidationMessage(null);
	}, [filter.dateRange]);

	function updateDateRangeDraft(nextDateRange: GlobalDateRange) {
		setDraftDateRange(nextDateRange);

		if (!nextDateRange.startDate || !nextDateRange.endDate) {
			setValidationMessage(null);
			return;
		}

		if (!isValidDateRange(nextDateRange)) {
			setValidationMessage(invalidDateRangeMessage);
			return;
		}

		setValidationMessage(null);
		setDateRange(nextDateRange);
	}

	return (
		<section className="rounded-[var(--panel-radius)] border border-[var(--panel-border)] bg-[var(--panel-bg)] p-[var(--layout-panel-padding)] shadow-[var(--panel-shadow)]">
			<div className="flex flex-col gap-5">
				<div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<h2 className="text-[length:var(--type-title-size)] leading-[var(--type-title-line-height)] font-[var(--type-title-weight)]">
							글로벌 필터
						</h2>
						<p className="mt-1 text-[length:var(--type-body-sm-size)] text-[var(--text-secondary)]">
							기간, 상태, 매체 조건을 하나의 기준 상태로 관리합니다.
						</p>
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
						onStartDateChange={(startDate) =>
							updateDateRangeDraft({
								...draftDateRange,
								startDate,
							})
						}
						onEndDateChange={(endDate) =>
							updateDateRangeDraft({
								...draftDateRange,
								endDate,
							})
						}
					/>

					<div className="hidden gap-4 md:grid md:grid-cols-2">
						<FilterChipGroup
							groupLabel="상태"
							options={statusOptions}
							selectedValues={filter.statuses}
							onSelectAll={() => selectAllStatuses()}
							onToggleValue={(value) => toggleStatus(value)}
						/>
						<FilterChipGroup
							groupLabel="매체"
							options={platformOptions}
							selectedValues={filter.platforms}
							onSelectAll={() => selectAllPlatforms()}
							onToggleValue={(value) => togglePlatform(value)}
						/>
					</div>

					<div className="grid gap-3 md:hidden">
						<FilterDropdown
							groupLabel="상태"
							options={statusOptions}
							selectedValues={filter.statuses}
							onSelectAll={() => selectAllStatuses()}
							onToggleValue={(value) => toggleStatus(value)}
						/>
						<FilterDropdown
							groupLabel="매체"
							options={platformOptions}
							selectedValues={filter.platforms}
							onSelectAll={() => selectAllPlatforms()}
							onToggleValue={(value) => togglePlatform(value)}
						/>
					</div>
				</div>
			</div>
		</section>
	);
}
