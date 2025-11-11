// Push notification utility library

import type { PlatformInfo } from "./types";
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

/**
 * Convert VAPID public key from base64 to Uint8Array
 */
export function urlBase64ToUint8Array(
	base64String: string,
): Uint8Array<ArrayBuffer> {
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
	if (!("serviceWorker" in navigator)) {
		throw new Error("Service workers are not supported in this browser");
	}

	// Check if already registered
	let registration = await navigator.serviceWorker.getRegistration("/push-sw.js");
	
	if (!registration) {
		registration = await navigator.serviceWorker.register("/push-sw.js", {
			scope: "/",
		});
	}
	
	// Wait for the service worker to be ready
	await navigator.serviceWorker.ready;
	
	return registration;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(
	registration: ServiceWorkerRegistration,
): Promise<PushSubscription> {
	if (!VAPID_PUBLIC_KEY) {
		throw new Error("VAPID public key is not configured");
	}

	// Check for existing subscription first
	let subscription = await registration.pushManager.getSubscription();
	
	if (subscription) {
		// Subscription already exists
		return subscription;
	}

	// Create new subscription
	subscription = await registration.pushManager.subscribe({
		userVisibleOnly: true,
		applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
	});

	return subscription;
}

/**
 * Get the current push subscription
 */
export async function getCurrentSubscription(): Promise<PushSubscription | null> {
	if (!("serviceWorker" in navigator)) {
		return null;
	}

	const registration = await navigator.serviceWorker.getRegistration(
		"/push-sw.js",
	);
	if (!registration) {
		return null;
	}

	return registration.pushManager.getSubscription();
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
	const subscription = await getCurrentSubscription();
	if (!subscription) {
		return false;
	}

	return subscription.unsubscribe();
}

/**
 * Check if push notifications are supported
 */
export function isPushNotificationSupported(): boolean {
	return "serviceWorker" in navigator && "PushManager" in window;
}

/**
 * Detect platform information (iOS, PWA status, etc.)
 */
export function detectPlatform(): PlatformInfo {
	const userAgent = window.navigator.userAgent.toLowerCase();
	const isIOS = /iphone|ipad|ipod/.test(userAgent);
	const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);

	// Type-safe check for standalone mode
	interface NavigatorStandalone {
		standalone?: boolean;
	}
	const isStandalone =
		window.matchMedia("(display-mode: standalone)").matches ||
		(window.navigator as NavigatorStandalone).standalone === true;

	// iOS users need to install as PWA to get push notifications
	// iOS 16.4+ supports Web Push API, but only in PWA mode (not in Safari browser)
	const needsPWAInstall = isIOS && !isStandalone;

	return {
		isIOS,
		isSafari,
		isStandalone,
		needsPWAInstall,
	};
}

/**
 * Check if the device supports Web Push (including iOS PWA)
 */
export function supportsWebPush(): boolean {
	const platform = detectPlatform();
	
	// For iOS, push notifications only work in PWA mode (standalone)
	if (platform.isIOS) {
		return platform.isStandalone && isPushNotificationSupported();
	}
	
	// For other platforms, check standard support
	return isPushNotificationSupported();
}
