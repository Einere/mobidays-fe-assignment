import { createStore } from "jotai";
import { describe, expect, it } from "vitest";
import { createInitialGlobalFilterState } from "@/entities/global-filter/model/defaults";
import { mergeCampaignPlatformValues } from "@/entities/global-filter/model/platforms";
import {
	globalFilterAtom,
	selectAllGlobalFilterPlatformsAtom,
} from "@/entities/global-filter/model/store";

describe("global filter platforms", () => {
	it("merges selected unknown platforms after the known platform order", () => {
		expect(mergeCampaignPlatformValues(["Meta", "TikTok", "TikTok"])).toEqual([
			"Google",
			"Meta",
			"Naver",
			"TikTok",
		]);
	});

	it("preserves unknown selected platforms when select all is triggered", () => {
		const store = createStore();

		store.set(globalFilterAtom, {
			...createInitialGlobalFilterState(new Date("2026-04-15")),
			platforms: ["Meta", "TikTok"],
		});

		store.set(selectAllGlobalFilterPlatformsAtom);

		expect(store.get(globalFilterAtom).platforms).toEqual([
			"Google",
			"Meta",
			"Naver",
			"TikTok",
		]);
	});
});
