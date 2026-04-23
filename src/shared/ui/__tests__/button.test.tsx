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

	it("uses explicit theme tokens for the default variant contrast", () => {
		render(<Button type="button">기본 버튼</Button>);

		const button = screen.getByRole("button", { name: "기본 버튼" });

		expect(button.className).toContain("bg-primary");
		expect(button.className).toContain("text-primary-fg");
		expect(button.className).toContain("hover:bg-primary-hover");
		expect(button.className).toContain("duration-fast");
		expect(button.className).toContain("disabled:opacity-interactive-disabled");
		expect(button.className).toContain("min-h-control-touch");
		expect(button.className).toContain("sm:h-control-md");
		expect(button.className).toContain("typo-label-md");
	});

	it("uses warning semantic tokens for the warning variant", () => {
		render(
			<Button type="button" variant="warning">
				주의 버튼
			</Button>,
		);

		const button = screen.getByRole("button", { name: "주의 버튼" });

		expect(button.getAttribute("data-variant")).toBe("warning");
		expect(button.className).toContain("border-status-warning-border");
		expect(button.className).toContain("bg-status-warning");
		expect(button.className).toContain("text-status-warning-fg");
	});
});
