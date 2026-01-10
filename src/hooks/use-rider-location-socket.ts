
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { updateRiderLocation } from '@/lib/api';

export interface LocationStatus {
    status: 'connecting' | 'connected' | 'disconnected' | 'error';
    message: string;
    color: string;
}

const UPDATE_INTERVAL = 3 * 60 * 1000; // 3 minutes

export const useRiderLocation = (): LocationStatus => {
    const { toast } = useToast();
    const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [status, setStatus] = useState<LocationStatus['status']>('connecting');
    const isSendingRef = useRef(false);

    const sendLocationUpdate = useCallback(async (isInitial = false) => {
        if (isSendingRef.current) {
            console.log("Location update already in progress.");
            return;
        }

        const userStr = localStorage.getItem('user');
        if (!userStr) {
            if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
            setStatus('disconnected');
            return;
        }

        const user = JSON.parse(userStr);
        if (user.role !== 'driver') {
            if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
            return;
        }
        
        isSendingRef.current = true;

        if (isInitial) {
            setStatus('connecting');
        }

        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                });
            });

            const { latitude, longitude } = position.coords;
            await updateRiderLocation(latitude, longitude);
            console.log(`Location updated: ${latitude}, ${longitude}`);
            setStatus('connected');
        } catch (error: any) {
            setStatus('error');
            if (error.code === error.PERMISSION_DENIED) {
                toast({
                    title: "Location Permission Denied",
                    description: "Grant permission to enable live tracking.",
                    variant: "destructive",
                });
                if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
            } else {
                 console.error('Failed to update location:', error);
                 toast({
                     title: "Location Update Failed",
                     description: "Could not send location to server.",
                     variant: "destructive"
                 });
            }
        } finally {
            isSendingRef.current = false;
        }
    }, [toast]);

    useEffect(() => {
        // Initial update
        sendLocationUpdate(true);

        // Set up periodic updates
        locationIntervalRef.current = setInterval(() => sendLocationUpdate(false), UPDATE_INTERVAL);

        // Cleanup on unmount
        return () => {
            if (locationIntervalRef.current) {
                clearInterval(locationIntervalRef.current);
            }
        };
    }, [sendLocationUpdate]);

    const statusMap: Record<LocationStatus['status'], { message: string; color: string }> = {
        connecting: { message: 'Connecting...', color: 'text-yellow-500' },
        connected: { message: 'Live', color: 'text-green-500' },
        disconnected: { message: 'Offline', color: 'text-gray-500' },
        error: { message: 'Error', color: 'text-red-500' },
    };

    return {
        status,
        ...statusMap[status],
    };
};
