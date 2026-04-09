# Campaign Management Table Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 전역 필터 결과를 기반으로 캠페인 테이블 뷰모델, 검색/정렬/페이지네이션, 선택 기반 일괄 상태 변경, 모바일 확장 UI를 갖춘 3.3 캠페인 관리 테이블을 구현한다.

**Architecture:** 기존 `useDashboardData(filter)` 조회 흐름을 유지하고, `campaigns`와 `dailyStats`를 입력으로 받는 순수 뷰모델 생성기에서 테이블 row를 계산한다. 검색/정렬/페이지네이션/선택은 위젯 로컬 상태로 관리하고, 일괄 상태 변경은 MSW 메모리 스토어를 갱신하는 mutation과 React Query invalidate로 반영한다.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library, TanStack Query v5, MSW, Tailwind CSS v4, Radix UI

---

## File Structure

- Create: `src/entities/campaign/lib/build-campaign-table-rows.ts`
  - `DashboardCampaign[]`와 `DashboardDailyStat[]`를 받아 `CampaignTableRow[]`를 계산하는 순수 함수
- Create: `src/entities/campaign/lib/__tests__/build-campaign-table-rows.test.ts`
  - 지표 계산, `null` 처리, 기간 정렬용 값, 원시 값 유지 규칙 검증
- Create: `src/entities/campaign/lib/format-campaign-table.ts`
  - 셀에서 재사용할 포맷/라벨 함수 집합
- Create: `src/entities/campaign/api/update-campaign-statuses.ts`
  - 일괄 상태 변경 API 호출 함수
- Create: `src/entities/campaign/api/use-update-campaign-statuses.ts`
  - mutation 훅과 invalidate 로직
- Modify: `src/shared/api/mock/handlers.ts`
  - `PATCH /campaigns/status` 핸들러 추가
- Create: `src/shared/api/mock/memory-db.ts`
  - 원본 `mockDb`를 복사해 세션 메모리에서 변경 가능한 DB 제공
- Create: `src/widgets/campaign-table/ui/campaign-table-card.tsx`
  - 테이블 카드 전체 조립, 조회 상태/빈 상태/오류 상태 처리
- Create: `src/widgets/campaign-table/ui/campaign-table-toolbar.tsx`
  - 검색 입력, 결과 건수, 상태 변경 드롭다운, 적용 버튼
- Create: `src/widgets/campaign-table/ui/campaign-table-status-dialog.tsx`
  - 확인 다이얼로그
- Create: `src/widgets/campaign-table/ui/campaign-table-mobile-row.tsx`
  - 모바일 확장 row 표시
- Create: `src/widgets/campaign-table/ui/__tests__/campaign-table-card.test.tsx`
  - 위젯 상호작용 테스트
- Modify: `src/widgets/campaign-table/model/use-campaign-table-controls.ts`
  - 일괄 상태 변경 대상 상태, 현재 페이지 row 선택 helpers 추가
- Modify: `src/shared/ui/table.tsx`
  - 정렬 가능한 헤더/모바일 대응이 필요하면 최소 범위 확장
- Modify: `src/App.tsx`
  - placeholder 제거 후 실제 카드 연결

## Task 1: 테이블 뷰모델 계산기 추가

**Files:**
- Create: `src/entities/campaign/lib/build-campaign-table-rows.ts`
- Test: `src/entities/campaign/lib/__tests__/build-campaign-table-rows.test.ts`

- [ ] **Step 1: 뷰모델 계산기의 failing test 작성**

