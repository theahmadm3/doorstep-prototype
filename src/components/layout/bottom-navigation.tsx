"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCartStore } from "@/stores/useCartStore";
import { useUIStore } from "@/stores/useUIStore";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface NavLink {
	href: string;
	label: string;
	icon: LucideIcon;
}

interface BottomNavigationProps {
	links: NavLink[];
}

function TempLogoutButton() {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [isLoggingOut, setIsLoggingOut] = useState(false);
	const { toast } = useToast();
	const clearUserOrders = useCartStore((state) => state.clearUserOrders);
	const clearUIState = useUIStore.getState().clearUIState;
	const queryClient = useQueryClient();

	const handleLogout = async () => {
		setIsLoggingOut(true);

		try {
			// In a real app, call your API endpoint to invalidate the token on the server
			// await logoutUser();

			// Clear all application state
			clearUserOrders();
			clearUIState();
			queryClient.clear();
			localStorage.clear();

			// Close dialog and redirect
			setOpen(false);
			router.push("/login");
		} catch (error) {
			console.error("Logout error:", error);
			toast({
				title: "Logout Error",
				description:
					"Could not log you out from the server, but you have been logged out locally.",
				variant: "destructive",
			});

			// Still clear local state even if server logout fails
			clearUserOrders();
			clearUIState();
			queryClient.clear();
			localStorage.clear();
			setOpen(false);
			router.push("/login");
		} finally {
			setIsLoggingOut(false);
		}
	};

	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogTrigger asChild>
				<button
					type="button"
					className="inline-flex flex-col items-center justify-center px-5 text-muted-foreground hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
					aria-label="Logout"
				>
					<LogOut className="w-5 h-5 mb-2" />
					<span className="text-xs">Logout</span>
				</button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Confirm Logout</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to log out of your account?
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isLoggingOut}>Cancel</AlertDialogCancel>
					<AlertDialogAction onClick={handleLogout} disabled={isLoggingOut}>
						{isLoggingOut ? "Logging out..." : "Logout"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

export default function BottomNavigation({ links }: BottomNavigationProps) {
	const pathname = usePathname();

	return (
		<nav
			className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t md:hidden"
			aria-label="Bottom navigation"
		>
			<div className="inline-flex items-center justify-center h-full w-full max-w-lg mx-auto font-medium">
				{links.map(({ href, label, icon: Icon }) => {
					const isActive = pathname.startsWith(href);
					return (
						<Link
							key={href}
							href={href}
							className={cn(
								"inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
								isActive ? "text-primary" : "text-muted-foreground",
							)}
							aria-current={isActive ? "page" : undefined}
						>
							<Icon className="w-5 h-5 mb-2" aria-hidden="true" />
							<span className="text-xs">{label}</span>
						</Link>
					);
				})}
				<TempLogoutButton />
			</div>
		</nav>
	);
}
