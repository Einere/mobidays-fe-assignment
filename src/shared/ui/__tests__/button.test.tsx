import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/shared/ui/button";

describe("Button", () => {
	it("keeps the disabled cursor style without pointer-events-none", () => {
		render(
			<Button disabled type="button">
				비활성 버튼
			</Button>,
		);

		const button = screen.getByRole("button", { name: "비활성 버튼" });

		expect(button.className).toContain("disabled:cursor-not-allowed");
		expect(button.className).not.toContain("disabled:pointer-events-none");
	});
});
