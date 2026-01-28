
// Push notification utility library

import type { PlatformInfo } from "./types";
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

/**
 * Convert VAPID public key from base64 to Uint8Array
 */
export function urlBase64ToUint8Array(
	base64String: string,
): Uint8Array {
	const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding)
		.replace(/\-/g, "+")
		.replace(/_/g, "/");

	const rawData = window.atob(base64);
	const outputArray = new Uint8Array(rawData.length);

	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
}

/**
 * Register the push service worker
 */
export async function registerPushServiceWorker(): Promise<ServiceWorkerRegistration> {
	console.log('[PushLib] registerPushServiceWorker called');
	if (!("serviceWorker" in navigator)) {
		console.error("[PushLib] Service workers are not supported in this browser");
		throw new Error("Service workers are not supported in this browser");
	}

	try {
		const registration = await navigator.serviceWorker.register("/push-sw.js");
		console.log("[PushLib] Service worker registered successfully:", registration);
		await registration.update();
		console.log("[PushLib] Service worker updated.");
		return registration;
	} catch (error) {
		console.error("[PushLib] Service worker registration failed:", error);
		throw error;
	}
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(
	registration: ServiceWorkerRegistration,
): Promise<PushSubscription> {
	console.log('[PushLib] subscribeToPushNotifications called');
	if (!VAPID_PUBLIC_KEY) {
		console.error("[PushLib] VAPID public key is not configured");
		throw new Error("VAPID public key is not configured");
	}
	console.log("[PushLib] VAPID public key found.");

	try {
		const subscription = await registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
		});
		console.log("[PushLib] Push subscription successful:", subscription);
		return subscription;
	} catch (error) {
		console.error("[PushLib] Push subscription failed:", error);
		throw error;
	}
}

/**
 * Get the current push subscription
 */
export async function getCurrentSubscription(): Promise<PushSubscription | null> {
	console.log('[PushLib] getCurrentSubscription called');
	if (!isPushNotificationSupported()) {
		console.log("[PushLib] Push not supported, returning null subscription.");
		return null;
	}
	
	try {
		const registration = await navigator.serviceWorker.getRegistration("/push-sw.js");
		if (!registration) {
			console.log("[PushLib] No service worker registration found.");
			return null;
		}
		console.log("[PushLib] Found service worker registration.");
		const subscription = await registration.pushManager.getSubscription();
		console.log("[PushLib] Found subscription:", subscription);
		return subscription;
	} catch (error) {
		console.error("[PushLib] Error getting current subscription:", error);
		return null;
	}
}


/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
	console.log('[PushLib] unsubscribeFromPushNotifications called');
	const subscription = await getCurrentSubscription();
	if (!subscription) {
		console.log("[PushLib] No subscription to unsubscribe from.");
		return false;
	}

	try {
		const result = await subscription.unsubscribe();
		console.log("[PushLib] Unsubscription successful:", result);
		return result;
	} catch (error) {
		console.error("[PushLib] Unsubscription failed:", error);
		throw error;
	}
}

/**
 * Check if push notifications are supported
 */
export function isPushNotificationSupported(): boolean {
  const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  console.log("[Push] Support check:", {
    serviceWorker: "serviceWorker" in navigator,
    PushManager: "PushManager" in window,
    Notification: "Notification" in window,
    result: supported
  });
  return supported;
}

/**
 * Detect platform information (iOS, PWA status, etc.)
 */
export function detectPlatform(): PlatformInfo {
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);

  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true;

  // iOS 16.4+ supports push in installed PWAs
  const needsPWAInstall = isIOS && !isStandalone;

  console.log("[Platform] Detection:", {
    userAgent,
    isIOS,
    isSafari,
    isStandalone,
    needsPWAInstall,
    displayMode: window.matchMedia("(display-mode: standalone)").matches,
    navigatorStandalone: (window.navigator as any).standalone
  });

  return {
    isIOS,
    isSafari,
    isStandalone,
    needsPWAInstall,
  };
}
