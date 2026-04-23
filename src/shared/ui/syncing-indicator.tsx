import { LoaderCircle } from "lucide-react";
import { cn } from "@/shared/lib/utils";

type SyncingIndicatorProps = {
	className?: string;
	visible?: boolean;
};

export function SyncingIndicator({
	className,
	visible = false,
}: SyncingIndicatorProps) {
	return (
		<span
			className={cn(
				"inline-flex size-4 shrink-0 items-center justify-center text-fg-muted",
				className,
			)}
			aria-hidden="true"
		>
			{visible ? (
				<LoaderCircle className="size-4 animate-spin" strokeWidth={2} />
			) : null}
		</span>
	);
}

type SyncingStatusMessageProps = {
	message: string;
};

export function SyncingStatusMessage({ message }: SyncingStatusMessageProps) {
	return (
		<span role="status" aria-live="polite" className="sr-only">
			{message}
		</span>
	);
}
