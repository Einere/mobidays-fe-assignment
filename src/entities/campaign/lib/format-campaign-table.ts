import type { CampaignStatus } from "@/entities/global-filter/model/types";
import {
	formatCurrencyWithLocale,
	formatPercentWithLocale,
} from "@/shared/lib/intl/number";

export type CampaignMetricKind = "currency" | "percent";

export function formatCampaignStatusLabel(status: CampaignStatus | null) {
	switch (status) {
		case "active":
			return "진행 중";
		case "paused":
			return "일시중지";
		case "ended":
			return "종료";
		case null:
			return "-";
	}
}

export function formatCampaignPeriod(
	startDate: string | null,
	endDate: string | null,
) {
	if (startDate === null) {
		return "-";
	}

	if (endDate === null) {
		return `${startDate} ~ 진행 중`;
	}

	return `${startDate} ~ ${endDate}`;
}

type CampaignSelectionLabelInput = {
	name: string | null;
	platform: string | null;
	startDate: string | null;
	endDate: string | null;
	status: CampaignStatus | null;
};

export function formatCampaignSelectionLabel({
	name,
	platform,
	startDate,
	endDate,
	status,
}: CampaignSelectionLabelInput) {
	const trimmedName = name?.trim();

	if (trimmedName && trimmedName !== "-") {
		return `${trimmedName} 선택`;
	}

	const statusLabel = formatCampaignStatusLabel(status);
	const periodLabel = formatCampaignPeriod(startDate, endDate);
	const selectionParts = [
		"이름 없음",
		platform ?? "매체 없음",
		statusLabel === "-" ? "상태 없음" : statusLabel,
		periodLabel === "-" ? "집행 기간 없음" : periodLabel,
	];

	return `${selectionParts.join(", ")} 선택`;
}

export function formatCampaignMetric(
	value: number | null,
	kind: CampaignMetricKind,
) {
	if (value === null) {
		return "-";
	}

	switch (kind) {
		case "currency":
			return formatCurrencyWithLocale(value);
		case "percent":
			return formatPercentWithLocale(value);
	}
}
