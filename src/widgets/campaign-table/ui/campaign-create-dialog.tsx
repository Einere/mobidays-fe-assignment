import { Controller, type UseFormReturn } from "react-hook-form";
import type { CreateCampaignFormValues } from "@/entities/campaign/lib/create-campaign-schema";
import { formatNumberWithLocale } from "@/shared/lib/intl/number";
import { Button } from "@/shared/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/ui/dialog";
import { TextInput } from "@/shared/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/select";

export interface CampaignCreateDialogFormState {
	register: UseFormReturn<CreateCampaignFormValues>["register"];
	control: UseFormReturn<CreateCampaignFormValues>["control"];
	handleSubmit: UseFormReturn<CreateCampaignFormValues>["handleSubmit"];
	formState: Pick<
		UseFormReturn<CreateCampaignFormValues>["formState"],
		"errors"
	>;
}

interface CampaignCreateDialogProps {
	createDialogState: {
		open: boolean;
		isSubmitting: boolean;
		commonError: string | null;
		form: CampaignCreateDialogFormState;
	};
	actions: {
		onOpenChange: (open: boolean) => void;
		onSubmit: (values: CreateCampaignFormValues) => Promise<void> | void;
	};
}

function formatIntegerInputValue(value: string) {
	if (!value) {
		return "";
	}

	const normalizedValue = value.replace(/\D/g, "");

	if (!normalizedValue) {
		return "";
	}

	return formatNumberWithLocale(Number(normalizedValue));
}

function normalizeIntegerInputValue(value: string) {
	return value.replace(/\D/g, "");
}

