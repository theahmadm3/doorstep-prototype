"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getAuthUser } from "@/lib/auth-api";
import type { User } from "@/lib/types";
import { Loader2 } from "lucide-react";

const publicRoutes = [
	"/",
	"/login",
	"/signup",
	"/signup/vendor",
	"/signup/rider",
	"/menu",
	"/secret/non-accessible/to/customers/login",
	"/verify-otp",
];

const getRoleRoutePrefix = (role: User["role"]): string => {
	switch (role) {
		case "customer":
			return "customer";
		case "restaurant":
			return "vendor";
		case "driver":
			return "rider";
		case "admin":
			return "admin";
		default:
			return "";
	}
};

const getDashboardRoute = (role: User["role"]): string => {
	const prefix = getRoleRoutePrefix(role);
	return prefix ? `/${prefix}/dashboard` : "/login";
};

const isPublicRoute = (pathname: string): boolean => {
	return (
		publicRoutes.includes(pathname) || pathname.startsWith("/restaurants/")
	);
};

const LoadingScreen = () => (
	<div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center">
		<Loader2 className="h-12 w-12 animate-spin text-primary" />
		<p className="mt-4 text-muted-foreground">Loading...</p>
	</div>
);

export default function AuthGuard({ children }: { children: React.ReactNode }) {
	const router = useRouter();
	const pathname = usePathname();
	const [isLoading, setIsLoading] = useState(true);
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	const clearAuthData = useCallback(() => {
		localStorage.removeItem("accessToken");
		localStorage.removeItem("user");
		setIsAuthenticated(false);
	}, []);

	useEffect(() => {
		const checkAuth = async () => {
			setIsLoading(true);

			// Allow public routes without auth check
			if (isPublicRoute(pathname)) {
				const token = localStorage.getItem("accessToken");

				// If user has token on public route, verify and redirect to dashboard
				if (token) {
					try {
						const user = await getAuthUser();
						localStorage.setItem("user", JSON.stringify(user));
						setIsAuthenticated(true);
						router.replace(getDashboardRoute(user.role));
						return;
					} catch (error) {
						console.error("Auth check failed:", error);
						clearAuthData();
					}
				}

				setIsLoading(false);
				return;
			}

			// Protected route - require authentication
			const token = localStorage.getItem("accessToken");

			if (!token) {
				clearAuthData();
				setIsLoading(false);
				router.replace("/login");
				return;
			}

			try {
				const user = await getAuthUser();
				localStorage.setItem("user", JSON.stringify(user));
				setIsAuthenticated(true);

				// Optional: Add role-based route protection
				const userRoutePrefix = getRoleRoutePrefix(user.role);

				// If user is trying to access another role's routes, redirect them
				if (
					userRoutePrefix &&
					pathname.startsWith(`/${userRoutePrefix}`) === false &&
					!pathname.startsWith("/restaurants/")
				) {
					console.warn("User attempting to access unauthorized route");
					router.replace(getDashboardRoute(user.role));
					return;
				}

				setIsLoading(false);
			} catch (error) {
				console.error("Auth check failed:", error);
				clearAuthData();
				router.replace("/login");
			}
		};

		checkAuth();
	}, [pathname, router, clearAuthData]);

	// Show loading screen during auth check
	if (isLoading) {
		return <LoadingScreen />;
	}

	// Only render children if on public route or authenticated
	if (!isPublicRoute(pathname) && !isAuthenticated) {
		return null;
	}

	return <>{children}</>;
}
