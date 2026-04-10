# Campaign Registration Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 3.4 캠페인 등록 모달을 추가해 새 캠페인을 MSW 인메모리 DB에 생성하고, 등록 성공 시 전역 필터 기준으로 캠페인 테이블과 대시보드 차트가 새로고침 없이 함께 갱신되게 한다.

**Architecture:** 생성 흐름은 `entities/campaign`에 `zod` 기반 스키마, payload 변환, create mutation을 두고, `widgets/campaign-table`에 `react-hook-form` 기반 모달 상태와 shadcn `Dialog` UI를 둔다. 이 기능에서 발생하는 모든 토스트 피드백은 `sonner`로 통일하고, 생성 성공 후에는 `useDashboardData(filter)` query invalidate만 수행해 테이블과 차트가 같은 재조회 결과를 소비하게 유지한다.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library, TanStack Query v5, MSW, shadcn/ui (`Dialog`), `react-hook-form`, `zod`, `@hookform/resolvers`, `sonner`

---

## File Structure

- Modify: `package.json`
  - `sonner`, `@hookform/resolvers` 의존성 추가
- Modify: `package-lock.json`
  - 신규 의존성 lockfile 반영
- Create: `src/shared/ui/dialog.tsx`
  - shadcn 스타일 `Dialog` 래퍼
- Create: `src/shared/ui/sonner.tsx`
  - shadcn 스타일 `Toaster` 래퍼
- Modify: `src/app/providers/app-providers.tsx`
  - 전역 `Toaster` 마운트
- Create: `src/entities/campaign/lib/create-campaign-schema.ts`
  - `zod` 스키마와 입력/출력 타입
- Create: `src/entities/campaign/lib/build-create-campaign-payload.ts`
  - 폼 값 -> API payload 변환
- Create: `src/entities/campaign/lib/__tests__/create-campaign-schema.test.ts`
  - 폼 검증 테스트
- Create: `src/entities/campaign/api/create-campaign.ts`
  - 생성 API 호출 함수
- Create: `src/entities/campaign/api/use-create-campaign.ts`
  - mutation + dashboard query invalidation + Sonner toast
- Create: `src/entities/campaign/api/__tests__/create-campaign.test.tsx`
  - 생성 mutation 테스트
- Modify: `src/shared/api/mock/memory-db.ts`
  - 캠페인 append 함수 추가
- Modify: `src/shared/api/mock/handlers.ts`
  - `POST /campaigns` 핸들러 추가
- Create: `src/widgets/campaign-table/model/use-campaign-create-dialog.ts`
  - 모달 열림 상태와 제출 orchestration
- Create: `src/widgets/campaign-table/ui/campaign-create-dialog.tsx`
  - shadcn `Dialog` + `react-hook-form` UI
- Modify: `src/widgets/campaign-table/ui/campaign-table-toolbar.tsx`
  - `캠페인 등록` 버튼 추가
- Modify: `src/widgets/campaign-table/ui/campaign-table-card.tsx`
  - 생성 다이얼로그 연결
- Create: `src/widgets/campaign-table/ui/__tests__/campaign-create-dialog.test.tsx`
  - 모달 상호작용 테스트
- Modify: `src/widgets/campaign-table/ui/__tests__/campaign-table-card.test.tsx`
  - 등록 후 목록 동기화 테스트 추가

## Task 1: shadcn 다이얼로그와 토스트 기반 UI 토대 추가

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/shared/ui/dialog.tsx`
- Create: `src/shared/ui/sonner.tsx`
- Modify: `src/app/providers/app-providers.tsx`

- [ ] **Step 1: 필요한 의존성 설치**

Run: `npm install sonner @hookform/resolvers`

Expected: `added` 로그와 함께 `package.json`, `package-lock.json`이 갱신된다.

- [ ] **Step 2: shadcn 스타일 `Dialog` 래퍼 파일 추가**

```tsx
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type * as React from "react";
import { cn } from "@/shared/lib/utils";

