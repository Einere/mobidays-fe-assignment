import { useDashboardDataContext } from "@/entities/dashboard/model/dashboard-data-context";
import { useDashboardVisibleData } from "@/entities/dashboard/model/use-dashboard-derivations";

export function GlobalFilterSummary() {
	const { query } = useDashboardDataContext();
	const visibleData = useDashboardVisibleData(query);
	const campaignsCount = visibleData?.campaigns.length ?? 0;
	const dailyStatsCount = visibleData?.dailyStats.length ?? 0;
	const hasVisibleData = visibleData !== null;
	const hasError = query.error !== null;
	const isInitialError = (query.isLoadingError || hasError) && !hasVisibleData;
	const initialErrorMessage = "필터 결과 요약을 불러오지 못했습니다.";
	const staleStatusMessage =
		hasVisibleData && hasError
			? "최신 필터 결과를 불러오지 못했습니다."
			: hasVisibleData && (query.isPlaceholderData || query.isPending)
				? "최신 필터 결과를 불러오는 중입니다."
				: null;

	if (isInitialError) {
		return (
			<section className="rounded-panel border border-outline-subtle bg-panel p-panel shadow-panel">
				<div className="flex flex-col gap-5">
					<div className="flex flex-col gap-2">
						<h2 className="typo-heading-md">필터 결과 요약</h2>
						<p className="typo-body-sm text-fg-muted">
							전역 필터 기준으로 결과 집합 크기를 확인합니다.
						</p>
					</div>
					<div className="rounded-card border border-status-danger-border bg-status-danger/30 px-4 py-3">
						<p className="typo-body-sm text-status-danger-fg">
							{initialErrorMessage}
						</p>
					</div>
				</div>
			</section>
		);
	}

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

				{staleStatusMessage ? (
					<div className="rounded-card border border-status-danger-border bg-status-danger/30 px-4 py-3">
						<p className="typo-body-sm text-status-danger-fg">
							{staleStatusMessage}
						</p>
						<p className="mt-1 typo-caption text-status-danger-fg">
							현재 값은 마지막 성공 결과입니다.
						</p>
					</div>
				) : null}

				<div className="grid grid-cols-2 gap-4">
					<div className="rounded-card bg-panel-muted p-4">
						<p className="mb-2 typo-caption text-fg-subtle">캠페인 결과</p>
						<p className="typo-metric-lg">{campaignsCount}건</p>
					</div>

					<div className="rounded-card bg-panel-muted p-4">
						<p className="mb-2 typo-caption text-fg-subtle">일별 데이터 결과</p>
						<p className="typo-metric-lg">{dailyStatsCount}건</p>
					</div>
				</div>
			</div>
		</section>
	);
}
