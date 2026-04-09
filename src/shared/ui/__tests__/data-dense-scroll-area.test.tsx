import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DataDenseScrollArea } from "@/shared/ui/data-dense-scroll-area";

describe("DataDenseScrollArea", () => {
	it("renders a mobile scroll hint and a shared scroll viewport", () => {
		render(
			<DataDenseScrollArea hint="좌우로 스크롤해 더 많은 지표를 확인하세요.">
				<div>내용</div>
			</DataDenseScrollArea>,
		);

		expect(
			screen.getByText("좌우로 스크롤해 더 많은 지표를 확인하세요."),
		).toBeInTheDocument();
		expect(
			screen.getByTestId("data-dense-scroll-viewport").className,
		).toContain("overflow-x-auto");
	});
});
