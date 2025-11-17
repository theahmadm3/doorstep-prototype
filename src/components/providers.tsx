"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import React from "react";
import { ErrorBoundary } from "react-error-boundary";

function ErrorFallback({ error }: { error: Error }) {
	return (
		<div
			role="alert"
			className="w-full h-screen flex flex-col justify-center items-center"
		>
			<h2 className="text-2xl font-bold">Something went wrong:</h2>
			<pre className="text-red-500">{error.message}</pre>
			<p>Please try refreshing the page.</p>
		</div>
	);
}

export function Providers({ children }: { children: React.ReactNode }) {
	const [queryClient] = React.useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 0,
					},
				},
			}),
	);

	return (
		<ErrorBoundary FallbackComponent={ErrorFallback}>
			<QueryClientProvider client={queryClient}>
				{children}
				<ReactQueryDevtools initialIsOpen={false} />
			</QueryClientProvider>
		</ErrorBoundary>
	);
}
