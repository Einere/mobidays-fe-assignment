import type { DailyTrendPoint } from "@/entities/daily-stat/lib/build-daily-trend-series";
import { DataDenseScrollArea } from "@/shared/ui/data-dense-scroll-area";
import type { DailyTrendMetricKey } from "@/widgets/daily-trend-chart/model/metrics";
import { DailyTrendLineChart } from "@/widgets/daily-trend-chart/ui/daily-trend-line-chart";

type DailyTrendChartContentProps = {
	activeMetrics: DailyTrendMetricKey[];
	data: DailyTrendPoint[];
};

export function DailyTrendChartContent({
	activeMetrics,
	data,
}: DailyTrendChartContentProps) {
	return (
		<DataDenseScrollArea
			hint="좌우로 스크롤해 추이 전체를 비교하세요."
			className="-mx-2 px-2 sm:mx-0 sm:px-0"
			viewportTestId="daily-trend-scroll-area"
		>
			<DailyTrendLineChart activeMetrics={activeMetrics} data={data} />
		</DataDenseScrollArea>
	);
}
