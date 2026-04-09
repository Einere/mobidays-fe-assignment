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

					<CampaignTableCard />
				</div>
			</section>
		</main>
	);
}

export default App;
