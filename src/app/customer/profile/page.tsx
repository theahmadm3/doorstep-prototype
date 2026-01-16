
"use client";

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
import AddressManagement from "@/components/profile/address-management";
import { Bell, ChevronRight, CreditCard, HelpCircle } from "lucide-react";

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

    return (
        <div className="container py-8 md:py-12">
            <h1 className="text-3xl font-bold font-headline mb-8 text-center md:text-left">Your Profile</h1>
            <div className="max-w-md mx-auto space-y-6">
                <Card>
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
                                <Button type="submit" disabled={!isProfileDirty || !isProfileValid || isProfileSubmitting} className="w-full">
                                    {isProfileSubmitting ? "Saving..." : "Save Information"}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
                 
                <Card>
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

                <Card>
                    <CardContent className="p-2">
                        <div className="space-y-1">
                            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-primary/10 rounded-full">
                                        <Bell className="h-5 w-5 text-primary" />
                                    </div>
                                    <span className="font-medium">Notifications</span>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-primary/10 rounded-full">
                                        <CreditCard className="h-5 w-5 text-primary" />
                                    </div>
                                    <span className="font-medium">Payment Methods</span>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-primary/10 rounded-full">
                                        <HelpCircle className="h-5 w-5 text-primary" />
                                    </div>
                                    <span className="font-medium">Help Center</span>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
