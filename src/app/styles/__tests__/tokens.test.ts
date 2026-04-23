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
		expect(tokensCss).toContain("--control-height-touch:");
		expect(tokensCss).toContain("--layout-table-row-height-compact:");
	});

	it("defines interactive state tokens for controls", () => {
		expect(tokensCss).toContain("--interactive-primary-bg:");
		expect(tokensCss).toContain("--interactive-primary-bg-hover:");
		expect(tokensCss).toContain("--interactive-secondary-bg:");
		expect(tokensCss).toContain("--interactive-focus-ring:");
		expect(tokensCss).toContain("--interactive-disabled-opacity:");
		expect(tokensCss).toContain("--overlay-scrim:");
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
		expect(baseCss).toContain("--color-overlay-scrim: var(--overlay-scrim);");
	});

	it("defines typo utility classes from typography tokens", () => {
		expect(baseCss).not.toContain("--text-title:");
		expect(baseCss).not.toContain("--type-heading-xl:");
		expect(baseCss).toContain("@utility typo-heading-xl");
		expect(baseCss).toContain("font-size: var(--type-heading-xl-size);");
		expect(baseCss).toContain("@utility typo-heading-md");
		expect(baseCss).toContain("@utility typo-caption");
		expect(baseCss).toContain("@utility typo-table-sm");
		expect(baseCss).toContain("@utility typo-metric-lg");
		expect(baseCss).toContain(
			"--spacing-control-md: var(--control-height-md);",
		);
		expect(baseCss).toContain(
			"--spacing-control-touch: var(--control-height-touch);",
		);
		expect(baseCss).toContain(
			"--spacing-table-row: var(--layout-table-row-height);",
		);
		expect(baseCss).toContain(
			"--spacing-table-row-compact: var(--layout-table-row-height-compact);",
		);
		expect(baseCss).toContain("--spacing-page-max: var(--layout-page-max);");
		expect(baseCss).toContain("--ease-standard: var(--easing-standard);");
		expect(baseCss).toContain("--duration-fast: var(--duration-fast);");
		expect(baseCss).toContain(
			"--interactive-disabled-opacity: var(--interactive-disabled-opacity);",
		);
		expect(baseCss).toContain("--radius-card: var(--radius-lg);");
		expect(baseCss).toContain("--z-dropdown: var(--z-dropdown);");
		expect(baseCss).toContain("--z-modal-popover: var(--z-modal-popover);");
	});
});
