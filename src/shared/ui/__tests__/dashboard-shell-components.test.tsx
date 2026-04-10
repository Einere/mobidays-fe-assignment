import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Button } from "@/shared/ui/button";
import { TextInput } from "@/shared/ui/input";
import { MobileSidebarNav, SidebarNav } from "@/shared/ui/sidebar";
import { DataTable } from "@/shared/ui/table";

describe("dashboard shell components", () => {
	it("renders interactive controls with pointer and text cursors", () => {
		render(
			<>
				<Button>보고서 내보내기</Button>
				<TextInput aria-label="캠페인 검색" placeholder="캠페인 검색" />
			</>,
		);

		expect(
			screen.getByRole("button", { name: "보고서 내보내기" }).className,
		).toContain("cursor-pointer");
		expect(
			screen.getByRole("button", { name: "보고서 내보내기" }).className,
		).toContain("min-h-control-touch");
		expect(
			screen.getByRole("textbox", { name: "캠페인 검색" }).className,
		).toContain("cursor-text");
		expect(
			screen.getByRole("textbox", { name: "캠페인 검색" }).className,
		).toContain("min-h-control-touch");
	});

	it("renders an input with semantic token classes", () => {
		render(<TextInput aria-label="캠페인 검색" placeholder="캠페인 검색" />);

		const input = screen.getByRole("textbox", { name: "캠페인 검색" });

		expect(input).toBeInTheDocument();
		expect(input.className).toContain("bg-panel");
		expect(input.className).toContain("border-outline");
		expect(input.className).toContain("focus-visible:ring-focus");
		expect(input.className).toContain(
			"aria-invalid:border-status-danger-border",
		);
	});

	it("renders a sidebar with active item token classes", () => {
		render(
			<SidebarNav
				title="Mobidays Dashboard"
				items={[
					{ id: "overview", label: "개요", active: true },
					{ id: "campaigns", label: "캠페인" },
				]}
			/>,
		);

		expect(screen.getByText("Mobidays Dashboard")).toBeInTheDocument();
		const activeItem = screen.getByRole("link", { name: "개요" });

		expect(activeItem.className).toContain("bg-selected");
		expect(activeItem.className).toContain("text-selected-fg");
		expect(activeItem.className).toContain("min-h-control-touch");
	});

	it("opens and closes a mobile navigation dialog from explicit controls", async () => {
		const user = userEvent.setup();

		render(
			<MobileSidebarNav
				title="Mobidays Dashboard"
				items={[
					{ id: "overview", label: "개요", active: true },
					{ id: "campaigns", label: "캠페인" },
				]}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "메뉴 열기" }));

		expect(screen.getByRole("dialog")).toBeInTheDocument();
		expect(
			document.querySelector('[data-slot="mobile-sidebar-overlay"]')
				?.className ?? "",
		).toContain("bg-overlay-scrim");
		expect(
			document.querySelector('[data-slot="mobile-sidebar-content"]')
				?.className ?? "",
		).toContain("overflow-y-auto");
		expect(screen.getByRole("link", { name: "개요" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "캠페인" })).toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: "메뉴 닫기" }));

		await waitFor(() => {
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
		});
	});

	it("truncates very long sidebar labels to prevent mobile overflow", () => {
		render(
			<SidebarNav
				title="Mobidays Dashboard"
				items={[
					{
						id: "extremely-long-item",
						label:
							"아주 길어서 한 줄을 넘어가는 캠페인 운영 메뉴 라벨 테스트 텍스트입니다",
						active: true,
					},
				]}
			/>,
		);

		expect(
			screen.getByRole("link", {
				name: "아주 길어서 한 줄을 넘어가는 캠페인 운영 메뉴 라벨 테스트 텍스트입니다",
			}).className,
		).toContain("min-w-0");
		expect(
			screen.getByText(
				"아주 길어서 한 줄을 넘어가는 캠페인 운영 메뉴 라벨 테스트 텍스트입니다",
			).className,
		).toContain("truncate");
	});

	it("renders a data table using density and status tokens", () => {
		render(
			<DataTable
				caption="캠페인 상태 표"
				columns={[
					{ key: "name", header: "캠페인" },
					{ key: "status", header: "상태" },
					{ key: "cpa", header: "CPA", align: "right" },
				]}
				rows={[
					{
						id: "1",
						name: "브랜드 검색",
						status: <span>운영 중</span>,
						cpa: "₩18,240",
					},
				]}
			/>,
		);

		expect(
			screen.getByRole("table", { name: "캠페인 상태 표" }),
		).toBeInTheDocument();
		expect(screen.getByText("브랜드 검색")).toBeInTheDocument();
		expect(screen.getByText("운영 중")).toBeInTheDocument();
		expect(screen.getByText("₩18,240").className).toContain("text-right");
		expect(
			screen.getByRole("table", { name: "캠페인 상태 표" }).className,
		).toContain("typo-table-sm");
	});
});
