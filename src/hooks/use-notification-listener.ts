"use client";

import { useEffect, useRef } from 'react';
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

export const useNotificationListener = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isListenerActive = useRef(false);

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('[Listener] Service worker not available');
      return;
    }
    
    console.log('[Listener] Platform info:', {
      userAgent: navigator.userAgent,
      isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
      standalone: (window.navigator as any).standalone,
      displayMode: window.matchMedia('(display-mode: standalone)').matches
    });


    // Prevent duplicate listeners
    if (isListenerActive.current) {
      console.log('[Listener] Already active, skipping');
      return;
    }

    const handleMessage = (event: MessageEvent<NotificationMessage>) => {
      console.log('[Listener] Received message from service worker:', event.data);

      // Check if this is an order update message
      if (event.data && event.data.type === 'ORDER_UPDATE') {
        console.log('[Listener] ORDER_UPDATE detected');
        
        // Verify queryClient is available
        if (!queryClient) {
          console.error('[Listener] QueryClient not available!');
          return;
        }

        console.log('[Listener] QueryClient available, invalidating queries');
        
        const queryKeysToInvalidate = [
          ["customerOrders"], 
          ["vendorOrders"],
          ["riderOrders"]
        ];

        // Use setTimeout to ensure this runs after any pending React updates
        setTimeout(() => {
          try {
            console.log('[Listener] Invalidating queries...');
            queryKeysToInvalidate.forEach(key => {
                queryClient.invalidateQueries({ 
                    queryKey: key,
                    refetchType: 'active'
                });
            });
            console.log('[Listener] Queries invalidated successfully');
          } catch (error) {
            console.error('[Listener] Error invalidating queries:', error);
          }
        }, 100);

        // Show toast only if app is in focus
        if (document.visibilityState === 'visible' && event.data.notification) {
          toast({
            title: event.data.notification.title || "Order Update",
            description: event.data.notification.body || "Your order has been updated",
          });
        }
      }
    };

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', handleMessage);
    isListenerActive.current = true;
    
    console.log('[Listener] Notification listener initialized');

    // Cleanup
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
      isListenerActive.current = false;
      console.log('[Listener] Notification listener cleaned up');
    };
  }, [queryClient, toast]);
};