function Dialog(props: React.ComponentProps<typeof DialogPrimitive.Root>) {
	return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger(
	props: React.ComponentProps<typeof DialogPrimitive.Trigger>,
) {
	return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal(props: React.ComponentProps<typeof DialogPrimitive.Portal>) {
	return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose(props: React.ComponentProps<typeof DialogPrimitive.Close>) {
	return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
	className,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
	return (
		<DialogPrimitive.Overlay
			data-slot="dialog-overlay"
			className={cn(
				"fixed inset-0 bg-black/48 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out",
				className,
			)}
			{...props}
		/>
	);
}

function DialogContent({
	className,
	children,
	showCloseButton = true,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
	showCloseButton?: boolean;
}) {
	return (
		<DialogPortal>
			<DialogOverlay />
			<DialogPrimitive.Content
				data-slot="dialog-content"
				className={cn(
					"fixed top-1/2 left-1/2 z-(--z-modal) w-[min(92vw,560px)] -translate-x-1/2 -translate-y-1/2 rounded-panel border border-outline-subtle bg-panel p-6 shadow-popover focus-visible:outline-none",
					className,
				)}
				{...props}
			>
				{children}
				{showCloseButton ? (
					<DialogPrimitive.Close
						className="absolute top-4 right-4 rounded-control p-1 text-fg-subtle transition-colors hover:bg-hover-surface hover:text-fg focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none"
					>
						<X aria-hidden="true" className="size-4" />
						<span className="sr-only">닫기</span>
					</DialogPrimitive.Close>
				) : null}
			</DialogPrimitive.Content>
		</DialogPortal>
	);
}

function DialogHeader({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="dialog-header"
			className={cn("flex flex-col gap-1.5", className)}
			{...props}
		/>
	);
}

function DialogFooter({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="dialog-footer"
			className={cn("mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
			{...props}
		/>
	);
}

function DialogTitle(props: React.ComponentProps<typeof DialogPrimitive.Title>) {
	return <DialogPrimitive.Title data-slot="dialog-title" {...props} />;
}

function DialogDescription(
	props: React.ComponentProps<typeof DialogPrimitive.Description>,
) {
	return <DialogPrimitive.Description data-slot="dialog-description" {...props} />;
}

export {
	Dialog,
	DialogTrigger,
	DialogPortal,
	DialogClose,
	DialogOverlay,
	DialogContent,
	DialogHeader,
	DialogFooter,
	DialogTitle,
	DialogDescription,
};
```

- [ ] **Step 3: `sonner` 래퍼 파일 추가**

```tsx
import { Toaster as Sonner } from "sonner";

export function Toaster() {
	return (
		<Sonner
			position="top-right"
			closeButton
			richColors
			toastOptions={{
				classNames: {
					toast:
						"rounded-card border border-outline-subtle bg-panel text-fg shadow-popover",
					title: "typo-label-lg",
					description: "typo-body-sm text-fg-muted",
					actionButton:
						"rounded-control bg-primary px-3 text-primary-fg hover:bg-primary-hover",
					cancelButton:
						"rounded-control bg-secondary px-3 text-secondary-fg hover:bg-secondary-hover",
				},
			}}
		/>
	);
}
```

- [ ] **Step 4: 앱 프로바이더에 `Toaster` 마운트**

```tsx
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Provider as JotaiProvider } from "jotai";
import type { PropsWithChildren } from "react";
import { createQueryClient } from "@/shared/api/query-client";
import { Toaster } from "@/shared/ui/sonner";

const queryClient = createQueryClient();

export function AppProviders({ children }: PropsWithChildren) {
	return (
		<JotaiProvider>
			<QueryClientProvider client={queryClient}>
				{children}
				<Toaster />
				{import.meta.env.DEV ? (
					<ReactQueryDevtools initialIsOpen={false} />
				) : null}
			</QueryClientProvider>
		</JotaiProvider>
	);
}
```

- [ ] **Step 5: 타입/빌드 확인**

Run: `npm run build`

Expected: `dist` 생성 전에 TypeScript 에러 없이 빌드가 완료된다.

## Task 2: `zod` 스키마와 MSW 생성 API 추가

**Files:**
- Create: `src/entities/campaign/lib/create-campaign-schema.ts`
- Create: `src/entities/campaign/lib/build-create-campaign-payload.ts`
- Create: `src/entities/campaign/lib/__tests__/create-campaign-schema.test.ts`
- Modify: `src/shared/api/mock/memory-db.ts`
- Modify: `src/shared/api/mock/handlers.ts`
- Create: `src/entities/campaign/api/create-campaign.ts`
- Create: `src/entities/campaign/api/use-create-campaign.ts`
- Create: `src/entities/campaign/api/__tests__/create-campaign.test.tsx`

- [ ] **Step 1: 스키마 failing test 작성**

```ts
import { describe, expect, it } from "vitest";
import { createCampaignSchema } from "@/entities/campaign/lib/create-campaign-schema";

describe("createCampaignSchema", () => {
	it("accepts a valid campaign form payload", () => {
		const result = createCampaignSchema.safeParse({
			name: "브랜드 검색 캠페인",
			platform: "Google",
			budget: "100000",
			spend: "50000",
			startDate: "2026-04-10",
			endDate: "2026-04-20",
		});

		expect(result.success).toBe(true);
	});

	it("accepts a same-day end date", () => {
		const result = createCampaignSchema.safeParse({
			name: "브랜드 검색 캠페인",
			platform: "Google",
			budget: "100000",
			spend: "50000",
			startDate: "2026-04-10",
			endDate: "2026-04-10",
		});

		expect(result.success).toBe(true);
	});

	it("rejects spend larger than budget", () => {
		const result = createCampaignSchema.safeParse({
			name: "브랜드 검색 캠페인",
			platform: "Google",
			budget: "100000",
			spend: "120000",
			startDate: "2026-04-10",
			endDate: "2026-04-10",
		});

		expect(result.success).toBe(false);
		expect(result.error?.flatten().fieldErrors).toMatchObject({
			spend: ["집행 금액은 예산을 초과할 수 없습니다."],
		});
	});

	it("rejects an end date earlier than the start date", () => {
		const result = createCampaignSchema.safeParse({
			name: "브랜드 검색 캠페인",
			platform: "Google",
			budget: "100000",
			spend: "50000",
			startDate: "2026-04-10",
			endDate: "2026-04-09",
		});

		expect(result.success).toBe(false);
		expect(result.error?.flatten().fieldErrors).toMatchObject({
			endDate: ["종료일은 시작일과 같거나 이후여야 합니다."],
		});
	});
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm run test:run -- src/entities/campaign/lib/__tests__/create-campaign-schema.test.ts`

Expected: `FAIL` with missing module or missing export.

- [ ] **Step 3: `zod` 스키마와 payload 변환 구현**

```ts
import { z } from "zod";

const platformSchema = z.enum(["Google", "Meta", "Naver"], {
	error: () => ({ message: "광고 매체를 선택해주세요." }),
});

function parseIntegerInRange({
	label,
	min,
	max,
	requiredMessage,
}: {
	label: string;
	min: number;
	max: number;
	requiredMessage: string;
}) {
	return z
		.string()
		.trim()
		.min(1, requiredMessage)
		.refine((value) => /^\d+$/.test(value), {
			message: `${label}은 ${min.toLocaleString()}원 이상 ${max.toLocaleString()}원 이하의 정수여야 합니다.`,
		})
		.refine((value) => {
			const amount = Number(value);
			return amount >= min && amount <= max;
		}, {
			message: `${label}은 ${min.toLocaleString()}원 이상 ${max.toLocaleString()}원 이하의 정수여야 합니다.`,
		});
}

export const createCampaignSchema = z
	.object({
		name: z
			.string()
			.trim()
			.min(1, "캠페인명을 입력해주세요.")
			.refine((value) => value.length >= 2 && value.length <= 100, {
				message: "캠페인명은 2자 이상 100자 이하로 입력해주세요.",
			}),
		platform: platformSchema,
		budget: parseIntegerInRange({
			label: "예산",
			min: 100,
			max: 1_000_000_000,
			requiredMessage: "예산을 입력해주세요.",
		}),
		spend: parseIntegerInRange({
			label: "집행 금액",
			min: 0,
			max: 1_000_000_000,
			requiredMessage: "집행 금액을 입력해주세요.",
		}),
		startDate: z.string().trim().min(1, "시작일을 선택해주세요."),
		endDate: z.string().trim().min(1, "종료일을 선택해주세요."),
	})
	.superRefine((value, ctx) => {
		const start = Date.parse(value.startDate);
		const end = Date.parse(value.endDate);

		if (Number.isFinite(start) && Number.isFinite(end) && end < start) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["endDate"],
				message: "종료일은 시작일과 같거나 이후여야 합니다.",
			});
		}

		if (Number(value.spend) > Number(value.budget)) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["spend"],
				message: "집행 금액은 예산을 초과할 수 없습니다.",
			});
		}
	});

