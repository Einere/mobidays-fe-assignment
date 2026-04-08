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
			return "border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] text-[var(--status-danger-fg)]";
		case "불러오는 중":
		case "동기화 중":
			return "border-[var(--status-info-border)] bg-[var(--status-info-bg)] text-[var(--status-info-fg)]";
		default:
			return "border-[var(--status-success-border)] bg-[var(--status-success-bg)] text-[var(--status-success-fg)]";
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
		<section className="rounded-[var(--panel-radius)] border border-[var(--panel-border)] bg-[var(--panel-bg)] p-[var(--layout-panel-padding)] shadow-[var(--panel-shadow)]">
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
					<h2 className="text-[length:var(--type-title-size)] leading-[var(--type-title-line-height)] font-[var(--type-title-weight)]">
						필터 결과 요약
					</h2>
					<p className="text-[length:var(--type-body-sm-size)] text-[var(--text-secondary)]">
						전역 필터 기준으로 조회 상태와 결과 집합 크기를 확인합니다.
					</p>
				</div>

				<div className="grid gap-4 md:grid-cols-3">
					<div className="rounded-[var(--radius-lg)] bg-[var(--surface-panel-muted)] p-4">
						<p className="text-[length:var(--type-caption-size)] text-[var(--text-tertiary)]">
							조회 상태
						</p>
						<p
							className={cn(
								"mt-2 inline-flex rounded-[var(--radius-full)] border px-3 py-1 text-[length:var(--type-label-md-size)] font-[var(--type-label-md-weight)]",
								getRequestStateClassName(requestState),
							)}
						>
							{requestState}
						</p>
						{query.isError ? (
							<p className="mt-2 text-[length:var(--type-body-sm-size)] text-[var(--status-danger-fg)]">
								{query.error.message}
							</p>
						) : null}
					</div>

					<div className="rounded-[var(--radius-lg)] bg-[var(--surface-panel-muted)] p-4">
						<p className="text-[length:var(--type-caption-size)] text-[var(--text-tertiary)]">
							캠페인 결과
						</p>
						<p className="mt-2 text-[length:var(--type-metric-lg-size)] leading-[var(--type-metric-lg-line-height)] font-[var(--type-metric-lg-weight)]">
							{campaignsCount}건
						</p>
					</div>

					<div className="rounded-[var(--radius-lg)] bg-[var(--surface-panel-muted)] p-4">
						<p className="text-[length:var(--type-caption-size)] text-[var(--text-tertiary)]">
							일별 데이터 결과
						</p>
						<p className="mt-2 text-[length:var(--type-metric-lg-size)] leading-[var(--type-metric-lg-line-height)] font-[var(--type-metric-lg-weight)]">
							{dailyStatsCount}건
						</p>
					</div>
				</div>

				<div className="grid gap-3 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-4 text-[length:var(--type-body-sm-size)] text-[var(--text-secondary)] md:grid-cols-3">
					<p>
						<span className="text-[var(--text-tertiary)]">기간</span>
						<br />
						{filter.dateRange.startDate} - {filter.dateRange.endDate}
					</p>
					<p>
						<span className="text-[var(--text-tertiary)]">상태</span>
						<br />
						{formatSelectionSummary(filter.statuses)}
					</p>
					<p>
						<span className="text-[var(--text-tertiary)]">매체</span>
						<br />
						{formatSelectionSummary(filter.platforms)}
					</p>
				</div>
			</div>
		</section>
	);
}
