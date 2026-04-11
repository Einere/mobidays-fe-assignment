# Campaign Table Structure Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `src/widgets/campaign-table`의 오케스트레이션 과밀을 줄이고, 선택 초기화 정책과 props 계약을 명시적으로 정리한 뒤, 기존 동작을 유지한 채 유지보수 가능한 구조로 분해한다.

**Architecture:** 카드 컴포넌트는 조립만 담당하고, 상태 조합은 전용 view model 훅으로 모은다. 선택 초기화는 문자열 직렬화가 아니라 의미 있는 primitive 조합으로 계산한다. UI 컴포넌트는 동작을 유지하되 목적별 state 객체를 받아 결합도를 낮춘다.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library, Jotai, TanStack Query v5, existing FSD layout

---

## File Structure

- Create: `src/widgets/campaign-table/model/build-campaign-table-selection-reset-key.ts`
  - 선택 초기화 조건을 명시적으로 계산하는 순수 함수
- Create: `src/widgets/campaign-table/model/use-campaign-table-view-model.ts`
  - controls, data, selection, bulk action, create dialog를 한 번에 조립하는 view model 훅
- Modify: `src/widgets/campaign-table/ui/campaign-table-card.tsx`
  - orchestration만 남기고 렌더링은 view model 결과를 소비하도록 축소
- Modify: `src/widgets/campaign-table/ui/campaign-table-toolbar.tsx`
  - props를 `toolbarState`와 이벤트 객체로 재구성
- Modify: `src/widgets/campaign-table/ui/campaign-table-table.tsx`
  - props를 `tableState`와 이벤트 객체로 재구성
- Modify: `src/widgets/campaign-table/ui/campaign-create-dialog.tsx`
  - props를 `createDialogState`와 핸들러로 재구성
- Modify: `src/widgets/campaign-table/ui/campaign-table-status-dialog.tsx`
  - props를 `statusDialogState`와 핸들러로 재구성
- Create: `src/widgets/campaign-table/model/__tests__/build-campaign-table-selection-reset-key.test.ts`
  - 선택 초기화 정책 회귀 테스트
- Create: `src/widgets/campaign-table/model/__tests__/use-campaign-table-view-model.test.ts`
  - view model 조립이 기존 card behavior를 보존하는지 검증
- Modify: `src/widgets/campaign-table/ui/__tests__/campaign-table-card.test.tsx`
  - 카드 통합 테스트를 view model 분리 이후에도 유지

## Parallel Execution Strategy

- Worker A: 선택 초기화 정책 추출과 관련 테스트를 담당한다.
- Worker B: view model 훅 추가와 카드 축소를 담당한다.
- Worker C: toolbar/table/dialog props 계약 정리를 담당한다.
- Worker D: 카드 통합 테스트와 신규 view model 테스트를 담당한다.

이 작업들은 파일 소유권이 겹치지 않도록 순서를 나누고, 최종적으로 카드가 view model을 소비하도록 합치는 단계에서만 조인한다.

---

### Task 1: 선택 초기화 정책을 명시적인 헬퍼로 분리

**Files:**
- Create: `src/widgets/campaign-table/model/build-campaign-table-selection-reset-key.ts`
- Create: `src/widgets/campaign-table/model/__tests__/build-campaign-table-selection-reset-key.test.ts`
- Modify: `src/widgets/campaign-table/ui/campaign-table-card.tsx`
- Modify: `src/widgets/campaign-table/model/__tests__/use-campaign-table-selection.test.ts`

- [ ] **Step 1: 선택 초기화 조건의 failing test 작성**

