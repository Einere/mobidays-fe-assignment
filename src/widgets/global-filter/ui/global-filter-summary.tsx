import { useAtomValue } from "jotai";
import { useDashboardData } from "@/entities/dashboard/api/use-dashboard-data";
import { globalFilterAtom } from "@/entities/global-filter/model/store";
import { cn } from "@/shared/lib/utils";

function formatSelectionSummary(values: string[]) {
	return values.length > 0 ? values.join(", ") : "선택 없음";
}

function formatRequestState(options: {
	hasError: boolean;
	isPending: boolean;
	isFetching: boolean;
}) {
	if (options.hasError) {
		return "오류";
	}

	if (options.isPending) {
		return "불러오는 중";
	}

	if (options.isFetching) {
		return "동기화 중";
	}

	return "준비됨";
}

function getRequestStateClassName(requestState: string) {
	switch (requestState) {
		case "오류":
			return "border-status-danger-border bg-status-danger text-status-danger-fg";
		case "불러오는 중":
		case "동기화 중":
			return "border-status-info-border bg-status-info text-status-info-fg";
		default:
			return "border-status-success-border bg-status-success text-status-success-fg";
	}
}

export function GlobalFilterSummary() {
	const filter = useAtomValue(globalFilterAtom);
	const query = useDashboardData(filter);

	const campaignsCount = query.data?.campaigns.length ?? 0;
	const dailyStatsCount = query.data?.dailyStats.length ?? 0;
	const requestState = formatRequestState({
		hasError: query.isError,
		isPending: query.isPending,
		isFetching: query.isFetching,
	});

	return (
		<section className="rounded-panel border border-outline-subtle bg-panel p-panel shadow-panel">
			<div className="flex flex-col gap-5">
				<p
					className="sr-only"
					role="status"
					aria-live="polite"
					aria-atomic="true"
				>
					조회 상태 {requestState}, 캠페인 결과 {campaignsCount}건, 일별 데이터
					결과 {dailyStatsCount}건
				</p>

				<div className="flex flex-col gap-2">
					<h2 className="text-title">필터 결과 요약</h2>
					<p className="text-body-sm text-fg-muted">
						전역 필터 기준으로 조회 상태와 결과 집합 크기를 확인합니다.
					</p>
				</div>

				<div className="grid gap-4 md:grid-cols-3">
					<div className="rounded-card bg-panel-muted p-4">
						<p className="mb-2 text-caption text-fg-subtle">조회 상태</p>
						<p
							className={cn(
								"inline-flex rounded-pill border px-3 py-1 text-label-md",
								getRequestStateClassName(requestState),
							)}
						>
							{requestState}
						</p>
						{query.isError ? (
							<p className="mt-2 text-body-sm text-status-danger-fg">
								{query.error.message}
							</p>
						) : null}
					</div>

					<div className="rounded-card bg-panel-muted p-4">
						<p className="mb-2 text-caption text-fg-subtle">캠페인 결과</p>
						<p className="text-metric-lg">{campaignsCount}건</p>
					</div>

					<div className="rounded-card bg-panel-muted p-4">
						<p className="mb-2 text-caption text-fg-subtle">일별 데이터 결과</p>
						<p className="text-metric-lg">{dailyStatsCount}건</p>
					</div>
				</div>

				<div className="grid gap-3 rounded-card border border-outline-subtle bg-panel p-4 text-body-sm text-fg-muted md:grid-cols-3">
					<p>
						<span className="mb-2 block text-fg-subtle">기간</span>
						{filter.dateRange.startDate} - {filter.dateRange.endDate}
					</p>
					<p>
						<span className="mb-2 block text-fg-subtle">상태</span>
						{formatSelectionSummary(filter.statuses)}
					</p>
					<p>
						<span className="mb-2 block text-fg-subtle">매체</span>
						{formatSelectionSummary(filter.platforms)}
					</p>
				</div>
			</div>
		</section>
	);
}
