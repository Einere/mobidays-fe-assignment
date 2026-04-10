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

export interface CampaignRankingTop3DisplayRow {
	id: string;
	rankLabel: string;
	campaignLabel: string;
	metricValue: number;
	metricDisplayValue: string;
}

interface CampaignRankingTop3BarChartProps {
	rows: CampaignRankingTop3DisplayRow[];
	metric: CampaignRankingMetricDefinition;
}

export function CampaignRankingTop3BarChart({
	rows,
	metric,
}: CampaignRankingTop3BarChartProps) {
	const chartConfig = {
		metricValue: {
			label: metric.label,
			color: metric.chartColor,
		},
	} satisfies ChartConfig;

	return (
		<div className="rounded-card border border-outline-subtle bg-panel p-3 sm:p-4">
			<div className="h-72" data-testid="campaign-ranking-top3-chart">
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
							width={136}
							tickLine={false}
							axisLine={false}
							interval={0}
						/>
						<ChartTooltip
							cursor={false}
							content={
								<ChartTooltipContent
									formatter={(value) =>
										metric.formatValue(typeof value === "number" ? value : null)
									}
								/>
							}
						/>
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
