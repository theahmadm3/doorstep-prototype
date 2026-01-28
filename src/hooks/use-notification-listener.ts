
"use client";

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';

interface NotificationMessage {
  type: string;
  notification?: {
    title?: string;
    body?: string;
    data?: any;
  };
}

// Global flag to track if refetch is needed. This is a workaround for iOS PWA lifecycle issues.
let needsRefetchOnVisible = false;

export const useNotificationListener = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.serviceWorker) {
        console.log('[Listener] Environment not supported, skipping listener setup.');
        return;
    }

    console.log('[Listener] Initializing...');

    const refetchAllOrders = () => {
        const refetchPromises = [
            queryClient.refetchQueries({ queryKey: ["customerOrders"], type: 'active' }),
            queryClient.refetchQueries({ queryKey: ["vendorOrders"], type: 'active' }),
            queryClient.refetchQueries({ queryKey: ["riderOrders"], type: 'active' }),
            queryClient.refetchQueries({ queryKey: ["availableRiderOrders"], type: 'active' }),
        ];

        return Promise.all(refetchPromises);
    }

    const handleMessage = (event: MessageEvent<NotificationMessage>) => {
      console.log('[Listener] Message received:', event.data);

      if (event.data?.type === 'ORDER_UPDATE') {
        console.log('[Listener] ORDER_UPDATE received. Visibility:', document.visibilityState);
        
        needsRefetchOnVisible = true;

        if (document.visibilityState === 'visible') {
            console.log('[Listener] Page is visible, attempting immediate refetch.');
            refetchAllOrders()
                .then(() => {
                    console.log('[Listener] Immediate refetch successful.');
                    needsRefetchOnVisible = false;
                })
                .catch(err => console.error('[Listener] Immediate refetch failed:', err));
        }
        
        if (document.visibilityState === 'visible' && event.data.notification) {
          toast({
            title: event.data.notification.title || "Order Update",
            description: event.data.notification.body || "Your order has been updated",
          });
        }
      }
    };

    const refetchIfNeeded = (eventName: string) => {
      if (document.visibilityState === 'visible' && needsRefetchOnVisible) {
        console.log(`[Listener] Refetch triggered by "${eventName}" event.`);
        
        // Using a small delay to ensure the app is responsive.
        setTimeout(() => {
          refetchAllOrders()
            .then(() => {
              console.log(`[Listener] Refetch after "${eventName}" successful.`);
              needsRefetchOnVisible = false;
            })
            .catch(err => console.error(`[Listener] Refetch after "${eventName}" failed:`, err));
        }, 300);
      }
    };

    const handleVisibilityChange = () => refetchIfNeeded('visibilitychange');
    const handleFocus = () => refetchIfNeeded('focus');
    const handlePageShow = (event: PageTransitionEvent) => {
      console.log('[Listener] Page show event, persisted:', event.persisted);
      refetchIfNeeded('pageshow');
    }

    navigator.serviceWorker.addEventListener('message', handleMessage);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('pageshow', handlePageShow);
    
    console.log('[Listener] Listeners for message, visibilitychange, focus, and pageshow attached.');

    // Initial check in case the page loaded while hidden and a notification arrived.
    refetchIfNeeded('initial mount');

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pageshow', handlePageShow);
      console.log('[Listener] Cleaned up all listeners.');
    };
  }, [queryClient, toast]);
};
