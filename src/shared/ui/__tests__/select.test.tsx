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
		expect(trigger.className).not.toContain("disabled:pointer-events-none");
	});
});
