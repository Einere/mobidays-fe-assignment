import { useCampaignTableViewModel } from "@/widgets/campaign-table/model/use-campaign-table-view-model";
import { CampaignCreateDialog } from "@/widgets/campaign-table/ui/campaign-create-dialog";
import { CampaignTableStatusDialog } from "@/widgets/campaign-table/ui/campaign-table-status-dialog";
import { CampaignTableTable } from "@/widgets/campaign-table/ui/campaign-table-table";
import { CampaignTableToolbar } from "@/widgets/campaign-table/ui/campaign-table-toolbar";

function CampaignTableLoadingState() {
	return (
		<section className="rounded-panel border border-outline-subtle bg-panel p-panel shadow-panel">
			<div className="flex flex-col gap-4" data-testid="campaign-table-loading">
				<div className="flex flex-col gap-1">
					<h2>캠페인 현황</h2>
					<p className="typo-body-sm text-fg-muted">
						전역 필터 기준으로 집계한 캠페인별 운영 성과입니다.
					</p>
				</div>
				<div className="h-6 w-40 rounded-sm bg-panel-muted" />
				<div className="h-control-md w-full rounded-md bg-panel-muted lg:w-[320px]" />
				<div className="h-80 rounded-card border border-outline-subtle bg-panel-muted" />
			</div>
		</section>
	);
}

function CampaignTableErrorState() {
	return (
		<section className="rounded-panel border border-outline-subtle bg-panel p-panel shadow-panel">
			<div className="flex flex-col gap-3">
				<h2>캠페인 현황</h2>
				<p className="typo-body-sm text-fg-muted">
					전역 필터 기준으로 집계한 캠페인별 운영 성과입니다.
				</p>
				<div className="rounded-card border border-status-danger-border bg-status-danger/30 px-4 py-5 typo-body-sm text-status-danger-fg">
					<p>캠페인 데이터를 불러오지 못했습니다.</p>
				</div>
			</div>
		</section>
	);
}

export function CampaignTableCard() {
	const viewModel = useCampaignTableViewModel();
	const controls = viewModel.controls;
	const createDialog = viewModel.createDialog;
	const tableData = viewModel.tableData;
	const selection = viewModel.selection;
	const bulkAction = viewModel.bulkAction;
	const isInteractionDisabled =
		tableData.isShowingPlaceholderData || bulkAction.isSubmitting;
	const isSyncing =
		tableData.viewState.kind === "table" && tableData.viewState.isSyncing;

	if (tableData.kind === "loading") {
		return <CampaignTableLoadingState />;
	}

	if (tableData.kind === "full-error") {
		return <CampaignTableErrorState />;
	}

	const tableView = tableData.tableView;
	const emptyStateMessage =
		tableView.totalCount === 0
			? "조건에 맞는 캠페인이 없습니다."
			: "검색 결과가 없습니다.";
	const toolbarState = {
		searchInput: controls.searchInput,
		filteredCount: tableView.filteredCount,
		totalCount: tableView.totalCount,
		selectedCount: selection.selectedCount,
		pendingStatus: bulkAction.pendingStatus,
		disabled: isInteractionDisabled,
		canApplyStatusChange: bulkAction.canOpenDialog,
	};
	const toolbarActions = {
		onSearchInputChange: controls.setSearchInput,
		onPendingStatusChange: bulkAction.setPendingStatus,
		onOpenStatusDialog: bulkAction.openDialog,
		onOpenCreateDialog: createDialog.openDialog,
	};
	const tableState = {
		tableView,
		selectedRowIds: selection.selectedRowIds,
		areAllVisibleRowsSelected: selection.areAllVisibleRowsSelected,
		isPartiallySelected: selection.isPartiallySelected,
		isInteractionDisabled,
		sort: controls.sort,
	};
	const tableActions = {
		onToggleSort: controls.toggleSort,
		onToggleRowSelection: selection.toggleRowSelection,
		onTogglePageSelection: selection.togglePageSelection,
		onSetPage: controls.setPage,
	};
	const statusDialogState = {
		open: bulkAction.isDialogOpen,
		selectedCount: selection.selectedCount,
		statusLabel: bulkAction.pendingStatusLabel,
		errorMessage: bulkAction.errorMessage,
		isSubmitting: bulkAction.isSubmitting,
		canConfirm: bulkAction.canConfirm,
	};
	const statusDialogActions = {
		onOpenChange: bulkAction.setDialogOpen,
		onConfirm: bulkAction.confirm,
	};
	const createDialogState = {
		open: createDialog.open,
		commonError: createDialog.commonError,
		isSubmitting: createDialog.isSubmitting,
		form: createDialog.form,
	};
	const createDialogActions = {
		onOpenChange: createDialog.setOpen,
		onSubmit: createDialog.submit,
	};

	return (
		<section className="rounded-panel border border-outline-subtle bg-panel p-panel shadow-panel">
			<div className="flex flex-col gap-5">
				<CampaignTableToolbar
					isSyncing={isSyncing}
					toolbarState={toolbarState}
					actions={toolbarActions}
				/>

				{tableData.viewState.staleErrorMessage ? (
					<div className="rounded-card border border-status-danger-border bg-status-danger/30 px-4 py-3 typo-body-sm text-status-danger-fg">
						<p>
							최신 캠페인 데이터를 불러오지 못해 마지막 성공 결과를 표시
							중입니다.
						</p>
					</div>
				) : null}

				{tableView.rows.length > 0 ? (
					<CampaignTableTable tableState={tableState} actions={tableActions} />
				) : (
					<div className="flex h-48 items-center justify-center rounded-card border border-outline-subtle bg-panel-muted px-4 typo-body-sm text-fg-muted">
						{emptyStateMessage}
					</div>
				)}
			</div>

			<CampaignTableStatusDialog
				statusDialogState={statusDialogState}
				actions={statusDialogActions}
			/>
			<CampaignCreateDialog
				createDialogState={createDialogState}
				actions={createDialogActions}
			/>
		</section>
	);
}
