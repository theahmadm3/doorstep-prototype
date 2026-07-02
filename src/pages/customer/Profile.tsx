
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useEffect, useState } from "react";
import { User, profileSchema, ProfileFormData } from "@/lib/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { updateUserProfile } from "@/lib/auth-api";
import { getStoredUser, updateStoredUser } from "@/lib/auth";
import AddressManagement from "@/components/profile/address-management";
import { Bell, ChevronRight, CreditCard, HelpCircle } from "lucide-react";
import LogoutButton from "@/components/auth/logout-button";
import { usePushStore, usePushManager } from "@/hooks/use-push-manager";

export default function CustomerProfilePage() {
    const [user, setUser] = useState<User | null>(null);
    const { toast } = useToast();

    const profileForm = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        mode: "onChange",
        defaultValues: {
            full_name: "",
            phone_number: "",
        },
    });

    const { isSupported, isSubscribed, isSubscribing, platformInfo } = usePushStore();
    const { handleSubscribe } = usePushManager();

    const { formState: { isDirty: isProfileDirty, isValid: isProfileValid, isSubmitting: isProfileSubmitting } } = profileForm;

    useEffect(() => {
        const storedUser = getStoredUser();
        if (storedUser) {
            setUser(storedUser);
            profileForm.reset({
                full_name: storedUser.full_name || "",
                phone_number: storedUser.phone_number || "",
            });
        }
    }, [profileForm]);

    const onProfileSubmit = async (data: ProfileFormData) => {
        try {
            const updatedUser = await updateUserProfile(data);
            updateStoredUser(updatedUser);
            setUser(updatedUser);
            profileForm.reset(data);
            toast({ title: "Success", description: "Your personal information has been updated." });
        } catch (error) {
            const message = error instanceof Error ? error.message : "An unexpected error occurred.";
            toast({ title: "Update Failed", description: message, variant: "destructive" });
        }
    };

    return (
        <div className="container py-8 md:py-12">
            <h1 className="text-3xl font-bold font-headline mb-8 text-center md:text-left">
                Your Profile
            </h1>

            <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left column */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                            <CardDescription>Update your personal details.</CardDescription>
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
                                                            const numeric = e.target.value.replace(/\D/g, "").slice(0, 11);
                                                            field.onChange(numeric);
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button
                                        type="submit"
                                        disabled={!isProfileDirty || !isProfileValid || isProfileSubmitting}
                                        className="w-full"
                                    >
                                        {isProfileSubmitting ? "Saving..." : "Save Information"}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-2">
                            <div className="space-y-1">
                                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted cursor-pointer">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="shrink-0 p-2 bg-primary/10 rounded-full">
                                            <CreditCard className="h-5 w-5 text-primary" />
                                        </div>
                                        <span className="font-medium truncate">Payment Methods</span>
                                    </div>
                                    <ChevronRight className="shrink-0 h-5 w-5 text-muted-foreground ml-2" />
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted cursor-pointer">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="shrink-0 p-2 bg-primary/10 rounded-full">
                                            <HelpCircle className="h-5 w-5 text-primary" />
                                        </div>
                                        <span className="font-medium truncate">Support</span>
                                    </div>
                                    <ChevronRight className="shrink-0 h-5 w-5 text-muted-foreground ml-2" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <LogoutButton />
                        </CardContent>
                    </Card>
                </div>

                {/* Right column */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Delivery Addresses</CardTitle>
                            <CardDescription>Manage your saved delivery locations.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AddressManagement />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="h-5 w-5 shrink-0" />
                                Notification Settings
                            </CardTitle>
                            <CardDescription>Manage push notifications for order updates.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isSupported ? (
                                <>
                                    {platformInfo.needsPWAInstall && (
                                        <div className="bg-yellow-100 dark:bg-yellow-900/20 border-l-4 border-yellow-500 text-yellow-700 dark:text-yellow-300 p-4 rounded-r" role="alert">
                                            <p className="font-bold">Enable Notifications on iOS</p>
                                            <p className="text-sm mt-1">
                                                Add this app to your Home Screen. Tap the Share icon then "Add to Home Screen".
                                            </p>
                                        </div>
                                    )}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-medium">Push Notifications</p>
                                            <p className="text-sm text-muted-foreground truncate">
                                                {isSubscribed
                                                    ? "Subscribed to push notifications"
                                                    : "Enable to receive order updates"}
                                            </p>
                                        </div>
                                        <Button
                                            onClick={handleSubscribe}
                                            disabled={isSubscribed || isSubscribing || platformInfo.needsPWAInstall}
                                            variant={isSubscribed ? "outline" : "default"}
                                            className="shrink-0 w-full sm:w-auto"
                                        >
                                            {isSubscribing ? "Enabling..." : isSubscribed ? "Enabled" : "Enable"}
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
                </div>
            </div>
        </div>
    );
}
