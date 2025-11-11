
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useEffect, useState } from "react";
import { User, profileSchema, PasswordFormData, passwordSchema, ProfileFormData } from "@/lib/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { updateUserProfile } from "@/lib/auth-api";
import AddressManagement from "@/components/profile/address-management";
import { 
    registerPushServiceWorker, 
    subscribeToPushNotifications, 
    getCurrentSubscription,
    isPushNotificationSupported,
    detectPlatform,
    supportsWebPush
} from "@/lib/push-notifications";
import { subscribeToNotifications } from "@/lib/api";
import { Bell } from "lucide-react";


export default function CustomerProfilePage() {
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

    const profileForm = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        mode: "onChange",
        defaultValues: {
            full_name: "",
            phone_number: "",
        },
    });

    const passwordForm = useForm<PasswordFormData>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
        }
    });
    
    const { formState: { isDirty: isProfileDirty, isValid: isProfileValid, isSubmitting: isProfileSubmitting } } = profileForm;


    const addDebugLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setDebugLogs(prev => [...prev, `[${timestamp}] ${message}`]);
        console.log(`[Debug] ${message}`);
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            profileForm.reset({
                full_name: parsedUser.full_name || '',
                phone_number: parsedUser.phone_number || '',
            });
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
    }, [profileForm]);

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

    const onProfileSubmit = async (data: ProfileFormData) => {
        try {
            const updatedUser = await updateUserProfile(data);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            profileForm.reset(data); // Reset form to new default values, making it "not dirty"
            toast({ title: "Success", description: "Your personal information has been updated." });
        } catch (error) {
            const message = error instanceof Error ? error.message : "An unexpected error occurred.";
            toast({
                title: "Update Failed",
                description: message,
                variant: "destructive"
            });
        }
    };

    const onPasswordSubmit = (data: PasswordFormData) => {
        console.log("Password change submitted");
        // TODO: Add API call to update password
        toast({ title: "Success", description: "Your password has been updated." });
        passwordForm.reset();
    };

    return (
        <div className="container py-8 md:py-12">
            <h1 className="text-3xl font-bold font-headline mb-8">Your Profile</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>
                            Update your personal details.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...profileForm}>
                            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                                <FormField
                                    control={profileForm.control}
                                    name="full_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Full Name</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={profileForm.control}
                                    name="phone_number"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Phone Number</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    onChange={(e) => {
                                                        const numericValue = e.target.value.replace(/\D/g, '');
                                                        const truncatedValue = numericValue.slice(0, 11);
                                                        field.onChange(truncatedValue);
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" disabled={!isProfileDirty || !isProfileValid || isProfileSubmitting}>
                                    {isProfileSubmitting ? "Saving..." : "Save Information"}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
                 <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Delivery Addresses</CardTitle>
                        <CardDescription>
                            Manage your saved delivery locations.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                       <AddressManagement />
                    </CardContent>
                </Card>
                <Card className="lg:col-span-3">
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
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Account Security</CardTitle>
                        <CardDescription>
                            Update your login credentials.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...passwordForm}>
                            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 max-w-md">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" defaultValue={user?.email || ''} readOnly />
                                </div>
                                <FormField
                                    control={passwordForm.control}
                                    name="currentPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Current Password</FormLabel>
                                            <FormControl>
                                                <Input type="password" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={passwordForm.control}
                                    name="newPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>New Password</FormLabel>
                                            <FormControl>
                                                <Input type="password" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full sm:w-auto">Update Password</Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
