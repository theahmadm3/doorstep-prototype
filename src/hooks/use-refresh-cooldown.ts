
"use client";

import { useState, useEffect, useCallback } from 'react';

const COOLDOWN_DURATION_MS = 60 * 1000;
const LOCAL_STORAGE_KEY = 'lastManualRefreshAt';

const getInitialTimestamp = (): number => {
    if (typeof window === 'undefined') {
        return 0;
    }
    try {
        const storedTimestamp = localStorage.getItem(LOCAL_STORAGE_KEY);
        // Ensure stored value is a valid number, otherwise return 0
        const parsedTimestamp = storedTimestamp ? parseInt(storedTimestamp, 10) : 0;
        return isNaN(parsedTimestamp) ? 0 : parsedTimestamp;
    } catch (error) {
        console.error("Failed to read from localStorage", error);
        return 0;
    }
};

export const useRefreshCooldown = () => {
    const [lastRefresh, setLastRefresh] = useState<number>(getInitialTimestamp);
    const [remainingTime, setRemainingTime] = useState<number>(0);

    const calculateRemainingTime = useCallback(() => {
        if (lastRefresh === 0) return 0;
        const now = Date.now();
        const timePassed = now - lastRefresh;
        return Math.max(0, COOLDOWN_DURATION_MS - timePassed);
    }, [lastRefresh]);

    useEffect(() => {
        setRemainingTime(calculateRemainingTime());

        const intervalId = setInterval(() => {
            setRemainingTime(prev => {
                const newRemaining = calculateRemainingTime();
                if (newRemaining <= 0) {
                    // Check if interval is still needed before clearing
                    if (intervalId) clearInterval(intervalId);
                    return 0;
                }
                return newRemaining;
            });
        }, 1000);

        return () => clearInterval(intervalId);
    }, [lastRefresh, calculateRemainingTime]);

    useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === LOCAL_STORAGE_KEY) {
                setLastRefresh(getInitialTimestamp());
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const triggerRefresh = useCallback((refetchFn: () => void) => {
        if (calculateRemainingTime() > 0) {
            console.log("Cooldown active, refresh skipped.");
            return;
        };

        const now = Date.now();
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, now.toString());
        } catch (error) {
            console.error("Failed to write to localStorage", error);
        }
        setLastRefresh(now);
        refetchFn();
    }, [calculateRemainingTime]);

    const isCooldownActive = remainingTime > 0;
    const remainingSeconds = Math.ceil(remainingTime / 1000);

    return {
        isCooldownActive,
        remainingSeconds,
        triggerRefresh,
    };
};
