import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { useCallback, useMemo, useState } from "react";
import { buildCampaignRankingTop3 } from "@/entities/campaign-ranking/lib/build-campaign-ranking-top3";
import type { CampaignRankingMetricKey } from "@/entities/campaign-ranking/model/types";
import { getDashboardDataQueryOptions } from "@/entities/dashboard/api/use-dashboard-data";
import { globalFilterAtom } from "@/entities/global-filter/model/store";
import { ToggleButton } from "@/shared/ui/toggle-button";
import {
	campaignRankingMetricDefinitions,
	defaultCampaignRankingMetricKey,
	formatCampaignRankingMetricValue,
	getCampaignRankingMetricDefinition,
} from "@/widgets/campaign-ranking-top3/model/campaign-ranking-metrics";
import {
	CampaignRankingTop3BarChart,
	type CampaignRankingTop3DisplayRow,
} from "@/widgets/campaign-ranking-top3/ui/campaign-ranking-top3-bar-chart";

type CampaignRankingTop3CardState =
	| {
			kind: "loading";
	  }
	| {
			kind: "full-error";
			errorMessage: string;
	  }
	| {
			kind: "empty-campaigns";
	  }
	| {
			kind: "empty-data";
	  }
	| {
			kind: "chart";
			rows: CampaignRankingTop3DisplayRow[];
			isSyncing: boolean;
			staleErrorMessage: string | null;
	  };

function normalizeCampaignLabel(name: string | null) {
	if (name === null) {
		return "-";
	}

	return name.trim() === "" ? "-" : name;
}

function buildDisplayRows({
	metricKey,
	rankedRows,
}: {
	metricKey: CampaignRankingMetricKey;
	rankedRows: ReturnType<typeof buildCampaignRankingTop3>;
}) {
	return rankedRows
		.map((row, index) => {
			const metricValue = row[metricKey];

			if (metricValue === null) {
				return null;
			}

			const rank = index + 1;

			return {
				id: row.id,
				rankLabel: `${rank}위`,
				campaignLabel: normalizeCampaignLabel(row.name),
				metricValue,
				metricDisplayValue: formatCampaignRankingMetricValue(
					metricKey,
					metricValue,
				),
			} satisfies CampaignRankingTop3DisplayRow;
		})
		.filter((row): row is CampaignRankingTop3DisplayRow => row !== null);
}

function resolveCampaignRankingTop3CardState({
	campaigns,
	errorMessage,
	isLoadingError,
	isPending,
	isRefetchError,
	isRefetching,
	rows,
}: {
	campaigns: unknown[] | null;
	errorMessage: string | null;
	isLoadingError: boolean;
	isPending: boolean;
	isRefetchError: boolean;
	isRefetching: boolean;
	rows: CampaignRankingTop3DisplayRow[];
}): CampaignRankingTop3CardState {
	if (isLoadingError) {
		return {
			kind: "full-error",
			errorMessage: errorMessage ?? "알 수 없는 오류가 발생했습니다.",
		};
	}

	if (campaigns === null && isPending) {
		return { kind: "loading" };
	}

	if (campaigns === null) {
		return { kind: "empty-data" };
	}

	if (campaigns.length === 0) {
		return { kind: "empty-campaigns" };
	}

	if (rows.length === 0) {
		return { kind: "empty-data" };
	}

	return {
		kind: "chart",
		rows,
		isSyncing: isRefetching,
		staleErrorMessage: isRefetchError
			? (errorMessage ?? "알 수 없는 오류가 발생했습니다.")
			: null,
	};
}

