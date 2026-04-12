import type { DashboardData } from "@/entities/dashboard/api/fetch-dashboard-data";
import { useDashboardDataContext } from "@/entities/dashboard/model/dashboard-data-context";

type GlobalFilterSummaryQuerySnapshot = {
	data: DashboardData | undefined;
	error: Error | null;
	isError: boolean;
	isPending: boolean;
	isPlaceholderData: boolean;
};

export type GlobalFilterSummaryViewState =
	| {
			kind: "full-error";
			errorMessage: string;
	  }
	| {
			kind: "summary";
			campaignsCount: number;
			dailyStatsCount: number;
			staleStatusMessage: string | null;
	  };

export function resolveGlobalFilterSummaryViewState(
	query: GlobalFilterSummaryQuerySnapshot,
): GlobalFilterSummaryViewState {
	if (query.isError) {
		return {
			kind: "full-error",
			errorMessage: query.error?.message ?? "알 수 없는 오류가 발생했습니다.",
		};
	}

	const campaignsCount = query.data?.campaigns.length ?? 0;
	const dailyStatsCount = query.data?.dailyStats.length ?? 0;

	return {
		kind: "summary",
		campaignsCount,
		dailyStatsCount,
		staleStatusMessage:
			query.data !== undefined && (query.isPlaceholderData || query.isPending)
				? "최신 필터 결과를 불러오는 중입니다."
				: null,
	};
}

export function useGlobalFilterSummaryViewModel() {
	const { query } = useDashboardDataContext();

	return resolveGlobalFilterSummaryViewState(query);
}