export type CreateCampaignFormValues = z.input<typeof createCampaignSchema>;

export interface CreateCampaignInput {
	name: string;
	platform: "Google" | "Meta" | "Naver";
	budget: number;
	spend: number;
	startDate: string;
	endDate: string;
}

export function buildCreateCampaignPayload(
	values: CreateCampaignFormValues,
): CreateCampaignInput {
	const parsed = createCampaignSchema.parse(values);

	return {
		name: parsed.name,
		platform: parsed.platform,
		budget: Number(parsed.budget),
		spend: Number(parsed.spend),
		startDate: parsed.startDate,
		endDate: parsed.endDate,
	};
}
```

- [ ] **Step 4: 인메모리 DB append와 `POST /campaigns` 핸들러 구현**

```ts
// memory-db.ts
import dbJson from "@/db.json";
import type { CampaignStatus } from "@/entities/global-filter/model/types";
import type { MockDb, RawCampaign } from "@/shared/api/mock/types";

function cloneMockDb(data: MockDb): MockDb {
	return structuredClone(data) as MockDb;
}

function createCampaignId() {
	return `campaign-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function appendCampaignToMemoryDb(
	input: Omit<RawCampaign, "id" | "status">,
): RawCampaign {
	const createdCampaign: RawCampaign = {
		id: createCampaignId(),
		status: "active",
		...input,
	};

	memoryDb = {
		...memoryDb,
		campaigns: [...memoryDb.campaigns, createdCampaign],
	};

	return createdCampaign;
}

// handlers.ts
function isCreateCampaignBody(
	value: unknown,
): value is {
	name: string;
	platform: CampaignPlatform;
	budget: number;
	spend: number;
	startDate: string;
	endDate: string;
} {
	if (typeof value !== "object" || value === null) {
		return false;
	}

	const body = value as Record<string, unknown>;

	return (
		typeof body.name === "string" &&
		(body.platform === "Google" ||
			body.platform === "Meta" ||
			body.platform === "Naver") &&
		typeof body.budget === "number" &&
		typeof body.spend === "number" &&
		typeof body.startDate === "string" &&
		typeof body.endDate === "string"
	);
}

http.post("/campaigns", async ({ request }) => {
	const body = await request.json();

	if (!isCreateCampaignBody(body)) {
		return HttpResponse.json({ message: "Invalid request body" }, { status: 400 });
	}

	const createdCampaign = appendCampaignToMemoryDb({
		name: body.name,
		platform: body.platform,
		budget: body.budget,
		startDate: body.startDate,
		endDate: body.endDate,
	});

	return HttpResponse.json(createdCampaign, { status: 201 });
});
```

- [ ] **Step 5: API 호출 함수와 mutation 구현**

```ts
// create-campaign.ts
import type { Campaign } from "@/entities/campaign/model/types";
import type { CreateCampaignInput } from "@/entities/campaign/lib/create-campaign-schema";

export async function createCampaign(input: CreateCampaignInput): Promise<Campaign> {
	const response = await fetch("/campaigns", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});

	if (!response.ok) {
		throw new Error("캠페인을 등록하지 못했습니다.");
	}

	return response.json() as Promise<Campaign>;
}

// use-create-campaign.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createCampaign } from "@/entities/campaign/api/create-campaign";

export function useCreateCampaign() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createCampaign,
		async onSuccess() {
			await queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
			toast.success("캠페인이 등록되었습니다.");
		},
		onError() {
			toast.error("캠페인을 등록하지 못했습니다. 잠시 후 다시 시도해주세요.");
		},
	});
}
```

- [ ] **Step 6: 도메인 테스트 실행**

Run: `npm run test:run -- src/entities/campaign/lib/__tests__/create-campaign-schema.test.ts src/entities/campaign/api/__tests__/create-campaign.test.tsx src/shared/api/mock/__tests__/db.test.ts`

Expected: 새 스키마와 생성 mutation 테스트가 `PASS` 한다.

## Task 3: `react-hook-form` 기반 등록 다이얼로그 구현

**Files:**
- Create: `src/widgets/campaign-table/model/use-campaign-create-dialog.ts`
- Create: `src/widgets/campaign-table/ui/campaign-create-dialog.tsx`
- Create: `src/widgets/campaign-table/ui/__tests__/campaign-create-dialog.test.tsx`

- [ ] **Step 1: 다이얼로그 interaction failing test 작성**

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CampaignCreateDialog } from "@/widgets/campaign-table/ui/campaign-create-dialog";

