import { QueryClientProvider } from "@tanstack/react-query";
import { Provider as JotaiProvider } from "jotai";
import type { PropsWithChildren } from "react";
import { createQueryClient } from "@/shared/api/query-client";

const queryClient = createQueryClient();

export function AppProviders({ children }: PropsWithChildren) {
	return (
		<JotaiProvider>
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		</JotaiProvider>
	);
}
