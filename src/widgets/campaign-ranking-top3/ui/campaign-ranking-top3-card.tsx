import { ToggleButton } from "@/shared/ui/toggle-button";
import { campaignRankingMetricDefinitions } from "@/widgets/campaign-ranking-top3/model/campaign-ranking-metrics";
import {
	type CampaignRankingTop3CardState,
	useCampaignRankingTop3CardViewModel,
} from "@/widgets/campaign-ranking-top3/model/use-campaign-ranking-top3";
import { CampaignRankingTop3BarChart } from "@/widgets/campaign-ranking-top3/ui/campaign-ranking-top3-bar-chart";

function renderBody(state: CampaignRankingTop3CardState) {
	switch (state.kind) {
		case "loading":
			return (
				<div
					className="h-72 rounded-card border border-outline-subtle bg-panel-muted"
					data-testid="campaign-ranking-top3-loading"
					role="status"
					aria-live="polite"
					aria-busy="true"
					aria-label="캠페인 랭킹 데이터를 불러오는 중"
				/>
			);
		case "full-error":
			return (
				<div
					className="rounded-card border border-status-danger-border bg-status-danger/30 px-4 py-5 typo-body-sm text-status-danger-fg"
					role="alert"
				>
					<p>캠페인 랭킹 데이터를 불러오지 못했습니다.</p>
					<p className="mt-1 text-fg-muted">{state.errorMessage}</p>
				</div>
			);
		case "empty-campaigns":
			return (
				<div
					className="flex h-72 items-center justify-center rounded-card border border-outline-subtle bg-panel-muted px-4 text-center typo-body-sm text-fg-muted"
					role="status"
				>
					필터 조건에 맞는 캠페인이 없습니다.
				</div>
			);
		case "empty-data":
			return (
				<div
					className="flex h-72 items-center justify-center rounded-card border border-outline-subtle bg-panel-muted px-4 text-center typo-body-sm text-fg-muted"
					role="status"
				>
					선택한 메트릭에 표시할 데이터가 없습니다.
				</div>
			);
		case "chart":
			return null;
	}
}

export function CampaignRankingTop3Card() {
	const { metricDefinition, metricKey, setMetricKey, state } =
		useCampaignRankingTop3CardViewModel();

	return (
		<section className="rounded-panel border border-outline-subtle bg-panel p-panel shadow-panel">
			<div className="flex flex-col gap-5">
				<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
					<div className="flex flex-col gap-2">
						<h2>캠페인 TOP 3</h2>
						<p className="typo-body-sm text-fg-muted">
							선택한 메트릭 기준으로 상위 3개 캠페인을 비교합니다.
						</p>
					</div>
					<div className="lg:self-start">
						<fieldset
							className="flex w-max flex-nowrap justify-end gap-2"
							aria-label="캠페인 랭킹 메트릭"
						>
							<legend className="sr-only">캠페인 랭킹 메트릭</legend>
							{campaignRankingMetricDefinitions.map((metric) => (
								<ToggleButton
									key={metric.key}
									type="button"
									pressed={metricKey === metric.key}
									onClick={() => setMetricKey(metric.key)}
								>
									{metric.label}
								</ToggleButton>
							))}
						</fieldset>
					</div>
				</div>

				{state.kind === "chart" ? (
					<CampaignRankingTop3BarChart
						rows={state.rows}
						metric={metricDefinition}
					/>
				) : (
					renderBody(state)
				)}

				{state.kind === "chart" && state.staleErrorMessage ? (
					<div
						className="rounded-card border border-status-danger-border bg-status-danger/30 px-4 py-3 typo-body-sm text-status-danger-fg"
						role="alert"
					>
						<p>
							최신 랭킹 데이터를 불러오지 못해 마지막 성공 결과를 표시 중입니다.
						</p>
					</div>
				) : null}

				<div className="min-h-5">
					{state.kind === "chart" && state.isSyncing ? (
						<p
							className="typo-body-sm text-fg-muted"
							role="status"
							aria-live="polite"
						>
							동기화 중
						</p>
					) : null}
				</div>
			</div>
		</section>
	);
}
