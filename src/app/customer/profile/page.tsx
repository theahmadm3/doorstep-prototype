
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
        <div className="container py-12">
            <h1 className="text-3xl font-bold font-headline mb-8">Your Profile</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
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
                                <Button type="submit" disabled={!isProfileDirty || !isProfileValid || isProfileSubmitting}>
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
                    <CardHeader>
                        <CardTitle>Account Security</CardTitle>
                        <CardDescription>
                            Update your login credentials.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...passwordForm}>
                            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
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
                                <Button type="submit" className="w-full">Update Password</Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
