import { MobileSidebarNav, SidebarNav } from "@/shared/ui/sidebar.tsx";
import { CampaignTableCard } from "@/widgets/campaign-table/ui/campaign-table-card";
import { DailyTrendChartCard } from "@/widgets/daily-trend-chart/ui/daily-trend-chart-card";
import { GlobalFilterBar } from "@/widgets/global-filter/ui/global-filter-bar";
import { GlobalFilterSummary } from "@/widgets/global-filter/ui/global-filter-summary";

function App() {
	const sidebarItems = [
		{ id: "overview", label: "개요", active: true },
		{ id: "campaigns", label: "캠페인", meta: "18" },
		{ id: "reports", label: "리포트" },
		{ id: "alerts", label: "알림", meta: "3" },
	];

	return (
		<main className="min-h-screen overflow-x-hidden bg-canvas text-fg">
			<section className="mx-auto grid min-h-screen w-full max-w-page-max gap-panel-gap px-page-gutter py-8 lg:grid-cols-[260px_minmax(0,1fr)]">
				<SidebarNav
					className="hidden min-w-0 lg:block"
					title="Mobidays Dashboard"
					items={sidebarItems}
				/>

				<div className="min-w-0 flex flex-col gap-panel-gap">
					<header className="flex flex-col gap-3">
						<div className="lg:hidden">
							<MobileSidebarNav
								title="Mobidays Dashboard"
								items={sidebarItems}
							/>
						</div>
						<p className="typo-caption tracking-[0.08em] text-fg-subtle uppercase">
							Mobidays Dashboard
						</p>
						<div className="flex flex-col gap-2">
							<h1>캠페인 운영 현황</h1>
						</div>
					</header>

					<section className="grid min-w-0 gap-panel-gap xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.9fr)]">
						<GlobalFilterBar />
						<GlobalFilterSummary />
					</section>

					<DailyTrendChartCard />

					{/*<section className="rounded-panel border border-outline-subtle bg-panel p-panel shadow-panel">
						<h2 className="typo-heading-md">운영 상태</h2>
						<div className="mt-5 flex flex-wrap gap-2">
							<span className="rounded-pill border border-status-success-border bg-status-success px-3 py-1 typo-caption text-status-success-fg">
								운영 중
							</span>
							<span className="rounded-pill border border-status-warning-border bg-status-warning px-3 py-1 typo-caption text-status-warning-fg">
								검토 필요
							</span>
							<span className="rounded-pill border border-status-danger-border bg-status-danger px-3 py-1 typo-caption text-status-danger-fg">
								예산 초과
							</span>
							<span className="rounded-pill border border-status-info-border bg-status-info px-3 py-1 typo-caption text-status-info-fg">
								동기화 중
							</span>
						</div>

						<div className="mt-8 flex flex-col gap-3">
							<div className="flex items-center justify-between typo-table-sm text-fg-muted">
								<span>안정 운영</span>
								<span>+18.4%</span>
							</div>
							<div className="h-2 rounded-full bg-panel-muted">
								<div className="h-full w-[72%] rounded-full bg-chart-positive" />
							</div>
							<div className="flex items-center justify-between typo-table-sm text-fg-muted">
								<span>주의 필요</span>
								<span>7 캠페인</span>
							</div>
							<div className="h-2 rounded-full bg-panel-muted">
								<div className="h-full w-[48%] rounded-full bg-chart-warning" />
							</div>
							<div className="flex items-center justify-between typo-table-sm text-fg-muted">
								<span>긴급 대응</span>
								<span>2 캠페인</span>
							</div>
							<div className="h-2 rounded-full bg-panel-muted">
								<div className="h-full w-[21%] rounded-full bg-chart-danger" />
							</div>
						</div>
					</section>*/}

					<CampaignTableCard />
				</div>
			</section>
		</main>
	);
}

export default App;
