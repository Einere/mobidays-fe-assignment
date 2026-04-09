import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { useEffect, useMemo, useRef, useState } from "react";
import { useUpdateCampaignStatuses } from "@/entities/campaign/api/use-update-campaign-statuses";
import type { CampaignTableRow } from "@/entities/campaign/lib/build-campaign-table-rows";
import { buildCampaignTableRows } from "@/entities/campaign/lib/build-campaign-table-rows";
import {
	formatCampaignMetric,
	formatCampaignPeriod,
	formatCampaignStatusLabel,
} from "@/entities/campaign/lib/format-campaign-table";
import { getDashboardDataQueryOptions } from "@/entities/dashboard/api/use-dashboard-data";
import { globalFilterAtom } from "@/entities/global-filter/model/store";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { DataTable } from "@/shared/ui/table";
import { deriveCampaignTableView } from "@/widgets/campaign-table/model/derive-campaign-table-view";
import {
	type CampaignTableSortKey,
	useCampaignTableControls,
} from "@/widgets/campaign-table/model/use-campaign-table-controls";
import { CampaignTableMobileRow } from "@/widgets/campaign-table/ui/campaign-table-mobile-row";
import { CampaignTableStatusDialog } from "@/widgets/campaign-table/ui/campaign-table-status-dialog";
import { CampaignTableToolbar } from "@/widgets/campaign-table/ui/campaign-table-toolbar";

const pageSize = 10;

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

type CampaignTableSnapshot = {
	rows: ReturnType<typeof buildCampaignTableRows>;
};

type CampaignTableViewState =
	| {
			kind: "loading";
	  }
	| {
			kind: "full-error";
			errorMessage: string;
	  }
	| {
			kind: "table";
			rows: CampaignTableSnapshot["rows"];
			isSyncing: boolean;
			staleErrorMessage: string | null;
	  };

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

