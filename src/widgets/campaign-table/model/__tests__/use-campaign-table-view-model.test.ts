import { renderHook } from "@testing-library/react";
import { useAtomValue } from "jotai";
import type { UseFormReturn } from "react-hook-form";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CampaignTableRow } from "@/entities/campaign/lib/build-campaign-table-rows";
import type { CreateCampaignFormValues } from "@/entities/campaign/lib/create-campaign-schema";
import type { GlobalFilterState } from "@/entities/global-filter/model/types";
import { buildCampaignTableSelectionResetKey } from "@/widgets/campaign-table/model/build-campaign-table-selection-reset-key";
import { useCampaignCreateDialog } from "@/widgets/campaign-table/model/use-campaign-create-dialog";
import { useCampaignStatusBulkAction } from "@/widgets/campaign-table/model/use-campaign-status-bulk-action";
import { useCampaignTableControls } from "@/widgets/campaign-table/model/use-campaign-table-controls";
import { useCampaignTableData } from "@/widgets/campaign-table/model/use-campaign-table-data";
import { useCampaignTableSelection } from "@/widgets/campaign-table/model/use-campaign-table-selection";
import type {
	CampaignTableCreateDialogState,
	CampaignTableTableState,
} from "@/widgets/campaign-table/model/use-campaign-table-view-model";
import { useCampaignTableViewModel } from "@/widgets/campaign-table/model/use-campaign-table-view-model";

vi.mock("jotai", async (importOriginal) => {
	const actual = await importOriginal<typeof import("jotai")>();

	return {
		...actual,
		useAtomValue: vi.fn(),
	};
});

vi.mock("@/widgets/campaign-table/model/use-campaign-table-controls", () => ({
	useCampaignTableControls: vi.fn(),
}));

vi.mock("@/widgets/campaign-table/model/use-campaign-create-dialog", () => ({
	useCampaignCreateDialog: vi.fn(),
}));

vi.mock("@/widgets/campaign-table/model/use-campaign-table-data", () => ({
	useCampaignTableData: vi.fn(),
}));

vi.mock("@/widgets/campaign-table/model/use-campaign-table-selection", () => ({
	useCampaignTableSelection: vi.fn(),
}));

vi.mock(
	"@/widgets/campaign-table/model/use-campaign-status-bulk-action",
	() => ({
		useCampaignStatusBulkAction: vi.fn(),
	}),
);

const mockFilter: GlobalFilterState = {
	dateRange: {
		startDate: "2026-04-01",
		endDate: "2026-04-30",
	},
	statuses: ["active", "paused", "ended"],
	platforms: ["Google", "Meta", "Naver"],
};

const mockControls = {
	searchInput: "브랜드",
	searchTerm: "브랜드",
	page: 2,
	sort: {
		key: "cost" as const,
		direction: "asc" as const,
	},
	setSearchInput: vi.fn(),
	setPage: vi.fn(),
	toggleSort: vi.fn(),
};

const mockCreateDialog: CampaignTableCreateDialogState = {
	open: false,
	form: {} as UseFormReturn<CreateCampaignFormValues>,
	isSubmitting: false,
	commonError: null,
	openDialog: vi.fn(),
	setOpen: vi.fn(),
	submit: vi.fn(),
};

const mockRawTableData = {
	viewState: {
		kind: "table" as const,
		rows: [],
		isSyncing: false,
		staleErrorMessage: null,
	},
	tableView: {
		rows: [
			{
				id: "campaign-1",
				name: "브랜드 검색",
				status: "active",
				platform: "Google",
				startDate: "2026-04-01",
				endDate: "2026-04-30",
				periodSortValue: Date.parse("2026-04-01"),
				cost: 1000,
				ctr: 12,
				cpc: 24,
				roas: 300,
			},
			{
				id: "campaign-2",
				name: "리타겟팅",
				status: "paused",
				platform: "Meta",
				startDate: "2026-04-10",
				endDate: "2026-04-20",
				periodSortValue: Date.parse("2026-04-10"),
				cost: 2000,
				ctr: 8,
				cpc: 32,
				roas: 220,
			},
		] satisfies CampaignTableRow[],
		filteredCount: 2,
		totalCount: 2,
		page: 1,
		totalPages: 1,
	},
	isShowingPlaceholderData: true,
} satisfies ReturnType<typeof useCampaignTableData>;

