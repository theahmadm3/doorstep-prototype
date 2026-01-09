
"use client";

import { useState } from "react";
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
import { LogOut } from "lucide-react";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCartStore } from "@/stores/useCartStore";
import { useUIStore } from "@/stores/useUIStore";
import { useQueryClient } from "@tanstack/react-query";
import { logoutUser } from "@/lib/auth-api";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const { toast } = useToast();
	const clearTokens = useAuthStore((state) => state.clearTokens);
	const clearUserOrders = useCartStore((state) => state.clearUserOrders);
	const clearUIState = useUIStore.getState().clearUIState;
	const queryClient = useQueryClient();

	const handleLogout = async () => {
		try {
			await logoutUser();
		} catch (error) {
			console.error("Server logout failed, proceeding with client-side cleanup:", error);
		} finally {
			// This block runs regardless of whether the API call succeeds or fails,
			// ensuring the user is logged out on the client.
			
			// 1. Clear the in-memory access and refresh tokens.
			clearTokens();
			
			// 2. Clear all other application state.
			clearUserOrders();
			clearUIState();
			
			// 3. Invalidate all TanStack Query caches.
			queryClient.clear();
			
			// 4. Redirect to the login page.
			router.push("/");
			
			toast({
				title: "Logged Out",
				description: "You have been successfully logged out.",
			});
		}
	};

	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-full text-white m-auto bg-primary"
				>
					Logout{" "}
					<LogOut className="w-5 h-5 text-white-foreground hover:text-foreground" />
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Confirm Logout</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to log out of your account?
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
