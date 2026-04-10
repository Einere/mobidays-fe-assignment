import { Toaster as Sonner, type ToasterProps } from "sonner";

const defaultToastClassNames = {
	toast:
		"rounded-card border border-outline-subtle bg-panel text-fg shadow-popover",
	title: "typo-label-lg",
	description: "typo-body-sm text-fg-muted",
	actionButton:
		"rounded-control bg-primary px-3 text-primary-fg hover:bg-primary-hover",
	cancelButton:
		"rounded-control bg-secondary px-3 text-secondary-fg hover:bg-secondary-hover",
};

export function Toaster({
	toastOptions,
	containerAriaLabel = "알림 영역",
	...props
}: ToasterProps) {
	return (
		<Sonner
			position="top-right"
			closeButton
			richColors
			containerAriaLabel={containerAriaLabel}
			toastOptions={{
				...toastOptions,
				classNames: {
					...defaultToastClassNames,
					...toastOptions?.classNames,
				},
			}}
			{...props}
		/>
	);
}
