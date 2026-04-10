import { useId, useMemo } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	LabelList,
	XAxis,
	YAxis,
} from "recharts";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/shared/ui/chart";
import type { CampaignRankingMetricDefinition } from "@/widgets/campaign-ranking-top3/model/campaign-ranking-metrics";
import type { CampaignRankingTop3DisplayRow } from "@/widgets/campaign-ranking-top3/model/types";

interface CampaignRankingTop3BarChartProps {
	rows: CampaignRankingTop3DisplayRow[];
	metric: CampaignRankingMetricDefinition;
}

export function CampaignRankingTop3BarChart({
	rows,
	metric,
}: CampaignRankingTop3BarChartProps) {
	const summaryId = useId();
	const chartConfig = useMemo(
		() =>
			({
				metricValue: {
					label: metric.label,
					color: metric.chartColor,
				},
			}) satisfies ChartConfig,
		[metric.chartColor, metric.label],
	);
	const tooltipContent = useMemo(
		() => (
			<ChartTooltipContent
				formatter={(value) =>
					metric.formatValue(typeof value === "number" ? value : null)
				}
			/>
		),
		[metric],
	);

	return (
		<div className="rounded-card border border-outline-subtle bg-panel p-3 sm:p-4">
			<table id={summaryId} className="sr-only" aria-label="캠페인 TOP 3 요약">
				<caption className="sr-only">
					선택한 메트릭 기준 상위 3개 캠페인 요약
				</caption>
				<thead>
					<tr>
						<th scope="col">순위</th>
						<th scope="col">캠페인</th>
						<th scope="col">{metric.label}</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((row) => (
						<tr key={row.id}>
							<td>{row.rankLabel}</td>
							<td>{row.campaignLabel}</td>
							<td>{row.metricDisplayValue}</td>
						</tr>
					))}
				</tbody>
			</table>
			<div
				className="h-72"
				data-testid="campaign-ranking-top3-chart"
				aria-describedby={summaryId}
			>
				<ChartContainer className="h-full w-full" config={chartConfig}>
					<BarChart
						data={rows}
						layout="vertical"
						margin={{ top: 8, right: 56, bottom: 8, left: 8 }}
						barCategoryGap={16}
					>
						<CartesianGrid
							vertical={false}
							stroke="var(--color-outline-subtle)"
						/>
						<XAxis type="number" hide />
						<YAxis
							type="category"
							dataKey="campaignLabel"
							width={164}
							tickLine={false}
							axisLine={false}
							interval={0}
						/>
						<ChartTooltip cursor={false} content={tooltipContent} />
						<Bar
							dataKey="metricValue"
							fill="var(--color-metricValue)"
							radius={[0, 6, 6, 0]}
							maxBarSize={32}
						>
							<LabelList
								dataKey="metricDisplayValue"
								position="right"
								className="fill-fg typo-caption"
								offset={10}
							/>
							<LabelList
								dataKey="rankLabel"
								position="insideLeft"
								className="fill-fg typo-caption"
								offset={8}
							/>
						</Bar>
					</BarChart>
				</ChartContainer>
			</div>
		</div>
	);
}
