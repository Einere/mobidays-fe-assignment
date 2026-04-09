import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ToggleButton } from "@/shared/ui/toggle-button";

describe("ToggleButton", () => {
	it("applies the selected chip styles and pressed state", () => {
		render(<ToggleButton pressed>선택됨</ToggleButton>);

		const button = screen.getByRole("button", { name: "선택됨" });

		expect(button).toHaveAttribute("aria-pressed", "true");
		expect(button.className).toContain("border-brand");
		expect(button.className).toContain("bg-selected");
		expect(button.className).toContain("text-selected-fg");
	});

	it("keeps the base chip styles when unpressed", () => {
		render(<ToggleButton>기본</ToggleButton>);

		const button = screen.getByRole("button", { name: "기본" });

		expect(button).toHaveAttribute("aria-pressed", "false");
		expect(button.className).toContain("border-outline");
		expect(button.className).not.toContain("border-brand");
	});
});
