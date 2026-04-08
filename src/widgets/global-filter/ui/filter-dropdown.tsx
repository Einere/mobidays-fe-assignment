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
					<span className="flex items-center gap-2 text-[var(--text-secondary)]">
						<span className="text-[length:var(--type-caption-size)] font-[var(--type-caption-weight)]">
							{selectedCount}/{options.length}
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
					className="z-[var(--z-dropdown)] w-[min(18rem,calc(100vw-2rem))] rounded-[var(--panel-radius)] border border-[var(--panel-border)] bg-[var(--panel-bg)] p-3 shadow-[var(--shadow-md)]"
				>
					<div className="flex flex-col gap-2">
						<button
							type="button"
							aria-pressed={isAllSelected}
							className={cn(
								"flex items-center justify-between rounded-[var(--radius-md)] px-3 py-2 text-left text-[length:var(--type-body-sm-size)] text-[var(--text-primary)] outline-none transition-colors hover:bg-[var(--surface-hover)] focus-visible:ring-2 focus-visible:ring-[var(--interactive-focus-ring)]",
								isAllSelected &&
									"bg-[var(--interactive-selected-bg)] text-[var(--interactive-selected-fg)]",
							)}
							onClick={onSelectAll}
						>
							<span className="font-[var(--type-label-md-weight)]">전체</span>
							{isAllSelected ? <Check className="size-4" /> : null}
						</button>
						<div className="h-px bg-[var(--border-subtle)]" />
						{options.map((option) => {
							const isSelected = selectedValues.includes(option.value);

							return (
								<button
									key={option.value}
									type="button"
									aria-pressed={isSelected}
									className={cn(
										"flex items-center justify-between rounded-[var(--radius-md)] px-3 py-2 text-[length:var(--type-body-sm-size)] text-[var(--text-primary)] outline-none transition-colors hover:bg-[var(--surface-hover)] focus-visible:ring-2 focus-visible:ring-[var(--interactive-focus-ring)]",
										isSelected &&
											"bg-[var(--interactive-selected-bg)] text-[var(--interactive-selected-fg)]",
									)}
									onClick={() => onToggleValue(option.value)}
								>
									<span>{option.label}</span>
									<span
										aria-hidden="true"
										className={cn(
											"flex size-4 items-center justify-center rounded-[4px] border border-[var(--border-default)] bg-[var(--surface-panel)]",
											isSelected &&
												"border-[var(--border-brand)] bg-[var(--interactive-selected-bg)]",
										)}
									>
										{isSelected ? (
											<Check className="size-3 text-[var(--interactive-selected-fg)]" />
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
