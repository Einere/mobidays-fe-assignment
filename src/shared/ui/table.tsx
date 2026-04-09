import type * as React from "react";

import { cn } from "@/shared/lib/utils";
import { DataDenseScrollArea } from "@/shared/ui/data-dense-scroll-area";

type DataTableColumn<T extends Record<string, React.ReactNode>> = {
	key: keyof T;
	header: React.ReactNode;
	align?: "left" | "right";
};

type DataTableRow = Record<string, React.ReactNode> & {
	id: string;
};

type DataTableProps<T extends DataTableRow> = {
	caption: string;
	columns: DataTableColumn<T>[];
	rows: T[];
	density?: "default" | "compact";
	mobileScrollHint?: string;
	className?: string;
	tableClassName?: string;
};

function DataTable<T extends DataTableRow>({
	caption,
	columns,
	rows,
	density = "default",
	mobileScrollHint,
	className,
	tableClassName,
}: DataTableProps<T>) {
	const headerCellClassName =
		density === "compact"
			? "h-table-row-compact px-3 sm:h-table-row sm:px-4 text-left typo-caption sm:typo-label-md"
			: "h-table-row px-4 text-left typo-label-md";
	const bodyCellClassName =
		density === "compact"
			? "h-table-row-compact px-3 sm:h-table-row sm:px-4 align-middle text-fg"
			: "h-table-row px-4 align-middle text-fg";

	return (
		<DataDenseScrollArea
			hint={mobileScrollHint ?? "좌우로 스크롤해 더 많은 데이터를 확인하세요."}
			className={cn(
				"rounded-panel border border-outline-subtle bg-panel shadow-panel",
				className,
			)}
		>
			<table
				aria-label={caption}
				className={cn(
					"w-full border-collapse typo-table-sm text-fg",
					tableClassName,
				)}
			>
				<caption className="sr-only">{caption}</caption>
				<thead className="bg-panel-muted text-fg-muted">
					<tr>
						{columns.map((column) => (
							<th
								key={String(column.key)}
								className={cn(
									headerCellClassName,
									column.align === "right" && "text-right",
								)}
								scope="col"
							>
								{column.header}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{rows.map((row, rowIndex) => (
						<tr
							key={row.id}
							className={cn(
								"border-t border-outline-subtle",
								rowIndex > 0 && "hover:bg-hover-surface",
							)}
						>
							{columns.map((column) => (
								<td
									key={String(column.key)}
									className={cn(
										bodyCellClassName,
										column.align === "right" && "text-right",
									)}
								>
									{row[column.key]}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</DataDenseScrollArea>
	);
}

export { DataTable };
