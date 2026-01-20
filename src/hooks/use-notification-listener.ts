"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

export function useNotificationListener() {
	const queryClient = useQueryClient();

	useEffect(() => {
		// Check if service worker is supported
		if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
			console.log("[NotificationListener] Service Worker not supported");
			return;
		}

		const handleMessage = (event: MessageEvent) => {
			console.log("[NotificationListener] Received message from SW:", event.data);

			// Check if this is an ORDER_UPDATE message
			if (event.data && event.data.type === "ORDER_UPDATE") {
				console.log("[NotificationListener] Processing ORDER_UPDATE");

				// Invalidate the customerOrders query to refetch the data
				queryClient.invalidateQueries({ queryKey: ["customerOrders"] });
				console.log("[NotificationListener] Invalidated customerOrders query");

				// Show toast only if the page is visible (user is actively viewing it)
				if (typeof document !== "undefined" && document.visibilityState === "visible") {
					const notification = event.data.notification || {};
					console.log(
						"[NotificationListener] Page is visible, showing toast",
					);

					toast({
						title: notification.title || "Order Update",
						description: notification.body || "You have a new order update",
					});
				} else {
					console.log(
						"[NotificationListener] Page is hidden, skipping toast",
					);
				}
			}
		};

		// Add the message event listener
		navigator.serviceWorker.addEventListener("message", handleMessage);
		console.log("[NotificationListener] Message listener registered");

		// Cleanup function
		return () => {
			navigator.serviceWorker.removeEventListener("message", handleMessage);
			console.log("[NotificationListener] Message listener removed");
		};
	}, [queryClient]);
}
