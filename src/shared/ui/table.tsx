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
};

function DataTable<T extends DataTableRow>({
	caption,
	columns,
	rows,
	className,
}: DataTableProps<T>) {
	return (
		<div
			className={cn(
				"overflow-hidden rounded-[var(--panel-radius)] border border-[var(--table-border)] bg-[var(--table-bg)] shadow-[var(--panel-shadow)]",
				className,
			)}
		>
			<table
				aria-label={caption}
				className="w-full border-collapse text-[length:var(--type-table-sm-size)] font-[var(--type-table-sm-weight)] text-[var(--table-text)]"
			>
				<caption className="sr-only">{caption}</caption>
				<thead className="bg-[var(--table-header-bg)] text-[var(--table-muted-text)]">
					<tr>
						{columns.map((column) => (
							<th
								key={String(column.key)}
								className={cn(
									"h-[var(--layout-table-row-height)] px-4 text-left font-[var(--type-label-md-weight)]",
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
								"border-t border-[var(--table-border)]",
								rowIndex > 0 && "hover:bg-[var(--table-row-hover-bg)]",
							)}
						>
							{columns.map((column) => (
								<td
									key={String(column.key)}
									className={cn(
										"h-[var(--layout-table-row-height)] px-4 align-middle text-[var(--table-text)]",
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
