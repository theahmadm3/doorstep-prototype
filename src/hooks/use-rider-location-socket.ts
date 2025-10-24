
"use client";

import { useState, useEffect, useRef, useCallback } from 'use-sync-external-store/shim/index.js';
import { useToast } from './use-toast';

export interface LocationStatus {
    status: 'connecting' | 'connected' | 'disconnected' | 'error';
    message: string;
    color: string;
}

const WEBSOCKET_URL = "wss://doorstep-backend-1.onrender.com/ws/driver/location/";
const UPDATE_INTERVAL = 15000; // 15 seconds
const MAX_RETRIES = 3;
const RETRY_BACKOFF = [3000, 6000, 12000]; // 3s, 6s, 12s

export const useRiderLocationSocket = (): LocationStatus => {
    const { toast } = useToast();
    const socketRef = useRef<WebSocket | null>(null);
    const retryCountRef = useRef(0);
    const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    const [status, setStatus] = useState<LocationStatus['status']>('connecting');

    const connect = useCallback(() => {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            console.log("No user found, aborting WebSocket connection.");
            setStatus('disconnected');
            return;
        }

        const user = JSON.parse(userStr);
        if (user.role !== 'driver') {
            return;
        }

        setStatus('connecting');
        console.log(`Attempting to connect (Retry ${retryCountRef.current})...`);

        const socket = new WebSocket(WEBSOCKET_URL);
        socketRef.current = socket;

        socket.onopen = () => {
            console.log('WebSocket connected.');
            setStatus('connected');
            retryCountRef.current = 0; // Reset retries on successful connection

            // Send driver ID
            socket.send(JSON.stringify({ driver_id: user.id }));

            // Start sending location updates
            locationIntervalRef.current = setInterval(() => {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        const roundedLat = parseFloat(latitude.toFixed(6));
                        const roundedLng = parseFloat(longitude.toFixed(6));
                        
                        if (socket.readyState === WebSocket.OPEN) {
                             socket.send(JSON.stringify({ latitude: roundedLat, longitude: roundedLng }));
                        }
                    },
                    (error) => {
                        console.error('Geolocation error:', error);
                        if(error.code === error.PERMISSION_DENIED) {
                            toast({
                                title: "Location Permission Denied",
                                description: "Grant permission to enable live tracking.",
                                variant: "destructive",
                            });
                            // Stop trying if permission is denied
                            socket.close();
                        }
                    },
                    { enableHighAccuracy: true }
                );
            }, UPDATE_INTERVAL);
        };

        socket.onmessage = (event) => {
            console.log('WebSocket message received:', event.data);
        };

        socket.onerror = (event) => {
            console.error('WebSocket error:', event);
            setStatus('error');
            // onclose will be triggered, handling the reconnection logic.
        };

        socket.onclose = () => {
            console.log('WebSocket disconnected.');
            if (locationIntervalRef.current) {
                clearInterval(locationIntervalRef.current);
            }
            if (retryCountRef.current < MAX_RETRIES) {
                const timeout = RETRY_BACKOFF[retryCountRef.current];
                console.log(`Retrying in ${timeout / 1000}s...`);
                
                retryTimeoutRef.current = setTimeout(() => {
                    retryCountRef.current++;
                    connect();
                }, timeout);

            } else {
                console.log('Max retries reached. Stopping reconnection attempts.');
                setStatus('disconnected');
            }
        };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [toast]);

    useEffect(() => {
        connect();

        return () => {
            // Cleanup on unmount
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
            if (locationIntervalRef.current) {
                clearInterval(locationIntervalRef.current);
            }
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, [connect]);


    const statusMap: Record<LocationStatus['status'], { message: string; color: string }> = {
        connecting: { message: 'Connecting...', color: 'text-yellow-500' },
        connected: { message: 'Live', color: 'text-green-500' },
        disconnected: { message: 'Disconnected', color: 'text-red-500' },
        error: { message: 'Error', color: 'text-red-500' },
    };

    return {
        status,
        ...statusMap[status],
    };
};
