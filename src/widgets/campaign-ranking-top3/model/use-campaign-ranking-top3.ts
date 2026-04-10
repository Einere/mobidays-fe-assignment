import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { useMemo, useState } from "react";
import {
	buildCampaignRankingTop3Candidates,
	selectCampaignRankingTop3,
} from "@/entities/campaign-ranking/lib/build-campaign-ranking-top3";
import type { CampaignRankingMetricKey } from "@/entities/campaign-ranking/model/types";
import { getDashboardDataQueryOptions } from "@/entities/dashboard/hooks/use-dashboard-data";
import { globalFilterAtom } from "@/entities/global-filter/model/store";
import {
	defaultCampaignRankingMetricKey,
	formatCampaignRankingMetricValue,
	getCampaignRankingMetricDefinition,
} from "@/widgets/campaign-ranking-top3/model/campaign-ranking-metrics";
import type { CampaignRankingTop3DisplayRow } from "@/widgets/campaign-ranking-top3/ui/campaign-ranking-top3-bar-chart";

export type CampaignRankingTop3CardState =
	| {
			kind: "loading";
	  }
	| {
			kind: "full-error";
			errorMessage: string;
	  }
	| {
			kind: "empty-campaigns";
	  }
	| {
			kind: "empty-data";
	  }
	| {
			kind: "chart";
			rows: CampaignRankingTop3DisplayRow[];
			isSyncing: boolean;
			staleErrorMessage: string | null;
	  };

function normalizeCampaignLabel(name: string | null) {
	const trimmedName = name?.trim() ?? "";

	return trimmedName === "" ? "이름 없음" : trimmedName;
}

function buildDisplayRows({
	metricKey,
	rankedRows,
}: {
	metricKey: CampaignRankingMetricKey;
	rankedRows: ReturnType<typeof selectCampaignRankingTop3>;
}): CampaignRankingTop3DisplayRow[] {
	return rankedRows
		.map((row, index) => {
			const metricValue = row[metricKey];

			if (metricValue === null) {
				return null;
			}

			const rank = index + 1;
			const campaignName = normalizeCampaignLabel(row.name);

			return {
				id: row.id,
				rankLabel: `${rank}위`,
				campaignLabel: `${rank}위 ${campaignName}`,
				metricValue,
				metricDisplayValue: formatCampaignRankingMetricValue(
					metricKey,
					metricValue,
				),
			} satisfies CampaignRankingTop3DisplayRow;
		})
		.filter((row): row is CampaignRankingTop3DisplayRow => row !== null);
}

function resolveCampaignRankingTop3CardState({
	campaigns,
	errorMessage,
	isLoadingError,
	isPending,
	isRefetchError,
	isRefetching,
	rows,
}: {
	campaigns: unknown[] | null;
	errorMessage: string | null;
	isLoadingError: boolean;
	isPending: boolean;
	isRefetchError: boolean;
	isRefetching: boolean;
	rows: CampaignRankingTop3DisplayRow[];
}): CampaignRankingTop3CardState {
	if (isLoadingError) {
		return {
			kind: "full-error",
			errorMessage: errorMessage ?? "알 수 없는 오류가 발생했습니다.",
		};
	}

	if (campaigns === null && isPending) {
		return { kind: "loading" };
	}

	if (campaigns === null) {
		return { kind: "empty-data" };
	}

	if (campaigns.length === 0) {
		return { kind: "empty-campaigns" };
	}

	if (rows.length === 0) {
		return { kind: "empty-data" };
	}

	return {
		kind: "chart",
		rows,
		isSyncing: isRefetching,
		staleErrorMessage: isRefetchError
			? (errorMessage ?? "알 수 없는 오류가 발생했습니다.")
			: null,
	};
}

export function useCampaignRankingTop3CardViewModel() {
	const filter = useAtomValue(globalFilterAtom);
	const [metricKey, setMetricKey] = useState<CampaignRankingMetricKey>(
		defaultCampaignRankingMetricKey,
	);
	const query = useQuery({
		...getDashboardDataQueryOptions(filter),
		placeholderData: keepPreviousData,
	});
	const metricDefinition = getCampaignRankingMetricDefinition(metricKey);
	const rankedCandidates = useMemo(() => {
		if (query.data === undefined) {
			return [];
		}

		return buildCampaignRankingTop3Candidates({
			campaigns: query.data.campaigns,
			dailyStats: query.data.dailyStats,
		});
	}, [query.data]);
	const rows = useMemo(() => {
		if (rankedCandidates.length === 0) {
			return [] as CampaignRankingTop3DisplayRow[];
		}

		const topRankedRows = selectCampaignRankingTop3(
			rankedCandidates,
			metricKey,
		);

		return buildDisplayRows({
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
