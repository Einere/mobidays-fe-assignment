export function toSafeNumber(value: number | null): number {
	return typeof value === "number" && Number.isFinite(value) && value >= 0
		? value
		: 0;
}
