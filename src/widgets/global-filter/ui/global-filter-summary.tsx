import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { getDashboardDataQueryOptions } from "@/entities/dashboard/api/use-dashboard-data";
import { globalFilterAtom } from "@/entities/global-filter/model/store";

function formatSelectionSummary(values: string[]) {
	return values.length > 0 ? values.join(", ") : "선택 없음";
}

export function GlobalFilterSummary() {
	const filter = useAtomValue(globalFilterAtom);
	const query = useQuery({
		...getDashboardDataQueryOptions(filter),
		placeholderData: keepPreviousData,
	});

	const campaignsCount = query.data?.campaigns.length ?? 0;
	const dailyStatsCount = query.data?.dailyStats.length ?? 0;

	return (
		<section className="rounded-panel border border-outline-subtle bg-panel p-panel shadow-panel">
			<div className="flex flex-col gap-5">
				<p
					className="sr-only"
					role="status"
					aria-live="polite"
					aria-atomic="true"
				>
					캠페인 결과 {campaignsCount}건, 일별 데이터 결과 {dailyStatsCount}건
				</p>

				<div className="flex flex-col gap-2">
					<h2 className="typo-heading-md">필터 결과 요약</h2>
					<p className="typo-body-sm text-fg-muted">
						전역 필터 기준으로 결과 집합 크기를 확인합니다.
					</p>
				</div>

				{query.isError ? (
					<p className="typo-body-sm text-status-danger-fg">
						{query.error.message}
					</p>
				) : null}

				<div className="grid gap-4 md:grid-cols-2">
					<div className="rounded-card bg-panel-muted p-4">
						<p className="mb-2 typo-caption text-fg-subtle">캠페인 결과</p>
						<p className="typo-metric-lg">{campaignsCount}건</p>
					</div>

					<div className="rounded-card bg-panel-muted p-4">
						<p className="mb-2 typo-caption text-fg-subtle">일별 데이터 결과</p>
						<p className="typo-metric-lg">{dailyStatsCount}건</p>
					</div>
				</div>

				<div className="grid gap-3 rounded-card border border-outline-subtle bg-panel p-4 typo-body-sm text-fg-muted md:grid-cols-3">
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
