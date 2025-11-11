
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { User } from "@/lib/types";
import { Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
    registerPushServiceWorker, 
    subscribeToPushNotifications, 
    getCurrentSubscription,
    isPushNotificationSupported,
    detectPlatform,
    supportsWebPush
} from "@/lib/push-notifications";
import { subscribeToNotifications } from "@/lib/api";

export default function RiderProfilePage() {
    const [user, setUser] = useState<User | null>(null);
    const { toast } = useToast();
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isSubscribing, setIsSubscribing] = useState(false);
    const [platformInfo, setPlatformInfo] = useState({
        isIOS: false,
        isSafari: false,
        isStandalone: false,
        needsPWAInstall: false,
    });
    const [debugLogs, setDebugLogs] = useState<string[]>([]);

    const addDebugLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setDebugLogs(prev => [...prev, `[${timestamp}] ${message}`]);
        console.log(`[Debug] ${message}`);
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }

        // Detect platform
        if (typeof window !== 'undefined') {
            const platform = detectPlatform();
            setPlatformInfo(platform);
            addDebugLog(`Platform detected - iOS: ${platform.isIOS}, Standalone: ${platform.isStandalone}, Safari: ${platform.isSafari}, Needs PWA Install: ${platform.needsPWAInstall}`);
            addDebugLog(`User Agent: ${navigator.userAgent}`);
            addDebugLog(`Display Mode: ${window.matchMedia("(display-mode: standalone)").matches ? "standalone" : "browser"}`);
        }
        
        // Register service worker and check subscription
        const initPushNotifications = async () => {
            try {
                addDebugLog(`Checking if push notifications are supported...`);
                const supported = isPushNotificationSupported();
                addDebugLog(`Service Worker supported: ${"serviceWorker" in navigator}`);
                addDebugLog(`PushManager supported: ${"PushManager" in window}`);
                addDebugLog(`Push notifications supported: ${supported}`);
                
                const webPushSupported = supportsWebPush();
                addDebugLog(`Web Push supported (iOS-aware): ${webPushSupported}`);
                
                if (webPushSupported) {
                    addDebugLog(`Registering push service worker...`);
                    await registerPushServiceWorker();
                    addDebugLog(`Service worker registered successfully`);
                    
                    const subscription = await getCurrentSubscription();
                    addDebugLog(`Current subscription: ${subscription ? 'Found' : 'None'}`);
                    if (subscription) {
                        addDebugLog(`Subscription endpoint: ${subscription.endpoint.substring(0, 50)}...`);
                    }
                    setIsSubscribed(!!subscription);
                } else {
                    addDebugLog(`Web Push not supported on this device/mode`);
                }
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                addDebugLog(`ERROR: ${errorMsg}`);
                console.error('Failed to initialize push notifications:', error);
            }
        };

        initPushNotifications();
    }, []);

    const handleEnableNotifications = async () => {
        addDebugLog(`Enable notifications button clicked`);
        
        if (platformInfo.needsPWAInstall) {
            addDebugLog(`Cannot enable - PWA not installed on iOS`);
            toast({
                title: "Install as PWA",
                description: "On iOS, please install this app to your home screen to enable notifications. Tap the Share button and select 'Add to Home Screen'.",
                variant: "destructive",
            });
            return;
        }

        setIsSubscribing(true);
        try {
            // Request permission
            addDebugLog(`Requesting notification permission...`);
            const permission = await Notification.requestPermission();
            addDebugLog(`Permission result: ${permission}`);
            
            if (permission !== 'granted') {
                addDebugLog(`Permission denied by user`);
                toast({
                    title: "Permission Denied",
                    description: "Please enable notifications in your browser settings to receive updates.",
                    variant: "destructive",
                });
                setIsSubscribing(false);
                return;
            }

            // Register service worker and subscribe
            addDebugLog(`Getting service worker registration...`);
            const registration = await registerPushServiceWorker();
            addDebugLog(`Service worker ready, subscribing to push...`);
            
            const subscription = await subscribeToPushNotifications(registration);
            addDebugLog(`Push subscription created: ${subscription.endpoint.substring(0, 50)}...`);

            // Send subscription to backend
            addDebugLog(`Sending subscription to backend...`);
            await subscribeToNotifications(subscription);
            addDebugLog(`Backend subscription successful`);

            setIsSubscribed(true);
            toast({
                title: "Success",
                description: "Push notifications have been enabled successfully!",
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to enable notifications";
            addDebugLog(`ERROR enabling notifications: ${message}`);
            toast({
                title: "Error",
                description: message,
                variant: "destructive",
            });
        } finally {
            setIsSubscribing(false);
        }
    };

    return (
        <div className="space-y-8">
             <h1 className="text-3xl font-bold font-headline">Your Profile</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>
                            Update your personal details.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input id="name" defaultValue={user?.full_name || ''} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input id="phone" defaultValue={user?.phone_number || ''} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="vehicle">Vehicle Type</Label>
                                <Input id="vehicle" defaultValue="Motorcycle" />
                            </div>
                            <Button type="submit">Save Information</Button>
                        </form>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            Notification Settings
                        </CardTitle>
                        <CardDescription>
                            Manage push notifications for order updates.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {platformInfo.needsPWAInstall && (
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                    <strong>iOS Users:</strong> To enable push notifications, please install this app to your home screen. 
                                    Tap the Share button <span className="inline-block">📤</span> and select "Add to Home Screen".
                                </p>
                            </div>
                        )}
                        
                        {supportsWebPush() ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">
                                            Push Notifications
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {isSubscribed 
                                                ? "You're subscribed to push notifications" 
                                                : "Enable notifications to receive order updates"}
                                        </p>
                                    </div>
                                    <Button 
                                        onClick={handleEnableNotifications}
                                        disabled={isSubscribed || isSubscribing || platformInfo.needsPWAInstall}
                                        variant={isSubscribed ? "outline" : "default"}
                                    >
                                        {isSubscribing ? "Enabling..." : isSubscribed ? "Enabled" : "Enable Notifications"}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Push notifications are not supported in your browser.
                            </p>
                        )}
                        
                        {/* Debug Logs Section */}
                        {debugLogs.length > 0 && (
                            <div className="mt-4 border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium text-sm">Debug Logs</h4>
                                    <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => setDebugLogs([])}
                                    >
                                        Clear
                                    </Button>
                                </div>
                                <div className="space-y-1 max-h-60 overflow-y-auto">
                                    {debugLogs.map((log, index) => (
                                        <p key={index} className="text-xs font-mono text-gray-700 dark:text-gray-300">
                                            {log}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Account Security</CardTitle>
                        <CardDescription>
                            Update your login credentials.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" defaultValue={user?.email || ''} readOnly />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="current-password">Current Password</Label>
                                <Input id="current-password" type="password" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input id="new-password" type="password" />
                            </div>
                            <Button type="submit" className="w-full">Update Password</Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