export function CampaignCreateDialog({
	createDialogState,
	actions,
}: CampaignCreateDialogProps) {
	const { open, isSubmitting, commonError, form } = createDialogState;
	const { onOpenChange, onSubmit } = actions;
	const {
		register,
		control,
		handleSubmit,
		formState: { errors },
	} = form;

	function handleOpenChange(nextOpen: boolean) {
		if (isSubmitting && !nextOpen) {
			return;
		}

		onOpenChange(nextOpen);
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent
				aria-describedby="campaign-create-dialog-description"
				showCloseButton={!isSubmitting}
				onEscapeKeyDown={(event) => {
					if (isSubmitting) {
						event.preventDefault();
					}
				}}
				onInteractOutside={(event) => {
					if (isSubmitting) {
						event.preventDefault();
					}
				}}
			>
				<DialogHeader>
					<DialogTitle className="typo-heading-md text-fg">
						캠페인 등록
					</DialogTitle>
					<DialogDescription
						id="campaign-create-dialog-description"
						className="typo-body-sm text-fg-muted"
					>
						새 캠페인을 등록하면 현재 대시보드 데이터에 반영됩니다.
					</DialogDescription>
				</DialogHeader>

				<form
					className="mt-5 flex flex-col gap-4"
					onSubmit={handleSubmit(onSubmit)}
				>
					{commonError ? (
						<div
							aria-live="polite"
							className="rounded-card border border-status-danger-border bg-status-danger/30 px-4 py-3 typo-body-sm text-status-danger-fg"
							role="alert"
						>
							<p>{commonError}</p>
						</div>
					) : null}

					<label
						className="flex flex-col gap-1.5"
						htmlFor="campaign-create-name"
					>
						<span className="typo-caption text-fg-muted">캠페인명</span>
						<TextInput
							id="campaign-create-name"
							aria-describedby={
								errors.name ? "campaign-create-name-error" : undefined
							}
							aria-invalid={errors.name ? "true" : "false"}
							disabled={isSubmitting}
							{...register("name")}
						/>
						<div className="min-h-5">
							{errors.name ? (
								<p
									id="campaign-create-name-error"
									aria-live="polite"
									className="typo-caption text-status-danger-fg"
									role="alert"
								>
									{errors.name.message}
								</p>
							) : null}
						</div>
					</label>

					<div className="flex flex-col gap-1.5">
						<span className="typo-caption text-fg-muted">광고 매체</span>
						<Controller
							control={control}
							name="platform"
							render={({ field }) => (
								<Select
									disabled={isSubmitting}
									name={field.name}
									value={field.value}
									onValueChange={field.onChange}
									onOpenChange={(nextOpen) => {
										if (!nextOpen) {
											field.onBlur();
										}
									}}
								>
									<SelectTrigger
										id="campaign-create-platform"
										aria-describedby={
											errors.platform
												? "campaign-create-platform-error"
												: undefined
										}
										aria-invalid={errors.platform ? "true" : "false"}
										aria-label="광고 매체"
										onBlur={field.onBlur}
										ref={field.ref}
									>
										<SelectValue placeholder="광고 매체 선택" />
									</SelectTrigger>
									<SelectContent className="z-modal-popover">
										<SelectItem value="Google">Google</SelectItem>
										<SelectItem value="Meta">Meta</SelectItem>
										<SelectItem value="Naver">Naver</SelectItem>
									</SelectContent>
								</Select>
							)}
						/>
						<div className="min-h-5">
							{errors.platform ? (
								<p
									id="campaign-create-platform-error"
									aria-live="polite"
									className="typo-caption text-status-danger-fg"
									role="alert"
								>
									{errors.platform.message}
								</p>
							) : null}
						</div>
					</div>

					<label
						className="flex flex-col gap-1.5"
						htmlFor="campaign-create-budget"
					>
						<span className="typo-caption text-fg-muted">예산</span>
						<Controller
							control={control}
							name="budget"
							render={({ field }) => (
								<TextInput
									id="campaign-create-budget"
									aria-describedby={
										errors.budget ? "campaign-create-budget-error" : undefined
									}
									aria-invalid={errors.budget ? "true" : "false"}
									disabled={isSubmitting}
									inputMode="numeric"
									type="text"
									value={formatIntegerInputValue(field.value)}
									onBlur={field.onBlur}
									onChange={(event) =>
										field.onChange(
											normalizeIntegerInputValue(event.target.value),
										)
									}
									ref={field.ref}
								/>
							)}
						/>
						<div className="min-h-5">
							{errors.budget ? (
								<p
									id="campaign-create-budget-error"
									aria-live="polite"
									className="typo-caption text-status-danger-fg"
									role="alert"
								>
									{errors.budget.message}
								</p>
							) : null}
						</div>
					</label>

					<label
						className="flex flex-col gap-1.5"
						htmlFor="campaign-create-spend"
					>
						<span className="typo-caption text-fg-muted">집행 금액</span>
						<Controller
							control={control}
							name="spend"
							render={({ field }) => (
								<TextInput
									id="campaign-create-spend"
									aria-describedby={
										errors.spend ? "campaign-create-spend-error" : undefined
									}
									aria-invalid={errors.spend ? "true" : "false"}
									disabled={isSubmitting}
									inputMode="numeric"
									type="text"
									value={formatIntegerInputValue(field.value)}
									onBlur={field.onBlur}
									onChange={(event) =>
										field.onChange(
											normalizeIntegerInputValue(event.target.value),
										)
									}
									ref={field.ref}
								/>
							)}
						/>
						<div className="min-h-5">
							{errors.spend ? (
								<p
									id="campaign-create-spend-error"
									aria-live="polite"
									className="typo-caption text-status-danger-fg"
									role="alert"
								>
									{errors.spend.message}
								</p>
							) : null}
						</div>
					</label>

					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<label
							className="flex flex-col gap-1.5"
							htmlFor="campaign-create-start-date"
						>
							<span className="typo-caption text-fg-muted">시작일</span>
							<TextInput
								id="campaign-create-start-date"
								aria-describedby={
									errors.startDate
										? "campaign-create-start-date-error"
										: undefined
								}
								aria-invalid={errors.startDate ? "true" : "false"}
								disabled={isSubmitting}
								type="date"
								{...register("startDate")}
							/>
							<div className="min-h-5">
								{errors.startDate ? (
									<p
										id="campaign-create-start-date-error"
										aria-live="polite"
										className="typo-caption text-status-danger-fg"
										role="alert"
									>
										{errors.startDate.message}
									</p>
								) : null}
							</div>
						</label>

						<label
							className="flex flex-col gap-1.5"
							htmlFor="campaign-create-end-date"
						>
							<span className="typo-caption text-fg-muted">종료일</span>
							<TextInput
								id="campaign-create-end-date"
								aria-describedby={
									errors.endDate ? "campaign-create-end-date-error" : undefined
								}
								aria-invalid={errors.endDate ? "true" : "false"}
								disabled={isSubmitting}
								type="date"
								{...register("endDate")}
							/>
							<div className="min-h-5">
								{errors.endDate ? (
									<p
										id="campaign-create-end-date-error"
										aria-live="polite"
										className="typo-caption text-status-danger-fg"
										role="alert"
									>
										{errors.endDate.message}
									</p>
								) : null}
							</div>
						</label>
					</div>

					<DialogFooter className="mt-2">
						<Button
							type="button"
							variant="outline"
							disabled={isSubmitting}
							onClick={() => handleOpenChange(false)}
						>
							취소
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? "등록 중..." : "등록하기"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
