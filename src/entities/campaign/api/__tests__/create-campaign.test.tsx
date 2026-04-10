import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCampaign } from "@/entities/campaign/api/create-campaign";
import { useCreateCampaign } from "@/entities/campaign/hooks/use-create-campaign";
import { getMemoryDb, seedMemoryDb } from "@/shared/api/mock/memory-db";
import { server } from "@/shared/api/mock/server";
import { createQueryClient } from "@/shared/api/query-client";

const { toastSuccessMock, toastErrorMock } = vi.hoisted(() => ({
	toastSuccessMock: vi.fn(),
	toastErrorMock: vi.fn(),
}));

vi.mock("sonner", () => ({
	toast: {
		success: toastSuccessMock,
		error: toastErrorMock,
	},
}));

describe("create campaign", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("creates a campaign via POST /campaigns and appends it to the memory db with active status", async () => {
		seedMemoryDb({
			campaigns: [],
			daily_stats: [],
		});

		const createdCampaign = await createCampaign({
			name: "Google 신규 캠페인",
			platform: "Google",
			budget: 100000,
			spend: 50000,
			startDate: "2026-04-10",
			endDate: "2026-04-20",
		});

		const memoryDb = getMemoryDb();

		expect(createdCampaign).toEqual({
			id: expect.any(String),
			name: "Google 신규 캠페인",
			platform: "Google",
			status: "active",
			budget: 100000,
			startDate: "2026-04-10",
			endDate: "2026-04-20",
		});
		expect(memoryDb.campaigns).toHaveLength(1);
		expect(memoryDb.campaigns[0]).toEqual(createdCampaign);
	});

	it("throws when POST /campaigns returns a non-ok response", async () => {
		server.use(
			http.post("/campaigns", () => new HttpResponse(null, { status: 500 })),
		);

		await expect(
			createCampaign({
				name: "Google 신규 캠페인",
				platform: "Google",
				budget: 100000,
				spend: 50000,
				startDate: "2026-04-10",
				endDate: "2026-04-20",
			}),
		).rejects.toThrow("Request failed: 500");
	});

	it("rejects POST /campaigns when domain validation rules fail", async () => {
		seedMemoryDb({
			campaigns: [],
			daily_stats: [],
		});

		await expect(
			createCampaign({
				name: "Google 신규 캠페인",
				platform: "Google",
				budget: 100000,
				spend: 120000,
				startDate: "2026/04/10",
				endDate: "2026-04-20",
			}),
		).rejects.toThrow("Request failed: 400");
		expect(getMemoryDb().campaigns).toHaveLength(0);
	});

	it("rejects POST /campaigns for invalid calendar dates in YYYY-MM-DD", async () => {
		seedMemoryDb({
			campaigns: [],
			daily_stats: [],
		});

		await expect(
			createCampaign({
				name: "Google 신규 캠페인",
				platform: "Google",
				budget: 100000,
				spend: 50000,
				startDate: "2026-04-10",
				endDate: "2026-02-30",
			}),
		).rejects.toThrow("Request failed: 400");
		expect(getMemoryDb().campaigns).toHaveLength(0);
	});

	it("invalidates dashboard queries and shows a success toast after a successful mutation", async () => {
		seedMemoryDb({
			campaigns: [],
			daily_stats: [],
		});

		const queryClient = createQueryClient();
		const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
		const wrapper = ({ children }: { children: React.ReactNode }) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);

		const { result } = renderHook(() => useCreateCampaign(), { wrapper });

		await act(async () => {
			await result.current.mutateAsync({
				name: "Google 신규 캠페인",
				platform: "Google",
				budget: 100000,
				spend: 50000,
				startDate: "2026-04-10",
				endDate: "2026-04-20",
			});
		});

		expect(invalidateQueriesSpy).toHaveBeenCalledWith({
			queryKey: ["dashboard-data"],
		});
		expect(toastSuccessMock).toHaveBeenCalledWith("캠페인이 등록되었습니다.");
		expect(toastErrorMock).not.toHaveBeenCalled();
	});

	it("shows an error toast when mutation fails", async () => {
		server.use(
			http.post("/campaigns", () => new HttpResponse(null, { status: 500 })),
		);

		const queryClient = createQueryClient();
		const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
		const wrapper = ({ children }: { children: React.ReactNode }) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);
		const { result } = renderHook(() => useCreateCampaign(), { wrapper });

		await expect(
			act(async () => {
				await result.current.mutateAsync({
					name: "Google 신규 캠페인",
					platform: "Google",
					budget: 100000,
					spend: 50000,
					startDate: "2026-04-10",
					endDate: "2026-04-20",
				});
			}),
		).rejects.toThrow("Request failed: 500");

		expect(invalidateQueriesSpy).not.toHaveBeenCalled();
		expect(toastErrorMock).toHaveBeenCalledWith(
			"캠페인을 등록하지 못했습니다. 잠시 후 다시 시도해주세요.",
		);
		expect(toastSuccessMock).not.toHaveBeenCalled();
	});
});
