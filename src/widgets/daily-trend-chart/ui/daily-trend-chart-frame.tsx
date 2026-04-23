import type { ReactNode } from "react";
import {
	SyncingIndicator,
	SyncingStatusMessage,
} from "@/shared/ui/syncing-indicator";

type DailyTrendChartFrameProps = {
	children?: ReactNode;
	actions?: ReactNode;
	status?: ReactNode;
	isSyncing?: boolean;
};

export function DailyTrendChartFrame({
	children,
	actions,
	status,
	isSyncing = false,
}: DailyTrendChartFrameProps) {
	return (
		<section className="rounded-panel border border-outline-subtle bg-panel p-panel shadow-panel">
			<div className="flex flex-col gap-5">
				<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
					<div className="flex flex-col gap-2">
						<div className="flex items-center gap-2">
							<h2>성과 개요</h2>
							<SyncingIndicator visible={isSyncing} />
							{isSyncing ? <SyncingStatusMessage message="동기화 중" /> : null}
						</div>
						<p className="typo-body-sm text-fg-muted">
							전역 필터 기준으로 집계한 일별 추이 꺾은선 그래프입니다.
						</p>
					</div>
					{actions ? (
						<div className="-mx-1 px-1 lg:mx-0 lg:self-start lg:px-0">
							{actions}
						</div>
					) : null}
				</div>
				<div className="min-h-5">{status ?? null}</div>
				{children ?? null}
			</div>
		</section>
	);
}
