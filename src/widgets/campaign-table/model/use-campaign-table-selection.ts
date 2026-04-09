import { useCallback, useEffect, useRef, useState } from "react";

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

	useEffect(() => {
		if (previousResetKeyRef.current === resetKey) {
			return;
		}

		previousResetKeyRef.current = resetKey;
		setSelectedRowIds([]);
	}, [resetKey]);

	const toggleRowSelection = useCallback((rowId: string) => {
		setSelectedRowIds((currentSelectedRowIds) => {
			if (currentSelectedRowIds.includes(rowId)) {
				return currentSelectedRowIds.filter(
					(selectedRowId) => selectedRowId !== rowId,
				);
			}

			return [...currentSelectedRowIds, rowId];
		});
	}, []);

	const togglePageSelection = useCallback((pageRowIds: string[]) => {
		setSelectedRowIds((currentSelectedRowIds) => {
			const areAllPageRowsSelected =
				pageRowIds.length > 0 &&
				pageRowIds.every((rowId) => currentSelectedRowIds.includes(rowId));

			if (areAllPageRowsSelected) {
				return currentSelectedRowIds.filter(
					(selectedRowId) => !pageRowIds.includes(selectedRowId),
				);
			}

			return Array.from(new Set([...currentSelectedRowIds, ...pageRowIds]));
		});
	}, []);

	const clearSelection = useCallback(() => {
		setSelectedRowIds([]);
	}, []);

	const selectedVisibleRowIds = visibleRowIds.filter((rowId) =>
		selectedRowIds.includes(rowId),
	);
	const areAllVisibleRowsSelected =
		visibleRowIds.length > 0 &&
		selectedVisibleRowIds.length === visibleRowIds.length;
	const isPartiallySelected =
		selectedVisibleRowIds.length > 0 && !areAllVisibleRowsSelected;

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
