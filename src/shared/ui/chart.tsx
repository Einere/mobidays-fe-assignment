import * as React from "react";
import { Legend, ResponsiveContainer, Tooltip } from "recharts";

import { cn } from "@/shared/lib/utils";

type ChartSeriesConfig = {
	label: string;
	color?: string;
};

type ChartConfig = Record<string, ChartSeriesConfig>;

type ChartContextValue = {
	config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextValue | null>(null);

function useChart() {
	const context = React.useContext(ChartContext);

	if (!context) {
		throw new Error("Chart components must be used within ChartContainer.");
	}

	return context;
}

function ChartContainer({
	className,
	config,
	style,
	children,
	...props
}: React.ComponentProps<"div"> & {
	config: ChartConfig;
}) {
	const cssVariables = Object.fromEntries(
		Object.entries(config).flatMap(([key, value]) => {
			const entries: Array<[string, string]> = [
				[`--color-${key}`, value.color ?? "currentColor"],
			];

			return entries;
		}),
	) as Record<string, string>;

	return (
		<ChartContext.Provider value={{ config }}>
			<div
				data-slot="chart"
				className={cn("relative w-full", className)}
				style={{ ...style, ...cssVariables } as React.CSSProperties}
				{...props}
			>
				<ResponsiveContainer width="100%" height="100%">
					{children}
				</ResponsiveContainer>
			</div>
		</ChartContext.Provider>
	);
}

function formatChartValue(value: unknown) {
	if (typeof value === "number") {
		return new Intl.NumberFormat("ko-KR").format(value);
	}

	return String(value ?? "");
}

type ChartTooltipPayloadItem = {
	dataKey?: string | number;
	name?: string | number;
	value?: unknown;
	color?: unknown;
};

type ChartTooltipContentProps = {
	active?: boolean;
	payload?: ChartTooltipPayloadItem[];
	label?: React.ReactNode;
	className?: string;
	formatter?: (value: unknown, name: string) => React.ReactNode;
};

function ChartTooltipContent({
	active,
	payload,
	label,
	className,
	formatter,
}: ChartTooltipContentProps) {
	const { config } = useChart();

	if (!active || !payload?.length) {
		return null;
	}

	return (
		<div
			className={cn(
				"rounded-card border border-outline-subtle bg-panel px-3 py-2 typo-body-sm shadow-panel",
				className,
			)}
		>
			{label ? (
				<div className="mb-2 typo-caption text-fg-muted">{label}</div>
			) : null}
			<div className="grid gap-2">
				{payload.map((item) => {
					const key = String(item.dataKey ?? item.name ?? "");
					const series = config[key];
					const value = formatter
						? formatter(item.value, key)
						: formatChartValue(item.value);

					return (
						<div key={key} className="flex items-center gap-2">
							<span
								aria-hidden="true"
								className="size-2 rounded-full"
								style={{
									backgroundColor:
										series?.color ??
										(typeof item.color === "string"
											? item.color
											: "currentColor"),
								}}
							/>
							<span className="text-fg-muted">
								{series?.label ?? item.name ?? key}
							</span>
							<span className="ml-auto font-medium text-fg">{value}</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}

function ChartTooltip({
	content,
	...props
}: React.ComponentProps<typeof Tooltip> & {
	content?: React.ReactElement<ChartTooltipContentProps>;
}) {
	return <Tooltip content={content ?? <ChartTooltipContent />} {...props} />;
}

type ChartLegendPayloadItem = {
	dataKey?: string | number;
	value?: string | number;
	color?: unknown;
};

type ChartLegendContentProps = {
	payload?: ChartLegendPayloadItem[];
	className?: string;
};

function ChartLegendContent({ payload, className }: ChartLegendContentProps) {
	const { config } = useChart();

	if (!payload?.length) {
		return null;
	}

	return (
		<div
			className={cn(
				"flex flex-wrap items-center gap-3 typo-body-sm",
				className,
			)}
		>
			{payload.map((item) => {
				const key = String(item.dataKey ?? item.value ?? "");
				const series = config[key];

				return (
					<div key={key} className="flex items-center gap-2">
						<span
							aria-hidden="true"
							className="size-2 rounded-full"
							style={{
								backgroundColor:
									series?.color ??
									(typeof item.color === "string"
										? item.color
										: "currentColor"),
							}}
						/>
						<span className="text-fg-muted">{series?.label ?? item.value}</span>
					</div>
				);
			})}
		</div>
	);
}

function ChartLegend({
	content,
	...props
}: React.ComponentProps<typeof Legend> & {
	content?: React.ReactElement<ChartLegendContentProps>;
}) {
	return <Legend content={content ?? <ChartLegendContent />} {...props} />;
}

export {
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
};
