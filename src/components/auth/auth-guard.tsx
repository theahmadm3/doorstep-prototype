
"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getAuthUser } from "@/lib/auth-api";
import type { User } from "@/lib/types";
import { Loader2 } from "lucide-react";

const publicRoutes = [
	"/",
	"/signup",
	"/signup/vendor",
	"/signup/rider",
	"/menu",
	"/secret/non-accessible/to/customers/login",
	"/verify-otp",
];

const getDashboardRoute = (role: User["role"]): string => {
	switch (role) {
		case "customer":
			return "/customer/dashboard";
		case "restaurant":
			return "/vendor/dashboard";
		case "driver":
			return "/rider/dashboard";
		case "admin":
			return "/admin/dashboard";
		default:
			return "/";
	}
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

	const clearAuthData = useCallback(() => {
		localStorage.removeItem("accessToken");
		localStorage.removeItem("user");
	}, []);

	useEffect(() => {
		const checkAuth = async () => {
			setIsLoading(true);
			const token = localStorage.getItem("accessToken");

			if (!token) {
				if (!isPublicRoute(pathname)) {
					router.replace("/");
					return;
				}
				setIsLoading(false);
				return;
			}

			try {
				const user = await getAuthUser();
				localStorage.setItem("user", JSON.stringify(user));
				const dashboardRoute = getDashboardRoute(user.role);

				// If user is on a public route, redirect to their dashboard
				if (isPublicRoute(pathname)) {
					router.replace(dashboardRoute);
					return; // Stop further execution
				}

				// If user is trying to access a route that doesn't match their role, redirect
				const userRoutePrefix = dashboardRoute.split("/")[1];
				if (!pathname.startsWith(`/${userRoutePrefix}`)) {
					console.warn(
						`User with role ${user.role} attempting to access ${pathname}. Redirecting.`,
					);
					router.replace(dashboardRoute);
					return; // Stop further execution
				}

				// If all checks pass, stop loading
				setIsLoading(false);
			} catch (error) {
				console.error("Auth check failed:", error);
				clearAuthData();
				if (!isPublicRoute(pathname)) {
					router.replace("/");
				}
				setIsLoading(false);
			}
		};

		checkAuth();
	}, [pathname, router, clearAuthData]);

	if (isLoading) {
		return <LoadingScreen />;
	}

	return <>{children}</>;
}
