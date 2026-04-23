import {
	SyncingIndicator,
	SyncingStatusMessage,
} from "@/shared/ui/syncing-indicator";
import { useCampaignRankingTop3CardViewModel } from "@/widgets/campaign-ranking-top3/model/use-campaign-ranking-top3";
import { CampaignRankingTop3CardContent } from "@/widgets/campaign-ranking-top3/ui/campaign-ranking-top3-card-content";
import { CampaignRankingTop3MetricToggleGroup } from "@/widgets/campaign-ranking-top3/ui/campaign-ranking-top3-metric-toggle-group";

export function CampaignRankingTop3Card() {
	const { metricDefinition, metricKey, setMetricKey, state } =
		useCampaignRankingTop3CardViewModel();
	const isSyncing = state.kind === "chart" && state.isSyncing;

	return (
		<section className="rounded-panel border border-outline-subtle bg-panel p-panel shadow-panel">
			<div className="flex flex-col gap-5">
				<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
					<div className="flex flex-col gap-2">
						<div className="flex items-center gap-2">
							<h2>캠페인 TOP 3</h2>
							<SyncingIndicator visible={isSyncing} />
							{isSyncing ? <SyncingStatusMessage message="동기화 중" /> : null}
						</div>
						<p className="typo-body-sm text-fg-muted">
							선택한 메트릭 기준으로 상위 3개 캠페인을 비교합니다.
						</p>
					</div>
					<div className="lg:self-start">
						<CampaignRankingTop3MetricToggleGroup
							metricKey={metricKey}
							onMetricKeyChange={setMetricKey}
						/>
					</div>
				</div>

				<CampaignRankingTop3CardContent
					metricDefinition={metricDefinition}
					state={state}
				/>
			</div>
		</section>
	);
}
