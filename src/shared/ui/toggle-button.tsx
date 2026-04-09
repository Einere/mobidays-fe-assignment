import type * as React from "react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

type ToggleButtonProps = Omit<
	React.ComponentProps<typeof Button>,
	"variant"
> & {
	pressed?: boolean;
};

export function ToggleButton({
	className,
	pressed = false,
	size = "sm",
	...props
}: ToggleButtonProps) {
	return (
		<Button
			variant="outline"
			size={size}
			aria-pressed={pressed}
			className={cn(
				"border-outline",
				pressed &&
					"border-brand bg-selected text-selected-fg hover:border-brand-strong hover:bg-selected-hover",
				className,
			)}
			{...props}
		/>
	);
}
