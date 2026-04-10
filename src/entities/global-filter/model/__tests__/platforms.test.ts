import { createStore } from "jotai";
import { describe, expect, it } from "vitest";
import { createInitialGlobalFilterState } from "@/entities/global-filter/model/defaults";
import {
	campaignPlatformValues,
	getCampaignPlatformOptions,
} from "@/entities/global-filter/model/platforms";
import {
	globalFilterAtom,
	selectAllGlobalFilterPlatformsAtom,
	toggleGlobalFilterPlatformAtom,
} from "@/entities/global-filter/model/store";

describe("global filter platforms", () => {
	it("exposes the three supported platform values in order", () => {
		expect(campaignPlatformValues).toEqual(["Google", "Meta", "Naver"]);
	});

	it("builds platform options from the fixed platform values", () => {
		expect(getCampaignPlatformOptions()).toEqual([
			{ value: "Google", label: "Google" },
			{ value: "Meta", label: "Meta" },
			{ value: "Naver", label: "Naver" },
		]);
	});

	it("selects all supported platforms when select all is triggered", () => {
		const store = createStore();

		store.set(globalFilterAtom, {
			...createInitialGlobalFilterState(new Date("2026-04-15")),
			platforms: ["Meta"],
		});

		store.set(selectAllGlobalFilterPlatformsAtom);

		expect(store.get(globalFilterAtom).platforms).toEqual([
			"Google",
			"Meta",
			"Naver",
		]);
	});

	it("toggles supported platforms without changing unsupported state shape", () => {
		const store = createStore();

		store.set(globalFilterAtom, {
			...createInitialGlobalFilterState(new Date("2026-04-15")),
			platforms: ["Meta"],
		});

		store.set(toggleGlobalFilterPlatformAtom, "Google");

		expect(store.get(globalFilterAtom).platforms).toEqual(["Google", "Meta"]);
	});
});
