// Push notification utility library.
// The service worker itself is registered once at app boot in `main.tsx`.
// Everything in here either waits for that registration or operates on it.

import type { PlatformInfo } from "./types";

// Safari-only non-standard property (not in the TS lib)
interface SafariNavigator extends Navigator {
	standalone?: boolean;
}

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;
const DEV = import.meta.env.DEV;
const log = (...args: unknown[]) => {
	if (DEV) console.log("[PushLib]", ...args);
};

/**
 * Convert a base64-url VAPID public key into the Uint8Array form that
 * `pushManager.subscribe` expects.
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
	const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
	const rawData = window.atob(base64);
	const out = new Uint8Array(rawData.length);
	for (let i = 0; i < rawData.length; ++i) out[i] = rawData.charCodeAt(i);
	return out;
}

/**
 * Resolve the existing service worker registration. The SW is registered in
 * `main.tsx`; this helper just waits for it to be ready.
 */
export async function getPushServiceWorker(): Promise<ServiceWorkerRegistration> {
	if (!("serviceWorker" in navigator)) {
		throw new Error("Service workers are not supported in this browser");
	}
	const registration = await navigator.serviceWorker.ready;
	log("Service worker ready", registration.scope);
	return registration;
}

/**
 * Subscribe to push notifications using an existing SW registration.
 */
export async function subscribeToPushNotifications(
	registration: ServiceWorkerRegistration,
): Promise<PushSubscription> {
	if (!VAPID_PUBLIC_KEY) {
		throw new Error("VAPID public key is not configured");
	}
	return registration.pushManager.subscribe({
		userVisibleOnly: true,
		applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
	});
}

/**
 * Get the current push subscription, or null if not subscribed / unsupported.
 */
export async function getCurrentSubscription(): Promise<PushSubscription | null> {
	if (!isPushNotificationSupported()) return null;
	try {
		const registration = await navigator.serviceWorker.getRegistration("/push-sw.js");
		if (!registration) return null;
		return registration.pushManager.getSubscription();
	} catch (err) {
		log("getCurrentSubscription error", err);
		return null;
	}
}

/**
 * Unsubscribe from push notifications. Returns true if there was a
 * subscription that was successfully removed, false if no subscription existed.
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
	const subscription = await getCurrentSubscription();
	if (!subscription) return false;
	try {
		return await subscription.unsubscribe();
	} catch (err) {
		log("Unsubscribe failed", err);
		return false;
	}
}

/**
 * Check whether the browser supports the full push notification stack.
 */
export function isPushNotificationSupported(): boolean {
	return (
		"serviceWorker" in navigator &&
		"PushManager" in window &&
		"Notification" in window
	);
}

/**
 * Detect platform info: iOS push only works inside an installed PWA, so we
 * surface that constraint here so the UI can guide the user.
 */
export function detectPlatform(): PlatformInfo {
	const userAgent = window.navigator.userAgent.toLowerCase();
	const isIOS = /iphone|ipad|ipod/.test(userAgent);
	const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
	const isStandalone =
		window.matchMedia("(display-mode: standalone)").matches ||
		(window.navigator as SafariNavigator).standalone === true;
	const needsPWAInstall = isIOS && !isStandalone;
	return { isIOS, isSafari, isStandalone, needsPWAInstall };
}
