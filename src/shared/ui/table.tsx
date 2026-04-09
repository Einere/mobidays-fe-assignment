import type * as React from "react";

import { cn } from "@/shared/lib/utils";

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
	className?: string;
	tableClassName?: string;
};

function DataTable<T extends DataTableRow>({
	caption,
	columns,
	rows,
	className,
	tableClassName,
}: DataTableProps<T>) {
	return (
		<div
			className={cn(
				"overflow-x-auto overflow-y-hidden rounded-panel border border-outline-subtle bg-panel shadow-panel",
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
									"h-table-row px-4 text-left typo-label-md",
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
										"h-table-row px-4 align-middle text-fg",
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
		</div>
	);
}

export { DataTable };
