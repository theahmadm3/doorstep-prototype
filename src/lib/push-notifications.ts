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
 * Wait for service worker to be ready
 */
async function waitForServiceWorker(): Promise<ServiceWorkerRegistration> {
	if (!("serviceWorker" in navigator)) {
		throw new Error("Service workers are not supported in this browser");
	}

	// Wait for the service worker to be ready (next-pwa registers it automatically)
	const registration = await navigator.serviceWorker.ready;

	// Force an update check (important for iOS)
	await registration.update();

	return registration;
}

/**
 * Register the push service worker (or get existing registration)
 * Note: next-pwa automatically registers sw.js, so we just wait for it
 */
export async function registerPushServiceWorker(): Promise<ServiceWorkerRegistration> {
	return waitForServiceWorker();
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

	// Wait for service worker to be active (critical for iOS)
	if (registration.installing || registration.waiting) {
		await new Promise<void>((resolve) => {
			const worker = registration.installing || registration.waiting;
			if (!worker) {
				resolve();
				return;
			}

			const checkState = () => {
				if (worker.state === "activated") {
					worker.removeEventListener("statechange", checkState);
					resolve();
				}
			};

			worker.addEventListener("statechange", checkState);

			// Timeout after 10 seconds
			setTimeout(() => {
				worker.removeEventListener("statechange", checkState);
				resolve();
			}, 10000);
		});
	}

	// Check for existing subscription first
	const existingSubscription = await registration.pushManager.getSubscription();
	if (existingSubscription) {
		return existingSubscription;
	}

	// Create new subscription
	const subscription = await registration.pushManager.subscribe({
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

	try {
		const registration = await navigator.serviceWorker.ready;
		return registration.pushManager.getSubscription();
	} catch (error) {
		console.error("Error getting subscription:", error);
		return null;
	}
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
 * Get iOS version
 */
function getIOSVersion(): number | null {
	const match = navigator.userAgent.match(/OS (\d+)_/);
	return match ? parseInt(match[1], 10) : null;
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

	// Check iOS version (16.4+ required for push)
	const iosVersion = isIOS ? getIOSVersion() : null;
	const supportsIOSPush = iosVersion !== null && iosVersion >= 16;

	// iOS users need to install as PWA to get push notifications
	const needsPWAInstall = isIOS && !isStandalone;

	return {
		isIOS,
		isSafari,
		isStandalone,
		needsPWAInstall,
	};
}
