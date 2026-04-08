import { useEffect, useMemo, useRef } from "react";
import { DataTable } from "@/shared/ui/table";
import type { CampaignTableControls } from "@/widgets/campaign-table/model/use-campaign-table-controls";

const placeholderCampaignRows = [
	{
		id: "campaign-1",
		name: "브랜드 검색",
		statusLabel: "운영 중",
		statusClassName:
			"border-[var(--status-success-border)] bg-[var(--status-success-bg)] text-[var(--status-success-fg)]",
		budget: "68%",
		cpa: "₩18,240",
	},
	{
		id: "campaign-2",
		name: "리타겟팅 세트",
		statusLabel: "검토 필요",
		statusClassName:
			"border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] text-[var(--status-warning-fg)]",
		budget: "83%",
		cpa: "₩24,900",
	},
	{
		id: "campaign-3",
		name: "앱 설치 프로모션",
		statusLabel: "예산 초과",
		statusClassName:
			"border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] text-[var(--status-danger-fg)]",
		budget: "112%",
		cpa: "₩31,400",
	},
] as const;

export function CampaignTablePlaceholder({
	controls,
}: {
	controls: CampaignTableControls;
}) {
	const selectAllCheckboxRef = useRef<HTMLInputElement>(null);
	const allPlaceholderRowIds = useMemo(
		() => placeholderCampaignRows.map((row) => row.id),
		[],
	);
	const selectedPlaceholderRowIds = useMemo(
		() =>
			allPlaceholderRowIds.filter((rowId) =>
				controls.selectedRowIds.includes(rowId),
			),
		[allPlaceholderRowIds, controls.selectedRowIds],
	);
	const areAllRowsSelected =
		allPlaceholderRowIds.length > 0 &&
		selectedPlaceholderRowIds.length === allPlaceholderRowIds.length;
	const isPartiallySelected =
		selectedPlaceholderRowIds.length > 0 && !areAllRowsSelected;

	useEffect(() => {
		if (!selectAllCheckboxRef.current) {
			return;
		}

		selectAllCheckboxRef.current.indeterminate = isPartiallySelected;
	}, [isPartiallySelected]);

	const tableRows = placeholderCampaignRows.map((row) => ({
		id: row.id,
		select: (
			<input
				aria-label={`${row.name} 선택`}
				checked={controls.selectedRowIds.includes(row.id)}
				className="size-4 rounded border border-[var(--border-default)] accent-[var(--interactive-primary-bg)]"
				type="checkbox"
				onChange={() => controls.toggleRowSelection(row.id)}
			/>
		),
		name: row.name,
		status: (
			<span
				className={`rounded-[var(--radius-full)] border px-2.5 py-1 ${row.statusClassName}`}
			>
				{row.statusLabel}
			</span>
		),
		budget: row.budget,
		cpa: row.cpa,
	}));

	return (
		<DataTable
			caption="캠페인 상태 표"
			columns={[
				{
					key: "select",
					header: (
						<input
							ref={selectAllCheckboxRef}
							aria-checked={isPartiallySelected ? "mixed" : areAllRowsSelected}
							aria-label="모든 캠페인 선택"
							checked={areAllRowsSelected}
							className="size-4 rounded border border-[var(--border-default)] accent-[var(--interactive-primary-bg)]"
							type="checkbox"
							onChange={() =>
								controls.setSelectedRowIds(
									areAllRowsSelected ? [] : [...allPlaceholderRowIds],
								)
							}
						/>
					),
				},
				{ key: "name", header: "캠페인" },
				{ key: "status", header: "상태" },
				{ key: "budget", header: "예산 소진율", align: "right" },
				{ key: "cpa", header: "CPA", align: "right" },
			]}
			rows={tableRows}
		/>
	);
}
