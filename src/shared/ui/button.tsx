import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";

import { cn } from "@/shared/lib/utils";

const buttonVariants = cva(
	"group/button inline-flex shrink-0 cursor-pointer items-center justify-center border text-sm whitespace-nowrap outline-none transition-colors duration-[var(--duration-fast)] ease-standard select-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none active:not-aria-[haspopup]:translate-y-px disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-(--interactive-disabled-opacity) [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
	{
		variants: {
			variant: {
				default:
					"border-transparent bg-primary text-primary-fg hover:bg-primary-hover",
				outline: "border-outline bg-panel text-fg hover:bg-hover-surface",
				secondary:
					"border-transparent bg-secondary text-secondary-fg hover:bg-secondary-hover",
				ghost:
					"border-transparent bg-transparent text-fg-muted hover:bg-ghost-hover hover:text-fg",
				destructive:
					"border-status-danger-border bg-status-danger text-status-danger-fg hover:bg-[color-mix(in_srgb,var(--status-danger-bg)_70%,var(--status-danger-border))]",
				link: "border-transparent px-0 text-fg-brand underline-offset-4 hover:underline",
			},
			size: {
				default:
					"h-control-md gap-1.5 rounded-control px-3 text-label-md has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
				xs: "h-7 gap-1 rounded-sm px-2 text-caption has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
				sm: "h-control-sm gap-1 rounded-control px-2.5 text-label-md has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
				lg: "h-control-lg gap-1.5 rounded-card px-4 text-label-lg has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
				icon: "size-control-md rounded-control",
				"icon-xs": "size-7 rounded-sm [&_svg:not([class*='size-'])]:size-3",
				"icon-sm": "size-control-sm rounded-control",
				"icon-lg": "size-control-lg rounded-card",
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
