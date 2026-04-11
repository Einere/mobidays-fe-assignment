import { useMemo } from "react";
import { useDashboardDataContext } from "@/entities/dashboard/model/dashboard-data-context";
import type { DashboardDerivations } from "@/entities/dashboard/model/use-dashboard-derivations";
import { deriveCampaignTableView } from "@/widgets/campaign-table/model/derive-campaign-table-view";
import type { CampaignTableControls } from "@/widgets/campaign-table/model/use-campaign-table-controls";

type CampaignTableRows = DashboardDerivations["tableRows"];

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

export function useCampaignTableData(controls: CampaignTableControls) {
	const { query, derivations } = useDashboardDataContext();

	const rows = useMemo(
		() => (derivations === null ? null : derivations.tableRows),
		[derivations],
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

	return {
		viewState,
		tableView,
		isShowingPlaceholderData: query.isPlaceholderData,
	};
}
