
import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useToast } from "./use-toast";

interface OrderUpdateMessage {
	type: "ORDER_UPDATE";
	notification?: {
		title?: string;
		body?: string;
		data?: Record<string, unknown>;
	};
}

interface NavigateMessage {
	type: "NAVIGATE";
	url: string;
}

interface NavigateToOrdersMessage {
	type: "NAVIGATE_TO_ORDERS";
}

type SWMessage = OrderUpdateMessage | NavigateMessage | NavigateToOrdersMessage;

const ROLE_ORDERS_PATH: Record<string, string> = {
	customer: "/customer/orders",
	restaurant: "/vendor/orders",
	driver: "/rider/orders",
	admin: "/admin/orders",
};

function ordersPathForCurrentUser(): string | null {
	try {
		const raw = localStorage.getItem("user");
		if (!raw) return null;
		const user = JSON.parse(raw) as { role?: string };
		return user.role ? ROLE_ORDERS_PATH[user.role] ?? null : null;
	} catch {
		return null;
	}
}

const DEV = import.meta.env.DEV;
const log = (...args: unknown[]) => {
	if (DEV) console.log("[Listener]", ...args);
};

export const useNotificationListener = () => {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const { toast } = useToast();

	// Per-mount flag, not module-level: avoids cross-instance pollution when
	// multiple role layouts share the same hook source.
	const needsRefetchOnVisible = useRef(false);

	const refetchAllOrders = useCallback(() => {
		return Promise.all([
			queryClient.refetchQueries({ queryKey: ["customerOrders"], type: "active" }),
			queryClient.refetchQueries({ queryKey: ["vendorOrders"], type: "active" }),
			queryClient.refetchQueries({ queryKey: ["riderOrders"], type: "active" }),
			queryClient.refetchQueries({ queryKey: ["availableRiderOrders"], type: "active" }),
		]);
	}, [queryClient]);

	useEffect(() => {
		if (typeof window === "undefined" || !navigator.serviceWorker) {
			log("Environment not supported, skipping listener setup");
			return;
		}

		log("Attaching listeners");

		const handleMessage = (event: MessageEvent<SWMessage>) => {
			const msg = event.data;
			if (!msg || typeof msg !== "object") return;
			log("Message received", msg);

			if (msg.type === "ORDER_UPDATE") {
				needsRefetchOnVisible.current = true;
				if (document.visibilityState === "visible") {
					refetchAllOrders()
						.then(() => {
							needsRefetchOnVisible.current = false;
						})
						.catch((err) => log("Immediate refetch failed", err));

					if (msg.notification) {
						toast({
							title: msg.notification.title || "Order Update",
							description: msg.notification.body || "Your order has been updated",
						});
					}
				}
				return;
			}

			if (msg.type === "NAVIGATE" && msg.url) {
				navigate(msg.url);
				return;
			}

			if (msg.type === "NAVIGATE_TO_ORDERS") {
				const path = ordersPathForCurrentUser();
				if (path) navigate(path);
				return;
			}
		};

		const refetchIfNeeded = (eventName: string) => {
			if (
				document.visibilityState === "visible" &&
				needsRefetchOnVisible.current
			) {
				log(`Refetch triggered by "${eventName}"`);
				setTimeout(() => {
					refetchAllOrders()
						.then(() => {
							needsRefetchOnVisible.current = false;
						})
						.catch((err) => log(`Refetch after "${eventName}" failed`, err));
				}, 300);
			}
		};

		const handleVisibilityChange = () => refetchIfNeeded("visibilitychange");
		const handleFocus = () => refetchIfNeeded("focus");
		const handlePageShow = () => refetchIfNeeded("pageshow");

		navigator.serviceWorker.addEventListener("message", handleMessage);
		document.addEventListener("visibilitychange", handleVisibilityChange);
		window.addEventListener("focus", handleFocus);
		window.addEventListener("pageshow", handlePageShow);

		// Catch the case where a notification arrived while the page was loading.
		refetchIfNeeded("initial mount");

		return () => {
			navigator.serviceWorker.removeEventListener("message", handleMessage);
			document.removeEventListener("visibilitychange", handleVisibilityChange);
			window.removeEventListener("focus", handleFocus);
			window.removeEventListener("pageshow", handlePageShow);
			log("Detached listeners");
		};
	}, [refetchAllOrders, navigate, toast]);
};
