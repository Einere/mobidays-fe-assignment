import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { buildCampaignTableRows } from "@/entities/campaign/lib/build-campaign-table-rows";
import { getDashboardDataQueryOptions } from "@/entities/dashboard/api/use-dashboard-data";
import type { GlobalFilterState } from "@/entities/global-filter/model/types";
import { deriveCampaignTableView } from "@/widgets/campaign-table/model/derive-campaign-table-view";
import type { CampaignTableControls } from "@/widgets/campaign-table/model/use-campaign-table-controls";

type CampaignTableRows = ReturnType<typeof buildCampaignTableRows>;

export type CampaignTableViewState =
	| {
			kind: "loading";
	  }
	| {
			kind: "full-error";
			errorMessage: string;
	  }
	| {
			kind: "table";
			rows: CampaignTableRows;
			isSyncing: boolean;
			staleErrorMessage: string | null;
	  };

function resolveCampaignTableViewState({
	rows,
	errorMessage,
	isLoadingError,
	isPending,
	isRefetchError,
	isRefetching,
}: {
	rows: CampaignTableRows | null;
	errorMessage: string | null;
	isLoadingError: boolean;
	isPending: boolean;
	isRefetchError: boolean;
	isRefetching: boolean;
}): CampaignTableViewState {
	if (rows === null) {
		if (isPending) {
			return { kind: "loading" };
		}

		if (isLoadingError) {
			return {
				kind: "full-error",
				errorMessage: errorMessage ?? "알 수 없는 오류가 발생했습니다.",
			};
		}

		return {
			kind: "table",
			rows: [],
			isSyncing: false,
			staleErrorMessage: null,
		};
	}

	return {
		kind: "table",
		rows,
		isSyncing: isRefetching,
		staleErrorMessage: isRefetchError
			? (errorMessage ?? "알 수 없는 오류가 발생했습니다.")
			: null,
	};
}

export function useCampaignTableData(
	filter: GlobalFilterState,
	controls: CampaignTableControls,
) {
	const query = useQuery({
		...getDashboardDataQueryOptions(filter),
		placeholderData: keepPreviousData,
	});

	const rows = useMemo(
		() =>
			query.data === undefined
				? null
				: buildCampaignTableRows({
						campaigns: query.data.campaigns,
						dailyStats: query.data.dailyStats,
					}),
		[query.data],
	);

	const viewState = resolveCampaignTableViewState({
		rows,
		errorMessage: query.error?.message ?? null,
		isLoadingError: query.isLoadingError,
		isPending: query.isPending,
		isRefetchError: query.isRefetchError,
		isRefetching: query.isRefetching,
	});

	const tableRows = viewState.kind === "table" ? viewState.rows : null;
	const tableView = useMemo(
		() =>
			tableRows === null
				? null
				: deriveCampaignTableView({
						rows: tableRows,
						searchTerm: controls.searchTerm,
						page: controls.page,
						pageSize: 10,
						sort: controls.sort,
					}),
		[controls.page, controls.searchTerm, controls.sort, tableRows],
	);

	const selectableRowIds = tableView?.rows.map((row) => row.id) ?? [];
	const selectedVisibleRowIds = selectableRowIds.filter((rowId) =>
		controls.selectedRowIds.includes(rowId),
	);
	const areAllVisibleRowsSelected =
		selectableRowIds.length > 0 &&
		selectedVisibleRowIds.length === selectableRowIds.length;
	const isPartiallySelected =
		selectedVisibleRowIds.length > 0 && !areAllVisibleRowsSelected;

	useEffect(() => {
		if (tableRows === null) {
			return;
		}

		const availableRowIds = new Set(tableRows.map((row) => row.id));
		const nextSelectedRowIds = controls.selectedRowIds.filter((rowId) =>
			availableRowIds.has(rowId),
		);

		if (nextSelectedRowIds.length !== controls.selectedRowIds.length) {
			controls.setSelectedRowIds(nextSelectedRowIds);
		}
	}, [controls.selectedRowIds, controls.setSelectedRowIds, tableRows]);

	return {
		viewState,
		tableView,
		selectableRowIds,
		areAllVisibleRowsSelected,
		isPartiallySelected,
		isShowingPlaceholderData: query.isPlaceholderData,
	};
}
