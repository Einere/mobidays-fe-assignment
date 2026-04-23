import { describe, expect, it } from "vitest";

import {
	formatIntegerInputValue,
	normalizeIntegerInputValue,
} from "@/shared/lib/number-input";

describe("number-input", () => {
	it("normalizes and formats integer input values", () => {
		expect(normalizeIntegerInputValue("1,234")).toBe("1234");
		expect(normalizeIntegerInputValue("abc123def")).toBe("123");
		expect(normalizeIntegerInputValue("")).toBe("");

		expect(formatIntegerInputValue("1,234")).toBe("1,234");
		expect(formatIntegerInputValue("abc123def")).toBe("123");
		expect(formatIntegerInputValue("001234")).toBe("1,234");
		expect(formatIntegerInputValue("")).toBe("");
		expect(formatIntegerInputValue("abc")).toBe("");
		expect(formatIntegerInputValue("1234567", "en-US")).toBe("1,234,567");
	});
});
