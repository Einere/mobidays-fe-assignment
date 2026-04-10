import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
	CREATE_CAMPAIGN_ERROR_MESSAGE,
	useCreateCampaign,
} from "@/entities/campaign";
import { buildCreateCampaignPayload } from "@/entities/campaign/lib/build-create-campaign-payload";
import {
	type CreateCampaignFormValues,
	createCampaignSchema,
} from "@/entities/campaign/lib/create-campaign-schema";

const DATE_FORMAT = "yyyy-MM-dd";

export function createCampaignDefaultValues(): CreateCampaignFormValues {
	const today = format(new Date(), DATE_FORMAT);

	return {
		name: "",
		platform: "",
		budget: "",
		spend: "",
		startDate: today,
		endDate: today,
	};
}

export function useCampaignCreateDialog() {
	const [defaultValues] = useState(createCampaignDefaultValues);
	const [open, setOpen] = useState(false);
	const [commonError, setCommonError] = useState<string | null>(null);
	const mutation = useCreateCampaign();
	const form = useForm<CreateCampaignFormValues>({
		defaultValues,
		resolver: zodResolver(createCampaignSchema),
		mode: "onSubmit",
	});

	useEffect(() => {
		if (!open) {
			setCommonError(null);
			form.reset(defaultValues);
		}
	}, [defaultValues, form, open]);

	function setDialogOpen(nextOpen: boolean) {
		if (mutation.isPending && !nextOpen) {
			return;
		}

		setOpen(nextOpen);

		if (!nextOpen) {
			setCommonError(null);
			form.reset(defaultValues);
		}
	}

	async function submit(values: CreateCampaignFormValues) {
		setCommonError(null);

		try {
			await mutation.mutateAsync(buildCreateCampaignPayload(values));
			setOpen(false);
			form.reset(defaultValues);
		} catch {
			setCommonError(CREATE_CAMPAIGN_ERROR_MESSAGE);
			return;
		}
	}

	return {
		open,
		form,
		isSubmitting: mutation.isPending,
		commonError,
		openDialog() {
			setCommonError(null);
			setOpen(true);
		},
		setOpen: setDialogOpen,
		submit,
	};
}