describe("CampaignCreateDialog", () => {
	it("shows field errors for invalid submission", async () => {
		const user = userEvent.setup();
		render(
			<CampaignCreateDialog
				open
				isSubmitting={false}
				onOpenChange={vi.fn()}
				onSubmit={vi.fn()}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "등록하기" }));

		expect(await screen.findByText("캠페인명을 입력해주세요.")).toBeInTheDocument();
		expect(screen.getByText("광고 매체를 선택해주세요.")).toBeInTheDocument();
		expect(screen.getByText("예산을 입력해주세요.")).toBeInTheDocument();
		expect(screen.getByText("집행 금액을 입력해주세요.")).toBeInTheDocument();
	});

	it("submits parsed form values through react-hook-form", async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn().mockResolvedValue(undefined);

		render(
			<CampaignCreateDialog
				open
				isSubmitting={false}
				onOpenChange={vi.fn()}
				onSubmit={onSubmit}
			/>,
		);

		await user.type(screen.getByLabelText("캠페인명"), "브랜드 검색 캠페인");
		await user.click(screen.getByRole("combobox", { name: "광고 매체" }));
		await user.click(screen.getByRole("option", { name: "Google" }));
		await user.type(screen.getByLabelText("예산"), "100000");
		await user.type(screen.getByLabelText("집행 금액"), "30000");
		await user.type(screen.getByLabelText("시작일"), "2026-04-10");
		await user.type(screen.getByLabelText("종료일"), "2026-04-15");
		await user.click(screen.getByRole("button", { name: "등록하기" }));

		await waitFor(() =>
			expect(onSubmit).toHaveBeenCalledWith({
				name: "브랜드 검색 캠페인",
				platform: "Google",
				budget: 100000,
				spend: 30000,
				startDate: "2026-04-10",
				endDate: "2026-04-15",
			}),
		);
	});
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm run test:run -- src/widgets/campaign-table/ui/__tests__/campaign-create-dialog.test.tsx`

Expected: `FAIL` with missing component or assertion failures.

- [ ] **Step 3: `react-hook-form` 훅과 다이얼로그 UI 구현**

```tsx
// use-campaign-create-dialog.ts
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useCreateCampaign } from "@/entities/campaign/api/use-create-campaign";
import {
	buildCreateCampaignPayload,
	createCampaignSchema,
	type CreateCampaignFormValues,
} from "@/entities/campaign/lib/create-campaign-schema";