```ts
import { describe, expect, it } from "vitest";
import { buildCampaignTableSelectionResetKey } from "@/widgets/campaign-table/model/build-campaign-table-selection-reset-key";

describe("buildCampaignTableSelectionResetKey", () => {
	it("encodes only the inputs that should reset table selection", () => {
		const key = buildCampaignTableSelectionResetKey({
			filter: {
				dateRange: { startDate: "2026-04-01", endDate: "2026-04-30" },
				statuses: ["active", "paused", "ended"],
				platforms: ["Google", "Meta", "Naver"],
			},
			page: 1,
			searchTerm: "brand",
			sort: { key: "cost", direction: "asc" },
		});

		expect(key).toBe(
			"2026-04-01|2026-04-30|active,paused,ended|Google,Meta,Naver|1|brand|cost:asc",
		);
	});

	it("changes when any reset-relevant primitive changes", () => {
		const baseKey = buildCampaignTableSelectionResetKey({
			filter: {
				dateRange: { startDate: "2026-04-01", endDate: "2026-04-30" },
				statuses: ["active", "paused", "ended"],
				platforms: ["Google", "Meta", "Naver"],
			},
			page: 1,
			searchTerm: "",
			sort: null,
		});

		const nextKey = buildCampaignTableSelectionResetKey({
			filter: {
				dateRange: { startDate: "2026-05-01", endDate: "2026-05-31" },
				statuses: ["active", "paused", "ended"],
				platforms: ["Google", "Meta", "Naver"],
			},
			page: 1,
			searchTerm: "",
			sort: null,
		});

		expect(nextKey).not.toBe(baseKey);
	});
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm run test:run -- src/widgets/campaign-table/model/__tests__/build-campaign-table-selection-reset-key.test.ts`

Expected: `FAIL` because the helper does not exist yet.

- [ ] **Step 3: 최소 구현 추가**

```ts
import type { GlobalFilterState } from "@/entities/global-filter/model/types";
import type { CampaignTableSortState } from "@/widgets/campaign-table/model/campaign-table-sort";

interface BuildCampaignTableSelectionResetKeyParams {
	filter: Pick<GlobalFilterState, "dateRange" | "statuses" | "platforms">;
	page: number;
	searchTerm: string;
	sort: CampaignTableSortState | null;
}

function joinValues(values: string[]) {
	return values.join(",");
}

export function buildCampaignTableSelectionResetKey({
	filter,
	page,
	searchTerm,
	sort,
}: BuildCampaignTableSelectionResetKeyParams) {
	const sortKey = sort === null ? "none" : `${sort.key}:${sort.direction}`;

	return [
		filter.dateRange.startDate,
		filter.dateRange.endDate,
		joinValues(filter.statuses),
		joinValues(filter.platforms),
		String(page),
		searchTerm.trim(),
		sortKey,
	].join("|");
}
```

- [ ] **Step 4: 테스트를 통과시킨다**

Run: `npm run test:run -- src/widgets/campaign-table/model/__tests__/build-campaign-table-selection-reset-key.test.ts`

Expected: `PASS`

- [ ] **Step 5: 카드에서 JSON stringify 기반 resetKey 제거**

```ts
const selectionResetKey = buildCampaignTableSelectionResetKey({
	filter,
	page: controls.page,
	searchTerm: controls.searchTerm,
	sort: controls.sort,
});
```

Expected: 선택 초기화 정책이 card 내부에서 의미를 드러내는 함수 호출로 바뀐다.

---

### Task 2: campaign-table 상태 조합을 view model 훅으로 모은다

**Files:**
- Create: `src/widgets/campaign-table/model/use-campaign-table-view-model.ts`
- Create: `src/widgets/campaign-table/model/__tests__/use-campaign-table-view-model.test.ts`
- Modify: `src/widgets/campaign-table/ui/campaign-table-card.tsx`

- [ ] **Step 1: view model 훅의 failing test 작성**

```ts
import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useCampaignTableViewModel } from "@/widgets/campaign-table/model/use-campaign-table-view-model";

describe("useCampaignTableViewModel", () => {
	it("exposes table data, selection, bulk action, and dialog state in one place", () => {
		const { result } = renderHook(() => useCampaignTableViewModel());

		expect(result.current.controls.page).toBe(1);
		expect(result.current.selection.selectedCount).toBe(0);
		expect(result.current.bulkAction.pendingStatus).toBeNull();
		expect(result.current.createDialog.open).toBe(false);
	});
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm run test:run -- src/widgets/campaign-table/model/__tests__/use-campaign-table-view-model.test.ts`

Expected: `FAIL` because the view model hook does not exist yet.

- [ ] **Step 3: 기존 훅들을 조립하는 최소 구현 추가**

