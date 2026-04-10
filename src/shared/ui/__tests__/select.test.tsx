import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/select";

describe("SelectTrigger", () => {
	it("keeps the disabled cursor style without pointer-events-none", () => {
		render(
			<Select disabled value="">
				<SelectTrigger aria-label="상태 선택">
					<SelectValue placeholder="상태 선택" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="active">진행 중</SelectItem>
				</SelectContent>
			</Select>,
		);

		const trigger = screen.getByRole("combobox", { name: "상태 선택" });

		expect(trigger.className).toContain("disabled:cursor-not-allowed");
		expect(trigger.className).toContain("min-h-control-touch");
		expect(trigger.className).toContain("sm:h-control-md");
		expect(trigger.className).not.toContain("disabled:pointer-events-none");
	});

	it("includes invalid-state styles when aria-invalid is set", () => {
		render(
			<Select value="">
				<SelectTrigger aria-invalid aria-label="광고 매체">
					<SelectValue placeholder="광고 매체 선택" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="Google">Google</SelectItem>
				</SelectContent>
			</Select>,
		);

		const trigger = screen.getByRole("combobox", { name: "광고 매체" });

		expect(trigger.className).toContain(
			"aria-invalid:border-status-danger-border",
		);
		expect(trigger.className).toContain("aria-invalid:bg-status-danger/30");
		expect(trigger.className).toContain("aria-invalid:text-status-danger-fg");
	});
});

describe("SelectContent", () => {
	it("keeps pointer events enabled for portal content rendered above dialogs", () => {
		const { container } = render(
			<Select open value="Google">
				<SelectTrigger aria-label="광고 매체">
					<SelectValue placeholder="광고 매체 선택" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="Google">Google</SelectItem>
				</SelectContent>
			</Select>,
		);

		const content = container.ownerDocument.querySelector(
			'[data-slot="select-content"]',
		);

		expect(content).not.toBeNull();
		expect(content?.className).toContain("pointer-events-auto");
	});
});
