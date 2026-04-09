import { ToggleButton } from "@/shared/ui/toggle-button";

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
			<legend className="mb-2 typo-form-label text-fg">{groupLabel}</legend>
			<div className="flex flex-wrap gap-2">
				<ToggleButton
					type="button"
					pressed={isAllSelected}
					onClick={onSelectAll}
				>
					전체
				</ToggleButton>
				{options.map((option) => {
					const isSelected = selectedValues.includes(option.value);

					return (
						<ToggleButton
							key={option.value}
							type="button"
							pressed={isSelected}
							onClick={() => onToggleValue(option.value)}
						>
							{option.label}
						</ToggleButton>
					);
				})}
			</div>
		</fieldset>
	);
}
