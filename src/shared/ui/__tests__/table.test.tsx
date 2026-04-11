import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DataTable } from "@/shared/ui/table";

describe("DataTable", () => {
	it("supports compact density and shared mobile scroll hints", () => {
		render(
			<DataTable
				caption="예시 표"
				density="compact"
				mobileScrollHint="좌우로 스크롤해 표 전체를 확인하세요."
				columns={[
					{ key: "name", header: "이름" },
					{ key: "metric", header: "지표", align: "right" },
				]}
				rows={[{ id: "row-1", name: "캠페인 A", metric: "10" }]}
			/>,
		);

		expect(
			screen.getByText("좌우로 스크롤해 표 전체를 확인하세요."),
		).toBeInTheDocument();
		expect(
			screen.getByRole("columnheader", { name: "이름" }).className,
		).toContain("h-table-row-compact");
		expect(screen.getByRole("cell", { name: "캠페인 A" }).className).toContain(
			"h-table-row-compact",
		);
	});

	it("exposes aria-sort on headers that opt into sort state", () => {
		render(
			<DataTable
				caption="정렬 예시 표"
				columns={[
					{ key: "name", header: "이름", ariaSort: "ascending" },
					{ key: "metric", header: "지표" },
				]}
				rows={[{ id: "row-1", name: "캠페인 A", metric: "10" }]}
			/>,
		);

		expect(screen.getByRole("columnheader", { name: "이름" })).toHaveAttribute(
			"aria-sort",
			"ascending",
		);
	});
});
