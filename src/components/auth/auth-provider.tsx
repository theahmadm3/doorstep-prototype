
"use client";

import { useAuth } from "@/hooks/use-auth";
import { Utensils } from "lucide-react";
import { usePathname } from "next/navigation";

// This component is the first line of defense for authentication.
// It initializes the useAuth hook which attempts to fetch the user.
// While the user is being fetched, it shows a loading screen.
// Once the auth state is known, it renders the children.
// The actual routing logic (redirects) is handled within the page components themselves
// by using the useAuth hook.

export default function AuthProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const { isLoading, isAuthenticated } = useAuth();
	const pathname = usePathname();

	const isPublicPage =
		pathname === "/" ||
		pathname.startsWith("/signup") ||
		pathname.startsWith("/verify-otp") ||
		pathname.startsWith("/secret");

	// While we're checking the auth status, show a global loading indicator
	// for a better user experience on initial load or refresh.
	if (isLoading && !isPublicPage) {
		return (
			<div className="flex h-screen w-screen items-center justify-center">
				<Utensils className="h-12 w-12 animate-spin text-primary" />
			</div>
		);
	}

	return <>{children}</>;
}