function renderBody(state: CampaignRankingTop3CardState) {
	switch (state.kind) {
		case "loading":
			return (
				<div
					className="h-72 rounded-card border border-outline-subtle bg-panel-muted"
					data-testid="campaign-ranking-top3-loading"
				/>
			);
		case "full-error":
			return (
				<div className="rounded-card border border-status-danger-border bg-status-danger/30 px-4 py-5 typo-body-sm text-status-danger-fg">
					<p>캠페인 랭킹 데이터를 불러오지 못했습니다.</p>
					<p className="mt-1 text-fg-muted">{state.errorMessage}</p>
				</div>
			);
		case "empty-campaigns":
			return (
				<div className="flex h-72 items-center justify-center rounded-card border border-outline-subtle bg-panel-muted px-4 text-center typo-body-sm text-fg-muted">
					필터 조건에 맞는 캠페인이 없습니다.
				</div>
			);
		case "empty-data":
			return (
				<div className="flex h-72 items-center justify-center rounded-card border border-outline-subtle bg-panel-muted px-4 text-center typo-body-sm text-fg-muted">
					선택한 메트릭에 표시할 데이터가 없습니다.
				</div>
			);
		case "chart":
			return null;
	}
}

export function CampaignRankingTop3Card() {
	const filter = useAtomValue(globalFilterAtom);
	const [metricKey, setMetricKey] = useState<CampaignRankingMetricKey>(
		defaultCampaignRankingMetricKey,
	);
	const query = useQuery({
		...getDashboardDataQueryOptions(filter),
		placeholderData: keepPreviousData,
	});
	const metricDefinition = getCampaignRankingMetricDefinition(metricKey);
	const rows = useMemo(() => {
		if (query.data === undefined) {
			return [] as CampaignRankingTop3DisplayRow[];
		}

		const rankedRows = buildCampaignRankingTop3({
			campaigns: query.data.campaigns,
			dailyStats: query.data.dailyStats,
			metricKey,
		});

		return buildDisplayRows({
			metricKey,
			rankedRows,
		});
	}, [metricKey, query.data]);
	const state = resolveCampaignRankingTop3CardState({
		campaigns: query.data?.campaigns ?? null,
		errorMessage: query.error?.message ?? null,
		isLoadingError: query.isLoadingError,
		isPending: query.isPending,
		isRefetchError: query.isRefetchError,
		isRefetching: query.isRefetching,
		rows,
	});
	const handleMetricChange = useCallback(
		(nextMetricKey: CampaignRankingMetricKey) => {
			setMetricKey(nextMetricKey);
		},
		[],
	);

	return (
		<section className="rounded-panel border border-outline-subtle bg-panel p-panel shadow-panel">
			<div className="flex flex-col gap-5">
				<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
					<div className="flex flex-col gap-2">
						<h2>캠페인 TOP 3</h2>
						<p className="typo-body-sm text-fg-muted">
							선택한 메트릭 기준으로 상위 3개 캠페인을 비교합니다.
						</p>
					</div>
					<div className="lg:self-start">
						<fieldset
							className="flex w-max flex-nowrap justify-end gap-2"
							aria-label="캠페인 랭킹 메트릭"
						>
							<legend className="sr-only">캠페인 랭킹 메트릭</legend>
							{campaignRankingMetricDefinitions.map((metric) => (
								<ToggleButton
									key={metric.key}
									type="button"
									pressed={metricKey === metric.key}
									onClick={() => handleMetricChange(metric.key)}
								>
									{metric.label}
								</ToggleButton>
							))}
						</fieldset>
					</div>
				</div>

				{state.kind === "chart" ? (
					<CampaignRankingTop3BarChart
						rows={state.rows}
						metric={metricDefinition}
					/>
				) : (
					renderBody(state)
				)}

				{state.kind === "chart" && state.staleErrorMessage ? (
					<div className="rounded-card border border-status-danger-border bg-status-danger/30 px-4 py-3 typo-body-sm text-status-danger-fg">
						<p>
							최신 랭킹 데이터를 불러오지 못해 마지막 성공 결과를 표시 중입니다.
						</p>
					</div>
				) : null}

				{state.kind === "chart" && state.isSyncing ? (
					<p
						className="typo-body-sm text-fg-muted"
						role="status"
						aria-live="polite"
					>
						동기화 중
					</p>
				) : null}
			</div>
		</section>
	);
}
