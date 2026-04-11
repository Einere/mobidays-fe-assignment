import { useAtomValue } from "jotai";
import type { UseFormReturn } from "react-hook-form";
import type { CreateCampaignFormValues } from "@/entities/campaign/lib/create-campaign-schema";
import { globalFilterAtom } from "@/entities/global-filter/model/store";
import type { CampaignStatus } from "@/entities/global-filter/model/types";
import { buildCampaignTableSelectionResetKey } from "@/widgets/campaign-table/model/build-campaign-table-selection-reset-key";
import type { CampaignTableView } from "@/widgets/campaign-table/model/derive-campaign-table-view";
import { useCampaignCreateDialog } from "@/widgets/campaign-table/model/use-campaign-create-dialog";
import { useCampaignStatusBulkAction } from "@/widgets/campaign-table/model/use-campaign-status-bulk-action";
import type { CampaignTableControls } from "@/widgets/campaign-table/model/use-campaign-table-controls";
import { useCampaignTableControls } from "@/widgets/campaign-table/model/use-campaign-table-controls";
import {
	type CampaignTableViewState,
	useCampaignTableData,
} from "@/widgets/campaign-table/model/use-campaign-table-data";
import { useCampaignTableSelection } from "@/widgets/campaign-table/model/use-campaign-table-selection";

export interface CampaignTableCreateDialogState {
	open: boolean;
	form: UseFormReturn<CreateCampaignFormValues>;
	isSubmitting: boolean;
	commonError: string | null;
	openDialog: () => void;
	setOpen: (open: boolean) => void;
	submit: (values: CreateCampaignFormValues) => Promise<void>;
}

export type CampaignTableDataState =
	| {
			kind: "loading";
			viewState: Extract<CampaignTableViewState, { kind: "loading" }>;
			tableView: null;
			isShowingPlaceholderData: boolean;
	  }
	| {
			kind: "full-error";
			viewState: Extract<CampaignTableViewState, { kind: "full-error" }>;
			tableView: null;
			isShowingPlaceholderData: boolean;
	  }
	| {
			kind: "table";
			viewState: Extract<CampaignTableViewState, { kind: "table" }>;
			tableView: CampaignTableView;
			isShowingPlaceholderData: boolean;
	  };

export type CampaignTableTableState = Extract<
	CampaignTableDataState,
	{ kind: "table" }
>;

export type CampaignTableLoadingState = Extract<
	CampaignTableDataState,
	{ kind: "loading" }
>;

export type CampaignTableErrorState = Extract<
	CampaignTableDataState,
	{ kind: "full-error" }
>;

export type CampaignTableUnavailableState =
	| CampaignTableLoadingState
	| CampaignTableErrorState;

export interface CampaignTableSelectionState {
	selectedRowIds: string[];
	selectedCount: number;
	areAllVisibleRowsSelected: boolean;
	isPartiallySelected: boolean;
	toggleRowSelection: (rowId: string) => void;
	togglePageSelection: (pageRowIds: string[]) => void;
	clearSelection: () => void;
}

export interface CampaignTableBulkActionState {
	pendingStatus: CampaignStatus | null;
	pendingStatusLabel: string;
	isDialogOpen: boolean;
	errorMessage: string | null;
	isSubmitting: boolean;
	canOpenDialog: boolean;
	canConfirm: boolean;
	setPendingStatus: (nextPendingStatus: CampaignStatus | null) => void;
	openDialog: () => void;
	setDialogOpen: (open: boolean) => void;
	confirm: () => Promise<void> | void;
}

export interface CampaignTableViewModel {
	controls: CampaignTableControls;
	createDialog: CampaignTableCreateDialogState;
	tableData: CampaignTableDataState;
	selection: CampaignTableSelectionState;
	bulkAction: CampaignTableBulkActionState;
}

function normalizeCampaignTableData(
	tableData: ReturnType<typeof useCampaignTableData>,
): CampaignTableDataState {
	if (tableData.viewState.kind === "loading") {
		return {
			kind: "loading",
			viewState: tableData.viewState,
			tableView: null,
			isShowingPlaceholderData: tableData.isShowingPlaceholderData,
		};
	}

	if (tableData.viewState.kind === "full-error") {
		return {
			kind: "full-error",
			viewState: tableData.viewState,
			tableView: null,
			isShowingPlaceholderData: tableData.isShowingPlaceholderData,
		};
	}

	if (tableData.viewState.kind === "table" && tableData.tableView !== null) {
		return {
			kind: "table",
			viewState: tableData.viewState,
			tableView: tableData.tableView,
			isShowingPlaceholderData: tableData.isShowingPlaceholderData,
		};
	}

	throw new Error(
		"Campaign table data invariant violated: table state is missing rows.",
	);
}

export function useCampaignTableViewModel() {
	const filter = useAtomValue(globalFilterAtom);
	const controls = useCampaignTableControls();
	const createDialog = useCampaignCreateDialog();
	const tableData = normalizeCampaignTableData(
		useCampaignTableData(filter, controls),
	);
	const visibleRowIds = tableData.tableView?.rows.map((row) => row.id) ?? [];
	const selectionResetKey = buildCampaignTableSelectionResetKey({
		filter,
		page: controls.page,
		searchTerm: controls.searchTerm,
		sort: controls.sort,
	});
	const selection = useCampaignTableSelection({
		resetKey: selectionResetKey,
		visibleRowIds,
	});
	const bulkAction = useCampaignStatusBulkAction({
		selectedRowIds: selection.selectedRowIds,
		isInteractionBlocked: tableData.isShowingPlaceholderData,
		onClearSelection: selection.clearSelection,
	});

	return {
		controls,
		createDialog,
		tableData,
		selection,
		bulkAction,
	} satisfies CampaignTableViewModel;
}