```ts
import { useAtomValue } from "jotai";
import { globalFilterAtom } from "@/entities/global-filter/model/store";
import { useCampaignCreateDialog } from "@/widgets/campaign-table/model/use-campaign-create-dialog";
import { useCampaignStatusBulkAction } from "@/widgets/campaign-table/model/use-campaign-status-bulk-action";
import { useCampaignTableControls } from "@/widgets/campaign-table/model/use-campaign-table-controls";
import { useCampaignTableData } from "@/widgets/campaign-table/model/use-campaign-table-data";
import { useCampaignTableSelection } from "@/widgets/campaign-table/model/use-campaign-table-selection";
import { buildCampaignTableSelectionResetKey } from "@/widgets/campaign-table/model/build-campaign-table-selection-reset-key";

export function useCampaignTableViewModel() {
	const filter = useAtomValue(globalFilterAtom);
	const controls = useCampaignTableControls();
	const createDialog = useCampaignCreateDialog();
	const tableData = useCampaignTableData(filter, controls);
	const visibleRowIds = tableData.tableView?.rows.map((row) => row.id) ?? [];
	const selectionResetKey = buildCampaignTableSelectionResetKey({
		filter,
		page: controls.page,
		searchTerm: controls.searchTerm,
		sort: controls.sort,
	});
	const selection = useCampaignTableSelection({
		resetKey: selectionResetKey,
		visibleRowIds,
	});
	const bulkAction = useCampaignStatusBulkAction({
		selectedRowIds: selection.selectedRowIds,
		isInteractionBlocked: tableData.isShowingPlaceholderData,
		onClearSelection: selection.clearSelection,
	});

	return {
		filter,
		controls,
		createDialog,
		tableData,
		selection,
		bulkAction,
	};
}
```

- [ ] **Step 4: 카드 조립 로직을 view model 소비로 전환한다**

```ts
const viewModel = useCampaignTableViewModel();
```

Expected: `campaign-table-card.tsx`가 개별 하위 훅을 직접 오케스트레이션하지 않는다.

- [ ] **Step 5: 기존 card 통합 테스트를 돌려 회귀를 확인한다**

Run: `npm run test:run -- src/widgets/campaign-table/ui/__tests__/campaign-table-card.test.tsx`

Expected: `PASS`

---

### Task 3: toolbar/table/dialog props 계약을 목적별 객체로 정리한다

**Files:**
- Modify: `src/widgets/campaign-table/ui/campaign-table-toolbar.tsx`
- Modify: `src/widgets/campaign-table/ui/campaign-table-table.tsx`
- Modify: `src/widgets/campaign-table/ui/campaign-create-dialog.tsx`
- Modify: `src/widgets/campaign-table/ui/campaign-table-status-dialog.tsx`
- Modify: `src/widgets/campaign-table/ui/campaign-table-card.tsx`
- Modify: `src/widgets/campaign-table/ui/__tests__/campaign-table-toolbar.test.tsx`
- Modify: `src/widgets/campaign-table/ui/__tests__/campaign-create-dialog.test.tsx`
- Modify: `src/widgets/campaign-table/ui/__tests__/campaign-table-status-dialog.test.tsx`

- [ ] **Step 1: props 묶음 변경이 필요한 테스트를 먼저 식별한다**

```ts
// 예시 목표
// - toolbarState: searchInput, counts, pendingStatus, disabled flags
// - tableState: tableView, selected rows, interaction flags, sort
// - createDialogState: open, form, commonError, isSubmitting
// - statusDialogState: open, selectedCount, statusLabel, errorMessage, isSubmitting
```

- [ ] **Step 2: 각 컴포넌트의 props를 새 계약으로 바꾼다**

```ts
interface CampaignTableToolbarProps {
	toolbarState: {
		searchInput: string;
		filteredCount: number;
		totalCount: number;
		selectedCount: number;
		pendingStatus: CampaignStatus | null;
		disabled: boolean;
		canApplyStatusChange: boolean;
	};
	actions: {
		onSearchInputChange: (nextSearchInput: string) => void;
		onPendingStatusChange: (nextPendingStatus: CampaignStatus | null) => void;
		onOpenStatusDialog: () => void;
		onOpenCreateDialog?: () => void;
	};
}
```

Expected: 컴포넌트 인터페이스가 한눈에 역할별로 읽힌다.

- [ ] **Step 3: card에서 넘기는 props를 새 계약으로 맞춘다**

```ts
<CampaignTableToolbar
	toolbarState={...}
	actions={...}
/>
```

