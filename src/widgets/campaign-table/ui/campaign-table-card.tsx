import { useAtomValue } from "jotai";
import { useMemo } from "react";
import { globalFilterAtom } from "@/entities/global-filter/model/store";
import { useCampaignStatusBulkAction } from "@/widgets/campaign-table/model/use-campaign-status-bulk-action";
import { useCampaignTableControls } from "@/widgets/campaign-table/model/use-campaign-table-controls";
import { useCampaignTableData } from "@/widgets/campaign-table/model/use-campaign-table-data";
import { useCampaignTableSelection } from "@/widgets/campaign-table/model/use-campaign-table-selection";
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
	const filter = useAtomValue(globalFilterAtom);
	const controls = useCampaignTableControls();
	const tableData = useCampaignTableData(filter, controls);
	const visibleRowIds = tableData.tableView?.rows.map((row) => row.id) ?? [];
	const selectionResetKey = useMemo(
		() =>
			JSON.stringify({
				filter,
				page: controls.page,
				searchTerm: controls.searchTerm,
				sort: controls.sort,
			}),
		[controls.page, controls.searchTerm, controls.sort, filter],
	);
	const selection = useCampaignTableSelection({
		resetKey: selectionResetKey,
		visibleRowIds,
	});
	const bulkAction = useCampaignStatusBulkAction({
		selectedRowIds: selection.selectedRowIds,
		isInteractionBlocked: tableData.isShowingPlaceholderData,
		onClearSelection: selection.clearSelection,
	});
	const isInteractionDisabled =
		tableData.isShowingPlaceholderData || bulkAction.isSubmitting;

	if (tableData.viewState.kind === "loading") {
		return <CampaignTableLoadingState />;
	}

	if (tableData.viewState.kind === "full-error") {
		return <CampaignTableErrorState />;
	}

	if (tableData.tableView === null) {
		return <CampaignTableLoadingState />;
	}

	const tableView = tableData.tableView;
	const emptyStateMessage =
		tableView.totalCount === 0
			? "조건에 맞는 캠페인이 없습니다."
			: "검색 결과가 없습니다.";

	return (
		<section className="rounded-panel border border-outline-subtle bg-panel p-panel shadow-panel">
			<div className="flex flex-col gap-5">
				<CampaignTableToolbar
					searchInput={controls.searchInput}
					filteredCount={tableView.filteredCount}
					totalCount={tableView.totalCount}
					selectedCount={selection.selectedCount}
					pendingStatus={bulkAction.pendingStatus}
					disabled={isInteractionDisabled}
					canApplyStatusChange={bulkAction.canOpenDialog}
					onSearchInputChange={controls.setSearchInput}
					onPendingStatusChange={bulkAction.setPendingStatus}
					onOpenStatusDialog={bulkAction.openDialog}
				/>

				{tableData.viewState.staleErrorMessage ? (
					<div className="rounded-card border border-status-danger-border bg-status-danger/30 px-4 py-3 typo-body-sm text-status-danger-fg">
						<p>
							최신 캠페인 데이터를 불러오지 못해 마지막 성공 결과를 표시
							중입니다.
						</p>
					</div>
				) : null}

				{tableData.viewState.isSyncing ? (
					<p
						className="typo-body-sm text-fg-muted"
						role="status"
						aria-live="polite"
					>
						동기화 중
					</p>
				) : null}

				{tableView.rows.length > 0 ? (
					<CampaignTableTable
						tableView={tableView}
						selectedRowIds={selection.selectedRowIds}
						areAllVisibleRowsSelected={selection.areAllVisibleRowsSelected}
						isPartiallySelected={selection.isPartiallySelected}
						isInteractionDisabled={isInteractionDisabled}
						sort={controls.sort}
						onToggleSort={controls.toggleSort}
						onToggleRowSelection={selection.toggleRowSelection}
						onTogglePageSelection={selection.togglePageSelection}
						onSetPage={controls.setPage}
					/>
				) : (
					<div className="flex h-48 items-center justify-center rounded-card border border-outline-subtle bg-panel-muted px-4 typo-body-sm text-fg-muted">
						{emptyStateMessage}
					</div>
				)}
			</div>

			<CampaignTableStatusDialog
				open={bulkAction.isDialogOpen}
				selectedCount={selection.selectedCount}
				statusLabel={bulkAction.pendingStatusLabel}
				errorMessage={bulkAction.errorMessage}
				isSubmitting={bulkAction.isSubmitting}
				canConfirm={bulkAction.canConfirm}
				onOpenChange={bulkAction.setDialogOpen}
				onConfirm={bulkAction.confirm}
			/>
		</section>
	);
}
