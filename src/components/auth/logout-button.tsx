
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { useCartStore } from "@/stores/useCartStore";
import { useUIStore } from "@/stores/useUIStore";
import { useQueryClient } from "@tanstack/react-query";

export default function LogoutButton() {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const { toast } = useToast();
	const clearUserOrders = useCartStore(state => state.clearUserOrders);
	const clearUIState = useUIStore.getState().clearUIState;
	const queryClient = useQueryClient();

	const handleLogout = async () => {
		try {
			// In a real app, you might call an API endpoint to invalidate the token on the server.
			// await logoutUser();
		} catch (error) {
			console.error("An error occurred during API logout:", error);
			toast({
				title: "Logout Error",
				description:
					"Could not log you out from the server, but you have been logged out locally.",
				variant: "destructive",
			});
		} finally {
			// Clear all application state and local storage before redirecting.
			clearUserOrders();
			clearUIState();
			queryClient.clear(); // Clears all TanStack Query cache
			localStorage.clear();
			router.push("/login");
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