const mockTableData: CampaignTableTableState = {
	kind: "table",
	viewState: {
		kind: "table" as const,
		rows: [],
		isSyncing: false,
		staleErrorMessage: null,
	},
	tableView: {
		rows: mockRawTableData.tableView.rows,
		filteredCount: 2,
		totalCount: 2,
		page: 1,
		totalPages: 1,
	},
	isShowingPlaceholderData: true,
};

const mockLoadingTableData = {
	viewState: {
		kind: "loading",
	},
	tableView: null,
	isShowingPlaceholderData: true,
} satisfies ReturnType<typeof useCampaignTableData>;

const mockSelection = {
	selectedRowIds: ["campaign-1"],
	selectedCount: 1,
	areAllVisibleRowsSelected: false,
	isPartiallySelected: true,
	toggleRowSelection: vi.fn(),
	togglePageSelection: vi.fn(),
	clearSelection: vi.fn(),
};

const mockBulkAction = {
	pendingStatus: null,
	pendingStatusLabel: "-",
	isDialogOpen: false,
	errorMessage: null,
	isSubmitting: false,
	canOpenDialog: false,
	canConfirm: false,
	setPendingStatus: vi.fn(),
	openDialog: vi.fn(),
	setDialogOpen: vi.fn(),
	confirm: vi.fn(),
};

describe("useCampaignTableViewModel", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(useAtomValue).mockReturnValue(mockFilter);
		vi.mocked(useCampaignTableControls).mockReturnValue(mockControls);
		vi.mocked(useCampaignCreateDialog).mockReturnValue(mockCreateDialog);
		vi.mocked(useCampaignTableData).mockReturnValue(mockRawTableData);
		vi.mocked(useCampaignTableSelection).mockReturnValue(mockSelection);
		vi.mocked(useCampaignStatusBulkAction).mockReturnValue(mockBulkAction);
	});

	it("combines controls, data, selection, bulk action, and create dialog state", () => {
		const { result } = renderHook(() => useCampaignTableViewModel());

		expect(result.current.controls).toBe(mockControls);
		expect(result.current.tableData).toStrictEqual(mockTableData);
		expect(result.current.selection).toBe(mockSelection);
		expect(result.current.bulkAction).toBe(mockBulkAction);
		expect(result.current.createDialog).toBe(mockCreateDialog);
	});

	it("wires selection reset and bulk action inputs from the composed state", () => {
		renderHook(() => useCampaignTableViewModel());

		expect(useCampaignTableSelection).toHaveBeenCalledWith({
			resetKey: buildCampaignTableSelectionResetKey({
				filter: mockFilter,
				page: mockControls.page,
				searchTerm: mockControls.searchTerm,
				sort: mockControls.sort,
			}),
			visibleRowIds:
				mockRawTableData.tableView?.rows.map((row) => row.id) ?? [],
		});
		expect(useCampaignStatusBulkAction).toHaveBeenCalledWith({
			selectedRowIds: mockSelection.selectedRowIds,
			isInteractionBlocked: true,
			onClearSelection: mockSelection.clearSelection,
		});
	});

	it("preserves the loading shape when table data is not ready", () => {
		vi.mocked(useCampaignTableData).mockReturnValue(mockLoadingTableData);

		const { result } = renderHook(() => useCampaignTableViewModel());

		expect(result.current.tableData.kind).toBe("loading");
		expect(result.current.tableData.tableView).toBeNull();
	});
});
