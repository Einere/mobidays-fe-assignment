import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Provider as JotaiProvider } from "jotai";
import type { PropsWithChildren } from "react";
import { createQueryClient } from "@/shared/api/query-client";

const queryClient = createQueryClient();

export function AppProviders({ children }: PropsWithChildren) {
	return (
		<JotaiProvider>
			<QueryClientProvider client={queryClient}>
				{children}
				{import.meta.env.DEV ? (
					<ReactQueryDevtools initialIsOpen={false} />
				) : null}
			</QueryClientProvider>
		</JotaiProvider>
	);
}