Expected: card의 JSX가 길어지더라도 상태와 이벤트 흐름이 묶여 보여 결합도가 낮아진다.

- [ ] **Step 4: UI 테스트를 수정해 새 props 계약을 고정한다**

Run:
`npm run test:run -- src/widgets/campaign-table/ui/__tests__/campaign-table-toolbar.test.tsx src/widgets/campaign-table/ui/__tests__/campaign-create-dialog.test.tsx src/widgets/campaign-table/ui/__tests__/campaign-table-status-dialog.test.tsx`

Expected: `PASS`

- [ ] **Step 5: 카드 통합 테스트로 props 변경의 부작용을 확인한다**

Run: `npm run test:run -- src/widgets/campaign-table/ui/__tests__/campaign-table-card.test.tsx`

Expected: `PASS`

---

### Task 4: 카드 오케스트레이션을 최종 정리하고 전체 회귀를 확인한다

**Files:**
- Modify: `src/widgets/campaign-table/ui/campaign-table-card.tsx`
- Modify: `src/widgets/campaign-table/model/use-campaign-table-selection.ts` if reset policy tests reveal boundary issues
- Modify: `src/widgets/campaign-table/model/use-campaign-table-controls.ts` if a reset condition needs to be surfaced more explicitly
- Modify: `src/widgets/campaign-table/model/__tests__/use-campaign-table-selection.test.ts`
- Modify: `src/widgets/campaign-table/model/__tests__/use-campaign-table-controls.test.ts`
- Modify: `src/widgets/campaign-table/model/__tests__/derive-campaign-table-view.test.ts`
- Modify: `src/widgets/campaign-table/ui/__tests__/campaign-table-card.test.tsx`

- [ ] **Step 1: card에 남아 있는 분기만 정리한다**

```ts
if (viewModel.tableData.viewState.kind === "loading") return <CampaignTableLoadingState />;
if (viewModel.tableData.viewState.kind === "full-error") return <CampaignTableErrorState />;
if (viewModel.tableData.tableView === null) return <CampaignTableLoadingState />;
```

Expected: card는 실제 데이터 로딩 상태와 렌더링 조립만 담당한다.

- [ ] **Step 2: 선택 초기화 관련 회귀를 다시 실행한다**

Run:
`npm run test:run -- src/widgets/campaign-table/model/__tests__/build-campaign-table-selection-reset-key.test.ts src/widgets/campaign-table/model/__tests__/use-campaign-table-selection.test.ts src/widgets/campaign-table/model/__tests__/use-campaign-table-controls.test.ts`

Expected: `PASS`

- [ ] **Step 3: 카드 통합 회귀를 실행한다**

Run:
`npm run test:run -- src/widgets/campaign-table/ui/__tests__/campaign-table-card.test.tsx`

Expected: `PASS`

- [ ] **Step 4: 위젯 하위 UI 회귀를 실행한다**

Run:
`npm run test:run -- src/widgets/campaign-table/ui/__tests__/campaign-table-toolbar.test.tsx src/widgets/campaign-table/ui/__tests__/campaign-create-dialog.test.tsx src/widgets/campaign-table/ui/__tests__/campaign-table-status-dialog.test.tsx`

Expected: `PASS`

- [ ] **Step 5: 전체 `campaign-table` 모델 테스트를 실행한다**

Run:
`npm run test:run -- src/widgets/campaign-table/model/__tests__`

Expected: `PASS`

---

## Review Checklist

- [ ] `campaign-table-card.tsx`가 조립 레이어로만 남았는지 확인한다.
- [ ] 선택 초기화 정책이 `JSON.stringify`가 아니라 명시적인 helper로 이동했는지 확인한다.
- [ ] toolbar/table/dialog props가 역할별 객체로 묶였는지 확인한다.
- [ ] 기존 behavior 테스트가 모두 유지되는지 확인한다.
- [ ] 신규 helper와 view model 테스트가 추가되었는지 확인한다.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-11-src-widgets-campaign-table-refactor.md`.

Two execution options:

1. Subagent-Driven (recommended) - 병렬 가능한 Task 1, 2, 3, 4를 별도 서브에이전트로 나누고, 각 task 완료 시 체크박스를 갱신한다.
2. Inline Execution - 이 세션에서 계획을 순차 실행하며 각 체크박스를 직접 갱신한다.
