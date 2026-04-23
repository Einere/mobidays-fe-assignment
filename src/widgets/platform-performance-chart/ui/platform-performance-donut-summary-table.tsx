import type { PlatformPerformanceSlice } from "@/entities/platform-performance/model/types";
import { percentageFormatter } from "@/widgets/platform-performance-chart/model/platform-performance-donut";

type PlatformPerformanceDonutSummaryTableProps = {
	id?: string;
	data: readonly PlatformPerformanceSlice[];
	metricLabel: string;
	formatValue: (value: number) => string;
};

export function PlatformPerformanceDonutSummaryTable({
	id,
	data,
	metricLabel,
	formatValue,
}: PlatformPerformanceDonutSummaryTableProps) {
	return (
		<table id={id} className="sr-only" aria-label="플랫폼별 성과 요약">
			<caption className="sr-only">
				선택한 메트릭 기준 플랫폼별 성과 및 점유율 요약
			</caption>
			<thead>
				<tr>
					<th scope="col">플랫폼</th>
					<th scope="col">점유율</th>
					<th scope="col">{metricLabel}</th>
				</tr>
			</thead>
			<tbody>
				{data.map((slice) => (
					<tr key={slice.platform}>
						<td>{slice.platform}</td>
						<td>{percentageFormatter.format(slice.sharePercent)}</td>
						<td>{formatValue(slice.value)}</td>
					</tr>
				))}
			</tbody>
		</table>
	);
}
