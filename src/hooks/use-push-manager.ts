
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  registerPushServiceWorker,
  getCurrentSubscription,
  isPushNotificationSupported,
  subscribeToPushNotifications,
  detectPlatform
} from "@/lib/push-notifications";
import { subscribeToNotifications } from "@/lib/api";
import { useToast } from "./use-toast";
import { PlatformInfo } from "@/lib/types";

// Zustand store to share state across components
import {create} from 'zustand';

interface PushState {
    isSupported: boolean;
    isSubscribed: boolean;
    isSubscribing: boolean;
    platformInfo: PlatformInfo;
    setIsSubscribed: (isSubscribed: boolean) => void;
    setIsSubscribing: (isSubscribing: boolean) => void;
}

export const usePushStore = create<PushState>((set) => ({
    isSupported: false,
    isSubscribed: false,
    isSubscribing: false,
    platformInfo: { isIOS: false, isSafari: false, isStandalone: false, needsPWAInstall: false },
    setIsSubscribed: (isSubscribed) => set({ isSubscribed }),
    setIsSubscribing: (isSubscribing) => set({ isSubscribing }),
}));


// This hook manages the global state of push notifications
export const usePushManager = () => {
    const { toast } = useToast();
    const { setIsSubscribed } = usePushStore();

    const initialize = useCallback(async () => {
        console.log('[PushManager] Initializing...');
        if (typeof window === 'undefined') return;

        const supported = isPushNotificationSupported();
        usePushStore.setState({ isSupported: supported });
        usePushStore.setState({ platformInfo: detectPlatform() });
        
        if (!supported) {
            console.log("[PushManager] Push notifications not supported.");
            return;
        }

        try {
            console.log("[PushManager] Registering service worker...");
            const registration = await registerPushServiceWorker();
            
            // Wait for service worker to be active
            if (registration.installing) {
                console.log("[PushManager] Service worker installing...");
                await new Promise<void>((resolve) => {
                    registration.installing!.addEventListener('statechange', (e) => {
                        if ((e.target as ServiceWorker).state === 'activated') {
                            console.log("[PushManager] Service worker activated.");
                            resolve();
                        }
                    });
                });
            }
            
            console.log("[PushManager] Service worker ready, checking subscription...");
            const subscription = await getCurrentSubscription();
            setIsSubscribed(!!subscription);
            console.log("[PushManager] Initialization complete. Subscription status:", !!subscription);
        } catch (error) {
            console.error("[PushManager] Failed to initialize push manager:", error);
        }
    }, [setIsSubscribed]);

    useEffect(() => {
        initialize();
    }, [initialize]);

    const handleSubscribe = async () => {
        const { platformInfo, isSubscribed } = usePushStore.getState();
        console.log('[PushManager] handleSubscribe called. isSubscribed:', isSubscribed);

        if (isSubscribed) return;

        if (platformInfo.needsPWAInstall) {
            console.warn('[PushManager] PWA installation needed on iOS.');
            toast({
                title: "Install App to Enable Notifications",
                description: "On iOS, please add this app to your Home Screen to enable notifications. Tap the Share button and select 'Add to Home Screen'.",
                variant: "destructive",
            });
            return;
        }

        usePushStore.setState({ isSubscribing: true });

        try {
            console.log('[PushManager] Requesting notification permission...');
            const permission = await Notification.requestPermission();
            console.log('[PushManager] Notification permission status:', permission);
            if (permission !== 'granted') {
                throw new Error("Push notification permission denied.");
            }

            const registration = await navigator.serviceWorker.ready;
            console.log('[PushManager] Service worker is ready for subscription.');

            const subscription = await subscribeToPushNotifications(registration);
            console.log('[PushManager] Successfully subscribed to push notifications:', subscription.endpoint);
            
            console.log('[PushManager] Sending subscription to server...');
            await subscribeToNotifications(subscription);
            console.log('[PushManager] Server subscription successful.');
            
            usePushStore.setState({ isSubscribed: true });
            toast({
                title: "Successfully Subscribed!",
                description: "You will now receive push notifications for order updates.",
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : "An unexpected error occurred.";
            console.error("[PushManager] Subscription Failed:", message);
            toast({
                title: "Subscription Failed",
                description: message,
                variant: "destructive",
            });
            usePushStore.setState({ isSubscribed: false });
        } finally {
            usePushStore.setState({ isSubscribing: false });
            console.log('[PushManager] handleSubscribe finished.');
        }
    };
    
    return { handleSubscribe };
};
