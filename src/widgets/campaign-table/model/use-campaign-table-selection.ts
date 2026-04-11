import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface UseCampaignTableSelectionParams {
	resetKey: string;
	visibleRowIds: string[];
}

export function useCampaignTableSelection({
	resetKey,
	visibleRowIds,
}: UseCampaignTableSelectionParams) {
	const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
	const previousResetKeyRef = useRef(resetKey);
	const selectedRowIdSet = useMemo(
		() => new Set(selectedRowIds),
		[selectedRowIds],
	);

	useEffect(() => {
		if (previousResetKeyRef.current === resetKey) {
			return;
		}

		previousResetKeyRef.current = resetKey;
		setSelectedRowIds([]);
	}, [resetKey]);

	const toggleRowSelection = useCallback((rowId: string) => {
		setSelectedRowIds((currentSelectedRowIds) => {
			const currentSelectedRowIdSet = new Set(currentSelectedRowIds);

			if (currentSelectedRowIdSet.has(rowId)) {
				return currentSelectedRowIds.filter(
					(selectedRowId) => selectedRowId !== rowId,
				);
			}

			return [...currentSelectedRowIds, rowId];
		});
	}, []);

	const togglePageSelection = useCallback((pageRowIds: string[]) => {
		setSelectedRowIds((currentSelectedRowIds) => {
			const currentSelectedRowIdSet = new Set(currentSelectedRowIds);
			const pageRowIdSet = new Set(pageRowIds);
			const areAllPageRowsSelected =
				pageRowIds.length > 0 &&
				pageRowIds.every((rowId) => currentSelectedRowIdSet.has(rowId));

			if (areAllPageRowsSelected) {
				return currentSelectedRowIds.filter(
					(selectedRowId) => !pageRowIdSet.has(selectedRowId),
				);
			}

			return Array.from(new Set([...currentSelectedRowIds, ...pageRowIds]));
		});
	}, []);

	const clearSelection = useCallback(() => {
		setSelectedRowIds([]);
	}, []);

	const selectedVisibleRowCount = visibleRowIds.reduce(
		(count, rowId) => count + (selectedRowIdSet.has(rowId) ? 1 : 0),
		0,
	);
	const areAllVisibleRowsSelected =
		visibleRowIds.length > 0 &&
		selectedVisibleRowCount === visibleRowIds.length;
	const isPartiallySelected =
		selectedVisibleRowCount > 0 && !areAllVisibleRowsSelected;

	return {
		selectedRowIds,
		selectedCount: selectedRowIds.length,
		areAllVisibleRowsSelected,
		isPartiallySelected,
		toggleRowSelection,
		togglePageSelection,
		clearSelection,
	};
}
