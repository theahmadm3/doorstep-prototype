
"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAuthUser } from "@/lib/auth-api";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useCartStore } from "@/stores/useCartStore";
import { useUIStore } from "@/stores/useUIStore";

export const useAuth = () => {
	const { accessToken, clearTokens } = useAuthStore();
	const router = useRouter();
	const queryClient = useQueryClient();
	const clearUserOrders = useCartStore((state) => state.clearUserOrders);
	const clearUIState = useUIStore.getState().clearUIState;

	// The `useAuth` hook no longer attempts to refresh the token on its own.
	// That logic is now entirely centralized within the `api-client`.
	// This hook's only job is to fetch the user if a token exists.

	const {
		data: user,
		isLoading,
		isError,
		error,
	} = useQuery({
		queryKey: ["authUser"],
		queryFn: getAuthUser,
		enabled: !!accessToken, // Only run the query if an access token is present in memory
		retry: 1, // Don't aggressively retry if the user is not authenticated.
		staleTime: 5 * 60 * 1000, // User data is considered fresh for 5 minutes
		gcTime: 15 * 60 * 1000, // Keep user data in cache for 15 minutes
	});

	const handleLogout = () => {
		// Clear all client-side state and caches
		clearTokens();
		clearUserOrders();
		clearUIState();
		queryClient.clear();
		// Redirect to the login page
		router.replace("/");
	};

	// Listen for the custom 'logout' event dispatched by the API client on 401 errors
	// or refresh failures.
	useEffect(() => {
		const logoutHandler = () => {
			console.log("Logout event received. Clearing session.");
			handleLogout();
		};
		window.addEventListener("logout", logoutHandler);

		return () => {
			window.removeEventListener("logout", logoutHandler);
		};
	}, []); // Empty dependency array ensures this runs only once
	
	return {
		user,
		isLoading,
		isError,
		error,
		isAuthenticated: !!user && !isError,
	};
};
