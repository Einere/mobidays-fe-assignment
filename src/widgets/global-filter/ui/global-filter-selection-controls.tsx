import { getCampaignPlatformOptions } from "@/entities/global-filter/model/platforms";
import type {
	CampaignPlatform,
	CampaignStatus,
} from "@/entities/global-filter/model/types";
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

interface GlobalFilterSelectionControlsProps {
	selectedPlatforms: CampaignPlatform[];
	selectedStatuses: CampaignStatus[];
	onSelectAllPlatforms: () => void;
	onSelectAllStatuses: () => void;
	onTogglePlatform: (value: CampaignPlatform) => void;
	onToggleStatus: (value: CampaignStatus) => void;
}

export function GlobalFilterSelectionControls({
	selectedPlatforms,
	selectedStatuses,
	onSelectAllPlatforms,
	onSelectAllStatuses,
	onTogglePlatform,
	onToggleStatus,
}: GlobalFilterSelectionControlsProps) {
	const platformOptions = getCampaignPlatformOptions();

	return (
		<>
			<div className="hidden gap-4 md:grid md:grid-cols-2">
				<FilterChipGroup
					groupLabel="상태"
					options={statusOptions}
					selectedValues={selectedStatuses}
					onSelectAll={onSelectAllStatuses}
					onToggleValue={onToggleStatus}
				/>
				<FilterChipGroup
					groupLabel="매체"
					options={platformOptions}
					selectedValues={selectedPlatforms}
					onSelectAll={onSelectAllPlatforms}
					onToggleValue={onTogglePlatform}
				/>
			</div>

			<div
				className="grid grid-cols-2 gap-3 md:hidden"
				data-testid="mobile-filter-grid"
			>
				<FilterDropdown
					groupLabel="상태"
					options={statusOptions}
					selectedValues={selectedStatuses}
					onSelectAll={onSelectAllStatuses}
					onToggleValue={onToggleStatus}
				/>
				<FilterDropdown
					groupLabel="매체"
					options={platformOptions}
					selectedValues={selectedPlatforms}
					onSelectAll={onSelectAllPlatforms}
					onToggleValue={onTogglePlatform}
				/>
			</div>
		</>
	);
}
