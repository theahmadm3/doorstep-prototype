
"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "./use-toast";

export const useNotificationListener = () => {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	useEffect(() => {
		const handleMessage = async (event: MessageEvent) => {
			console.log("Service Worker message received:", event.data);

			if (event.data && event.data.type === "ORDER_UPDATE") {
				console.log("Received ORDER_UPDATE, refetching queries...");
				console.log("QueryClient instance:", queryClient);
				console.log("About to refetch queries with keys:", [
					"customerOrders",
					"riderOrders",
					"vendorOrders",
				]);

				// Use refetchQueries to force an immediate background fetch
				await queryClient.refetchQueries({ queryKey: ["customerOrders"] });
				await queryClient.refetchQueries({ queryKey: ["riderOrders"] });
				await queryClient.refetchQueries({ queryKey: ["vendorOrders"] });

				console.log("Refetch calls executed.");


				// Optionally show a toast if the tab is active
				if (document.visibilityState === "visible") {
					toast({
						title: event.data.notification?.title || "Order Update",
						description:
							event.data.notification?.body ||
							"Your orders have been updated.",
					});
				}
			}
		};

		if ("serviceWorker" in navigator) {
			navigator.serviceWorker.addEventListener("message", handleMessage);
			console.log("Notification listener added.");
		}

		// Cleanup
		return () => {
			if ("serviceWorker" in navigator) {
				navigator.serviceWorker.removeEventListener("message", handleMessage);
				console.log("Notification listener removed.");
			}
		};
	}, [queryClient, toast]);
};
