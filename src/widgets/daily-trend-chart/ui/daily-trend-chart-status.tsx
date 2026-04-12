type DailyTrendChartStatusProps =
	| {
			kind: "loading";
	  }
	| {
			kind: "full-error";
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

export function DailyTrendChartStatus(props: DailyTrendChartStatusProps) {
	switch (props.kind) {
		case "loading":
			return (
				<div
					className="h-80 rounded-card border border-outline-subtle bg-panel-muted"
					data-testid="daily-trend-loading"
				/>
			);
		case "full-error":
			return (
				<div className="rounded-card border border-status-danger-border bg-status-danger/30 px-4 py-5 typo-body-sm text-status-danger-fg">
					<p>성과 데이터를 불러오지 못했습니다.</p>
				</div>
			);
		case "empty-campaigns":
		case "empty-data":
			return (
				<div className="flex h-80 items-center justify-center rounded-card border border-outline-subtle bg-panel-muted px-4 typo-body-sm text-fg-muted">
					{props.message}
				</div>
			);
		case "stale":
			return (
				<div className="rounded-card border border-status-danger-border bg-status-danger/30 px-4 py-3 typo-body-sm text-status-danger-fg">
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

export type { DailyTrendChartStatusProps };
