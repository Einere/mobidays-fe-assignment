/// <reference types="node" />

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const tokensCss = fs.readFileSync(
	path.resolve(process.cwd(), "src/app/styles/tokens.css"),
	"utf8",
);

describe("design tokens", () => {
	it("defines core semantic tokens", () => {
		expect(tokensCss).toContain("--text-primary:");
		expect(tokensCss).toContain("--surface-panel:");
		expect(tokensCss).toContain("--border-default:");
		expect(tokensCss).toContain("--control-height-md:");
	});

	it("defines interactive state tokens for controls", () => {
		expect(tokensCss).toContain("--interactive-primary-bg:");
		expect(tokensCss).toContain("--interactive-primary-bg-hover:");
		expect(tokensCss).toContain("--interactive-secondary-bg:");
		expect(tokensCss).toContain("--interactive-focus-ring:");
		expect(tokensCss).toContain("--interactive-disabled-opacity:");
	});

	it("defines typography tokens for data-dense interfaces", () => {
		expect(tokensCss).toContain("--type-body-md-size:");
		expect(tokensCss).toContain("--type-table-sm-size:");
		expect(tokensCss).toContain("--type-metric-lg-size:");
		expect(tokensCss).toContain("--type-form-label-size:");
	});

	it("defines chart meaning tokens beyond ordinal series colors", () => {
		expect(tokensCss).toContain("--chart-positive:");
		expect(tokensCss).toContain("--chart-warning:");
		expect(tokensCss).toContain("--chart-danger:");
		expect(tokensCss).toContain("--chart-baseline:");
	});
});
