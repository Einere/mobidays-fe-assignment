import type { ReactNode } from "react";
import {
	SyncingIndicator,
	SyncingStatusMessage,
} from "@/shared/ui/syncing-indicator";

function GlobalFilterSummaryCardFrame({ children }: { children: ReactNode }) {
	return (
		<section className="rounded-panel border border-outline-subtle bg-panel p-panel shadow-panel">
			<div className="flex flex-col gap-5">{children}</div>
		</section>
	);
}

function GlobalFilterSummaryErrorState({
	errorMessage,
}: {
	errorMessage: string;
}) {
	return (
		<div className="rounded-card border border-status-danger-border bg-status-danger/30 px-4 py-3">
			<p className="typo-body-sm text-status-danger-fg">
				필터 결과 요약을 불러오지 못했습니다.
			</p>
			<p className="mt-1 typo-caption text-status-danger-fg">{errorMessage}</p>
		</div>
	);
}

function GlobalFilterSummaryHeader() {
	return (
		<div className="flex flex-col gap-2">
			<h2 className="typo-heading-md">필터 결과 요약</h2>
			<p className="typo-body-sm text-fg-muted">
				전역 필터 기준으로 결과 집합 크기를 확인합니다.
			</p>
		</div>
	);
}

function GlobalFilterSummaryMetricCard({
	label,
	value,
	isSyncing,
}: {
	label: string;
	value: string;
	isSyncing: boolean;
}) {
	return (
		<div className="rounded-card bg-panel-muted p-4">
			<div className="mb-2 flex min-h-5 items-center gap-2">
				<p className="typo-caption text-fg-subtle">{label}</p>
				<SyncingIndicator visible={isSyncing} />
			</div>
			<p className="typo-metric-lg">{value}</p>
		</div>
	);
}

function GlobalFilterSummarySummaryContent({
	campaignsCount,
	dailyStatsCount,
	isSyncing,
}: {
	campaignsCount: number;
	dailyStatsCount: number;
	isSyncing: boolean;
}) {
	return (
		<>
			{isSyncing ? (
				<SyncingStatusMessage message="최신 필터 결과를 불러오는 중입니다." />
			) : null}

			<p className="sr-only" aria-atomic="true">
				캠페인 결과 {campaignsCount}건, 일별 데이터 결과 {dailyStatsCount}건
			</p>

			<div className="grid grid-cols-2 gap-4">
				<GlobalFilterSummaryMetricCard
					isSyncing={isSyncing}
					label="캠페인 결과"
					value={`${campaignsCount}건`}
				/>

				<GlobalFilterSummaryMetricCard
					isSyncing={isSyncing}
					label="일별 데이터 결과"
					value={`${dailyStatsCount}건`}
				/>
			</div>
		</>
	);
}

export {
	GlobalFilterSummaryCardFrame,
	GlobalFilterSummaryErrorState,
	GlobalFilterSummaryHeader,
	GlobalFilterSummarySummaryContent,
};
