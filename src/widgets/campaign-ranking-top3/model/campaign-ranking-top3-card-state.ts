import type { CampaignRankingMetricKey } from "@/entities/campaign-ranking/model/types";
import { formatCampaignRankingMetricValue } from "@/widgets/campaign-ranking-top3/model/campaign-ranking-metrics";
import type { CampaignRankingTop3DisplayRow } from "@/widgets/campaign-ranking-top3/model/types";

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

export function buildCampaignRankingTop3DisplayRows({
	metricKey,
	rankedRows,
}: {
	metricKey: CampaignRankingMetricKey;
	rankedRows: Array<
		{
			id: string;
			name: string | null;
		} & Partial<Record<CampaignRankingMetricKey, number | null>>
	>;
}): CampaignRankingTop3DisplayRow[] {
	return rankedRows
		.map((row, index) => {
			const metricValue = row[metricKey];

			if (typeof metricValue !== "number") {
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

export function resolveCampaignRankingTop3CardState({
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