```ts
import { describe, expect, it } from "vitest";
import {
	buildCampaignTableRows,
	type CampaignTableRow,
} from "@/entities/campaign/lib/build-campaign-table-rows";
import type {
	DashboardCampaign,
	DashboardDailyStat,
} from "@/entities/dashboard/api/parse-dashboard-data";

function createCampaign(
	overrides: Partial<DashboardCampaign>,
): DashboardCampaign {
	return {
		raw: {} as DashboardCampaign["raw"],
		id: "campaign-1",
		name: "브랜드 검색",
		platform: "Google",
		status: "active",
		budget: 100000,
		startDate: "2026-04-01",
		endDate: "2026-04-30",
		...overrides,
	};
}

function createDailyStat(
	overrides: Partial<DashboardDailyStat>,
): DashboardDailyStat {
	return {
		raw: {} as DashboardDailyStat["raw"],
		id: "stat-1",
		campaignId: "campaign-1",
		date: "2026-04-02",
		impressions: 1000,
		clicks: 50,
		conversions: 5,
		cost: 10000,
		conversionsValue: 40000,
		...overrides,
	};
}

describe("buildCampaignTableRows", () => {
	it("aggregates campaign stats into sortable raw row values", () => {
		const rows = buildCampaignTableRows({
			campaigns: [createCampaign({}), createCampaign({ id: "campaign-2", name: "리타겟팅" })],
			dailyStats: [
				createDailyStat({ campaignId: "campaign-1", impressions: 2000, clicks: 100, cost: 20000, conversionsValue: 60000 }),
				createDailyStat({ id: "stat-2", campaignId: "campaign-1", impressions: 1000, clicks: 50, cost: 10000, conversionsValue: 30000 }),
			],
		});

		expect(rows).toEqual<CampaignTableRow[]>([
			{
				id: "campaign-1",
				name: "브랜드 검색",
				status: "active",
				platform: "Google",
				startDate: "2026-04-01",
				endDate: "2026-04-30",
				periodSortValue: Date.parse("2026-04-01"),
				cost: 30000,
				ctr: 5,
				cpc: 200,
				roas: 300,
			},
			{
				id: "campaign-2",
				name: "리타겟팅",
				status: "active",
				platform: "Google",
				startDate: "2026-04-01",
				endDate: "2026-04-30",
				periodSortValue: Date.parse("2026-04-01"),
				cost: null,
				ctr: null,
				cpc: null,
				roas: null,
			},
		]);
	});

	it("keeps zero distinct from null and returns null on division by zero", () => {
		const rows = buildCampaignTableRows({
			campaigns: [createCampaign({})],
			dailyStats: [
				createDailyStat({
					impressions: 0,
					clicks: 0,
					cost: 0,
					conversionsValue: 0,
				}),
			],
		});

		expect(rows[0]).toMatchObject({
			cost: 0,
			ctr: null,
			cpc: null,
			roas: null,
		});
	});
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm run test:run -- src/entities/campaign/lib/__tests__/build-campaign-table-rows.test.ts`

Expected: `FAIL` with module not found or exported function missing.

- [ ] **Step 3: 최소 구현 추가**

```ts
import type {
	DashboardCampaign,
	DashboardDailyStat,
} from "@/entities/dashboard/api/parse-dashboard-data";

export interface CampaignTableRow {
	id: string;
	name: string;
	status: DashboardCampaign["status"];
	platform: DashboardCampaign["platform"];
	startDate: string | null;
	endDate: string | null;
	periodSortValue: number | null;
	cost: number | null;
	ctr: number | null;
	cpc: number | null;
	roas: number | null;
}

interface BuildCampaignTableRowsParams {
	campaigns: DashboardCampaign[];
	dailyStats: DashboardDailyStat[];
}

function sumNullable(values: Array<number | null>): number | null {
	const validValues = values.filter((value): value is number => value !== null);
	if (validValues.length === 0) {
		return null;
	}
	return validValues.reduce((sum, value) => sum + value, 0);
}

function divideOrNull(numerator: number | null, denominator: number | null) {
	if (numerator === null || denominator === null || denominator === 0) {
		return null;
	}
	return numerator / denominator;
}

export function buildCampaignTableRows({
	campaigns,
	dailyStats,
}: BuildCampaignTableRowsParams): CampaignTableRow[] {
	return campaigns.map((campaign) => {
		const stats = dailyStats.filter((item) => item.campaignId === campaign.id);
		const totalImpressions = sumNullable(stats.map((item) => item.impressions));
		const totalClicks = sumNullable(stats.map((item) => item.clicks));
		const totalCost = sumNullable(stats.map((item) => item.cost));
		const totalConversionValue = sumNullable(
			stats.map((item) => item.conversionsValue),
		);

		const ctr = divideOrNull(totalClicks, totalImpressions);
		const cpc = divideOrNull(totalCost, totalClicks);
		const roas = divideOrNull(totalConversionValue, totalCost);

		return {
			id: campaign.id,
			name: campaign.name ?? "-",
			status: campaign.status,
			platform: campaign.platform,
			startDate: campaign.startDate,
			endDate: campaign.endDate,
			periodSortValue:
				campaign.startDate === null ? null : Date.parse(campaign.startDate),
			cost: totalCost,
			ctr: ctr === null ? null : ctr * 100,
			cpc,
			roas: roas === null ? null : roas * 100,
		};
	});
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm run test:run -- src/entities/campaign/lib/__tests__/build-campaign-table-rows.test.ts`

Expected: `PASS`

- [ ] **Step 5: 커밋**

```bash
git add src/entities/campaign/lib/build-campaign-table-rows.ts src/entities/campaign/lib/__tests__/build-campaign-table-rows.test.ts
git commit -m "feat: add campaign table row builder"
```

## Task 2: 셀 포맷 함수 추가

**Files:**
- Create: `src/entities/campaign/lib/format-campaign-table.ts`
- Test: `src/entities/campaign/lib/__tests__/build-campaign-table-rows.test.ts`

