import { afterEach, describe, expect, it, vi } from "vitest";
import {
	applyBrowserDatasetAttribute,
	isSafariBrowser,
} from "@/shared/lib/browser";

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("isSafariBrowser", () => {
	it("returns true for Safari brands from userAgentData", () => {
		vi.stubGlobal("navigator", {
			userAgent: "Mozilla/5.0",
			userAgentData: {
				brands: [{ brand: "Safari", version: "17" }],
			},
		});

		expect(isSafariBrowser()).toBe(true);
	});

	it("returns true for a Safari user agent when userAgentData is unavailable", () => {
		vi.stubGlobal("navigator", {
			userAgent:
				"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
		});

		expect(isSafariBrowser()).toBe(true);
	});

	it("returns false for Chrome-based browsers", () => {
		vi.stubGlobal("navigator", {
			userAgent:
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0",
		});

		expect(isSafariBrowser()).toBe(false);
	});

	it("returns false for Chrome on iOS user agents", () => {
		vi.stubGlobal("navigator", {
			userAgent:
				"Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0.0.0 Mobile/15E148 Safari/604.1",
		});

		expect(isSafariBrowser()).toBe(false);
	});

	it("returns false when navigator is unavailable", () => {
		vi.stubGlobal("navigator", undefined);

		expect(isSafariBrowser()).toBe(false);
	});

	it("returns false for Edge on iOS user agents", () => {
		vi.stubGlobal("navigator", {
			userAgent:
				"Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 EdgiOS/124.0.2478.67 Mobile/15E148 Safari/605.1.15",
		});

		expect(isSafariBrowser()).toBe(false);
	});
});

describe("applyBrowserDatasetAttribute", () => {
	it("sets browser dataset to safari when Safari is detected", () => {
		vi.stubGlobal("navigator", {
			userAgent:
				"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
		});

		document.documentElement.dataset.browser = "other";
		applyBrowserDatasetAttribute(document);

		expect(document.documentElement.dataset.browser).toBe("safari");
	});

	it("removes browser dataset when Safari is not detected", () => {
		vi.stubGlobal("navigator", {
			userAgent:
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
		});

		document.documentElement.dataset.browser = "safari";
		applyBrowserDatasetAttribute(document);

		expect(document.documentElement.dataset.browser).toBeUndefined();
	});
});
