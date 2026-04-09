import type { CampaignTableRow } from "@/entities/campaign/lib/build-campaign-table-rows";
import {
	formatCampaignMetric,
	formatCampaignPeriod,
	formatCampaignStatusLabel,
} from "@/entities/campaign/lib/format-campaign-table";
import { cn } from "@/shared/lib/utils";

interface CampaignTableMobileRowProps {
	row: CampaignTableRow;
	selected: boolean;
	disabled: boolean;
	statusToneClassName: string;
	onToggleSelection: () => void;
}

export function CampaignTableMobileRow({
	row,
	selected,
	disabled,
	statusToneClassName,
	onToggleSelection,
}: CampaignTableMobileRowProps) {
	return (
		<article
			className="rounded-card border border-outline-subtle bg-panel p-4 shadow-panel"
			data-testid={`campaign-mobile-row-${row.id}`}
		>
			<div className="flex items-start gap-3">
				<input
					aria-label={`${row.name} 선택`}
					checked={selected}
					className="mt-1 size-4 rounded border border-outline accent-primary"
					disabled={disabled}
					type="checkbox"
					onChange={onToggleSelection}
				/>
				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-2">
						<p className="font-medium text-fg">{row.name}</p>
						<span
							className={cn(
								"inline-flex rounded-pill border px-2.5 py-1 text-caption",
								statusToneClassName,
							)}
						>
							{formatCampaignStatusLabel(row.status)}
						</span>
					</div>
					<p className="mt-1 text-body-sm text-fg-muted">
						{row.platform ?? "-"} ·{" "}
						{formatCampaignPeriod(row.startDate, row.endDate)}
					</p>
				</div>
			</div>

			<div className="mt-4 grid grid-cols-2 gap-3 rounded-card bg-panel-muted p-3 text-body-sm">
				<div>
					<p className="text-fg-muted">총 집행금액</p>
					<p className="mt-1 font-medium text-fg">
						{formatCampaignMetric(row.cost, "currency")}
					</p>
				</div>
				<div>
					<p className="text-fg-muted">CTR</p>
					<p className="mt-1 font-medium text-fg">
						{formatCampaignMetric(row.ctr, "percent")}
					</p>
				</div>
				<div>
					<p className="text-fg-muted">CPC</p>
					<p className="mt-1 font-medium text-fg">
						{formatCampaignMetric(row.cpc, "currency")}
					</p>
				</div>
				<div>
					<p className="text-fg-muted">ROAS</p>
					<p className="mt-1 font-medium text-fg">
						{formatCampaignMetric(row.roas, "percent")}
					</p>
				</div>
			</div>
		</article>
	);
}
