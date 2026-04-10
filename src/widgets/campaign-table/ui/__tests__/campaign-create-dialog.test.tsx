import { zodResolver } from "@hookform/resolvers/zod";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	type CreateCampaignFormValues,
	createCampaignSchema,
} from "@/entities/campaign/lib/create-campaign-schema";
import {
	createCampaignDefaultValues,
	useCampaignCreateDialog,
} from "@/widgets/campaign-table/model/use-campaign-create-dialog";
import { CampaignCreateDialog } from "@/widgets/campaign-table/ui/campaign-create-dialog";

const { mutationState, mutateAsyncMock } = vi.hoisted(() => {
	const mutateAsyncMock = vi.fn();

	return {
		mutateAsyncMock,
		mutationState: {
			isPending: false,
			mutateAsync: mutateAsyncMock,
		},
	};
});

vi.mock("@/entities/campaign", () => ({
	CREATE_CAMPAIGN_ERROR_MESSAGE:
		"캠페인을 등록하지 못했습니다. 잠시 후 다시 시도해주세요.",
	useCreateCampaign: () => mutationState,
}));

const defaultValues: CreateCampaignFormValues = createCampaignDefaultValues();

interface CampaignCreateDialogHarnessProps {
	isSubmitting?: boolean;
	commonError?: string | null;
	onOpenChange?: (open: boolean) => void;
	onSubmit: (values: CreateCampaignFormValues) => Promise<void> | void;
}

function CampaignCreateDialogHarness({
	isSubmitting = false,
	commonError = null,
	onOpenChange = vi.fn(),
	onSubmit,
}: CampaignCreateDialogHarnessProps) {
	const form = useForm<CreateCampaignFormValues>({
		defaultValues,
		resolver: zodResolver(createCampaignSchema),
		mode: "onSubmit",
	});

	return (
		<CampaignCreateDialog
			open
			commonError={commonError}
			form={form}
			isSubmitting={isSubmitting}
			onOpenChange={onOpenChange}
			onSubmit={onSubmit}
		/>
	);
}

function ConnectedCampaignCreateDialogHarness() {
	const dialog = useCampaignCreateDialog();

	return (
		<>
			<button type="button" onClick={dialog.openDialog}>
				등록 다이얼로그 열기
			</button>
			<CampaignCreateDialog
				open={dialog.open}
				commonError={dialog.commonError}
				form={dialog.form}
				isSubmitting={dialog.isSubmitting}
				onOpenChange={dialog.setOpen}
				onSubmit={dialog.submit}
			/>
		</>
	);
}

