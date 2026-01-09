
"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAuthUser } from "@/lib/auth-api";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useCartStore } from "@/stores/useCartStore";
import { useUIStore } from "@/stores/useUIStore";

export const useAuth = () => {
	const { accessToken, clearToken } = useAuthStore();
	const router = useRouter();
	const queryClient = useQueryClient();
	const clearUserOrders = useCartStore((state) => state.clearUserOrders);
	const clearUIState = useUIStore.getState().clearUIState;

	const {
		data: user,
		isLoading,
		isError,
		error,
	} = useQuery({
		queryKey: ["authUser"],
		queryFn: getAuthUser,
		enabled: !!accessToken, // Only run the query if there's an access token
		retry: 1, // Only retry once on failure
		staleTime: Infinity, // User data is considered fresh until invalidated
		gcTime: Infinity, // Keep user data in cache indefinitely
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