- [ ] **Step 1: 포맷 함수 failing test 추가**

```ts
import {
	formatCampaignStatusLabel,
	formatCampaignMetric,
	formatCampaignPeriod,
} from "@/entities/campaign/lib/format-campaign-table";

it("formats status, period, and metric values in cells", () => {
	expect(formatCampaignStatusLabel("active")).toBe("진행 중");
	expect(formatCampaignStatusLabel("paused")).toBe("일시중지");
	expect(formatCampaignStatusLabel("ended")).toBe("종료");
	expect(formatCampaignPeriod("2026-04-01", null)).toBe("2026-04-01 ~ 진행 중");
	expect(formatCampaignMetric(null, "currency")).toBe("-");
	expect(formatCampaignMetric(0, "currency")).toBe("₩0");
	expect(formatCampaignMetric(12.34, "percent")).toBe("12.34%");
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm run test:run -- src/entities/campaign/lib/__tests__/build-campaign-table-rows.test.ts`

Expected: `FAIL` with missing formatter exports.

- [ ] **Step 3: 포맷 함수 구현**

```ts
type MetricKind = "currency" | "percent";

const currencyFormatter = new Intl.NumberFormat("ko-KR", {
	style: "currency",
	currency: "KRW",
	maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("ko-KR", {
	maximumFractionDigits: 2,
	minimumFractionDigits: 0,
});

export function formatCampaignStatusLabel(
	status: "active" | "paused" | "ended" | null,
) {
	if (status === "active") return "진행 중";
	if (status === "paused") return "일시중지";
	if (status === "ended") return "종료";
	return "-";
}

export function formatCampaignPeriod(
	startDate: string | null,
	endDate: string | null,
) {
	if (startDate === null) return "-";
	if (endDate === null) return `${startDate} ~ 진행 중`;
	return `${startDate} ~ ${endDate}`;
}

export function formatCampaignMetric(
	value: number | null,
	kind: MetricKind,
) {
	if (value === null) return "-";
	if (kind === "currency") return currencyFormatter.format(value);
	return `${numberFormatter.format(value)}%`;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm run test:run -- src/entities/campaign/lib/__tests__/build-campaign-table-rows.test.ts`

Expected: `PASS`

- [ ] **Step 5: 커밋**

```bash
git add src/entities/campaign/lib/format-campaign-table.ts src/entities/campaign/lib/__tests__/build-campaign-table-rows.test.ts
git commit -m "feat: add campaign table formatters"
```

## Task 3: 테이블 로컬 후처리 유틸과 controls 확장

**Files:**
- Modify: `src/widgets/campaign-table/model/use-campaign-table-controls.ts`
- Create: `src/widgets/campaign-table/model/derive-campaign-table-view.ts`
- Create: `src/widgets/campaign-table/model/__tests__/derive-campaign-table-view.test.ts`

- [ ] **Step 1: 검색/정렬/페이지네이션 유틸 failing test 작성**

```ts
import { describe, expect, it } from "vitest";
import { deriveCampaignTableView } from "@/widgets/campaign-table/model/derive-campaign-table-view";

const rows = [
	{ id: "1", name: "브랜드 검색", periodSortValue: 10, cost: 5000, ctr: 5, cpc: 100, roas: 300, status: "active", platform: "Google", startDate: "2026-04-01", endDate: "2026-04-30" },
	{ id: "2", name: "Retargeting", periodSortValue: 20, cost: null, ctr: null, cpc: null, roas: null, status: "paused", platform: "Meta", startDate: "2026-04-02", endDate: null },
];

describe("deriveCampaignTableView", () => {
	it("filters by trimmed case-insensitive search term and resets to page slice", () => {
		const view = deriveCampaignTableView({
			rows,
			searchTerm: "  brand ",
			page: 1,
			pageSize: 10,
			sort: null,
		});

		expect(view.totalCount).toBe(2);
		expect(view.filteredCount).toBe(1);
		expect(view.rows.map((row) => row.id)).toEqual(["1"]);
	});

	it("sorts null metric values last for both directions", () => {
		const asc = deriveCampaignTableView({
			rows,
			searchTerm: "",
			page: 1,
			pageSize: 10,
			sort: { key: "cost", direction: "asc" },
		});

		const desc = deriveCampaignTableView({
			rows,
			searchTerm: "",
			page: 1,
			pageSize: 10,
			sort: { key: "cost", direction: "desc" },
		});

		expect(asc.rows.map((row) => row.id)).toEqual(["1", "2"]);
		expect(desc.rows.map((row) => row.id)).toEqual(["1", "2"]);
	});
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm run test:run -- src/widgets/campaign-table/model/__tests__/derive-campaign-table-view.test.ts`

Expected: `FAIL` with missing file/export.

