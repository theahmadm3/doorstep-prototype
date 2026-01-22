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

export const useNotificationListener = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.serviceWorker) {
        console.log('[Listener] Service Worker not supported, skipping listener setup.');
        return;
    }
    
    console.log('[Listener] Initializing...');

    // Add iOS-specific debugging
    console.log('[Listener] Platform info:', {
      userAgent: navigator.userAgent,
      isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
      standalone: (window.navigator as any).standalone,
      displayMode: window.matchMedia('(display-mode: standalone)').matches
    });

    // Add temporary window message listener for debugging
    const windowListener = (e: MessageEvent) => {
      console.log('[Window] Message event:', e.data);
    };
    window.addEventListener('message', windowListener);

    let isActive = true;

    const handleMessage = (event: MessageEvent<NotificationMessage>) => {
      if (!isActive) return;
      
      console.log('[Listener] Message received:', event.data);

      if (event.data?.type === 'ORDER_UPDATE') {
        console.log('[Listener] Processing ORDER_UPDATE');
        
        // Force refetch instead of just invalidate - works better on iOS
        queryClient.refetchQueries({ 
          queryKey: ["customerOrders"],
          type: 'active'
        }).then(() => {
          console.log('[Listener] Orders refetched successfully');
        }).catch(err => {
          console.error('[Listener] Refetch error:', err);
        });

        // Show toast only if page is visible
        if (document.visibilityState === 'visible' && event.data.notification) {
          toast({
            title: event.data.notification.title || "Order Update",
            description: event.data.notification.body || "Your order has been updated",
          });
        }
      }
    };
    
    navigator.serviceWorker.addEventListener('message', handleMessage);
    console.log('[Listener] Message listener attached.');

    const handleControllerChange = () => {
      console.log('[Listener] Controller changed.');
    };
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    return () => {
      isActive = false;
      navigator.serviceWorker.removeEventListener('message', handleMessage);
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      window.removeEventListener('message', windowListener);
      console.log('[Listener] Cleaned up.');
    };
  }, [queryClient, toast]);
};
