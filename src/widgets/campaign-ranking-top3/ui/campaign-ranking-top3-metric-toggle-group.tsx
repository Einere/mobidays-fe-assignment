import type { CampaignRankingMetricKey } from "@/entities/campaign-ranking/model/types";
import { ToggleButton } from "@/shared/ui/toggle-button";
import { campaignRankingMetricDefinitions } from "@/widgets/campaign-ranking-top3/model/campaign-ranking-metrics";

interface CampaignRankingTop3MetricToggleGroupProps {
	metricKey: CampaignRankingMetricKey;
	onMetricKeyChange: (metricKey: CampaignRankingMetricKey) => void;
}

export function CampaignRankingTop3MetricToggleGroup({
	metricKey,
	onMetricKeyChange,
}: CampaignRankingTop3MetricToggleGroupProps) {
	return (
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
					onClick={() => onMetricKeyChange(metric.key)}
				>
					{metric.label}
				</ToggleButton>
			))}
		</fieldset>
	);
}
