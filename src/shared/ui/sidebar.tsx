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
				"rounded-[var(--panel-radius)] border border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] p-[var(--layout-panel-padding)] shadow-[var(--panel-shadow)]",
				className,
			)}
		>
			<div className="mb-5">
				<p className="text-[length:var(--type-caption-size)] font-[var(--type-caption-weight)] tracking-[0.08em] text-[var(--text-tertiary)] uppercase">
					Workspace
				</p>
				<h2 className="mt-2 text-[length:var(--type-title-size)] leading-[var(--type-title-line-height)] font-[var(--type-title-weight)]">
					{title}
				</h2>
			</div>
			<nav aria-label={title}>
				<ul className="flex list-none flex-col gap-1 p-0">
					{items.map((item) => (
						<li key={item.id}>
							<a
								href={item.href ?? "#"}
								className={cn(
									"flex min-h-[var(--control-height-md)] items-center justify-between rounded-[var(--radius-md)] px-3 text-[length:var(--type-label-md-size)] font-[var(--type-label-md-weight)] transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)]",
									item.active
										? "bg-[var(--interactive-selected-bg)] text-[var(--interactive-selected-fg)]"
										: "text-[var(--text-secondary)] hover:bg-[var(--interactive-ghost-bg-hover)] hover:text-[var(--text-primary)]",
								)}
								aria-current={item.active ? "page" : undefined}
							>
								<span>{item.label}</span>
								{item.meta ? (
									<span className="text-[length:var(--type-caption-size)] text-[var(--text-tertiary)]">
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
