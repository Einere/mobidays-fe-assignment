import type { CampaignStatus } from "@/entities/global-filter/model/types";

export type CampaignMetricKind = "currency" | "percent";

const currencyFormatter = new Intl.NumberFormat("ko-KR", {
	style: "currency",
	currency: "KRW",
	maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat("ko-KR", {
	maximumFractionDigits: 2,
});

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

export function formatCampaignMetric(
	value: number | null,
	kind: CampaignMetricKind,
) {
	if (value === null) {
		return "-";
	}

	switch (kind) {
		case "currency":
			return currencyFormatter.format(value);
		case "percent":
			return `${percentFormatter.format(value)}%`;
	}
}
