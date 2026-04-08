import type * as React from "react";

import { cn } from "@/shared/lib/utils";

function TextInput({
	className,
	type = "text",
	...props
}: React.ComponentProps<"input">) {
	return (
		<input
			type={type}
			className={cn(
				"flex h-control-md w-full cursor-text rounded-md border border-outline bg-panel px-3 text-body-md text-fg shadow-none outline-none transition-colors duration-[var(--duration-fast)] ease-standard placeholder:text-fg-subtle hover:border-outline-strong focus-visible:ring-2 focus-visible:ring-focus aria-invalid:border-status-danger-border aria-invalid:bg-status-danger/30 aria-invalid:text-status-danger-fg disabled:cursor-not-allowed disabled:opacity-(--interactive-disabled-opacity)",
				className,
			)}
			{...props}
		/>
	);
}

export { TextInput };
