function normalizeFinitePageValue(value: number) {
	return Number.isFinite(value) ? value : 1;
}

export function normalizePageSize(pageSize: number) {
	const normalizedPageSize = normalizeFinitePageValue(pageSize);

	return normalizedPageSize >= 1 ? Math.floor(normalizedPageSize) : 1;
}

export function normalizePage(page: number) {
	const normalizedPage = normalizeFinitePageValue(page);

	return Math.floor(normalizedPage);
}
