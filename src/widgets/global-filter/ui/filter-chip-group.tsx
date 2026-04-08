import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

export interface FilterOption<T extends string> {
	label: string;
	value: T;
}

interface FilterChipGroupProps<T extends string> {
	groupLabel: string;
	onSelectAll: () => void;
	onToggleValue: (value: T) => void;
	options: FilterOption<T>[];
	selectedValues: T[];
}

export function FilterChipGroup<T extends string>({
	groupLabel,
	onSelectAll,
	onToggleValue,
	options,
	selectedValues,
}: FilterChipGroupProps<T>) {
	const isAllSelected =
		selectedValues.length === options.length &&
		options.every((option) => selectedValues.includes(option.value));

	return (
		<fieldset aria-label={`${groupLabel} 필터`} className="flex flex-col">
			<legend className="mb-2 text-form-label text-fg">{groupLabel}</legend>
			<div className="flex flex-wrap gap-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					aria-pressed={isAllSelected}
					className={cn(
						"border-outline",
						isAllSelected &&
							"border-brand bg-selected text-selected-fg hover:border-brand-strong hover:bg-selected-hover",
					)}
					onClick={onSelectAll}
				>
					전체
				</Button>
				{options.map((option) => {
					const isSelected = selectedValues.includes(option.value);

					return (
						<Button
							key={option.value}
							type="button"
							variant="outline"
							size="sm"
							aria-pressed={isSelected}
							className={cn(
								"border-outline",
								isSelected &&
									"border-brand bg-selected text-selected-fg hover:border-brand-strong hover:bg-selected-hover",
							)}
							onClick={() => onToggleValue(option.value)}
						>
							{option.label}
						</Button>
					);
				})}
			</div>
		</fieldset>
	);
}
