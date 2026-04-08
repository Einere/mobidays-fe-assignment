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
				"flex h-[var(--control-height-md)] w-full cursor-text rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-panel)] px-3 text-[var(--text-primary)] shadow-none outline-none transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] placeholder:text-[var(--text-tertiary)] hover:border-[var(--border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--interactive-focus-ring)] aria-invalid:border-[var(--status-danger-border)] aria-invalid:bg-[var(--status-danger-bg)]/30 aria-invalid:text-[var(--status-danger-fg)] disabled:cursor-not-allowed disabled:opacity-[var(--interactive-disabled-opacity)]",
				className,
			)}
			{...props}
		/>
	);
}

export { TextInput };
