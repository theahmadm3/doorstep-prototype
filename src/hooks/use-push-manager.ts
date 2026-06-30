"use client";

import { useEffect, useCallback } from "react";
import { create } from "zustand";
import {
	getPushServiceWorker,
	getCurrentSubscription,
	isPushNotificationSupported,
	subscribeToPushNotifications,
	detectPlatform,
} from "@/lib/push-notifications";
import { subscribeToNotifications } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { useToast } from "./use-toast";
import type { PlatformInfo } from "@/lib/types";

interface PushState {
	isSupported: boolean;
	isSubscribed: boolean;
	isSubscribing: boolean;
	platformInfo: PlatformInfo;
	initialized: boolean;
	setIsSubscribed: (v: boolean) => void;
	setIsSubscribing: (v: boolean) => void;
}

export const usePushStore = create<PushState>((set) => ({
	isSupported: false,
	isSubscribed: false,
	isSubscribing: false,
	platformInfo: { isIOS: false, isSafari: false, isStandalone: false, needsPWAInstall: false },
	initialized: false,
	setIsSubscribed: (isSubscribed) => set({ isSubscribed }),
	setIsSubscribing: (isSubscribing) => set({ isSubscribing }),
}));

const DEV = import.meta.env.DEV;
const log = (...args: unknown[]) => {
	if (DEV) console.log("[PushManager]", ...args);
};

/**
 * Wait for the service worker registration to reach the `activated` state.
 * Handles both the `installing` and `waiting` lifecycle slots.
 */
function waitForActive(registration: ServiceWorkerRegistration): Promise<void> {
	const target = registration.installing ?? registration.waiting;
	if (!target) return Promise.resolve();
	return new Promise<void>((resolve) => {
		const onStateChange = () => {
			if (target.state === "activated") {
				target.removeEventListener("statechange", onStateChange);
				resolve();
			}
		};
		target.addEventListener("statechange", onStateChange);
	});
}

export const usePushManager = () => {
	const { toast } = useToast();

	const initialize = useCallback(async () => {
		// Guard against re-entry: every consumer (App, header, profile pages)
		// would otherwise re-run the entire bootstrap on mount.
		if (usePushStore.getState().initialized) return;
		usePushStore.setState({ initialized: true });

		if (typeof window === "undefined") return;

		const supported = isPushNotificationSupported();
		const platform = detectPlatform();

		// Seed subscription state immediately from the server-side flag stored
		// in the user object — no async SW check needed for the initial render.
		const storedUser = getStoredUser();
		const optimisticSubscribed = storedUser?.push_notification_subscribed ?? false;
		usePushStore.setState({
			isSupported: supported,
			platformInfo: platform,
			isSubscribed: optimisticSubscribed,
		});

		if (!supported) {
			log("Push not supported in this environment");
			return;
		}

		try {
			const registration = await getPushServiceWorker();
			await waitForActive(registration);
			// Confirm against the actual SW subscription — corrects the optimistic
			// value if e.g. the user cleared browser data or uses a different device.
			const subscription = await getCurrentSubscription();
			usePushStore.setState({ isSubscribed: !!subscription });
			log("Initialized. Subscribed:", !!subscription);
		} catch (err) {
			console.error("[PushManager] Failed to initialize:", err);
			usePushStore.setState({ initialized: false });
		}
	}, []);

	useEffect(() => {
		initialize();
	}, [initialize]);

	const handleSubscribe = async () => {
		const { platformInfo, isSubscribed } = usePushStore.getState();
		if (isSubscribed) return;

		if (platformInfo.needsPWAInstall) {
			toast({
				title: "Install App to Enable Notifications",
				description:
					"On iOS, please add this app to your Home Screen first. Tap the Share button and select 'Add to Home Screen'.",
				variant: "destructive",
			});
			return;
		}

		usePushStore.setState({ isSubscribing: true });
		try {
			const permission = await Notification.requestPermission();
			if (permission !== "granted") {
				throw new Error("Push notification permission denied.");
			}

			const registration = await getPushServiceWorker();
			const subscription = await subscribeToPushNotifications(registration);
			await subscribeToNotifications(subscription);

			usePushStore.setState({ isSubscribed: true });
			toast({
				title: "Successfully Subscribed!",
				description: "You will now receive push notifications for order updates.",
			});
		} catch (err) {
			const message = err instanceof Error ? err.message : "An unexpected error occurred.";
			console.error("[PushManager] Subscribe failed:", message);
			toast({
				title: "Subscription Failed",
				description: message,
				variant: "destructive",
			});
			usePushStore.setState({ isSubscribed: false });
		} finally {
			usePushStore.setState({ isSubscribing: false });
		}
	};

	return { handleSubscribe };
};
