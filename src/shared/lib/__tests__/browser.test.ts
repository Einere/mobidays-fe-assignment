import { afterEach, describe, expect, it, vi } from "vitest";
import { isChromeBrowser } from "@/shared/lib/browser";

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("isChromeBrowser", () => {
	it("returns true for Chromium brands from userAgentData", () => {
		vi.stubGlobal("navigator", {
			userAgent: "Mozilla/5.0",
			userAgentData: {
				brands: [{ brand: "Google Chrome", version: "124" }],
			},
		});

		expect(isChromeBrowser()).toBe(true);
	});

	it("returns true for a Chrome user agent when userAgentData is unavailable", () => {
		vi.stubGlobal("navigator", {
			userAgent:
				"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
		});

		expect(isChromeBrowser()).toBe(true);
	});

	it("returns false for non-Chrome Chromium-based browsers", () => {
		vi.stubGlobal("navigator", {
			userAgent:
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0",
		});

		expect(isChromeBrowser()).toBe(false);
	});
});
