
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
        if (typeof window === 'undefined') return;

        const supported = isPushNotificationSupported();
        usePushStore.setState({ isSupported: supported });
        usePushStore.setState({ platformInfo: detectPlatform() });
        
        if (!supported) {
            console.log("Push notifications not supported.");
            return;
        }

        try {
            await registerPushServiceWorker();
            const subscription = await getCurrentSubscription();
            setIsSubscribed(!!subscription);
        } catch (error) {
            console.error("Failed to initialize push manager:", error);
        }
    }, [setIsSubscribed]);

    useEffect(() => {
        initialize();
    }, [initialize]);

    const handleSubscribe = async () => {
        const { platformInfo, isSubscribed } = usePushStore.getState();

        if (isSubscribed) return;

        if (platformInfo.needsPWAInstall) {
            toast({
                title: "Install App to Enable Notifications",
                description: "On iOS, please add this app to your Home Screen to enable notifications. Tap the Share button and select 'Add to Home Screen'.",
                variant: "destructive",
            });
            return;
        }

        usePushStore.setState({ isSubscribing: true });

        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                throw new Error("Push notification permission denied.");
            }

            const registration = await navigator.serviceWorker.ready;
            const subscription = await subscribeToPushNotifications(registration);
            
            await subscribeToNotifications(subscription);
            
            usePushStore.setState({ isSubscribed: true });
            toast({
                title: "Successfully Subscribed!",
                description: "You will now receive push notifications for order updates.",
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : "An unexpected error occurred.";
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
