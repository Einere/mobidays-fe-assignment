import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TextInput } from "@/shared/ui/input";
import { SidebarNav } from "@/shared/ui/sidebar";
import { DataTable } from "@/shared/ui/table";

describe("dashboard shell components", () => {
	it("renders an input with semantic token classes", () => {
		render(<TextInput aria-label="캠페인 검색" placeholder="캠페인 검색" />);

		const input = screen.getByRole("textbox", { name: "캠페인 검색" });

		expect(input).toBeInTheDocument();
		expect(input.className).toContain("bg-[var(--surface-panel)]");
		expect(input.className).toContain("border-[var(--border-default)]");
		expect(input.className).toContain(
			"focus-visible:ring-[var(--interactive-focus-ring)]",
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

		expect(activeItem.className).toContain(
			"bg-[var(--interactive-selected-bg)]",
		);
		expect(activeItem.className).toContain(
			"text-[var(--interactive-selected-fg)]",
		);
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
		).toContain("text-[length:var(--type-table-sm-size)]");
	});
});
