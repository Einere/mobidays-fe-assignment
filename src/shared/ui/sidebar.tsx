import * as Dialog from "@radix-ui/react-dialog";
import { Menu } from "lucide-react";
import type * as React from "react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

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

function SidebarNavList({
	title,
	items,
}: Pick<SidebarNavProps, "title" | "items">) {
	return (
		<>
			<div className="mb-5">
				<p className="typo-caption tracking-[0.08em] text-fg-subtle uppercase">
					Workspace
				</p>
				<h2 className="mt-2 typo-heading-md">{title}</h2>
			</div>
			<nav aria-label={title}>
				<ul className="flex list-none flex-col gap-1 p-0">
					{items.map((item) => (
						<li key={item.id}>
							<a
								href={item.href ?? "#"}
								className={cn(
									"flex min-h-control-md items-center justify-between rounded-md px-3 typo-label-md transition-colors duration-[var(--duration-fast)] ease-standard",
									item.active
										? "bg-selected text-selected-fg"
										: "text-fg-muted hover:bg-ghost-hover hover:text-fg",
								)}
								aria-current={item.active ? "page" : undefined}
							>
								<span>{item.label}</span>
								{item.meta ? (
									<span className="typo-caption text-fg-subtle">
										{item.meta}
									</span>
								) : null}
							</a>
						</li>
					))}
				</ul>
			</nav>
		</>
	);
}

function SidebarNav({ title, items, className }: SidebarNavProps) {
	return (
		<aside
			className={cn(
				"rounded-panel border border-outline-subtle bg-panel p-panel shadow-panel",
				className,
			)}
		>
			<SidebarNavList title={title} items={items} />
		</aside>
	);
}

function MobileSidebarNav({ title, items, className }: SidebarNavProps) {
	return (
		<Dialog.Root>
			<Dialog.Trigger asChild>
				<Button
					type="button"
					variant="outline"
					size="icon"
					className={cn("lg:hidden", className)}
					aria-label="메뉴 열기"
				>
					<Menu aria-hidden="true" />
				</Button>
			</Dialog.Trigger>
			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[1px]" />
				<Dialog.Content className="fixed inset-y-0 left-0 z-50 w-[min(88vw,22rem)] border-r border-outline-subtle bg-panel p-panel shadow-panel focus:outline-none">
					<Dialog.Title className="sr-only">{title} 메뉴</Dialog.Title>
					<SidebarNavList title={title} items={items} />
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}

export { MobileSidebarNav, SidebarNav };
