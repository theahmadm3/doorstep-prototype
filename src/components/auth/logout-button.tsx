
import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { unsubscribeFromPushNotifications } from "@/lib/push-notifications";
import { usePushStore } from "@/hooks/use-push-manager";
import { clearAuth } from "@/lib/auth";

export default function LogoutButton() {
	const navigate = useNavigate();
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
			// Best-effort: drop the push subscription so the backend stops sending
			// notifications to this device for the previous user. We don't block on
			// it — failures here shouldn't prevent the user from logging out.
			try {
				await unsubscribeFromPushNotifications();
			} catch (err) {
				console.error("Push unsubscribe failed during logout:", err);
			}
			usePushStore.setState({ isSubscribed: false, initialized: false });

			// Clear all auth keys (tokens, user, role history) then app state.
			clearAuth();
			clearUserOrders();
			clearUIState();
			queryClient.clear();
			navigate("/");
		}
	};

	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogTrigger asChild>
				<Button
					variant="destructive"
					className="w-full"
				>
					<LogOut className="mr-2 h-4 w-4" />
					Logout
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
