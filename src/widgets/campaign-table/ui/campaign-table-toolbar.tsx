import { Search } from "lucide-react";
import type { CampaignStatus } from "@/entities/global-filter/model/types";
import { Button } from "@/shared/ui/button";
import { TextInput } from "@/shared/ui/input";

interface CampaignTableToolbarProps {
	searchTerm: string;
	filteredCount: number;
	totalCount: number;
	selectedCount: number;
	pendingStatus: CampaignStatus | null;
	canApplyStatusChange: boolean;
	onSearchTermChange: (nextSearchTerm: string) => void;
	onPendingStatusChange: (nextPendingStatus: CampaignStatus | null) => void;
	onOpenStatusDialog: () => void;
}

export function CampaignTableToolbar({
	searchTerm,
	filteredCount,
	totalCount,
	selectedCount,
	pendingStatus,
	canApplyStatusChange,
	onSearchTermChange,
	onPendingStatusChange,
	onOpenStatusDialog,
}: CampaignTableToolbarProps) {
	return (
		<div className="flex flex-col gap-4 border-b border-outline-subtle pb-4">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div className="flex flex-col gap-1">
					<h2>캠페인 현황</h2>
					<p className="text-body-sm text-fg-muted">
						전역 필터 기준으로 집계한 캠페인별 운영 성과입니다.
					</p>
				</div>

				<div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
					<div className="relative min-w-[240px] flex-1 lg:w-[280px] lg:flex-none">
						<Search
							aria-hidden="true"
							className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-fg-subtle"
						/>
						<TextInput
							aria-label="캠페인 검색"
							className="pl-9"
							placeholder="캠페인명 검색"
							type="search"
							value={searchTerm}
							onChange={(event) => onSearchTermChange(event.target.value)}
						/>
					</div>
					<label className="flex min-w-[140px] flex-col gap-1 text-body-sm text-fg-muted">
						<span className="sr-only">변경할 상태</span>
						<select
							aria-label="변경할 상태"
							className="flex h-control-md w-full rounded-md border border-outline bg-panel px-3 text-fg outline-none transition-colors duration-[var(--duration-fast)] ease-standard hover:border-outline-strong focus-visible:ring-2 focus-visible:ring-focus"
							value={pendingStatus ?? ""}
							onChange={(event) =>
								onPendingStatusChange(
									event.target.value === ""
										? null
										: (event.target.value as CampaignStatus),
								)
							}
						>
							<option value="">상태 선택</option>
							<option value="active">진행 중</option>
							<option value="paused">일시중지</option>
							<option value="ended">종료</option>
						</select>
					</label>
					<Button
						type="button"
						variant="secondary"
						disabled={!canApplyStatusChange}
						onClick={onOpenStatusDialog}
					>
						상태 적용
					</Button>
				</div>
			</div>

			<div className="flex flex-col gap-2 text-body-sm text-fg-muted sm:flex-row sm:items-center sm:justify-between">
				<p>
					총 {totalCount}건 중 {filteredCount}건 표시
				</p>
				<p>선택 {selectedCount}건</p>
			</div>
		</div>
	);
}
