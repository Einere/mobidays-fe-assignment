import type { ReactNode } from "react";

type PlatformPerformanceChartFrameProps = {
	children: ReactNode;
	status?: ReactNode;
	titleTrailing?: ReactNode;
};

export function PlatformPerformanceChartFrame({
	children,
	status,
	titleTrailing,
}: PlatformPerformanceChartFrameProps) {
	return (
		<section className="rounded-panel border border-outline-subtle bg-panel p-panel shadow-panel">
			<div className="flex flex-col gap-5">
				<div className="flex flex-col gap-2">
					<div className="flex items-center gap-2">
						<h2>플랫폼별 성과</h2>
						{titleTrailing ?? null}
					</div>
					<p className="typo-body-sm text-fg-muted">
						전역 필터 기준으로 플랫폼별 성과를 집계한 도넛 차트입니다.
					</p>
				</div>

				{status ? <div className="min-h-5">{status}</div> : null}
				{children}
			</div>
		</section>
	);
}