const defaultValues: CreateCampaignFormValues = {
	name: "",
	platform: "Google",
	budget: "",
	spend: "",
	startDate: "",
	endDate: "",
};

export function useCampaignCreateDialog() {
	const [open, setOpen] = useState(false);
	const mutation = useCreateCampaign();
	const form = useForm<CreateCampaignFormValues>({
		resolver: zodResolver(createCampaignSchema),
		defaultValues,
		mode: "onSubmit",
	});

	useEffect(() => {
		if (!open) {
			form.reset(defaultValues);
		}
	}, [form, open]);

	return {
		open,
		form,
		isSubmitting: mutation.isPending,
		setOpen,
		openDialog() {
			setOpen(true);
		},
		async submit(values: CreateCampaignFormValues) {
			await mutation.mutateAsync(buildCreateCampaignPayload(values));
			setOpen(false);
			form.reset(defaultValues);
		},
	};
}

// campaign-create-dialog.tsx
import { Controller, type SubmitHandler, useFormContext } from "react-hook-form";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { TextInput } from "@/shared/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/select";
import type { CreateCampaignFormValues } from "@/entities/campaign/lib/create-campaign-schema";

interface CampaignCreateDialogProps {
	open: boolean;
	isSubmitting: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (values: CreateCampaignFormValues) => Promise<void> | void;
}

