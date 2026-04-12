import { type ComponentProps, useState } from "react";
import { Sector } from "recharts";
import type { CampaignPlatform } from "@/entities/global-filter/model/types";
import type { PlatformPerformanceSlice } from "@/entities/platform-performance/model/types";
import { isKnownCampaignPlatformForDonut } from "@/widgets/platform-performance-chart/model/platform-performance-donut";

type PlatformPerformancePieSectorProps = ComponentProps<typeof Sector> & {
	payload?: PlatformPerformanceSlice;
	onPlatformSelect: (platform: CampaignPlatform) => void;
};

export function PlatformPerformancePieSector({
	payload,
	onPlatformSelect,
	...props
}: PlatformPerformancePieSectorProps) {
	const platform = payload?.platform;
	const isSelected = payload?.isSelected ?? false;
	const [isFocused, setIsFocused] = useState(false);

	if (platform === undefined) {
		return <Sector {...props} />;
	}

	if (!isKnownCampaignPlatformForDonut(platform)) {
		return (
			<Sector
				{...props}
				aria-label={platform}
				aria-disabled="true"
				style={{ cursor: "not-allowed", ...(props.style ?? {}) }}
			/>
		);
	}

	return (
		<Sector
			{...props}
			role="button"
			tabIndex={0}
			aria-label={`${platform} 선택`}
			aria-pressed={isSelected}
			stroke={isFocused ? "var(--color-focus)" : "transparent"}
			strokeWidth={isFocused ? 3 : 1}
			strokeLinejoin="round"
			style={{ cursor: "pointer", ...(props.style ?? {}) }}
			onClick={(event) => {
				event.stopPropagation();
				onPlatformSelect(platform);
			}}
			onFocus={() => setIsFocused(true)}
			onBlur={() => setIsFocused(false)}
			onKeyDown={(event) => {
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					onPlatformSelect(platform);
				}
			}}
		/>
	);
}