- [ ] **Step 3: 후처리 유틸과 controls 최소 구현**

```ts
import type { CampaignTableRow } from "@/entities/campaign/lib/build-campaign-table-rows";
import type { CampaignTableSortState } from "@/widgets/campaign-table/model/use-campaign-table-controls";

interface DeriveCampaignTableViewParams {
	rows: CampaignTableRow[];
	searchTerm: string;
	page: number;
	pageSize: number;
	sort: CampaignTableSortState | null;
}

function includesSearchTerm(name: string, searchTerm: string) {
	return name.toLocaleLowerCase().includes(searchTerm.trim().toLocaleLowerCase());
}

function compareNullableNumber(a: number | null, b: number | null) {
	if (a === null && b === null) return 0;
	if (a === null) return 1;
	if (b === null) return -1;
	return a - b;
}

export function deriveCampaignTableView({
	rows,
	searchTerm,
	page,
	pageSize,
	sort,
}: DeriveCampaignTableViewParams) {
	const filteredRows = searchTerm.trim().length === 0
		? rows
		: rows.filter((row) => includesSearchTerm(row.name, searchTerm));

	const sortedRows = [...filteredRows].sort((left, right) => {
		if (sort === null) return 0;
		const direction = sort.direction === "asc" ? 1 : -1;
		if (sort.key === "period") {
			return compareNullableNumber(left.periodSortValue, right.periodSortValue) * direction;
		}
		if (sort.key === "cost") return compareNullableNumber(left.cost, right.cost) * direction;
		if (sort.key === "ctr") return compareNullableNumber(left.ctr, right.ctr) * direction;
		if (sort.key === "cpc") return compareNullableNumber(left.cpc, right.cpc) * direction;
		return compareNullableNumber(left.roas, right.roas) * direction;
	});

	const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
	const safePage = Math.min(Math.max(page, 1), totalPages);
	const startIndex = (safePage - 1) * pageSize;

	return {
		totalCount: rows.length,
		filteredCount: sortedRows.length,
		totalPages,
		page: safePage,
		rows: sortedRows.slice(startIndex, startIndex + pageSize),
	};
}
```

`useCampaignTableControls.ts`에는 아래 state를 추가한다.

```ts
const [pendingStatus, setPendingStatus] = useState<CampaignStatus | null>(null);
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm run test:run -- src/widgets/campaign-table/model/__tests__/derive-campaign-table-view.test.ts`

Expected: `PASS`

- [ ] **Step 5: 커밋**

```bash
git add src/widgets/campaign-table/model/use-campaign-table-controls.ts src/widgets/campaign-table/model/derive-campaign-table-view.ts src/widgets/campaign-table/model/__tests__/derive-campaign-table-view.test.ts
git commit -m "feat: add campaign table view derivation"
```

## Task 4: 세션 메모리 DB와 상태 변경 API 추가

**Files:**
- Create: `src/shared/api/mock/memory-db.ts`
- Modify: `src/shared/api/mock/handlers.ts`
- Create: `src/entities/campaign/api/update-campaign-statuses.ts`
- Create: `src/entities/campaign/api/use-update-campaign-statuses.ts`
- Test: `src/widgets/campaign-table/ui/__tests__/campaign-table-card.test.tsx`

- [ ] **Step 1: mutation 흐름 failing test 작성**

```ts
it("updates selected campaign statuses only after confirm and refetches rows", async () => {
	renderCampaignTable();

	await screen.findByText("브랜드 검색");
	await user.click(screen.getByRole("checkbox", { name: "브랜드 검색 선택" }));
	await user.selectOptions(screen.getByLabelText("변경할 상태"), "paused");
	await user.click(screen.getByRole("button", { name: "적용" }));

	expect(screen.getByRole("dialog")).toBeInTheDocument();
	expect(screen.getByText("선택 1건을 일시중지로 변경합니다.")).toBeInTheDocument();

	await user.click(screen.getByRole("button", { name: "확인" }));

	await waitFor(() => {
		expect(screen.getByText("일시중지")).toBeInTheDocument();
	});
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm run test:run -- src/widgets/campaign-table/ui/__tests__/campaign-table-card.test.tsx -t "updates selected campaign statuses only after confirm and refetches rows"`

Expected: `FAIL`

- [ ] **Step 3: 세션 메모리 DB와 mutation API 구현**

`src/shared/api/mock/memory-db.ts`

```ts
import { mockDb } from "@/shared/api/mock/db";

function cloneDb() {
	return {
		campaigns: mockDb.campaigns.map((campaign) => ({ ...campaign })),
		daily_stats: mockDb.daily_stats.map((item) => ({ ...item })),
	};
}

let memoryDb = cloneDb();

export function getMemoryDb() {
	return memoryDb;
}

export function resetMemoryDb() {
	memoryDb = cloneDb();
}

export function updateCampaignStatuses(ids: string[], status: "active" | "paused" | "ended") {
	memoryDb = {
		...memoryDb,
		campaigns: memoryDb.campaigns.map((campaign) =>
			ids.includes(campaign.id) ? { ...campaign, status } : campaign,
		),
	};
}
```

