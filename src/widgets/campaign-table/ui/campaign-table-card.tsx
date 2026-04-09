import { useAtomValue } from "jotai";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import type { CampaignTableRow } from "@/entities/campaign/lib/build-campaign-table-rows";
import {
	formatCampaignMetric,
	formatCampaignPeriod,
	formatCampaignStatusLabel,
} from "@/entities/campaign/lib/format-campaign-table";
import { globalFilterAtom } from "@/entities/global-filter/model/store";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { DataTable } from "@/shared/ui/table";
import type { CampaignTableSortKey } from "@/widgets/campaign-table/model/campaign-table-sort";
import { useCampaignStatusBulkAction } from "@/widgets/campaign-table/model/use-campaign-status-bulk-action";
import { useCampaignTableControls } from "@/widgets/campaign-table/model/use-campaign-table-controls";
import { useCampaignTableData } from "@/widgets/campaign-table/model/use-campaign-table-data";
import { CampaignTableMobileRow } from "@/widgets/campaign-table/ui/campaign-table-mobile-row";
import { CampaignTableStatusDialog } from "@/widgets/campaign-table/ui/campaign-table-status-dialog";
import { CampaignTableToolbar } from "@/widgets/campaign-table/ui/campaign-table-toolbar";

const sortLabels: Record<CampaignTableSortKey, string> = {
	period: "집행기간",
	cost: "총 집행금액",
	ctr: "CTR",
	cpc: "CPC",
	roas: "ROAS",
};

const statusToneClassNames = {
	active:
		"border-status-success-border bg-status-success text-status-success-fg",
	paused:
		"border-status-warning-border bg-status-warning text-status-warning-fg",
	ended: "border-outline bg-panel-muted text-fg-muted",
	unknown: "border-outline bg-panel-muted text-fg-muted",
} as const;

function getStatusToneClassName(status: CampaignTableRow["status"]) {
	switch (status) {
		case "active":
			return statusToneClassNames.active;
		case "paused":
			return statusToneClassNames.paused;
		case "ended":
			return statusToneClassNames.ended;
		default:
			return statusToneClassNames.unknown;
	}
}

function useIsMobileTableView() {
	const [isMobile, setIsMobile] = useState(() => {
		if (
			typeof window === "undefined" ||
			typeof window.matchMedia !== "function"
		) {
			return false;
		}

		return window.matchMedia("(max-width: 1023px)").matches;
	});
	const updateIsMobile = useEffectEvent((matches: boolean) => {
		setIsMobile(matches);
	});

	useEffect(() => {
		if (
			typeof window === "undefined" ||
			typeof window.matchMedia !== "function"
		) {
			return;
		}

		const mediaQueryList = window.matchMedia("(max-width: 1023px)");
		const handleChange = (event: MediaQueryListEvent) => {
			updateIsMobile(event.matches);
		};

		updateIsMobile(mediaQueryList.matches);
		mediaQueryList.addEventListener("change", handleChange);

		return () => {
			mediaQueryList.removeEventListener("change", handleChange);
		};
	}, []);

	return isMobile;
}

function SortableColumnHeader({
	active,
	direction,
	label,
	disabled,
	onClick,
}: {
	active: boolean;
	direction: "asc" | "desc" | null;
	label: string;
	disabled: boolean;
	onClick: () => void;
}) {
	return (
		<Button
			type="button"
			variant="ghost"
			size="sm"
			aria-label={`${label} 정렬`}
			className="-mx-2 h-auto px-2 py-1 typo-label-md text-fg-muted hover:text-fg data-[active=true]:text-fg"
			data-active={active}
			disabled={disabled}
			onClick={onClick}
		>
			{label}
			<span aria-hidden="true" className="typo-caption text-fg-subtle">
				{active ? (direction === "asc" ? "↑" : "↓") : "↕"}
			</span>
		</Button>
	);
}

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