describe("CampaignCreateDialog", () => {
	beforeEach(() => {
		mutationState.isPending = false;
		mutateAsyncMock.mockReset();
		mutateAsyncMock.mockResolvedValue(undefined);
	});

	it("shows field errors for invalid submission", async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn();

		render(<CampaignCreateDialogHarness onSubmit={onSubmit} />);

		expect(screen.getByLabelText("예산")).toHaveAttribute("type", "number");
		expect(screen.getByLabelText("집행 금액")).toHaveAttribute(
			"type",
			"number",
		);
		expect(screen.getByLabelText("시작일")).toHaveValue(
			defaultValues.startDate,
		);
		expect(screen.getByLabelText("종료일")).toHaveValue(defaultValues.endDate);

		await user.click(screen.getByRole("button", { name: "등록하기" }));

		expect(
			await screen.findByText("캠페인명을 입력해주세요."),
		).toBeInTheDocument();
		expect(screen.getByText("광고 매체를 선택해주세요.")).toBeInTheDocument();
		expect(screen.getByRole("combobox", { name: "광고 매체" })).toHaveAttribute(
			"aria-invalid",
			"true",
		);
		expect(screen.getByText("예산을 입력해주세요.")).toBeInTheDocument();
		expect(screen.getByText("집행 금액을 입력해주세요.")).toBeInTheDocument();
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it("submits a valid form and forwards parsed payload through the create hook", async () => {
		const user = userEvent.setup();

		render(<ConnectedCampaignCreateDialogHarness />);

		await user.click(
			screen.getByRole("button", { name: "등록 다이얼로그 열기" }),
		);

		await user.type(screen.getByLabelText("캠페인명"), "브랜드 검색 캠페인");
		await user.click(screen.getByRole("combobox", { name: "광고 매체" }));
		await user.click(await screen.findByRole("option", { name: "Google" }));
		await user.type(screen.getByLabelText("예산"), "100000");
		await user.type(screen.getByLabelText("집행 금액"), "30000");
		await user.clear(screen.getByLabelText("시작일"));
		await user.type(screen.getByLabelText("시작일"), "2026-04-10");
		await user.clear(screen.getByLabelText("종료일"));
		await user.type(screen.getByLabelText("종료일"), "2026-04-15");
		await user.click(screen.getByRole("button", { name: "등록하기" }));

		await waitFor(() =>
			expect(mutateAsyncMock).toHaveBeenCalledWith({
				name: "브랜드 검색 캠페인",
				platform: "Google",
				budget: 100000,
				spend: 30000,
				startDate: "2026-04-10",
				endDate: "2026-04-15",
			}),
		);
		await waitFor(() =>
			expect(
				screen.queryByRole("dialog", { name: "캠페인 등록" }),
			).not.toBeInTheDocument(),
		);
	});

	it("renders platform select content above the modal with the modal-popover layer", async () => {
		const user = userEvent.setup();

		render(<ConnectedCampaignCreateDialogHarness />);

		await user.click(
			screen.getByRole("button", { name: "등록 다이얼로그 열기" }),
		);
		await user.click(screen.getByRole("combobox", { name: "광고 매체" }));

		const selectContent = document.querySelector(
			'[data-slot="select-content"]',
		);

		expect(selectContent).not.toBeNull();
		expect(selectContent?.className).toContain("z-(--z-modal-popover)");
	});

	it("blocks close interactions while submitting", async () => {
		const user = userEvent.setup();
		const onOpenChange = vi.fn();

		render(
			<CampaignCreateDialogHarness
				isSubmitting
				onOpenChange={onOpenChange}
				onSubmit={vi.fn()}
			/>,
		);

		expect(
			screen.getByRole("dialog", { name: "캠페인 등록" }),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "닫기" }),
		).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "취소" })).toBeDisabled();

		await user.keyboard("{Escape}");

		expect(onOpenChange).not.toHaveBeenCalledWith(false);
		expect(
			screen.getByRole("dialog", { name: "캠페인 등록" }),
		).toBeInTheDocument();
	});

	it("keeps the dialog open and preserves form values when mutation fails", async () => {
		const user = userEvent.setup();

		mutateAsyncMock.mockRejectedValueOnce(new Error("Request failed: 500"));

		render(<ConnectedCampaignCreateDialogHarness />);

		await user.click(
			screen.getByRole("button", { name: "등록 다이얼로그 열기" }),
		);
		await user.type(screen.getByLabelText("캠페인명"), "브랜드 검색 캠페인");
		await user.click(screen.getByRole("combobox", { name: "광고 매체" }));
		await user.click(await screen.findByRole("option", { name: "Google" }));
		await user.type(screen.getByLabelText("예산"), "100000");
		await user.type(screen.getByLabelText("집행 금액"), "30000");
		await user.clear(screen.getByLabelText("시작일"));
		await user.type(screen.getByLabelText("시작일"), "2026-04-10");
		await user.clear(screen.getByLabelText("종료일"));
		await user.type(screen.getByLabelText("종료일"), "2026-04-15");
		await user.click(screen.getByRole("button", { name: "등록하기" }));

		await waitFor(() =>
			expect(mutateAsyncMock).toHaveBeenCalledWith({
				name: "브랜드 검색 캠페인",
				platform: "Google",
				budget: 100000,
				spend: 30000,
				startDate: "2026-04-10",
				endDate: "2026-04-15",
			}),
		);
		expect(
			screen.getByRole("dialog", { name: "캠페인 등록" }),
		).toBeInTheDocument();
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"캠페인을 등록하지 못했습니다. 잠시 후 다시 시도해주세요.",
		);
		expect(screen.getByLabelText("캠페인명")).toHaveValue("브랜드 검색 캠페인");
		expect(
			screen.getByRole("combobox", { name: "광고 매체" }),
		).toHaveTextContent("Google");
		expect(screen.getByLabelText("예산")).toHaveValue(100000);
		expect(screen.getByLabelText("집행 금액")).toHaveValue(30000);
		expect(screen.getByLabelText("시작일")).toHaveValue("2026-04-10");
		expect(screen.getByLabelText("종료일")).toHaveValue("2026-04-15");
	});
});
