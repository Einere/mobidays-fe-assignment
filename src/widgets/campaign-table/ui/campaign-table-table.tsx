import { useEffect, useMemo, useRef } from "react";
import type { CampaignTableRow } from "@/entities/campaign/lib/build-campaign-table-rows";
import {
	formatCampaignMetric,
	formatCampaignPeriod,
	formatCampaignStatusLabel,
} from "@/entities/campaign/lib/format-campaign-table";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { DataTable } from "@/shared/ui/table";
import type {
	CampaignTableSortKey,
	CampaignTableSortState,
} from "@/widgets/campaign-table/model/campaign-table-sort";
import type { CampaignTableView } from "@/widgets/campaign-table/model/derive-campaign-table-view";

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

interface CampaignTableTableProps {
	tableState: {
		tableView: CampaignTableView;
		selectedRowIds: string[];
		areAllVisibleRowsSelected: boolean;
		isPartiallySelected: boolean;
		isInteractionDisabled: boolean;
		sort: CampaignTableSortState | null;
	};
	actions: {
		onToggleSort: (key: CampaignTableSortKey) => void;
		onToggleRowSelection: (rowId: string) => void;
		onTogglePageSelection: (pageRowIds: string[]) => void;
		onSetPage: (page: number) => void;
	};
}
/*TODO: table 이 중복되는 네이밍이 어색하다. CampaignTable 로 바꾸자. */
export function CampaignTableTable({
	tableState,
	actions,
}: CampaignTableTableProps) {
	const {
		tableView,
		selectedRowIds,
		areAllVisibleRowsSelected,
		isPartiallySelected,
		isInteractionDisabled,
		sort,
	} = tableState;
	const {
		onToggleSort,
		onToggleRowSelection,
		onTogglePageSelection,
		onSetPage,
	} = actions;
	const selectAllCheckboxRef = useRef<HTMLInputElement>(null);
	const selectedRowIdSet = useMemo(
		() => new Set(selectedRowIds),
		[selectedRowIds],
	);

	useEffect(() => {
		if (selectAllCheckboxRef.current) {
			selectAllCheckboxRef.current.indeterminate = isPartiallySelected;
		}
	}, [isPartiallySelected]);

	const selectableRowIds = tableView.rows.map((row) => row.id);
	const tableRows = tableView.rows.map((row) => ({
		id: row.id,
		select: (
			<input
				aria-label={`${row.name} 선택`}
				checked={selectedRowIdSet.has(row.id)}
				className="size-4 rounded border border-outline accent-primary"
				disabled={isInteractionDisabled}
				type="checkbox"
				onChange={() => onToggleRowSelection(row.id)}
			/>
		),
		name: <span className="font-medium text-fg">{row.name}</span>,
		status: (
			<span
				className={cn(
					"inline-flex whitespace-nowrap rounded-pill border px-2 py-0.5 typo-caption lg:px-2.5 lg:py-1",
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

	return (
		<>
			<DataTable
				caption="캠페인 현황 표"
				className="-mx-2 sm:mx-0"
				density="compact"
				mobileScrollHint="좌우로 스크롤해 표 전체를 확인하세요."
				tableClassName="min-w-[940px] lg:min-w-0"
				columns={[
					{
						key: "select",
						header: (
							<input
								ref={selectAllCheckboxRef}
								aria-checked={
									isPartiallySelected ? "mixed" : areAllVisibleRowsSelected
								}
								aria-label="현재 페이지 캠페인 모두 선택"
								checked={areAllVisibleRowsSelected}
								className="size-4 rounded border border-outline accent-primary"
								disabled={isInteractionDisabled}
								type="checkbox"
								onChange={() => onTogglePageSelection(selectableRowIds)}
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
								active={sort?.key === "period"}
								disabled={isInteractionDisabled}
								direction={sort?.key === "period" ? sort.direction : null}
								label={sortLabels.period}
								onClick={() => onToggleSort("period")}
							/>
						),
					},
					{
						key: "cost",
						header: (
							<SortableColumnHeader
								active={sort?.key === "cost"}
								disabled={isInteractionDisabled}
								direction={sort?.key === "cost" ? sort.direction : null}
								label={sortLabels.cost}
								onClick={() => onToggleSort("cost")}
							/>
						),
						align: "right",
					},
					{
						key: "ctr",
						header: (
							<SortableColumnHeader
								active={sort?.key === "ctr"}
								disabled={isInteractionDisabled}
								direction={sort?.key === "ctr" ? sort.direction : null}
								label={sortLabels.ctr}
								onClick={() => onToggleSort("ctr")}
							/>
						),
						align: "right",
					},
					{
						key: "cpc",
						header: (
							<SortableColumnHeader
								active={sort?.key === "cpc"}
								disabled={isInteractionDisabled}
								direction={sort?.key === "cpc" ? sort.direction : null}
								label={sortLabels.cpc}
								onClick={() => onToggleSort("cpc")}
							/>
						),
						align: "right",
					},
					{
						key: "roas",
						header: (
							<SortableColumnHeader
								active={sort?.key === "roas"}
								disabled={isInteractionDisabled}
								direction={sort?.key === "roas" ? sort.direction : null}
								label={sortLabels.roas}
								onClick={() => onToggleSort("roas")}
							/>
						),
						align: "right",
					},
				]}
				rows={tableRows}
			/>

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
						onClick={() => onSetPage(tableView.page - 1)}
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
						onClick={() => onSetPage(tableView.page + 1)}
					>
						다음
					</Button>
				</div>
			</div>
		</>
	);
}