function resolveCampaignTableViewState({
	currentDataSnapshot,
	errorMessage,
	isLoadingError,
	isPending,
	isRefetchError,
	isRefetching,
}: {
	currentDataSnapshot: CampaignTableSnapshot | null;
	errorMessage: string | null;
	isLoadingError: boolean;
	isPending: boolean;
	isRefetchError: boolean;
	isRefetching: boolean;
}): CampaignTableViewState {
	if (currentDataSnapshot === null) {
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
		rows: currentDataSnapshot.rows,
		isSyncing: isRefetching,
		staleErrorMessage: isRefetchError
			? (errorMessage ?? "알 수 없는 오류가 발생했습니다.")
			: null,
	};
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

	useEffect(() => {
		if (
			typeof window === "undefined" ||
			typeof window.matchMedia !== "function"
		) {
			return;
		}

		const mediaQueryList = window.matchMedia("(max-width: 1023px)");
		const handleChange = (event: MediaQueryListEvent) => {
			setIsMobile(event.matches);
		};

		setIsMobile(mediaQueryList.matches);
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
	onClick,
}: {
	active: boolean;
	direction: "asc" | "desc" | null;
	label: string;
	onClick: () => void;
}) {
	return (
		<Button
			type="button"
			variant="ghost"
			size="sm"
			aria-label={`${label} 정렬`}
			className="-mx-2 h-auto px-2 py-1 text-label-md text-fg-muted hover:text-fg data-[active=true]:text-fg"
			data-active={active}
			onClick={onClick}
		>
			{label}
			<span aria-hidden="true" className="text-caption text-fg-subtle">
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
					<p className="text-body-sm text-fg-muted">
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
				<p className="text-body-sm text-fg-muted">
					전역 필터 기준으로 집계한 캠페인별 운영 성과입니다.
				</p>
				<div className="rounded-card border border-status-danger-border bg-status-danger/30 px-4 py-5 text-body-sm text-status-danger-fg">
					<p>캠페인 데이터를 불러오지 못했습니다.</p>
					<p className="mt-1 text-caption">{errorMessage}</p>
				</div>
			</div>
		</section>
	);
}

export function CampaignTableCard() {
	const filter = useAtomValue(globalFilterAtom);
	const controls = useCampaignTableControls();
	const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
	const [statusUpdateErrorMessage, setStatusUpdateErrorMessage] = useState<
		string | null
	>(null);
	const selectAllCheckboxRef = useRef<HTMLInputElement>(null);
	const query = useQuery({
		...getDashboardDataQueryOptions(filter),
		placeholderData: keepPreviousData,
	});
	const updateCampaignStatusesMutation = useUpdateCampaignStatuses(filter);
	const isMobileTableView = useIsMobileTableView();
	const currentDataSnapshot =
		query.data === undefined
			? null
			: {
					rows: buildCampaignTableRows({
						campaigns: query.data.campaigns,
						dailyStats: query.data.dailyStats,
					}),
				};
	const viewState = resolveCampaignTableViewState({
		currentDataSnapshot,
		errorMessage: query.error?.message ?? null,
		isLoadingError: query.isLoadingError,
		isPending: query.isPending,
		isRefetchError: query.isRefetchError,
		isRefetching: query.isRefetching,
	});
	const canOpenStatusDialog =
		controls.selectedRowIds.length > 0 && controls.pendingStatus !== null;
	const pendingStatusLabel = formatCampaignStatusLabel(controls.pendingStatus);

	const tableView = useMemo(
		() =>
			viewState.kind !== "table"
				? null
				: deriveCampaignTableView({
						rows: viewState.rows,
						searchTerm: controls.searchTerm,
						page: controls.page,
						pageSize,
						sort: controls.sort,
					}),
		[controls.page, controls.searchTerm, controls.sort, viewState],
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
		if (selectAllCheckboxRef.current) {
			selectAllCheckboxRef.current.indeterminate = isPartiallySelected;
		}
	}, [isPartiallySelected]);

	useEffect(() => {
		if (tableView === null) {
			return;
		}

		const availableRowIds = new Set(
			viewState.kind === "table" ? viewState.rows.map((row) => row.id) : [],
		);
		const nextSelectedRowIds = controls.selectedRowIds.filter((rowId) =>
			availableRowIds.has(rowId),
		);

		if (nextSelectedRowIds.length !== controls.selectedRowIds.length) {
			controls.setSelectedRowIds(nextSelectedRowIds);
		}
	}, [controls, tableView, viewState]);

	async function handleConfirmStatusChange() {
		if (
			controls.pendingStatus === null ||
			controls.selectedRowIds.length === 0
		) {
			return;
		}

		setStatusUpdateErrorMessage(null);

		try {
			await updateCampaignStatusesMutation.mutateAsync({
				ids: controls.selectedRowIds,
				status: controls.pendingStatus,
			});
			setIsStatusDialogOpen(false);
			controls.setSelectedRowIds([]);
			controls.setPendingStatus(null);
		} catch (error) {
			setStatusUpdateErrorMessage(
				error instanceof Error
					? error.message
					: "알 수 없는 오류가 발생했습니다.",
			);
		}
	}

	if (viewState.kind === "loading") {
		return <CampaignTableLoadingState />;
	}

	if (viewState.kind === "full-error") {
		return <CampaignTableErrorState errorMessage={viewState.errorMessage} />;
	}

	if (tableView === null) {
		return <CampaignTableLoadingState />;
	}

	const tableRows = tableView.rows.map((row) => ({
		id: row.id,
		select: (
			<input
				aria-label={`${row.name} 선택`}
				checked={controls.selectedRowIds.includes(row.id)}
				className="size-4 rounded border border-outline accent-primary"
				type="checkbox"
				onChange={() => controls.toggleRowSelection(row.id)}
			/>
		),
		name: <span className="font-medium text-fg">{row.name}</span>,
		status: (
			<span
				className={cn(
					"inline-flex rounded-pill border px-2.5 py-1 text-caption",
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
		tableView.totalCount === 0
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
					pendingStatus={controls.pendingStatus}
					canApplyStatusChange={canOpenStatusDialog}
					onSearchTermChange={controls.setSearchTerm}
					onPendingStatusChange={(nextPendingStatus) => {
						setStatusUpdateErrorMessage(null);
						controls.setPendingStatus(nextPendingStatus);
					}}
					onOpenStatusDialog={() => {
						if (!canOpenStatusDialog) {
							return;
						}

						setStatusUpdateErrorMessage(null);
						setIsStatusDialogOpen(true);
					}}
				/>

				{viewState.staleErrorMessage ? (
					<div className="rounded-card border border-status-danger-border bg-status-danger/30 px-4 py-3 text-body-sm text-status-danger-fg">
						<p>
							최신 캠페인 데이터를 불러오지 못해 마지막 성공 결과를 표시
							중입니다.
						</p>
						<p className="mt-1 text-caption">{viewState.staleErrorMessage}</p>
					</div>
				) : null}

				{viewState.isSyncing ? (
					<p
						className="text-body-sm text-fg-muted"
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
												isPartiallySelected
													? "mixed"
													: areAllVisibleRowsSelected
											}
											aria-label="현재 페이지 캠페인 모두 선택"
											checked={areAllVisibleRowsSelected}
											className="size-4 rounded border border-outline accent-primary"
											type="checkbox"
											onChange={() =>
												controls.togglePageSelection(selectableRowIds)
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
					<div className="flex h-48 items-center justify-center rounded-card border border-outline-subtle bg-panel-muted px-4 text-body-sm text-fg-muted">
						{emptyStateMessage}
					</div>
				)}

				<div className="flex flex-col gap-3 text-body-sm text-fg-muted sm:flex-row sm:items-center sm:justify-between">
					<p>
						페이지 {tableView.page} / {tableView.totalPages}
					</p>
					<div className="flex gap-2">
						<Button
							type="button"
							size="sm"
							variant="outline"
							disabled={tableView.page <= 1}
							onClick={() => controls.setPage(tableView.page - 1)}
						>
							이전
						</Button>
						<Button
							type="button"
							size="sm"
							variant="outline"
							disabled={tableView.page >= tableView.totalPages}
							onClick={() => controls.setPage(tableView.page + 1)}
						>
							다음
						</Button>
					</div>
				</div>
			</div>

			<CampaignTableStatusDialog
				open={isStatusDialogOpen}
				selectedCount={controls.selectedRowIds.length}
				statusLabel={pendingStatusLabel}
				errorMessage={statusUpdateErrorMessage}
				isSubmitting={updateCampaignStatusesMutation.isPending}
				canConfirm={
					controls.selectedRowIds.length > 0 && controls.pendingStatus !== null
				}
				onOpenChange={(open) => {
					setIsStatusDialogOpen(open);

					if (!open) {
						setStatusUpdateErrorMessage(null);
					}
				}}
				onConfirm={handleConfirmStatusChange}
			/>
		</section>
	);
}
