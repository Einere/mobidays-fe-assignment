import type * as React from "react";
import { cn } from "@/shared/lib/utils";

interface DataDenseScrollAreaProps {
	hint: string;
	children: React.ReactNode;
	className?: string;
	hintClassName?: string;
	viewportClassName?: string;
	viewportTestId?: string;
}

export function DataDenseScrollArea({
	hint,
	children,
	className,
	hintClassName,
	viewportClassName,
	viewportTestId = "data-dense-scroll-viewport",
}: DataDenseScrollAreaProps) {
	return (
		<div className={cn("flex flex-col gap-2", className)}>
			<p className={cn("typo-caption text-fg-subtle sm:hidden", hintClassName)}>
				{hint}
			</p>
			<div
				className={cn("overflow-x-auto overflow-y-hidden", viewportClassName)}
				data-testid={viewportTestId}
			>
				{children}
			</div>
		</div>
	);
}
