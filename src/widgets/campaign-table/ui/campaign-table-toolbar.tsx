import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import type { CampaignStatus } from "@/entities/global-filter/model/types";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { Button } from "@/shared/ui/button";
import { TextInput } from "@/shared/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/select";

const SEARCH_DEBOUNCE_DELAY = 300;

interface CampaignTableToolbarProps {
	searchTerm: string;
	filteredCount: number;
	totalCount: number;
	selectedCount: number;
	pendingStatus: CampaignStatus | null;
	disabled: boolean;
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
	disabled,
	canApplyStatusChange,
	onSearchTermChange,
	onPendingStatusChange,
	onOpenStatusDialog,
}: CampaignTableToolbarProps) {
	const [draftSearchTerm, setDraftSearchTerm] = useState(searchTerm);
	const debouncedSearchTerm = useDebouncedValue(
		draftSearchTerm,
		SEARCH_DEBOUNCE_DELAY,
	);
	const isStatusControlDisabled = disabled || selectedCount === 0;

	useEffect(() => {
		setDraftSearchTerm(searchTerm);
	}, [searchTerm]);

	useEffect(() => {
		if (debouncedSearchTerm === searchTerm) {
			return;
		}

		onSearchTermChange(debouncedSearchTerm);
	}, [debouncedSearchTerm, onSearchTermChange, searchTerm]);

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
							disabled={disabled}
							placeholder="캠페인명 검색"
							type="search"
							value={draftSearchTerm}
							onChange={(event) => setDraftSearchTerm(event.target.value)}
						/>
					</div>
					<div className="min-w-[140px]">
						<Select
							disabled={isStatusControlDisabled}
							value={pendingStatus ?? ""}
							onValueChange={(value) =>
								onPendingStatusChange(
									value === "" ? null : (value as CampaignStatus),
								)
							}
						>
							<SelectTrigger aria-label="변경할 상태">
								<SelectValue placeholder="상태 선택" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="active">진행 중</SelectItem>
								<SelectItem value="paused">일시중지</SelectItem>
								<SelectItem value="ended">종료</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<Button
						type="button"
						variant="secondary"
						disabled={isStatusControlDisabled || !canApplyStatusChange}
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
