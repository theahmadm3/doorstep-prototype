
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Edit, Star } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getRestaurantProfile } from "@/lib/api";
import { VendorProfile } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";

const StarRating = ({ rating }: { rating: number }) => {
    const totalStars = 5;
    return (
        <div className="flex items-center">
            {[...Array(totalStars)].map((_, i) => (
                <Star
                    key={i}
                    className={`h-5 w-5 ${i < Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                />
            ))}
            <span className="ml-2 text-sm text-muted-foreground">({rating.toFixed(1)})</span>
        </div>
    );
};

export default function VendorProfilePage() {
    const [profile, setProfile] = useState<VendorProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await getRestaurantProfile();
                setProfile(data);
            } catch (error) {
                toast({
                    title: "Failed to fetch profile",
                    description: "Could not load your restaurant profile data.",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, [toast]);

    if (isLoading) {
        return (
            <div className="space-y-8">
                 <h1 className="text-3xl font-bold font-headline">Your Restaurant Profile</h1>
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <Skeleton className="h-96 w-full" />
                        <Skeleton className="h-48 w-full" />
                    </div>
                    <div className="space-y-8">
                         <Skeleton className="h-64 w-full" />
                    </div>
                 </div>
            </div>
        );
    }
    
    if (!profile) {
        return (
             <div className="text-center">
                <p>Could not load restaurant profile.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold font-headline">Your Restaurant Profile</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Restaurant Info Card */}
                    <Card>
                        <CardHeader className="flex flex-row justify-between items-start">
                            <div>
                                <CardTitle>Restaurant Information</CardTitle>
                                <CardDescription>Your restaurant's public details.</CardDescription>
                            </div>
                             <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm"><Edit className="mr-2 h-4 w-4" /> Edit</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Edit Restaurant Information</DialogTitle>
                                        <DialogDescription>
                                            Update your restaurant's public details.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Restaurant Name</Label>
                                            <Input id="name" defaultValue={profile.name} />
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="description">Description</Label>
                                            <Textarea id="description" defaultValue={profile.description || ''} />
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col md:flex-row gap-6">
                                <Image
                                    src={profile.image_url || "https://placehold.co/200x200.png"}
                                    alt={profile.name}
                                    width={200}
                                    height={200}
                                    className="rounded-lg object-cover bg-muted"
                                />
                                <div className="flex-1 space-y-4">
                                    <h2 className="text-2xl font-bold">{profile.name}</h2>
                                    <p className="text-muted-foreground">{profile.description}</p>
                                    <StarRating rating={parseFloat(profile.rating)} />
                                     <div className="flex items-center space-x-2">
                                        <Switch id="is_active" checked={profile.is_active} />
                                        <Label htmlFor="is_active">
                                            {profile.is_active ? "Actively taking orders" : "Currently closed"}
                                        </Label>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Address Card */}
                     <Card>
                        <CardHeader className="flex flex-row justify-between items-start">
                           <div>
                                <CardTitle>Address</CardTitle>
                                <CardDescription>Your restaurant's location.</CardDescription>
                            </div>
                             <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm"><Edit className="mr-2 h-4 w-4" /> Edit</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Edit Address</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>Street Name</Label>
                                            <Input defaultValue={profile.address?.street_name || ''} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Latitude</Label>
                                                <Input type="number" defaultValue={profile.address?.latitude} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Longitude</Label>
                                                <Input type="number" defaultValue={profile.address?.longitude} />
                                            </div>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent>
                             <div className="space-y-2 text-sm">
                                <p><strong>Street:</strong> {profile.address?.street_name || 'N/A'}</p>
                                <p><strong>Coordinates:</strong> {profile.address ? `${profile.address.latitude}, ${profile.address.longitude}` : 'N/A'}</p>
                             </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Owner Info Card */}
                <div className="space-y-8">
                    <Card>
                         <CardHeader className="flex flex-row justify-between items-start">
                             <div>
                                <CardTitle>Owner Information</CardTitle>
                                <CardDescription>Your personal account details.</CardDescription>
                            </div>
                             <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm"><Edit className="mr-2 h-4 w-4" /> Edit</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Edit Owner Information</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                         <div className="space-y-2">
                                            <Label>Full Name</Label>
                                            <Input defaultValue={profile.owner.full_name} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Phone Number</Label>
                                            <Input defaultValue={profile.owner.phone_number || ''} />
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={profile.owner.avatar_url || "https://github.com/shadcn.png"} alt={profile.owner.full_name} />
                                    <AvatarFallback>{profile.owner.full_name[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-bold">{profile.owner.full_name}</p>
                                    <p className="text-sm text-muted-foreground">{profile.owner.email}</p>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm">
                                <p><strong>Phone:</strong> {profile.owner.phone_number || 'N/A'}</p>
                                <p><strong>Role:</strong> <Badge variant="secondary" className="capitalize">{profile.owner.role}</Badge></p>
                                <p><strong>Account Status:</strong> <Badge className="capitalize">{profile.owner.status}</Badge></p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
