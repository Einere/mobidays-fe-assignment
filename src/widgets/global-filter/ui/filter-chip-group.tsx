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
			<legend className="mb-2 text-[length:var(--type-form-label-size)] font-[var(--type-form-label-weight)] text-[var(--text-primary)]">
				{groupLabel}
			</legend>
			<div className="flex flex-wrap gap-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					aria-pressed={isAllSelected}
					className={cn(
						"border-[var(--border-default)]",
						isAllSelected &&
							"border-[var(--border-brand)] bg-[var(--interactive-selected-bg)] text-[var(--interactive-selected-fg)] hover:border-[var(--interactive-selected-border-hover)] hover:bg-[var(--interactive-selected-bg-hover)]",
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
								"border-[var(--border-default)]",
								isSelected &&
									"border-[var(--border-brand)] bg-[var(--interactive-selected-bg)] text-[var(--interactive-selected-fg)] hover:border-[var(--interactive-selected-border-hover)] hover:bg-[var(--interactive-selected-bg-hover)]",
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
