import { atom } from "jotai";
import { createInitialGlobalFilterState } from "@/entities/global-filter/model/defaults";
import type {
	CampaignPlatform,
	CampaignStatus,
	GlobalDateRange,
	GlobalFilterState,
} from "@/entities/global-filter/model/types";

export const campaignStatusValues = ["active", "paused", "ended"] as const;
export const campaignPlatformValues = ["Google", "Meta", "Naver"] as const;

function toggleFilterValue<T extends string>(
	selectedValues: T[],
	value: T,
	allValues: readonly T[],
) {
	if (selectedValues.includes(value)) {
		return selectedValues.filter((selectedValue) => selectedValue !== value);
	}

	return allValues.filter(
		(candidate) => candidate === value || selectedValues.includes(candidate),
	);
}

export const globalFilterAtom = atom<GlobalFilterState>(
	createInitialGlobalFilterState(),
);

export const setGlobalFilterAtom = atom(
	null,
	(_get, set, nextFilter: GlobalFilterState) => {
		set(globalFilterAtom, nextFilter);
	},
);

export const setGlobalFilterDateRangeAtom = atom(
	null,
	(get, set, dateRange: GlobalDateRange) => {
		set(globalFilterAtom, {
			...get(globalFilterAtom),
			dateRange,
		});
	},
);

export const toggleGlobalFilterStatusAtom = atom(
	null,
	(get, set, status: CampaignStatus) => {
		const currentFilter = get(globalFilterAtom);

		set(globalFilterAtom, {
			...currentFilter,
			statuses: toggleFilterValue(
				currentFilter.statuses,
				status,
				campaignStatusValues,
			),
		});
	},
);

export const selectAllGlobalFilterStatusesAtom = atom(null, (get, set) => {
	const currentFilter = get(globalFilterAtom);

	set(globalFilterAtom, {
		...currentFilter,
		statuses: [...campaignStatusValues],
	});
});

export const toggleGlobalFilterPlatformAtom = atom(
	null,
	(get, set, platform: CampaignPlatform) => {
		const currentFilter = get(globalFilterAtom);

		set(globalFilterAtom, {
			...currentFilter,
			platforms: toggleFilterValue(
				currentFilter.platforms,
				platform,
				campaignPlatformValues,
			),
		});
	},
);

export const selectAllGlobalFilterPlatformsAtom = atom(null, (get, set) => {
	const currentFilter = get(globalFilterAtom);

	set(globalFilterAtom, {
		...currentFilter,
		platforms: [...campaignPlatformValues],
	});
});

export const resetGlobalFilterAtom = atom(null, (_get, set) => {
	set(globalFilterAtom, createInitialGlobalFilterState());
});
