import React, { useEffect, useRef, useState } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const BACKEND_URL = process.env.NEXT_PUBLIC_PUSH_BACKEND || "";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationTester() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const statusBoxRef = useRef<HTMLPreElement | null>(null);

  function log(message: string) {
    console.log(message);
    setLogs((l) => [...l, `> ${message}`]);
    setTimeout(() => {
      if (statusBoxRef.current) {
        statusBoxRef.current.scrollTop = statusBoxRef.current.scrollHeight;
      }
    }, 50);
  }

  useEffect(() => {
    detectPlatform();
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready
        .then(() => {
          log("Service worker ready.");
        })
        .catch((err) => log(`Service worker not ready: ${err?.message ?? err}`));
    } else {
      log("❌ Service Workers not supported.");
    }
  }, []);

  function detectPlatform() {
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS/.test(ua);
    const isAndroid = /Android/.test(ua);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;

    let platformText = `Platform: `;
    if (isIOS) {
      platformText += `iOS (${isSafari ? "Safari" : "Other Browser"})`;
      if (!isStandalone) {
        platformText += `\n⚠️ iOS requires: Add to Home Screen first!`;
      } else {
        platformText += `\n✓ Running as PWA`;
      }
    } else if (isAndroid) {
      platformText += `Android - Should work! ✓`;
    } else {
      platformText += `Desktop`;
    }

    log(platformText);
  }

  async function subscribeUserToPush() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      log("❌ Push not supported in this browser.");
      return;
    }

    log("Checking for existing subscription...");
    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();

    if (existing) {
      log("✓ Already subscribed.");
      await sendSubscriptionToBackend(existing);
      setIsSubscribed(true);
      setNotifyEnabled(true);
      return;
    }

    log("Requesting notification permission...");
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      log(`❌ Permission ${permission}. Cannot send notifications.`);
      return;
    }
    log("✓ Permission granted.");

    try {
      log("Subscribing to Push Manager...");
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
      log("✓ Subscribed successfully!");
      await sendSubscriptionToBackend(subscription);
      setIsSubscribed(true);
      setNotifyEnabled(true);
    } catch (error: any) {
      log(`❌ Subscription failed: ${error?.message ?? error}`);
    }
  }

  async function sendSubscriptionToBackend(subscription: PushSubscription) {
    log("Sending subscription to backend...");
    try {
      const response = await fetch(`${BACKEND_URL}/subscribe`, {
        method: "POST",
        body: JSON.stringify(subscription.toJSON()),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error(`Backend error: ${response.status}`);
      const data = await response.json();
      log(`✓ ${data.message ?? "Subscription saved on backend"}`);
    } catch (error: any) {
      log(`❌ Backend error: ${error?.message ?? error}`);
    }
  }

  async function triggerManualNotification() {
    log("Sending manual notification request...");
    try {
      const response = await fetch(`${BACKEND_URL}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error(`Backend error: ${response.status}`);
      const data = await response.json();
      log(`✓ ${data.message ?? "Notify request accepted"}`);
    } catch (error: any) {
      log(`❌ Error: ${error?.message ?? error}`);
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-gray-800 rounded-lg shadow-xl text-white">
      <h1 className="text-2xl md:text-3xl font-bold text-center mb-4">Push Notification Tester</h1>

      <div className="space-y-3">
        <button
          onClick={subscribeUserToPush}
          disabled={isSubscribed}
          className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ${isSubscribed ? "opacity-50 cursor-not-allowed" : ""}`}>
          {isSubscribed ? "Subscribed! ✓" : "1. Subscribe to Notifications"}
        </button>

        <button
          onClick={triggerManualNotification}
          disabled={!notifyEnabled}
          className={`w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ${!notifyEnabled ? "opacity-50 cursor-not-allowed" : ""}`}>
          2. Send Test Notification
        </button>
      </div>

      <div className="mt-6">
        <h2 className="text-lg md:text-xl font-semibold mb-2">Logs:</h2>
        <pre ref={statusBoxRef} className="bg-gray-900 rounded-lg p-3 h-48 md:h-64 overflow-y-auto text-xs md:text-sm text-gray-300">{logs.join("\n")}</pre>
      </div>
    </div>
  );
}
