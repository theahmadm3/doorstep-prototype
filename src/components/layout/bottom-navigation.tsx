
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
					className="group relative inline-flex flex-col items-center justify-center px-5 transition-all duration-300"
					aria-label="Logout"
				>
					{/* Glassy hover effect */}
					<div className="absolute inset-0 rounded-2xl bg-white/10 dark:bg-white/5 opacity-0 group-hover:opacity-100 group-active:opacity-100 group-active:bg-white/20 dark:group-active:bg-white/10 transition-all duration-300 backdrop-blur-xl" />

					<LogOut className="w-6 h-6 mb-1.5 relative z-10 transition-all duration-300 group-hover:scale-110 group-active:scale-95" />
					<span className="text-xs font-medium relative z-10">Logout</span>
				</button>
			</AlertDialogTrigger>
			<AlertDialogContent className="backdrop-blur-3xl bg-white/80 dark:bg-gray-900/80 border border-white/20 dark:border-white/10 shadow-2xl">
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
		<>
			{/* Backdrop blur background */}
			<div className="fixed bottom-0 left-0 z-40 w-full h-20 bg-transparent pointer-events-none md:hidden border-0 backdrop-blur-2xl" />

			<nav
				className="fixed bottom-0 left-0 z-50 w-full md:hidden"
				aria-label="Bottom navigation"
			>
				{/* Glassy container with enhanced blur */}
				<div className="relative mx-3 mb-2 rounded-[28px] overflow-hidden">
					{/* Multi-layered glass effect */}
					<div className="absolute inset-0 bg-transparent dark:bg-gray-900/70 backdrop-blur-3xl" />
					<div className="absolute inset-0 bg-gradient-to-b  dark:from-white/10 dark:to-white/5" />

					{/* Border glow */}
					<div className="absolute inset-0 rounded-[28px] border border-white/40 dark:border-white/20" />
					<div className="absolute inset-0 rounded-[28px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]" />

					{/* Content */}
					<div className="relative inline-flex items-center justify-around h-16 w-full px-2 font-medium">
						{links.map(({ href, label, icon: Icon }) => {
							const isActive = pathname.startsWith(href);
							return (
								<Link
									key={label}
									href={href}
									className={cn(
										"group relative inline-flex flex-col items-center justify-center px-3 py-1 rounded-2xl transition-all duration-300",
										isActive && "text-primary",
									)}
									aria-current={isActive ? "page" : undefined}
								>
									{/* Active indicator */}
									{isActive && (
										<div className="absolute inset-0 bg-primary/10 dark:bg-primary/20 rounded-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300" />
									)}

									{/* Hover effect */}
									<div className="absolute inset-0 rounded-2xl bg-white/10 dark:bg-white/5 opacity-0 group-hover:opacity-100 group-active:opacity-100 group-active:bg-white/20 dark:group-active:bg-white/10 transition-all duration-300 backdrop-blur-xl" />

									<Icon
										className={cn(
											"w-6 h-6 mb-1.5 relative z-10 transition-all duration-300 group-hover:scale-110 group-active:scale-95",
											!isActive && "text-muted-foreground",
										)}
										aria-hidden="true"
									/>
									<span
										className={cn(
											"text-xs font-medium relative z-10",
											!isActive && "text-muted-foreground",
										)}
									>
										{label}
									</span>
								</Link>
							);
						})}
						<TempLogoutButton />
					</div>
				</div>
			</nav>
		</>
	);
}
