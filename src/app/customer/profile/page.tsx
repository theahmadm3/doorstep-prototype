
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
import { Bell } from "lucide-react";
import { usePushStore, usePushManager } from "@/hooks/use-push-manager";


export default function CustomerProfilePage() {
    const [user, setUser] = useState<User | null>(null);
    const { toast } = useToast();
    
    // Push notification state and handler from central hook
    const { isSupported, isSubscribed, isSubscribing, platformInfo } = usePushStore();
    const { handleSubscribe } = usePushManager();

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
    }, [profileForm]);

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
