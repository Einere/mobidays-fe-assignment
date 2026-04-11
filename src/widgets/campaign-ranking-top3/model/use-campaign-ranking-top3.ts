import { useMemo, useState } from "react";
import { selectCampaignRankingTop3 } from "@/entities/campaign-ranking/lib/build-campaign-ranking-top3";
import type { CampaignRankingMetricKey } from "@/entities/campaign-ranking/model/types";
import { useDashboardDataContext } from "@/entities/dashboard/model/dashboard-data-context";
import {
	defaultCampaignRankingMetricKey,
	getCampaignRankingMetricDefinition,
} from "@/widgets/campaign-ranking-top3/model/campaign-ranking-metrics";
import {
	buildCampaignRankingTop3DisplayRows,
	resolveCampaignRankingTop3CardState,
} from "@/widgets/campaign-ranking-top3/model/campaign-ranking-top3-card-state";

export function useCampaignRankingTop3CardViewModel() {
	const { query, derivations } = useDashboardDataContext();
	const [metricKey, setMetricKey] = useState<CampaignRankingMetricKey>(
		defaultCampaignRankingMetricKey,
	);
	const metricDefinition = getCampaignRankingMetricDefinition(metricKey);
	const rankedCandidates = useMemo(() => {
		if (derivations === null) {
			return [];
		}

		return derivations.campaignRankingCandidates;
	}, [derivations]);
	const rows = useMemo(() => {
		if (rankedCandidates.length === 0) {
			return [];
		}

		const topRankedRows = selectCampaignRankingTop3(
			rankedCandidates,
			metricKey,
		);

		return buildCampaignRankingTop3DisplayRows({
			metricKey,
			rankedRows: topRankedRows,
		});
	}, [metricKey, rankedCandidates]);

	const state = resolveCampaignRankingTop3CardState({
		campaigns: query.data?.campaigns ?? null,
		errorMessage: query.error?.message ?? null,
		isLoadingError: query.isLoadingError,
		isPending: query.isPending,
		isRefetchError: query.isRefetchError,
		isRefetching: query.isRefetching,
		rows,
	});

	return {
		metricDefinition,
		metricKey,
		setMetricKey,
		state,
	};
}
