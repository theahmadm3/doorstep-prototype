
"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "./use-toast";

export const useNotificationListener = () => {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			console.log("Service Worker message received:", event.data);

			if (event.data && event.data.type === "ORDER_UPDATE") {
				console.log("Received ORDER_UPDATE, invalidating queries...");

				// Invalidate queries to refetch data
				queryClient.invalidateQueries({ queryKey: ["customerOrders"] });
				queryClient.invalidateQueries({ queryKey: ["riderOrders"] });
				queryClient.invalidateQueries({ queryKey: ["vendorOrders"] });

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
