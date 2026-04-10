import { MobileSidebarNav, SidebarNav } from "@/shared/ui/sidebar.tsx";
import { CampaignRankingTop3Card } from "@/widgets/campaign-ranking-top3/ui/campaign-ranking-top3-card";
import { CampaignTableCard } from "@/widgets/campaign-table/ui/campaign-table-card";
import { DailyTrendChartCard } from "@/widgets/daily-trend-chart/ui/daily-trend-chart-card";
import { GlobalFilterBar } from "@/widgets/global-filter/ui/global-filter-bar";
import { GlobalFilterSummary } from "@/widgets/global-filter/ui/global-filter-summary";
import { PlatformPerformanceChartCard } from "@/widgets/platform-performance-chart/ui/platform-performance-chart-card";

const sidebarItems = [{ id: "overview", label: "개요", active: true }];

function App() {
	return (
		<main className="min-h-screen overflow-x-hidden bg-canvas text-fg">
			<section className="mx-auto grid min-h-screen w-full max-w-page-max gap-panel-gap px-page-gutter py-8 xl:grid-cols-[260px_minmax(0,1fr)]">
				<SidebarNav
					className="hidden min-w-0 xl:block"
					title="Mobidays Dashboard"
					items={sidebarItems}
				/>

				<div className="min-w-0 flex flex-col gap-panel-gap">
					<header className="flex flex-col gap-3">
						<div className="xl:hidden">
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
					<section className="grid min-w-0 gap-panel-gap lg:grid-cols-2">
						<PlatformPerformanceChartCard />
						<CampaignRankingTop3Card />
					</section>

					<CampaignTableCard />
				</div>
			</section>
		</main>
	);
}

export default App;
