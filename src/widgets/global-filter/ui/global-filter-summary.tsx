import { useGlobalFilterSummaryViewModel } from "@/widgets/global-filter/model/use-global-filter-summary-view-model";
import {
	GlobalFilterSummaryCardFrame,
	GlobalFilterSummaryErrorState,
	GlobalFilterSummaryHeader,
	GlobalFilterSummarySummaryContent,
} from "@/widgets/global-filter/ui/global-filter-summary-content";

export function GlobalFilterSummary() {
	const state = useGlobalFilterSummaryViewModel();

	return (
		<GlobalFilterSummaryCardFrame>
			<GlobalFilterSummaryHeader />

			{state.kind === "full-error" ? (
				<GlobalFilterSummaryErrorState errorMessage={state.errorMessage} />
			) : (
				<GlobalFilterSummarySummaryContent
					campaignsCount={state.campaignsCount}
					dailyStatsCount={state.dailyStatsCount}
					isSyncing={state.isSyncing}
				/>
			)}
		</GlobalFilterSummaryCardFrame>
	);
}
