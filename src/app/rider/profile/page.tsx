
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { User } from "@/lib/types";
import { Bell } from "lucide-react";
import { usePushStore, usePushManager } from "@/hooks/use-push-manager";

export default function RiderProfilePage() {
    const [user, setUser] = useState<User | null>(null);

    // Push notification state and handler from central hook
    const { isSupported, isSubscribed, isSubscribing, platformInfo } = usePushStore();
    const { handleSubscribe } = usePushManager();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

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
                        {isSupported ? (
                            <>
                                {platformInfo.needsPWAInstall && (
                                    <div className="bg-yellow-100 dark:bg-yellow-900/20 border-l-4 border-yellow-500 text-yellow-700 dark:text-yellow-300 p-4" role="alert">
                                        <p className="font-bold">Enable Notifications on iOS</p>
                                        <p>To get notifications, you must add this app to your Home Screen. Tap the Share icon and then 'Add to Home Screen'.</p>
                                    </div>
                                )}
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
                                        onClick={handleSubscribe}
                                        disabled={isSubscribed || isSubscribing || platformInfo.needsPWAInstall}
                                        variant={isSubscribed ? "outline" : "default"}
                                    >
                                        {isSubscribing ? "Enabling..." : isSubscribed ? "Enabled" : "Enable Notifications"}
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Push notifications are not supported in your browser.
                            </p>
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
