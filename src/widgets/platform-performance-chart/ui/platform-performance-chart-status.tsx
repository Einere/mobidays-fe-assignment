type PlatformPerformanceChartStatusProps =
	| {
			kind: "loading";
	  }
	| {
			kind: "full-error";
			errorMessage: string;
	  }
	| {
			kind: "empty-campaigns";
			message: string;
	  }
	| {
			kind: "empty-data";
			message: string;
	  }
	| {
			kind: "stale";
			message: string;
	  }
	| {
			kind: "syncing";
	  }
	| {
			kind: "none";
	  };

export function PlatformPerformanceChartStatus(
	props: PlatformPerformanceChartStatusProps,
) {
	switch (props.kind) {
		case "loading":
			return (
				<div
					className="rounded-card border border-outline-subtle bg-panel-muted"
					role="status"
					aria-live="polite"
					aria-busy="true"
					aria-label="성과 데이터를 불러오는 중"
				>
					<div className="h-80" data-testid="platform-performance-loading" />
				</div>
			);
		case "full-error":
			return (
				<div
					className="rounded-card border border-status-danger-border bg-status-danger/30 px-4 py-5 typo-body-sm text-status-danger-fg"
					role="alert"
				>
					<p>성과 데이터를 불러오지 못했습니다.</p>
					<p className="mt-1 text-fg-muted">{props.errorMessage}</p>
				</div>
			);
		case "empty-campaigns":
		case "empty-data":
			return (
				<div
					role="status"
					aria-label={props.message}
					className="rounded-card border border-outline-subtle bg-panel-muted px-4 py-8 text-center typo-body-sm text-fg-muted"
				>
					{props.message}
				</div>
			);
		case "stale":
			return (
				<div
					className="rounded-card border border-status-danger-border bg-status-danger/30 px-4 py-3 typo-body-sm text-status-danger-fg"
					role="alert"
				>
					<p>{props.message}</p>
				</div>
			);
		case "syncing":
			return (
				<p
					className="typo-body-sm text-fg-muted"
					role="status"
					aria-live="polite"
				>
					동기화 중
				</p>
			);
		case "none":
			return null;
	}
}

export type { PlatformPerformanceChartStatusProps };
