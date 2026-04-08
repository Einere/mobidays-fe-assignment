import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider, useAtomValue } from "jotai";
import { describe, expect, it } from "vitest";
import { globalFilterAtom } from "@/entities/global-filter/model/store";
import { GlobalFilterBar } from "@/widgets/global-filter/ui/global-filter-bar";

function FilterStateSnapshot() {
	const filter = useAtomValue(globalFilterAtom);

	return <pre data-testid="global-filter-state">{JSON.stringify(filter)}</pre>;
}

function renderGlobalFilterBar() {
	render(
		<Provider>
			<GlobalFilterBar />
			<FilterStateSnapshot />
		</Provider>,
	);
}

describe("GlobalFilterBar", () => {
	it("toggles desktop chips using the shared filter semantics", async () => {
		const user = userEvent.setup();

		renderGlobalFilterBar();

		const statusGroup = screen.getByRole("group", { name: "상태 필터" });
		const allChip = within(statusGroup).getByRole("button", { name: "전체" });
		const activeChip = within(statusGroup).getByRole("button", {
			name: "운영 중",
		});

		expect(activeChip).toHaveAttribute("aria-pressed", "true");

		await user.click(activeChip);

		expect(activeChip).toHaveAttribute("aria-pressed", "false");
		expect(allChip).toHaveAttribute("aria-pressed", "false");
		expect(screen.getByTestId("global-filter-state")).toHaveTextContent(
			'"statuses":["paused","ended"]',
		);

		await user.click(allChip);

		expect(activeChip).toHaveAttribute("aria-pressed", "true");
		expect(allChip).toHaveAttribute("aria-pressed", "true");
		expect(screen.getByTestId("global-filter-state")).toHaveTextContent(
			'"statuses":["active","paused","ended"]',
		);
	});

	it("keeps mobile dropdown checkboxes synced with the same atom state", async () => {
		const user = userEvent.setup();

		renderGlobalFilterBar();

		const mobileTrigger = screen.getByRole("button", {
			name: "매체 필터 열기",
		});

		expect(mobileTrigger).toHaveTextContent("3/3");

		await user.click(mobileTrigger);

		const dropdown = await screen.findByRole("dialog", { name: "매체 필터" });
		const googleOption = within(dropdown).getByRole("button", {
			name: "Google",
		});

		expect(googleOption).toHaveAttribute("aria-pressed", "true");

		await user.click(googleOption);

		await waitFor(() => {
			expect(mobileTrigger).toHaveTextContent("2/3");
			expect(screen.getByTestId("global-filter-state")).toHaveTextContent(
				'"platforms":["Meta","Naver"]',
			);
		});

		await waitFor(() => {
			expect(googleOption).toHaveAttribute("aria-pressed", "false");
		});
	});

	it("uses a focusable mobile row button as the interactive toggle target", async () => {
		const user = userEvent.setup();

		renderGlobalFilterBar();

		await user.click(screen.getByRole("button", { name: "매체 필터 열기" }));

		const dropdown = await screen.findByRole("dialog", { name: "매체 필터" });
		const googleOption = within(dropdown).getByRole("button", {
			name: "Google",
		});

		await user.tab();

		expect(googleOption).toHaveFocus();
		expect(googleOption.className).toContain(
			"focus-visible:ring-[var(--interactive-focus-ring)]",
		);
		expect(googleOption).toHaveAttribute("aria-pressed", "true");

		await user.keyboard("[Space]");

		await waitFor(() => {
			expect(googleOption).toHaveAttribute("aria-pressed", "false");
			expect(screen.getByTestId("global-filter-state")).toHaveTextContent(
				'"platforms":["Meta","Naver"]',
			);
		});
	});

	it("shows a validation message and keeps the last valid atom state for descending dates", async () => {
		const user = userEvent.setup();

		renderGlobalFilterBar();

		const startDateInput = screen.getByLabelText("시작일");
		const endDateInput = screen.getByLabelText("종료일");

		await user.clear(startDateInput);
		await user.type(startDateInput, "2026-04-10");
		await user.clear(endDateInput);
		await user.type(endDateInput, "2026-04-20");

		expect(screen.getByTestId("global-filter-state")).toHaveTextContent(
			'"startDate":"2026-04-10"',
		);
		expect(screen.getByTestId("global-filter-state")).toHaveTextContent(
			'"endDate":"2026-04-20"',
		);

		await user.clear(endDateInput);
		await user.type(endDateInput, "2026-04-01");

		expect(
			screen.getByText("시작일은 종료일보다 늦을 수 없습니다."),
		).toBeInTheDocument();
		expect(startDateInput).toHaveValue("2026-04-10");
		expect(endDateInput).toHaveValue("2026-04-01");
		expect(screen.getByTestId("global-filter-state")).toHaveTextContent(
			'"startDate":"2026-04-10"',
		);
		expect(screen.getByTestId("global-filter-state")).toHaveTextContent(
			'"endDate":"2026-04-20"',
		);
	});
});
