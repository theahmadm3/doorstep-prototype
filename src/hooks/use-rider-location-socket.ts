
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

    const sendLocationUpdate = useCallback(async () => {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            console.log("No user found, stopping location updates.");
            if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
            setStatus('disconnected');
            return;
        }
        
        const user = JSON.parse(userStr);
        if (user.role !== 'driver') {
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    await updateRiderLocation(latitude, longitude);
                    console.log(`Location updated: ${latitude}, ${longitude}`);
                    setStatus('connected');
                } catch (error) {
                    console.error('Failed to update location:', error);
                    setStatus('error');
                    toast({
                        title: "Location Update Failed",
                        description: "Could not send location to server.",
                        variant: "destructive"
                    });
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                setStatus('error');
                if (error.code === error.PERMISSION_DENIED) {
                    toast({
                        title: "Location Permission Denied",
                        description: "Grant permission to enable live tracking.",
                        variant: "destructive",
                    });
                    if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
                    setStatus('disconnected');
                }
            },
            { enableHighAccuracy: true }
        );
    }, [toast]);

    useEffect(() => {
        // Initial update
        sendLocationUpdate();

        // Set up periodic updates
        locationIntervalRef.current = setInterval(sendLocationUpdate, UPDATE_INTERVAL);

        // Cleanup on unmount
        return () => {
            if (locationIntervalRef.current) {
                clearInterval(locationIntervalRef.current);
            }
        };
    }, [sendLocationUpdate]);

    const statusMap: Record<LocationStatus['status'], { message: string; color: string }> = {
        connecting: { message: 'Updating...', color: 'text-yellow-500' },
        connected: { message: 'Live', color: 'text-green-500' },
        disconnected: { message: 'Offline', color: 'text-red-500' },
        error: { message: 'Error', color: 'text-red-500' },
    };

    return {
        status,
        ...statusMap[status],
    };
};
