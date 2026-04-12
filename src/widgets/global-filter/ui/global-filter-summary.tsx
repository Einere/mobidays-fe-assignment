import { useGlobalFilterSummaryViewModel } from "@/widgets/global-filter/model/use-global-filter-summary-view-model";
import { GlobalFilterSummaryContent } from "@/widgets/global-filter/ui/global-filter-summary-content";

export function GlobalFilterSummary() {
	const state = useGlobalFilterSummaryViewModel();

	return <GlobalFilterSummaryContent state={state} />;
}
