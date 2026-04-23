import { LoaderCircle } from "lucide-react";
import { cn } from "@/shared/lib/utils";

type SyncingIndicatorProps = {
	className?: string;
	label?: string;
};

export function SyncingIndicator({
	className,
	label = "동기화 중",
}: SyncingIndicatorProps) {
	return (
		<span
			className={cn(
				"inline-flex shrink-0 items-center justify-center text-fg-muted",
				className,
			)}
			role="status"
			aria-label={label}
			aria-live="polite"
		>
			<LoaderCircle
				aria-hidden="true"
				className="size-4 animate-spin"
				strokeWidth={2}
			/>
			<span className="sr-only">{label}</span>
		</span>
	);
}
