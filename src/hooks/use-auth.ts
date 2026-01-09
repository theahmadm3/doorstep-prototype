
"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAuthUser, refreshToken } from "@/lib/auth-api";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useCartStore } from "@/stores/useCartStore";
import { useUIStore } from "@/stores/useUIStore";

export const useAuth = () => {
	const { accessToken, setAccessToken, clearToken } = useAuthStore();
	const router = useRouter();
	const queryClient = useQueryClient();
	const clearUserOrders = useCartStore((state) => state.clearUserOrders);
	const clearUIState = useUIStore.getState().clearUIState;

	// This is the core logic for session restoration.
	// On initial load, if there's no access token in memory,
	// we immediately try to get a new one using the refresh token cookie.
	useEffect(() => {
		const restoreSession = async () => {
			if (!accessToken) {
				try {
					console.log("No access token found, attempting to refresh session...");
					const { access } = await refreshToken();
					setAccessToken(access);
					console.log("Session restored successfully.");
				} catch (error) {
					console.log("No valid session found or refresh failed.");
					// If refresh fails, it's okay, the user is simply not logged in.
					// The useQuery below will not run.
				}
			}
		};

		restoreSession();
	}, []); // This runs only once on component mount

	const {
		data: user,
		isLoading,
		isError,
		error,
	} = useQuery({
		queryKey: ["authUser"],
		queryFn: getAuthUser,
		enabled: !!accessToken, // Only run the query if an access token is present
		retry: 1, // Only retry once on failure
		staleTime: Infinity,
		gcTime: Infinity,
	});

	const handleLogout = () => {
		// Clear all client-side state and caches
		clearToken();
		clearUserOrders();
		clearUIState();
		queryClient.clear();
		// Redirect to the login page
		router.replace("/");
	};

	// Listen for the custom 'logout' event dispatched by the API client on 401 errors
	useEffect(() => {
		const logoutHandler = () => {
			console.log("Logout event received. Clearing session.");
			handleLogout();
		};
		window.addEventListener("logout", logoutHandler);

		return () => {
			window.removeEventListener("logout", logoutHandler);
		};
	}, []);
	
	return {
		user,
		isLoading,
		isError,
		error,
		isAuthenticated: !!user && !isError,
	};
};
