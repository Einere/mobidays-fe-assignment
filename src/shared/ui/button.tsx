import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";

import { cn } from "@/shared/lib/utils";

const buttonVariants = cva(
	"group/button inline-flex shrink-0 cursor-pointer items-center justify-center border text-sm whitespace-nowrap outline-none transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] select-none focus-visible:ring-2 focus-visible:ring-[var(--interactive-focus-ring)] focus-visible:outline-none active:not-aria-[haspopup]:translate-y-px disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-[var(--interactive-disabled-opacity)] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
	{
		variants: {
			variant: {
				default:
					"border-transparent bg-[var(--interactive-primary-bg)] text-[var(--interactive-primary-fg)] hover:bg-[var(--interactive-primary-bg-hover)]",
				outline:
					"border-[var(--border-default)] bg-[var(--surface-panel)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)]",
				secondary:
					"border-transparent bg-[var(--interactive-secondary-bg)] text-[var(--interactive-secondary-fg)] hover:bg-[var(--interactive-secondary-bg-hover)]",
				ghost:
					"border-transparent bg-transparent text-[var(--text-secondary)] hover:bg-[var(--interactive-ghost-bg-hover)] hover:text-[var(--text-primary)]",
				destructive:
					"border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] text-[var(--status-danger-fg)] hover:bg-[color-mix(in_srgb,var(--status-danger-bg)_70%,var(--status-danger-border))]",
				link: "border-transparent px-0 text-[var(--text-brand)] underline-offset-4 hover:underline",
			},
			size: {
				default:
					"h-[var(--button-height-md)] gap-1.5 rounded-[var(--button-radius)] px-3 text-[length:var(--type-label-md-size)] font-[var(--type-label-md-weight)] has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
				xs: "h-7 gap-1 rounded-[var(--radius-sm)] px-2 text-[length:var(--type-caption-size)] font-[var(--type-caption-weight)] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
				sm: "h-[var(--button-height-sm)] gap-1 rounded-[var(--button-radius)] px-2.5 text-[length:var(--type-label-md-size)] font-[var(--type-label-md-weight)] has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
				lg: "h-[var(--button-height-lg)] gap-1.5 rounded-[var(--radius-lg)] px-4 text-[length:var(--type-label-lg-size)] font-[var(--type-label-lg-weight)] has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
				icon: "size-[var(--button-height-md)] rounded-[var(--button-radius)]",
				"icon-xs":
					"size-7 rounded-[var(--radius-sm)] [&_svg:not([class*='size-'])]:size-3",
				"icon-sm":
					"size-[var(--button-height-sm)] rounded-[var(--button-radius)]",
				"icon-lg": "size-[var(--button-height-lg)] rounded-[var(--radius-lg)]",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

function Button({
	className,
	variant = "default",
	size = "default",
	asChild = false,
	...props
}: React.ComponentProps<"button"> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
	}) {
	const Comp = asChild ? Slot.Root : "button";

	return (
		<Comp
			data-slot="button"
			data-variant={variant}
			data-size={size}
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	);
}

export { Button, buttonVariants };
