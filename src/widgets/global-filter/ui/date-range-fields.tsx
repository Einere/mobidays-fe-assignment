import { TextInput } from "@/shared/ui/input";

interface DateRangeFieldsProps {
	endDate: string;
	onEndDateChange: (value: string) => void;
	onStartDateChange: (value: string) => void;
	startDate: string;
	validationMessage?: string | null;
}

export function DateRangeFields({
	endDate,
	onEndDateChange,
	onStartDateChange,
	startDate,
	validationMessage,
}: DateRangeFieldsProps) {
	const describedBy = validationMessage
		? "global-filter-date-error"
		: undefined;

	return (
		<div className="flex min-w-0 flex-1 flex-col gap-2">
			<p className="typo-form-label text-fg">집행 기간</p>
			<div className="grid gap-3 sm:grid-cols-2">
				<div className="flex flex-col gap-1.5">
					<label
						htmlFor="global-filter-start-date"
						className="typo-caption text-fg-muted"
					>
						시작일
					</label>
					<TextInput
						id="global-filter-start-date"
						aria-describedby={describedBy}
						aria-invalid={validationMessage ? "true" : "false"}
						type="date"
						value={startDate}
						onChange={(event) => onStartDateChange(event.target.value)}
					/>
				</div>
				<div className="flex flex-col gap-1.5">
					<label
						htmlFor="global-filter-end-date"
						className="typo-caption text-fg-muted"
					>
						종료일
					</label>
					<TextInput
						id="global-filter-end-date"
						aria-describedby={describedBy}
						aria-invalid={validationMessage ? "true" : "false"}
						type="date"
						value={endDate}
						onChange={(event) => onEndDateChange(event.target.value)}
					/>
				</div>
			</div>
			<div className="min-h-5">
				{validationMessage ? (
					<p
						id="global-filter-date-error"
						className="typo-caption text-status-danger-fg"
					>
						{validationMessage}
					</p>
				) : null}
			</div>
		</div>
	);
}
