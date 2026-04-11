import { describe, expect, it } from "vitest";
import {
	resolveCampaignStatusBulkActionAvailability,
	shouldResetPendingStatus,
} from "@/widgets/campaign-table/model/campaign-status-bulk-action";

describe("resolveCampaignStatusBulkActionAvailability", () => {
	it("disables status actions when selection, pending status, or interaction state is missing", () => {
		expect(
			resolveCampaignStatusBulkActionAvailability({
				selectedRowCount: 0,
				isInteractionBlocked: false,
				isSubmitting: false,
				pendingStatus: "active",
			}),
		).toEqual({
			canOpenDialog: false,
			canConfirm: false,
		});

		expect(
			resolveCampaignStatusBulkActionAvailability({
				selectedRowCount: 2,
				isInteractionBlocked: false,
				isSubmitting: false,
				pendingStatus: null,
			}),
		).toEqual({
			canOpenDialog: false,
			canConfirm: false,
		});

		expect(
			resolveCampaignStatusBulkActionAvailability({
				selectedRowCount: 2,
				isInteractionBlocked: true,
				isSubmitting: false,
				pendingStatus: "paused",
			}),
		).toEqual({
			canOpenDialog: false,
			canConfirm: false,
		});
	});

	it("enables both actions only when the bulk action can proceed", () => {
		expect(
			resolveCampaignStatusBulkActionAvailability({
				selectedRowCount: 2,
				isInteractionBlocked: false,
				isSubmitting: false,
				pendingStatus: "ended",
			}),
		).toEqual({
			canOpenDialog: true,
			canConfirm: true,
		});
	});
});

describe("shouldResetPendingStatus", () => {
	it("resets the pending status when selected rows disappear", () => {
		expect(
			shouldResetPendingStatus({
				selectedRowCount: 0,
				pendingStatus: "active",
			}),
		).toBe(true);
	});

	it("keeps the pending status while rows remain selected", () => {
		expect(
			shouldResetPendingStatus({
				selectedRowCount: 1,
				pendingStatus: "active",
			}),
		).toBe(false);
		expect(
			shouldResetPendingStatus({
				selectedRowCount: 0,
				pendingStatus: null,
			}),
		).toBe(false);
	});
});
