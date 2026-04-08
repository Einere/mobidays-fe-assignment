import { Button } from "@/shared/ui/button.tsx";
import { TextInput } from "@/shared/ui/input.tsx";
import { SidebarNav } from "@/shared/ui/sidebar.tsx";
import { useCampaignTableControls } from "@/widgets/campaign-table/model/use-campaign-table-controls";
import { CampaignTablePlaceholder } from "@/widgets/campaign-table/ui/campaign-table-placeholder";
import { GlobalFilterBar } from "@/widgets/global-filter/ui/global-filter-bar";
import { GlobalFilterSummary } from "@/widgets/global-filter/ui/global-filter-summary";

const campaignTableSortLabels = {
	period: "집행기간",
	cost: "총 집행금액",
	ctr: "CTR",
	cpc: "CPC",
	roas: "ROAS",
} as const;

function App() {
	const campaignTableControls = useCampaignTableControls();
	const activeSortLabel = campaignTableControls.sort
		? `${campaignTableSortLabels[campaignTableControls.sort.key]} ${campaignTableControls.sort.direction === "asc" ? "오름차순" : "내림차순"}`
		: "없음";

	return (
		<main className="min-h-screen bg-canvas text-fg">
			<section className="mx-auto grid min-h-screen max-w-page-max gap-panel-gap px-page-gutter py-8 lg:grid-cols-[260px_minmax(0,1fr)]">
				<SidebarNav
					title="Mobidays Dashboard"
					items={[
						{ id: "overview", label: "개요", active: true },
						{ id: "campaigns", label: "캠페인", meta: "18" },
						{ id: "reports", label: "리포트" },
						{ id: "alerts", label: "알림", meta: "3" },
					]}
				/>

				<div className="flex flex-col gap-panel-gap">
					<header className="flex flex-col gap-3">
						<p className="text-caption tracking-[0.08em] text-fg-subtle uppercase">
							Mobidays Dashboard
						</p>
						<div className="flex flex-col gap-2">
							<h1>캠페인 운영 현황</h1>
						</div>
					</header>

					<section className="grid gap-panel-gap xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.9fr)]">
						<GlobalFilterBar />
						<GlobalFilterSummary />
					</section>

					<section className="grid gap-panel-gap lg:grid-cols-[1.4fr_1fr]">
						<div className="rounded-panel border border-outline-subtle bg-panel p-panel shadow-panel">
							<div className="flex items-start justify-between gap-4">
								<div className="flex flex-col gap-2">
									<h2 className="text-heading-lg">성과 개요</h2>
								</div>
								<div className="flex gap-2">
									<Button size="sm" variant="outline">
										지난 7일
									</Button>
									<Button size="sm">보고서 내보내기</Button>
								</div>
							</div>

							<div className="mt-8 grid gap-4 md:grid-cols-3">
								<div className="rounded-card bg-panel-muted p-4">
									<p className="text-caption text-fg-subtle">총 집행 금액</p>
									<p className="mt-2 text-metric-lg">₩128.4M</p>
								</div>
								<div className="rounded-card bg-panel-muted p-4">
									<p className="text-caption text-fg-subtle">전환율</p>
									<p className="mt-2 text-metric-lg">4.82%</p>
								</div>
								<div className="rounded-card bg-panel-muted p-4">
									<p className="text-caption text-fg-subtle">CPA</p>
									<p className="mt-2 text-metric-lg">₩18,240</p>
								</div>
							</div>
						</div>

						<div className="rounded-panel border border-outline-subtle bg-panel p-panel shadow-panel">
							<h2 className="text-title">운영 상태</h2>
							<div className="mt-5 flex flex-wrap gap-2">
								<span className="rounded-pill border border-status-success-border bg-status-success px-3 py-1 text-caption text-status-success-fg">
									운영 중
								</span>
								<span className="rounded-pill border border-status-warning-border bg-status-warning px-3 py-1 text-caption text-status-warning-fg">
									검토 필요
								</span>
								<span className="rounded-pill border border-status-danger-border bg-status-danger px-3 py-1 text-caption text-status-danger-fg">
									예산 초과
								</span>
								<span className="rounded-pill border border-status-info-border bg-status-info px-3 py-1 text-caption text-status-info-fg">
									동기화 중
								</span>
							</div>

							<div className="mt-8 flex flex-col gap-3">
								<div className="flex items-center justify-between text-table-sm text-fg-muted">
									<span>안정 운영</span>
									<span>+18.4%</span>
								</div>
								<div className="h-2 rounded-full bg-panel-muted">
									<div className="h-full w-[72%] rounded-full bg-chart-positive" />
								</div>
								<div className="flex items-center justify-between text-table-sm text-fg-muted">
									<span>주의 필요</span>
									<span>7 캠페인</span>
								</div>
								<div className="h-2 rounded-full bg-panel-muted">
									<div className="h-full w-[48%] rounded-full bg-chart-warning" />
								</div>
								<div className="flex items-center justify-between text-table-sm text-fg-muted">
									<span>긴급 대응</span>
									<span>2 캠페인</span>
								</div>
								<div className="h-2 rounded-full bg-panel-muted">
									<div className="h-full w-[21%] rounded-full bg-chart-danger" />
								</div>
							</div>
						</div>
					</section>

					<section className="rounded-panel border border-outline-subtle bg-panel p-panel shadow-panel">
						<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
							<div>
								<h2>캠페인 현황</h2>
							</div>
							<div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
								<TextInput
									aria-label="캠페인 검색"
									className="min-w-[240px]"
									placeholder="캠페인 검색"
									value={campaignTableControls.searchTerm}
									onChange={(event) =>
										campaignTableControls.setSearchTerm(event.target.value)
									}
								/>
								<Button variant="secondary">필터 열기</Button>
							</div>
						</div>

						<div className="mt-4 flex flex-col gap-3 rounded-card border border-outline-subtle bg-panel-muted p-4">
							<div className="flex flex-wrap gap-2">
								<Button
									type="button"
									size="sm"
									variant={
										campaignTableControls.sort?.key === "period"
											? "secondary"
											: "outline"
									}
									onClick={() => campaignTableControls.toggleSort("period")}
								>
									집행기간
								</Button>
								<Button
									type="button"
									size="sm"
									variant={
										campaignTableControls.sort?.key === "ctr"
											? "secondary"
											: "outline"
									}
									onClick={() => campaignTableControls.toggleSort("ctr")}
								>
									CTR
								</Button>
								<Button
									type="button"
									size="sm"
									variant={
										campaignTableControls.sort?.key === "roas"
											? "secondary"
											: "outline"
									}
									onClick={() => campaignTableControls.toggleSort("roas")}
								>
									ROAS
								</Button>
							</div>
							<div className="flex flex-wrap gap-x-4 gap-y-1 text-body-sm text-fg-muted">
								<span>
									검색어{" "}
									{campaignTableControls.searchTerm
										? `"${campaignTableControls.searchTerm}"`
										: "없음"}
								</span>
								<span>정렬 {activeSortLabel}</span>
								<span>페이지 {campaignTableControls.page}</span>
								<span>
									선택 {campaignTableControls.selectedRowIds.length}건
								</span>
							</div>
						</div>

						<div className="mt-6">
							<CampaignTablePlaceholder controls={campaignTableControls} />
						</div>

						<div className="mt-4 flex items-center justify-between text-body-sm text-fg-muted">
							<p>선택 {campaignTableControls.selectedRowIds.length}건</p>
							<div className="flex gap-2">
								<Button
									type="button"
									size="sm"
									variant="outline"
									disabled={campaignTableControls.page === 1}
									onClick={() =>
										campaignTableControls.setPage(
											campaignTableControls.page - 1,
										)
									}
								>
									이전
								</Button>
								<Button
									type="button"
									size="sm"
									variant="outline"
									onClick={() =>
										campaignTableControls.setPage(
											campaignTableControls.page + 1,
										)
									}
								>
									다음
								</Button>
							</div>
						</div>
					</section>
				</div>
			</section>
		</main>
	);
}

export default App;
