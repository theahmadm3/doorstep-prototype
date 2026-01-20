"use client";

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePushStore } from '@/hooks/use-push-manager';
import { isPushNotificationSupported, getCurrentSubscription, detectPlatform } from '@/lib/push-notifications';
import { useToast } from '@/hooks/use-toast';

export default function TestPushPage() {
    const [logs, setLogs] = useState<string[]>([]);
    const { toast } = useToast();
    const pushState = usePushStore();

    const addLog = useCallback((message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [`[${timestamp}] ${message}`, ...prev]);
        console.log(`[TestPage] ${message}`);
    }, []);

    const testPlatformInfo = () => {
        addLog('--- Testing Platform Info ---');
        addLog(`User Agent: ${navigator.userAgent}`);
        const platform = detectPlatform();
        addLog(`Is iOS? ${platform.isIOS}`);
        addLog(`Is Safari? ${platform.isSafari}`);
        addLog(`Is Standalone (PWA)? ${platform.isStandalone}`);
        addLog(`Needs PWA Install for Push? ${platform.needsPWAInstall}`);
        addLog(`isPushNotificationSupported()? ${isPushNotificationSupported()}`);
        addLog(`Push Store State (isSupported): ${pushState.isSupported}`);
        addLog('-------------------------');
    };
    
    const testServiceWorker = async () => {
        addLog('--- Testing Service Worker ---');
        if ('serviceWorker' in navigator) {
            try {
                const registrations = await navigator.serviceWorker.getRegistrations();
                if (registrations.length > 0) {
                    addLog(`Found ${registrations.length} service worker(s).`);
                    registrations.forEach((reg, i) => {
                        addLog(`  [${i}] Scope: ${reg.scope}`);
                        addLog(`  [${i}] Active: ${!!reg.active}`);
                        addLog(`  [${i}] Installing: ${!!reg.installing}`);
                        addLog(`  [${i}] Waiting: ${!!reg.waiting}`);
                    });
                } else {
                    addLog('No service workers found.');
                }
            } catch (error) {
                addLog(`Error getting SW registrations: ${error.message}`);
            }
        } else {
            addLog('Service workers not supported in this browser.');
        }
        addLog('-------------------------');
    };

    const testNotificationPermission = () => {
        addLog('--- Testing Notification Permission ---');
        addLog(`Notification.permission: ${Notification.permission}`);
        addLog('-------------------------');
    };
    
    const testPushSubscription = async () => {
        addLog('--- Testing Push Subscription ---');
        const subscription = await getCurrentSubscription();
        if (subscription) {
            addLog('Found active push subscription.');
            addLog(`Endpoint: ${subscription.endpoint}`);
        } else {
            addLog('No active push subscription found.');
        }
        addLog(`Push Store State (isSubscribed): ${pushState.isSubscribed}`);
        addLog('-------------------------');
    };

    const testToast = () => {
        addLog('--- Testing Toast ---');
        toast({
            title: 'Test Notification',
            description: 'If you see this, toasts are working.'
        });
        addLog('Toast triggered.');
        addLog('-------------------------');
    }

    return (
        <div className="container py-8 md:py-12">
            <h1 className="text-3xl font-bold font-headline mb-8">Push Notification Diagnostics</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Run Tests</CardTitle>
                        <CardDescription>Click the buttons below to run diagnostic tests.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <Button onClick={testPlatformInfo}>1. Platform Info</Button>
                        <Button onClick={testServiceWorker}>2. Service Worker</Button>
                        <Button onClick={testNotificationPermission}>3. Notification Permission</Button>
                        <Button onClick={testPushSubscription}>4. Push Subscription</Button>
                        <Button onClick={testToast}>5. Test Toast</Button>
                    </CardContent>
                </Card>
                <Card>
                     <CardHeader>
                        <CardTitle>Live Logs</CardTitle>
                        <CardDescription>Output from the diagnostic tests will appear here.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-64 w-full bg-muted rounded-md p-4">
                            {logs.length > 0 ? (
                                logs.map((log, i) => <p key={i} className="text-xs font-mono whitespace-pre-wrap">{log}</p>)
                            ) : (
                                <p className="text-sm text-muted-foreground text-center pt-10">Run tests to see logs...</p>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