export function CampaignCreateDialog({
	open,
	isSubmitting,
	onOpenChange,
	onSubmit,
}: CampaignCreateDialogProps) {
	const form = useFormContext<CreateCampaignFormValues>();
	const {
		register,
		control,
		handleSubmit,
		formState: { errors },
	} = form;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent aria-describedby="campaign-create-description">
				<DialogHeader>
					<DialogTitle className="typo-heading-md">캠페인 등록</DialogTitle>
					<DialogDescription
						id="campaign-create-description"
						className="typo-body-sm text-fg-muted"
					>
						새 캠페인을 등록하면 현재 세션의 대시보드 데이터에 즉시 반영됩니다.
					</DialogDescription>
				</DialogHeader>

				<form className="mt-5 flex flex-col gap-4" onSubmit={handleSubmit(onSubmit as SubmitHandler<CreateCampaignFormValues>)}>
					<label className="flex flex-col gap-2">
						<span className="typo-label-md">캠페인명</span>
						<TextInput aria-invalid={errors.name ? true : undefined} aria-label="캠페인명" {...register("name")} />
						{errors.name ? <p className="typo-body-sm text-status-danger-fg">{errors.name.message}</p> : null}
					</label>

					<label className="flex flex-col gap-2">
						<span className="typo-label-md">광고 매체</span>
						<Controller
							control={control}
							name="platform"
							render={({ field }) => (
								<Select value={field.value} onValueChange={field.onChange}>
									<SelectTrigger aria-label="광고 매체">
										<SelectValue placeholder="광고 매체 선택" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Google">Google</SelectItem>
										<SelectItem value="Meta">Meta</SelectItem>
										<SelectItem value="Naver">Naver</SelectItem>
									</SelectContent>
								</Select>
							)}
						/>
						{errors.platform ? <p className="typo-body-sm text-status-danger-fg">{errors.platform.message}</p> : null}
					</label>

					<label className="flex flex-col gap-2">
						<span className="typo-label-md">예산</span>
						<TextInput aria-invalid={errors.budget ? true : undefined} aria-label="예산" inputMode="numeric" {...register("budget")} />
						{errors.budget ? <p className="typo-body-sm text-status-danger-fg">{errors.budget.message}</p> : null}
					</label>

					<label className="flex flex-col gap-2">
						<span className="typo-label-md">집행 금액</span>
						<TextInput aria-invalid={errors.spend ? true : undefined} aria-label="집행 금액" inputMode="numeric" {...register("spend")} />
						{errors.spend ? <p className="typo-body-sm text-status-danger-fg">{errors.spend.message}</p> : null}
					</label>

					<div className="grid gap-4 sm:grid-cols-2">
						<label className="flex flex-col gap-2">
							<span className="typo-label-md">시작일</span>
							<TextInput aria-invalid={errors.startDate ? true : undefined} aria-label="시작일" type="date" {...register("startDate")} />
							{errors.startDate ? <p className="typo-body-sm text-status-danger-fg">{errors.startDate.message}</p> : null}
						</label>

						<label className="flex flex-col gap-2">
							<span className="typo-label-md">종료일</span>
							<TextInput aria-invalid={errors.endDate ? true : undefined} aria-label="종료일" type="date" {...register("endDate")} />
							{errors.endDate ? <p className="typo-body-sm text-status-danger-fg">{errors.endDate.message}</p> : null}
						</label>
					</div>

					<DialogFooter>
						<Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
							취소
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							등록하기
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
```

- [ ] **Step 4: 다이얼로그 테스트 실행**

Run: `npm run test:run -- src/widgets/campaign-table/ui/__tests__/campaign-create-dialog.test.tsx`

Expected: 필드 에러와 정상 제출 흐름이 `PASS` 한다.

## Task 4: 툴바/카드에 등록 흐름 연결하고 통합 테스트 추가

**Files:**
- Modify: `src/widgets/campaign-table/ui/campaign-table-toolbar.tsx`
- Modify: `src/widgets/campaign-table/ui/campaign-table-card.tsx`
- Modify: `src/widgets/campaign-table/ui/__tests__/campaign-table-card.test.tsx`

- [ ] **Step 1: 툴바에 `캠페인 등록` 버튼 추가**

```tsx
interface CampaignTableToolbarProps {
	searchInput: string;
	filteredCount: number;
	totalCount: number;
	selectedCount: number;
	pendingStatus: CampaignStatus | null;
	disabled: boolean;
	canApplyStatusChange: boolean;
	onSearchInputChange: (nextSearchInput: string) => void;
	onPendingStatusChange: (nextPendingStatus: CampaignStatus | null) => void;
	onOpenStatusDialog: () => void;
	onOpenCreateDialog: () => void;
}

// ...

<Button type="button" variant="outline" onClick={onOpenCreateDialog}>
	캠페인 등록
</Button>
<Button
	type="button"
	variant="secondary"
	disabled={isStatusControlDisabled || !canApplyStatusChange}
	onClick={onOpenStatusDialog}
>
	상태 적용
</Button>
```

- [ ] **Step 2: 카드에 생성 훅과 다이얼로그 연결**

```tsx
import { FormProvider } from "react-hook-form";
import { useCampaignCreateDialog } from "@/widgets/campaign-table/model/use-campaign-create-dialog";
import { CampaignCreateDialog } from "@/widgets/campaign-table/ui/campaign-create-dialog";

export function CampaignTableCard() {
	const filter = useAtomValue(globalFilterAtom);
	const controls = useCampaignTableControls();
	const createDialog = useCampaignCreateDialog();
	const tableData = useCampaignTableData(filter, controls);
	// ... existing selection and bulk action logic

	return (
		<section className="rounded-panel border border-outline-subtle bg-panel p-panel shadow-panel">
			<div className="flex flex-col gap-5">
				<CampaignTableToolbar
					searchInput={controls.searchInput}
					filteredCount={tableView.filteredCount}
					totalCount={tableView.totalCount}
					selectedCount={selection.selectedCount}
					pendingStatus={bulkAction.pendingStatus}
					disabled={isInteractionDisabled}
					canApplyStatusChange={bulkAction.canOpenDialog}
					onSearchInputChange={controls.setSearchInput}
					onPendingStatusChange={bulkAction.setPendingStatus}
					onOpenStatusDialog={bulkAction.openDialog}
					onOpenCreateDialog={createDialog.openDialog}
				/>
				{/* existing table and status dialog */}
			</div>

			<FormProvider {...createDialog.form}>
				<CampaignCreateDialog
					open={createDialog.open}
					isSubmitting={createDialog.isSubmitting}
					onOpenChange={createDialog.setOpen}
					onSubmit={createDialog.submit}
				/>
			</FormProvider>
		</section>
	);
}
```

- [ ] **Step 3: 통합 테스트 추가**

```tsx
it("creates a campaign and shows it in the table when current filters match", async () => {
	const user = userEvent.setup();
	renderCampaignTableCard();

	await user.click(screen.getByRole("button", { name: "캠페인 등록" }));
	await user.type(screen.getByLabelText("캠페인명"), "신규 검색 캠페인");
	await user.click(screen.getByRole("combobox", { name: "광고 매체" }));
	await user.click(screen.getByRole("option", { name: "Google" }));
	await user.type(screen.getByLabelText("예산"), "100000");
	await user.type(screen.getByLabelText("집행 금액"), "10000");
	await user.type(screen.getByLabelText("시작일"), "2026-04-10");
	await user.type(screen.getByLabelText("종료일"), "2026-04-20");
	await user.click(screen.getByRole("button", { name: "등록하기" }));

	expect(await screen.findByText("신규 검색 캠페인")).toBeInTheDocument();
	expect(await screen.findByText("캠페인이 등록되었습니다.")).toBeInTheDocument();
});

it("keeps success but does not show the row when current platform filter excludes it", async () => {
	const user = userEvent.setup();
	renderCampaignTableCardWithFilter({
		platforms: ["Meta"],
	});

	await user.click(screen.getByRole("button", { name: "캠페인 등록" }));
	await user.type(screen.getByLabelText("캠페인명"), "구글 브랜드 캠페인");
	await user.click(screen.getByRole("combobox", { name: "광고 매체" }));
	await user.click(screen.getByRole("option", { name: "Google" }));
	await user.type(screen.getByLabelText("예산"), "100000");
	await user.type(screen.getByLabelText("집행 금액"), "10000");
	await user.type(screen.getByLabelText("시작일"), "2026-04-10");
	await user.type(screen.getByLabelText("종료일"), "2026-04-20");
	await user.click(screen.getByRole("button", { name: "등록하기" }));

	expect(await screen.findByText("캠페인이 등록되었습니다.")).toBeInTheDocument();
	expect(screen.queryByText("구글 브랜드 캠페인")).not.toBeInTheDocument();
});
```

- [ ] **Step 4: 관련 테스트와 린트 실행**

Run: `npm run test:run -- src/widgets/campaign-table/ui/__tests__/campaign-create-dialog.test.tsx src/widgets/campaign-table/ui/__tests__/campaign-table-card.test.tsx src/entities/campaign/api/__tests__/create-campaign.test.tsx src/entities/campaign/lib/__tests__/create-campaign-schema.test.ts`

Expected: 생성 모달 관련 테스트가 모두 `PASS` 한다.

- [ ] **Step 5: 최종 검증 실행**

Run: `npm run lint`

Expected: `Checked` 로그와 함께 에러 없이 종료된다.

Run: `npm run build`

Expected: TypeScript/번들 에러 없이 완료된다.

- [ ] **Step 6: 커밋**

```bash
git add package.json package-lock.json src/app/providers/app-providers.tsx src/shared/ui/dialog.tsx src/shared/ui/sonner.tsx src/entities/campaign/lib/create-campaign-schema.ts src/entities/campaign/lib/build-create-campaign-payload.ts src/entities/campaign/lib/__tests__/create-campaign-schema.test.ts src/entities/campaign/api/create-campaign.ts src/entities/campaign/api/use-create-campaign.ts src/entities/campaign/api/__tests__/create-campaign.test.tsx src/shared/api/mock/memory-db.ts src/shared/api/mock/handlers.ts src/widgets/campaign-table/model/use-campaign-create-dialog.ts src/widgets/campaign-table/ui/campaign-create-dialog.tsx src/widgets/campaign-table/ui/campaign-table-toolbar.tsx src/widgets/campaign-table/ui/campaign-table-card.tsx src/widgets/campaign-table/ui/__tests__/campaign-create-dialog.test.tsx src/widgets/campaign-table/ui/__tests__/campaign-table-card.test.tsx docs/superpowers/plans/2026-04-10-campaign-registration-modal.md
git commit -m "feat: add campaign registration modal"
```

## Self-Review

- Spec coverage: 3.4의 모달 노출, 필드 유효성 검사, 성공 후 즉시 반영, 세션 메모리 유지, `daily_stats` 없는 신규 캠페인 처리, 현재 전역 필터에 따른 가시성 규칙을 모두 별도 태스크로 포함했다.
- Placeholder scan: `sonner`, shadcn `Dialog`, `react-hook-form`, `zod` 사용을 명시했고, 의존성 설치부터 테스트/검증 명령까지 구체적으로 적었다.
- Type consistency: 폼 입력 타입은 `CreateCampaignFormValues`, API 입력 타입은 `CreateCampaignInput`, 저장 타입은 기존 `Campaign`으로 분리해 later task와 이름을 일치시켰다.
