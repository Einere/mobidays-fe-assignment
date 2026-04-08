import type * as React from "react";

import { cn } from "@/shared/lib/utils";

type SidebarNavItem = {
	id: string;
	label: string;
	href?: string;
	active?: boolean;
	meta?: React.ReactNode;
};

type SidebarNavProps = {
	title: string;
	items: SidebarNavItem[];
	className?: string;
};

function SidebarNav({ title, items, className }: SidebarNavProps) {
	return (
		<aside
			className={cn(
				"rounded-panel border border-outline-subtle bg-panel p-panel shadow-panel",
				className,
			)}
		>
			<div className="mb-5">
				<p className="text-caption tracking-[0.08em] text-fg-subtle uppercase">
					Workspace
				</p>
				<h2 className="mt-2 text-title">{title}</h2>
			</div>
			<nav aria-label={title}>
				<ul className="flex list-none flex-col gap-1 p-0">
					{items.map((item) => (
						<li key={item.id}>
							<a
								href={item.href ?? "#"}
								className={cn(
									"flex min-h-control-md items-center justify-between rounded-md px-3 text-label-md transition-colors duration-[var(--duration-fast)] ease-standard",
									item.active
										? "bg-selected text-selected-fg"
										: "text-fg-muted hover:bg-ghost-hover hover:text-fg",
								)}
								aria-current={item.active ? "page" : undefined}
							>
								<span>{item.label}</span>
								{item.meta ? (
									<span className="text-caption text-fg-subtle">
										{item.meta}
									</span>
								) : null}
							</a>
						</li>
					))}
				</ul>
			</nav>
		</aside>
	);
}

export { SidebarNav };
