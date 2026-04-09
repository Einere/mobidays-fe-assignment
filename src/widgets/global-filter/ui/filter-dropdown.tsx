import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import type { FilterOption } from "@/widgets/global-filter/ui/filter-chip-group";

interface FilterDropdownProps<T extends string> {
	groupLabel: string;
	onSelectAll: () => void;
	onToggleValue: (value: T) => void;
	options: FilterOption<T>[];
	selectedValues: T[];
}

function formatSelectedSummary<T extends string>(
	options: FilterOption<T>[],
	selectedValues: T[],
) {
	if (selectedValues.length === options.length) {
		return `전체 ${options.length}`;
	}

	if (selectedValues.length === 0) {
		return "선택 없음";
	}

	const selectedLabels = options
		.filter((option) => selectedValues.includes(option.value))
		.map((option) => option.label);

	if (selectedLabels.length <= 2) {
		return selectedLabels.join(", ");
	}

	return `${selectedLabels[0]} 외 ${selectedLabels.length - 1}`;
}

export function FilterDropdown<T extends string>({
	groupLabel,
	onSelectAll,
	onToggleValue,
	options,
	selectedValues,
}: FilterDropdownProps<T>) {
	const selectedCount = selectedValues.length;
	const isAllSelected =
		selectedCount === options.length &&
		options.every((option) => selectedValues.includes(option.value));
	const selectedSummary = formatSelectedSummary(options, selectedValues);

	return (
		<Popover.Root>
			<Popover.Trigger asChild>
				<Button
					type="button"
					variant="outline"
					className="w-full justify-between"
					aria-label={`${groupLabel} 필터 열기`}
				>
					<span>{groupLabel}</span>
					<span className="flex items-center gap-2 text-fg-muted">
						<span className="max-w-[10rem] truncate typo-caption">
							{selectedSummary}
						</span>
						<ChevronDown className="size-4" />
					</span>
				</Button>
			</Popover.Trigger>
			<Popover.Portal>
				<Popover.Content
					align="start"
					sideOffset={8}
					aria-label={`${groupLabel} 필터`}
					className="z-(--z-dropdown) w-[min(18rem,calc(100vw-2rem))] rounded-panel border border-outline-subtle bg-panel p-3 shadow-popover"
				>
					<div className="flex flex-col gap-2">
						<button
							type="button"
							aria-pressed={isAllSelected}
							className={cn(
								"flex items-center justify-between rounded-md px-3 py-2 text-left typo-body-sm text-fg outline-none transition-colors hover:bg-hover-surface focus-visible:ring-2 focus-visible:ring-focus",
								isAllSelected && "bg-selected text-selected-fg",
							)}
							onClick={onSelectAll}
						>
							<span className="typo-label-md">전체</span>
							{isAllSelected ? <Check className="size-4" /> : null}
						</button>
						<div className="h-px bg-outline-subtle" />
						{options.map((option) => {
							const isSelected = selectedValues.includes(option.value);

							return (
								<button
									key={option.value}
									type="button"
									aria-pressed={isSelected}
									className={cn(
										"flex items-center justify-between rounded-md px-3 py-2 typo-body-sm text-fg outline-none transition-colors hover:bg-hover-surface focus-visible:ring-2 focus-visible:ring-focus",
										isSelected && "bg-selected text-selected-fg",
									)}
									onClick={() => onToggleValue(option.value)}
								>
									<span>{option.label}</span>
									<span
										aria-hidden="true"
										className={cn(
											"flex size-4 items-center justify-center rounded-[4px] border border-outline bg-panel",
											isSelected && "border-brand bg-selected",
										)}
									>
										{isSelected ? (
											<Check className="size-3 text-selected-fg" />
										) : null}
									</span>
								</button>
							);
						})}
					</div>
				</Popover.Content>
			</Popover.Portal>
		</Popover.Root>
	);
}