function CampaignTableErrorState({ errorMessage }: { errorMessage: string }) {
	return (
		<section className="rounded-panel border border-outline-subtle bg-panel p-panel shadow-panel">
			<div className="flex flex-col gap-3">
				<h2>캠페인 현황</h2>
				<p className="typo-body-sm text-fg-muted">
					전역 필터 기준으로 집계한 캠페인별 운영 성과입니다.
				</p>
				<div className="rounded-card border border-status-danger-border bg-status-danger/30 px-4 py-5 typo-body-sm text-status-danger-fg">
					<p>캠페인 데이터를 불러오지 못했습니다.</p>
					<p className="mt-1 typo-caption">{errorMessage}</p>
				</div>
			</div>
		</section>
	);
}

export function CampaignTableCard() {
	const filter = useAtomValue(globalFilterAtom);
	const controls = useCampaignTableControls();
	const selectAllCheckboxRef = useRef<HTMLInputElement>(null);
	const isMobileTableView = useIsMobileTableView();
	const tableData = useCampaignTableData(filter, controls);
	const bulkAction = useCampaignStatusBulkAction({
		selectedRowIds: controls.selectedRowIds,
		isInteractionBlocked: tableData.isShowingPlaceholderData,
		onClearSelection: () => controls.setSelectedRowIds([]),
	});
	const isInteractionDisabled =
		tableData.isShowingPlaceholderData || bulkAction.isSubmitting;

	useEffect(() => {
		if (selectAllCheckboxRef.current) {
			selectAllCheckboxRef.current.indeterminate =
				tableData.isPartiallySelected;
		}
	}, [tableData.isPartiallySelected]);

	if (tableData.viewState.kind === "loading") {
		return <CampaignTableLoadingState />;
	}

	if (tableData.viewState.kind === "full-error") {
		return (
			<CampaignTableErrorState
				errorMessage={tableData.viewState.errorMessage}
			/>
		);
	}

	if (tableData.tableView === null) {
		return <CampaignTableLoadingState />;
	}

	const tableView = tableData.tableView;
	const tableRows = tableView.rows.map((row) => ({
		id: row.id,
		select: (
			<input
				aria-label={`${row.name} 선택`}
				checked={controls.selectedRowIds.includes(row.id)}
				className="size-4 rounded border border-outline accent-primary"
				disabled={isInteractionDisabled}
				type="checkbox"
				onChange={() => controls.toggleRowSelection(row.id)}
			/>
		),
		name: <span className="font-medium text-fg">{row.name}</span>,
		status: (
			<span
				className={cn(
					"inline-flex rounded-pill border px-2.5 py-1 typo-caption",
					getStatusToneClassName(row.status),
				)}
			>
				{formatCampaignStatusLabel(row.status)}
			</span>
		),
		platform: row.platform ?? "-",
		period: formatCampaignPeriod(row.startDate, row.endDate),
		cost: formatCampaignMetric(row.cost, "currency"),
		ctr: formatCampaignMetric(row.ctr, "percent"),
		cpc: formatCampaignMetric(row.cpc, "currency"),
		roas: formatCampaignMetric(row.roas, "percent"),
	}));
	const emptyStateMessage =
		tableData.tableView.totalCount === 0
			? "조건에 맞는 캠페인이 없습니다."
			: "검색 결과가 없습니다.";

	return (
		<section className="rounded-panel border border-outline-subtle bg-panel p-panel shadow-panel">
			<div className="flex flex-col gap-5">
				<CampaignTableToolbar
					searchTerm={controls.searchTerm}
					filteredCount={tableView.filteredCount}
					totalCount={tableView.totalCount}
					selectedCount={controls.selectedRowIds.length}
					pendingStatus={bulkAction.pendingStatus}
					disabled={isInteractionDisabled}
					canApplyStatusChange={bulkAction.canOpenDialog}
					onSearchTermChange={controls.setSearchTerm}
					onPendingStatusChange={bulkAction.setPendingStatus}
					onOpenStatusDialog={bulkAction.openDialog}
				/>

				{tableData.viewState.staleErrorMessage ? (
					<div className="rounded-card border border-status-danger-border bg-status-danger/30 px-4 py-3 typo-body-sm text-status-danger-fg">
						<p>
							최신 캠페인 데이터를 불러오지 못해 마지막 성공 결과를 표시
							중입니다.
						</p>
						<p className="mt-1 typo-caption">
							{tableData.viewState.staleErrorMessage}
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

				{tableRows.length > 0 ? (
					isMobileTableView ? (
						<div className="flex flex-col gap-3">
							{tableView.rows.map((row) => (
								<CampaignTableMobileRow
									key={row.id}
									row={row}
									selected={controls.selectedRowIds.includes(row.id)}
									disabled={isInteractionDisabled}
									statusToneClassName={getStatusToneClassName(row.status)}
									onToggleSelection={() => controls.toggleRowSelection(row.id)}
								/>
							))}
						</div>
					) : (
						<DataTable
							caption="캠페인 현황 표"
							columns={[
								{
									key: "select",
									header: (
										<input
											ref={selectAllCheckboxRef}
											aria-checked={
												tableData.isPartiallySelected
													? "mixed"
													: tableData.areAllVisibleRowsSelected
											}
											aria-label="현재 페이지 캠페인 모두 선택"
											checked={tableData.areAllVisibleRowsSelected}
											className="size-4 rounded border border-outline accent-primary"
											disabled={isInteractionDisabled}
											type="checkbox"
											onChange={() =>
												controls.togglePageSelection(tableData.selectableRowIds)
											}
										/>
									),
								},
								{ key: "name", header: "캠페인명" },
								{ key: "status", header: "상태" },
								{ key: "platform", header: "매체" },
								{
									key: "period",
									header: (
										<SortableColumnHeader
											active={controls.sort?.key === "period"}
											disabled={isInteractionDisabled}
											direction={
												controls.sort?.key === "period"
													? controls.sort.direction
													: null
											}
											label={sortLabels.period}
											onClick={() => controls.toggleSort("period")}
										/>
									),
								},
								{
									key: "cost",
									header: (
										<SortableColumnHeader
											active={controls.sort?.key === "cost"}
											disabled={isInteractionDisabled}
											direction={
												controls.sort?.key === "cost"
													? controls.sort.direction
													: null
											}
											label={sortLabels.cost}
											onClick={() => controls.toggleSort("cost")}
										/>
									),
									align: "right",
								},
								{
									key: "ctr",
									header: (
										<SortableColumnHeader
											active={controls.sort?.key === "ctr"}
											disabled={isInteractionDisabled}
											direction={
												controls.sort?.key === "ctr"
													? controls.sort.direction
													: null
											}
											label={sortLabels.ctr}
											onClick={() => controls.toggleSort("ctr")}
										/>
									),
									align: "right",
								},
								{
									key: "cpc",
									header: (
										<SortableColumnHeader
											active={controls.sort?.key === "cpc"}
											disabled={isInteractionDisabled}
											direction={
												controls.sort?.key === "cpc"
													? controls.sort.direction
													: null
											}
											label={sortLabels.cpc}
											onClick={() => controls.toggleSort("cpc")}
										/>
									),
									align: "right",
								},
								{
									key: "roas",
									header: (
										<SortableColumnHeader
											active={controls.sort?.key === "roas"}
											disabled={isInteractionDisabled}
											direction={
												controls.sort?.key === "roas"
													? controls.sort.direction
													: null
											}
											label={sortLabels.roas}
											onClick={() => controls.toggleSort("roas")}
										/>
									),
									align: "right",
								},
							]}
							rows={tableRows}
						/>
					)
				) : (
					<div className="flex h-48 items-center justify-center rounded-card border border-outline-subtle bg-panel-muted px-4 typo-body-sm text-fg-muted">
						{emptyStateMessage}
					</div>
				)}

				<div className="flex flex-col gap-3 typo-body-sm text-fg-muted sm:flex-row sm:items-center sm:justify-between">
					<p>
						페이지 {tableView.page} / {tableView.totalPages}
					</p>
					<div className="flex gap-2">
						<Button
							type="button"
							size="sm"
							variant="outline"
							disabled={isInteractionDisabled || tableView.page <= 1}
							onClick={() => controls.setPage(tableView.page - 1)}
						>
							이전
						</Button>
						<Button
							type="button"
							size="sm"
							variant="outline"
							disabled={
								isInteractionDisabled || tableView.page >= tableView.totalPages
							}
							onClick={() => controls.setPage(tableView.page + 1)}
						>
							다음
						</Button>
					</div>
				</div>
			</div>

			<CampaignTableStatusDialog
				open={bulkAction.isDialogOpen}
				selectedCount={controls.selectedRowIds.length}
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