`src/shared/api/mock/handlers.ts`

```ts
import { getMemoryDb, updateCampaignStatuses } from "@/shared/api/mock/memory-db";

http.patch("/campaigns/status", async ({ request }) => {
	const body = (await request.json()) as {
		ids: string[];
		status: "active" | "paused" | "ended";
	};

	updateCampaignStatuses(body.ids, body.status);

	return HttpResponse.json({ updatedIds: body.ids, status: body.status });
});
```

`src/entities/campaign/api/update-campaign-statuses.ts`

```ts
export async function updateCampaignStatuses(input: {
	ids: string[];
	status: "active" | "paused" | "ended";
}) {
	const response = await fetch("/campaigns/status", {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});

	if (!response.ok) {
		throw new Error("캠페인 상태 변경에 실패했습니다.");
	}

	return response.json();
}
```

`src/entities/campaign/api/use-update-campaign-statuses.ts`

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateCampaignStatuses } from "@/entities/campaign/api/update-campaign-statuses";
import { createDashboardDataQueryKey } from "@/entities/dashboard/api/use-dashboard-data";
import type { GlobalFilterState } from "@/entities/global-filter/model/types";

export function useUpdateCampaignStatuses(filter: GlobalFilterState) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: updateCampaignStatuses,
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: createDashboardDataQueryKey(filter),
			});
		},
	});
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm run test:run -- src/widgets/campaign-table/ui/__tests__/campaign-table-card.test.tsx -t "updates selected campaign statuses only after confirm and refetches rows"`

Expected: `PASS`

- [ ] **Step 5: 커밋**

```bash
git add src/shared/api/mock/memory-db.ts src/shared/api/mock/handlers.ts src/entities/campaign/api/update-campaign-statuses.ts src/entities/campaign/api/use-update-campaign-statuses.ts src/widgets/campaign-table/ui/__tests__/campaign-table-card.test.tsx
git commit -m "feat: add campaign status batch update flow"
```

## Task 5: 캠페인 테이블 카드 UI 구현

**Files:**
- Create: `src/widgets/campaign-table/ui/campaign-table-card.tsx`
- Create: `src/widgets/campaign-table/ui/campaign-table-toolbar.tsx`
- Create: `src/widgets/campaign-table/ui/campaign-table-status-dialog.tsx`
- Modify: `src/shared/ui/table.tsx`
- Modify: `src/App.tsx`
- Test: `src/widgets/campaign-table/ui/__tests__/campaign-table-card.test.tsx`

- [ ] **Step 1: 위젯 렌더링 failing test 작성**

```ts
it("renders campaign rows with search, counts, and sortable columns", async () => {
	renderCampaignTable();

	await screen.findByText("브랜드 검색");

	expect(screen.getByRole("searchbox", { name: "캠페인 검색" })).toBeInTheDocument();
	expect(screen.getByText("2 / 2")).toBeInTheDocument();
	expect(screen.getByRole("columnheader", { name: "집행기간" })).toBeInTheDocument();
	expect(screen.getByRole("columnheader", { name: "총 집행금액" })).toBeInTheDocument();
	expect(screen.getByRole("columnheader", { name: "CTR" })).toBeInTheDocument();
	expect(screen.getByRole("columnheader", { name: "CPC" })).toBeInTheDocument();
	expect(screen.getByRole("columnheader", { name: "ROAS" })).toBeInTheDocument();
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm run test:run -- src/widgets/campaign-table/ui/__tests__/campaign-table-card.test.tsx -t "renders campaign rows with search, counts, and sortable columns"`

Expected: `FAIL`

- [ ] **Step 3: 카드와 툴바 최소 구현**

`src/widgets/campaign-table/ui/campaign-table-card.tsx`

```tsx
import { useMemo, useState } from "react";
import { useAtomValue } from "jotai";
import { buildCampaignTableRows } from "@/entities/campaign/lib/build-campaign-table-rows";
import {
	formatCampaignMetric,
	formatCampaignPeriod,
	formatCampaignStatusLabel,
} from "@/entities/campaign/lib/format-campaign-table";
import { useDashboardData } from "@/entities/dashboard/api/use-dashboard-data";
import { globalFilterAtom } from "@/entities/global-filter/model/store";
import { DataTable } from "@/shared/ui/table";
import { deriveCampaignTableView } from "@/widgets/campaign-table/model/derive-campaign-table-view";
import { useCampaignTableControls } from "@/widgets/campaign-table/model/use-campaign-table-controls";
import { CampaignTableStatusDialog } from "@/widgets/campaign-table/ui/campaign-table-status-dialog";
import { CampaignTableToolbar } from "@/widgets/campaign-table/ui/campaign-table-toolbar";

export function CampaignTableCard() {
	const filter = useAtomValue(globalFilterAtom);
	const controls = useCampaignTableControls();
	const query = useDashboardData(filter);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	const rows = useMemo(() => {
		if (!query.data) return [];
		return buildCampaignTableRows(query.data);
	}, [query.data]);

	const view = useMemo(
		() =>
			deriveCampaignTableView({
				rows,
				searchTerm: controls.searchTerm,
				page: controls.page,
				pageSize: 10,
				sort: controls.sort,
			}),
		[rows, controls.searchTerm, controls.page, controls.sort],
	);

	if (query.isPending) return <section>테이블 로딩 중...</section>;
	if (query.isError) return <section>테이블을 불러오지 못했습니다.</section>;

	return (
		<section className="rounded-panel border border-outline-subtle bg-panel p-panel shadow-panel">
			<CampaignTableToolbar
				controls={controls}
				filteredCount={view.filteredCount}
				totalCount={view.totalCount}
				onOpenConfirm={() => setIsDialogOpen(true)}
			/>
			<DataTable
				caption="캠페인 관리 테이블"
				columns={[
					{ key: "name", header: "캠페인명" },
					{ key: "status", header: "상태" },
					{ key: "platform", header: "매체" },
					{ key: "period", header: "집행기간" },
					{ key: "cost", header: "총 집행금액", align: "right" },
					{ key: "ctr", header: "CTR", align: "right" },
					{ key: "cpc", header: "CPC", align: "right" },
					{ key: "roas", header: "ROAS", align: "right" },
				]}
				rows={view.rows.map((row) => ({
					id: row.id,
					name: row.name,
					status: formatCampaignStatusLabel(row.status),
					platform: row.platform ?? "-",
					period: formatCampaignPeriod(row.startDate, row.endDate),
					cost: formatCampaignMetric(row.cost, "currency"),
					ctr: formatCampaignMetric(row.ctr, "percent"),
					cpc: row.cpc === null ? "-" : formatCampaignMetric(row.cpc, "currency"),
					roas: formatCampaignMetric(row.roas, "percent"),
				}))}
			/>
			<CampaignTableStatusDialog
				open={isDialogOpen}
				selectedCount={controls.selectedRowIds.length}
				status={controls.pendingStatus}
				onOpenChange={setIsDialogOpen}
			/>
		</section>
	);
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm run test:run -- src/widgets/campaign-table/ui/__tests__/campaign-table-card.test.tsx -t "renders campaign rows with search, counts, and sortable columns"`

Expected: `PASS`

- [ ] **Step 5: 커밋**

```bash
git add src/widgets/campaign-table/ui/campaign-table-card.tsx src/widgets/campaign-table/ui/campaign-table-toolbar.tsx src/widgets/campaign-table/ui/campaign-table-status-dialog.tsx src/shared/ui/table.tsx src/App.tsx src/widgets/campaign-table/ui/__tests__/campaign-table-card.test.tsx
git commit -m "feat: add campaign table card UI"
```

## Task 6: 정렬, 페이지네이션, 선택 상태 UI 완성

**Files:**
- Modify: `src/widgets/campaign-table/ui/campaign-table-card.tsx`
- Modify: `src/widgets/campaign-table/model/use-campaign-table-controls.ts`
- Test: `src/widgets/campaign-table/ui/__tests__/campaign-table-card.test.tsx`

- [ ] **Step 1: 상호작용 failing test 작성**

```ts
it("sorts rows, paginates 10 per page, and keeps selection across pages", async () => {
	renderCampaignTableWithManyRows();

	await screen.findByText("캠페인 01");
	await user.click(screen.getByRole("columnheader", { name: "총 집행금액" }));
	await user.click(screen.getByRole("checkbox", { name: "캠페인 01 선택" }));
	await user.click(screen.getByRole("button", { name: "다음" }));

	expect(screen.getByText("페이지 2 / 2")).toBeInTheDocument();
	expect(screen.getByText("선택 1건")).toBeInTheDocument();
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm run test:run -- src/widgets/campaign-table/ui/__tests__/campaign-table-card.test.tsx -t "sorts rows, paginates 10 per page, and keeps selection across pages"`

Expected: `FAIL`

- [ ] **Step 3: 상호작용 구현**

```tsx
<button
	type="button"
	onClick={() => controls.toggleSort("cost")}
>
	총 집행금액
</button>

<Button
	type="button"
	size="sm"
	variant="outline"
	disabled={view.page === 1}
	onClick={() => controls.setPage(view.page - 1)}
>
	이전
</Button>

<Button
	type="button"
	size="sm"
	variant="outline"
	disabled={view.page === view.totalPages}
	onClick={() => controls.setPage(view.page + 1)}
>
	다음
</Button>
```

`useCampaignTableControls.ts`에는 현재 페이지 row IDs를 받아 헤더 선택을 처리하는 helper를 추가한다.

```ts
function togglePageSelection(pageRowIds: string[]) {
	setSelectedRowIds((current) => {
		const pageSelected = pageRowIds.every((id) => current.includes(id));
		if (pageSelected) {
			return current.filter((id) => !pageRowIds.includes(id));
		}
		return Array.from(new Set([...current, ...pageRowIds]));
	});
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm run test:run -- src/widgets/campaign-table/ui/__tests__/campaign-table-card.test.tsx -t "sorts rows, paginates 10 per page, and keeps selection across pages"`

Expected: `PASS`

- [ ] **Step 5: 커밋**

```bash
git add src/widgets/campaign-table/ui/campaign-table-card.tsx src/widgets/campaign-table/model/use-campaign-table-controls.ts src/widgets/campaign-table/ui/__tests__/campaign-table-card.test.tsx
git commit -m "feat: add campaign table sorting paging selection"
```

## Task 7: 확인 다이얼로그와 mutation 연결 완성

**Files:**
- Modify: `src/widgets/campaign-table/ui/campaign-table-status-dialog.tsx`
- Modify: `src/widgets/campaign-table/ui/campaign-table-card.tsx`
- Modify: `src/widgets/campaign-table/ui/campaign-table-toolbar.tsx`
- Test: `src/widgets/campaign-table/ui/__tests__/campaign-table-card.test.tsx`

- [ ] **Step 1: 다이얼로그 제약 failing test 작성**

```ts
it("disables batch action until rows and target status are selected", async () => {
	renderCampaignTable();

	await screen.findByText("브랜드 검색");

	expect(screen.getByRole("button", { name: "적용" })).toBeDisabled();

	await user.click(screen.getByRole("checkbox", { name: "브랜드 검색 선택" }));
	expect(screen.getByRole("button", { name: "적용" })).toBeDisabled();

	await user.selectOptions(screen.getByLabelText("변경할 상태"), "ended");
	expect(screen.getByRole("button", { name: "적용" })).toBeEnabled();
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm run test:run -- src/widgets/campaign-table/ui/__tests__/campaign-table-card.test.tsx -t "disables batch action until rows and target status are selected"`

Expected: `FAIL`

- [ ] **Step 3: 다이얼로그와 mutation 연결 구현**

```tsx
const updateMutation = useUpdateCampaignStatuses(filter);
const canApply =
	controls.selectedRowIds.length > 0 && controls.pendingStatus !== null;

async function handleConfirmStatusChange() {
	if (!controls.pendingStatus) return;

	await updateMutation.mutateAsync({
		ids: controls.selectedRowIds,
		status: controls.pendingStatus,
	});

	controls.setSelectedRowIds([]);
	controls.setPendingStatus(null);
	setIsDialogOpen(false);
}
```

`campaign-table-status-dialog.tsx`

```tsx
import * as Dialog from "@radix-ui/react-dialog";

export function CampaignTableStatusDialog(props: {
	open: boolean;
	selectedCount: number;
	status: "active" | "paused" | "ended" | null;
	onConfirm: () => void;
	onOpenChange: (open: boolean) => void;
}) {
	return (
		<Dialog.Root open={props.open} onOpenChange={props.onOpenChange}>
			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 bg-slate-950/30" />
				<Dialog.Content className="fixed top-1/2 left-1/2 w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-panel bg-panel p-panel shadow-popover">
					<Dialog.Title>상태 일괄 변경 확인</Dialog.Title>
					<p className="mt-3 text-body-sm text-fg-muted">
						선택 {props.selectedCount}건을 {formatCampaignStatusLabel(props.status)}로 변경합니다.
					</p>
					<div className="mt-6 flex justify-end gap-2">
						<button type="button" onClick={() => props.onOpenChange(false)}>취소</button>
						<button type="button" onClick={props.onConfirm}>확인</button>
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm run test:run -- src/widgets/campaign-table/ui/__tests__/campaign-table-card.test.tsx -t "disables batch action until rows and target status are selected"`

Expected: `PASS`

- [ ] **Step 5: 커밋**

```bash
git add src/widgets/campaign-table/ui/campaign-table-status-dialog.tsx src/widgets/campaign-table/ui/campaign-table-card.tsx src/widgets/campaign-table/ui/campaign-table-toolbar.tsx src/widgets/campaign-table/ui/__tests__/campaign-table-card.test.tsx
git commit -m "feat: add campaign table status confirmation dialog"
```

## Task 8: 모바일 확장 행과 empty/error 상태 마무리

**Files:**
- Create: `src/widgets/campaign-table/ui/campaign-table-mobile-row.tsx`
- Modify: `src/widgets/campaign-table/ui/campaign-table-card.tsx`
- Test: `src/widgets/campaign-table/ui/__tests__/campaign-table-card.test.tsx`

- [ ] **Step 1: 모바일/empty state failing test 작성**

```ts
it("shows a separate empty state for no filtered campaigns and no search results", async () => {
	renderCampaignTableWithEmptyData();
	expect(await screen.findByText("조건에 맞는 캠페인이 없습니다.")).toBeInTheDocument();

	renderCampaignTable();
	await screen.findByText("브랜드 검색");
	await user.type(screen.getByRole("searchbox", { name: "캠페인 검색" }), "없는 이름");
	expect(screen.getByText("검색 결과가 없습니다.")).toBeInTheDocument();
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm run test:run -- src/widgets/campaign-table/ui/__tests__/campaign-table-card.test.tsx -t "shows a separate empty state for no filtered campaigns and no search results"`

Expected: `FAIL`

- [ ] **Step 3: 모바일/empty state 구현**

```tsx
if (rows.length === 0) {
	return <section>조건에 맞는 캠페인이 없습니다.</section>;
}

if (view.filteredCount === 0) {
	return (
		<section>
			<CampaignTableToolbar ... />
			<p className="mt-6 text-body-sm text-fg-muted">검색 결과가 없습니다.</p>
		</section>
	);
}

<div className="md:hidden">
	{view.rows.map((row) => (
		<CampaignTableMobileRow key={row.id} row={row} />
	))}
</div>
<div className="hidden md:block">
	<DataTable ... />
</div>
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm run test:run -- src/widgets/campaign-table/ui/__tests__/campaign-table-card.test.tsx -t "shows a separate empty state for no filtered campaigns and no search results"`

Expected: `PASS`

- [ ] **Step 5: 커밋**

```bash
git add src/widgets/campaign-table/ui/campaign-table-mobile-row.tsx src/widgets/campaign-table/ui/campaign-table-card.tsx src/widgets/campaign-table/ui/__tests__/campaign-table-card.test.tsx
git commit -m "feat: add responsive campaign table states"
```

## Task 9: 최종 검증과 정리

**Files:**
- Verify: `src/entities/campaign/lib/build-campaign-table-rows.ts`
- Verify: `src/entities/campaign/lib/format-campaign-table.ts`
- Verify: `src/widgets/campaign-table/model/use-campaign-table-controls.ts`
- Verify: `src/widgets/campaign-table/ui/campaign-table-card.tsx`
- Verify: `src/widgets/campaign-table/ui/__tests__/campaign-table-card.test.tsx`

- [ ] **Step 1: 캠페인 테이블 관련 테스트 전체 실행**

Run: `npm run test:run -- src/entities/campaign/lib/__tests__/build-campaign-table-rows.test.ts src/widgets/campaign-table/model/__tests__/derive-campaign-table-view.test.ts src/widgets/campaign-table/ui/__tests__/campaign-table-card.test.tsx`

Expected: `PASS`

- [ ] **Step 2: 린트 실행**

Run: `npm run lint`

Expected: `Checked X files in Yms. No fixes applied.`

- [ ] **Step 3: 프로덕션 빌드 실행**

Run: `npm run build`

Expected: `vite build` 완료와 산출물 생성

- [ ] **Step 4: 최종 커밋**

```bash
git add src/App.tsx src/entities/campaign src/shared/api/mock src/shared/ui/table.tsx src/widgets/campaign-table docs/superpowers/specs/2026-04-09-campaign-management-table-design.md docs/superpowers/plans/2026-04-09-campaign-management-table.md
git commit -m "feat: implement campaign management table"
```

## Self-Review

- Spec coverage:
  - 뷰모델 계산: Task 1
  - 셀 포맷 분리: Task 2
  - 검색/정렬/페이지네이션: Task 3, Task 6
  - MSW 메모리 상태 변경과 invalidate: Task 4, Task 7
  - 확인 다이얼로그: Task 7
  - 모바일 확장과 empty/error 상태: Task 8
  - 통합 검증: Task 9
- Placeholder scan:
  - `TODO`, `TBD`, `implement later` 없음
  - 각 작업에 파일 경로, 테스트, 실행 명령 포함
- Type consistency:
  - `CampaignTableRow`, `deriveCampaignTableView`, `useUpdateCampaignStatuses`, `pendingStatus` 이름을 모든 task에서 일관되게 사용

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-09-campaign-management-table.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
