/// <reference types="node" />

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const tokensCss = fs.readFileSync(
	path.resolve(process.cwd(), "src/app/styles/tokens.css"),
	"utf8",
);
const baseCss = fs.readFileSync(
	path.resolve(process.cwd(), "src/app/styles/base.css"),
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
		expect(tokensCss).toContain("--type-heading-xl-size:");
		expect(tokensCss).not.toContain("--type-display-lg-size:");
		expect(tokensCss).toContain("--type-body-md-size:");
		expect(tokensCss).not.toContain("--type-title-size:");
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

	it("maps semantic tokens to tailwind theme aliases", () => {
		expect(baseCss).toContain("--color-panel: var(--surface-panel);");
		expect(baseCss).toContain("--color-fg: var(--text-primary);");
		expect(baseCss).toContain("--color-fg-muted: var(--text-secondary);");
		expect(baseCss).toContain("--color-brand: var(--border-brand);");
		expect(baseCss).toContain(
			"--color-status-danger: var(--status-danger-bg);",
		);
		expect(baseCss).toContain("--color-focus: var(--interactive-focus-ring);");
	});

	it("maps typography and sizing tokens to tailwind theme aliases", () => {
		expect(baseCss).not.toContain("--text-title:");
		expect(baseCss).toContain(
			"--text-heading-xl: var(--type-heading-xl-size);",
		);
		expect(baseCss).toContain(
			"--text-heading-md: var(--type-heading-md-size);",
		);
		expect(baseCss).toContain("--text-caption: var(--type-caption-size);");
		expect(baseCss).toContain("--text-table-sm: var(--type-table-sm-size);");
		expect(baseCss).toContain("--text-metric-lg: var(--type-metric-lg-size);");
		expect(baseCss).toContain(
			"--spacing-control-md: var(--control-height-md);",
		);
		expect(baseCss).toContain(
			"--spacing-table-row: var(--layout-table-row-height);",
		);
		expect(baseCss).toContain("--spacing-page-max: var(--layout-page-max);");
		expect(baseCss).toContain("--ease-standard: var(--easing-standard);");
		expect(baseCss).toContain("--radius-card: var(--radius-lg);");
	});
});
