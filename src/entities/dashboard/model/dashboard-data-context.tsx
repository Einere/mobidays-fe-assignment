import type { PropsWithChildren } from "react";
import { createContext, useContext, useMemo } from "react";
import { useDashboardData } from "@/entities/dashboard/hooks/use-dashboard-data";
import {
	type DashboardDerivations,
	useDashboardDerivations,
} from "@/entities/dashboard/model/use-dashboard-derivations";
import type { GlobalFilterState } from "@/entities/global-filter/model/types";

type DashboardDataContextValue = {
	query: ReturnType<typeof useDashboardData>;
	derivations: DashboardDerivations | null;
};

const DashboardDataContext = createContext<DashboardDataContextValue | null>(
	null,
);

export function DashboardDataProvider({
	filter,
	children,
}: PropsWithChildren<{ filter: GlobalFilterState }>) {
	const query = useDashboardData(filter);
	const derivations = useDashboardDerivations(query.data ?? null, filter);
	const value = useMemo(() => ({ query, derivations }), [derivations, query]);

	return (
		<DashboardDataContext.Provider value={value}>
			{children}
		</DashboardDataContext.Provider>
	);
}

export function useDashboardDataContext() {
	const context = useContext(DashboardDataContext);

	if (context === null) {
		throw new Error("DashboardDataProvider is required.");
	}

	return context;
}
