import { describe, expect, it, vi } from "vitest";
import {
	shouldStartMockApi,
	startMockApi,
} from "@/app/bootstrap/start-mock-api";

describe("startMockApi", () => {
	it("starts mocks for non-test modes unless explicitly disabled", () => {
		expect(shouldStartMockApi("development", undefined)).toBe(true);
		expect(shouldStartMockApi("production", undefined)).toBe(true);
		expect(shouldStartMockApi("preview", undefined)).toBe(true);
		expect(shouldStartMockApi("production", "false")).toBe(false);
		expect(shouldStartMockApi("test", undefined)).toBe(false);
	});

	it("returns false and logs when worker startup fails", async () => {
		const error = new Error("startup failed");
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => undefined);

		const result = await startMockApi({
			start: vi.fn().mockRejectedValue(error),
		});

		expect(result).toBe(false);
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			"Failed to start MSW worker",
			error,
		);

		consoleErrorSpy.mockRestore();
	});
});
