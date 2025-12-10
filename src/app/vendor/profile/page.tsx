
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Edit, Star, MapPin, LocateFixed, Search, PlusCircle, Bell } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { getRestaurantProfile, updateRestaurantProfile } from "@/lib/api";
import { VendorProfile, VendorProfileUpdatePayload } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { useLoadScript } from "@react-google-maps/api";
import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePushStore, usePushManager } from "@/hooks/use-push-manager";

const libraries: ("places")[] = ['places'];

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

const GooglePlacesAutocomplete = ({ onPlaceSelect, initialValue = "" }) => {
    const {
        ready,
        value,
        suggestions: { status, data },
        setValue,
        clearSuggestions,
    } = usePlacesAutocomplete({
        requestOptions: { /* Define search scope here */ },
        debounce: 300,
        defaultValue: initialValue,
    });

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value);
        onPlaceSelect(null, e.target.value);
    };

    const handleSelect = (suggestion) => () => {
        setValue(suggestion.description, false);
        clearSuggestions();

        getGeocode({ address: suggestion.description }).then((results) => {
            const { lat, lng } = getLatLng(results[0]);
            onPlaceSelect({
                street_name: suggestion.description,
                latitude: lat,
                longitude: lng,
            });
        });
    };
    
    return (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
                value={value}
                onChange={handleInput}
                disabled={!ready}
                placeholder="Search for an address..."
                className="pl-10"
            />
            {status === "OK" && (
                 <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg">
                    <ScrollArea className="h-auto max-h-60">
                        {data.map((suggestion) => (
                            <div key={suggestion.place_id} onClick={handleSelect(suggestion)} className="p-3 hover:bg-muted cursor-pointer text-sm">
                                <strong>{suggestion.structured_formatting.main_text}</strong> <small>{suggestion.structured_formatting.secondary_text}</small>
                            </div>
                        ))}
                    </ScrollArea>
                </div>
            )}
        </div>
    );
};


function VendorProfilePage() {
    const [profile, setProfile] = useState<VendorProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // State for modals
    const [isInfoModalOpen, setInfoModalOpen] = useState(false);
    const [isAddressModalOpen, setAddressModalOpen] = useState(false);

    // State for forms
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [addressState, setAddressState] = useState<{ street_name: string | null; latitude: number; longitude: number; }>({ street_name: null, latitude: 0, longitude: 0 });

    // Push notification state and handler from central hook
    const { isSupported, isSubscribed, isSubscribing, platformInfo } = usePushStore();
    const { handleSubscribe } = usePushManager();

    const { toast } = useToast();

    const fetchProfile = useCallback(async () => {
        try {
            const data = await getRestaurantProfile();
            setProfile(data);
            setName(data.name);
            setDescription(data.description || "");
            setIsActive(data.is_active);
            setAddressState(data.address || { street_name: "", latitude: 0, longitude: 0 });
        } catch (error) {
            toast({
                title: "Failed to fetch profile",
                description: "Could not load your restaurant profile data.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);
    
    const openInfoModal = () => {
        if (!profile) return;
        setName(profile.name);
        setDescription(profile.description || "");
        setIsActive(profile.is_active);
        setInfoModalOpen(true);
    };
    
    const openAddressModal = () => {
        if (!profile) return;
        setAddressState(profile.address || { street_name: null, latitude: 0, longitude: 0 });
        setAddressModalOpen(true);
    };

    const handleInfoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile) return;
        setIsSubmitting(true);
        try {
            const payload: VendorProfileUpdatePayload = { name };
            if (description !== profile.description) payload.description = description;
            if (isActive !== profile.is_active) payload.is_active = isActive;

            await updateRestaurantProfile(payload);
            toast({ title: "Success", description: "Restaurant information updated."});
            await fetchProfile(); // Refetch data
            setInfoModalOpen(false);
        } catch (error) {
            const message = error instanceof Error ? error.message : "An unexpected error occurred.";
            toast({ title: "Update Failed", description: message, variant: "destructive"});
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleAddressSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile) return;
        setIsSubmitting(true);
        try {
            const payload: VendorProfileUpdatePayload = {
                name: profile.name,
                address: addressState
            };
            await updateRestaurantProfile(payload);
            toast({ title: "Success", description: "Address updated."});
            await fetchProfile(); // Refetch data
            setAddressModalOpen(false);
        } catch (error) {
            const message = error instanceof Error ? error.message : "An unexpected error occurred.";
            toast({ title: "Update Failed", description: message, variant: "destructive"});
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePlaceSelect = (place: { street_name: string; latitude: number; longitude: number } | null, manualStreetName?: string) => {
        if (place) {
            setAddressState({
                street_name: place.street_name,
                latitude: Number(place.latitude.toFixed(6)),
                longitude: Number(place.longitude.toFixed(6))
            });
        } else {
            // Manual input
            setAddressState(prev => ({
                ...prev,
                street_name: manualStreetName || "",
                latitude: 0,
                longitude: 0,
            }));
        }
    };

    const handleUseCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                setAddressState({
                    street_name: "Current Location",
                    latitude: Number(position.coords.latitude.toFixed(6)),
                    longitude: Number(position.coords.longitude.toFixed(6))
                });
                toast({ title: "Location Updated", description: "Current location captured. Save to confirm." });
            }, () => {
                toast({ title: "Geolocation Error", description: "Unable to retrieve your location.", variant: "destructive" });
            });
        }
    };

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

    const profileImageUrl =
        profile.image_url && profile.image_url.startsWith("http")
            ? profile.image_url
            : "https://placehold.co/200x200.png";

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold font-headline">Your Restaurant Profile</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-3 xl:col-span-2 space-y-8">
                    {/* Restaurant Info Card */}
                    <Card>
                        <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                            <div>
                                <CardTitle>Restaurant Information</CardTitle>
                                <CardDescription>Your restaurant's public details.</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={openInfoModal} className="w-full sm:w-auto"><Edit className="mr-2 h-4 w-4" /> Edit</Button>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col md:flex-row gap-6">
                                <Image
                                    src={profileImageUrl}
                                    alt={profile.name}
                                    width={200}
                                    height={200}
                                    className="rounded-lg object-cover bg-muted mx-auto md:mx-0"
                                />
                                <div className="flex-1 space-y-4">
                                    <h2 className="text-2xl font-bold">{profile.name}</h2>
                                    <p className="text-muted-foreground">{profile.description}</p>
                                    <StarRating rating={parseFloat(profile.rating)} />
                                     <div className="flex items-center space-x-2">
                                        <Switch id="is_active" checked={profile.is_active} disabled />
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
                        <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                           <div>
                                <CardTitle>Address</CardTitle>
                                <CardDescription>Your restaurant's location.</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={openAddressModal} className="w-full sm:w-auto">
                                {profile.address ? (
                                    <><Edit className="mr-2 h-4 w-4" /> Edit</>
                                ) : (
                                    <><PlusCircle className="mr-2 h-4 w-4" /> Add Address</>
                                )}
                            </Button>
                        </CardHeader>
                        <CardContent>
                             <div className="space-y-2 text-sm">
                                <p><strong>Address:</strong> {profile.address?.street_name || 'N/A'}</p>
                             </div>
                        </CardContent>
                    </Card>

                    {/* Notification Settings Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="h-5 w-5" />
                                Notification Settings
                            </CardTitle>
                            <CardDescription>Manage push notifications for order updates.</CardDescription>
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
                </div>

                {/* Owner Info Card */}
                <div className="lg:col-span-3 xl:col-span-1 space-y-8">
                    <Card>
                         <CardHeader>
                             <CardTitle>Owner Information</CardTitle>
                             <CardDescription>Your personal account details.</CardDescription>
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
                                <div className="flex items-center gap-2">
                                    <strong>Role:</strong>
                                    <Badge variant="secondary" className="capitalize">{profile.owner.role}</Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                    <strong>Account Status:</strong>
                                    <Badge className="capitalize">{profile.owner.status}</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
            
            {/* Modals */}
            <Dialog open={isInfoModalOpen} onOpenChange={setInfoModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Restaurant Information</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleInfoSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Restaurant Name</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch id="modal-is_active" checked={isActive} onCheckedChange={setIsActive} />
                            <Label htmlFor="modal-is_active">Actively taking orders</Label>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

             <Dialog open={isAddressModalOpen} onOpenChange={setAddressModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Address</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddressSubmit} className="space-y-4 py-4">
                         <div className="space-y-2">
                            <Label>Search for an address or enter manually</Label>
                            <GooglePlacesAutocomplete onPlaceSelect={handlePlaceSelect} initialValue={profile.address?.street_name || ""} />
                        </div>
                        <Button type="button" variant="outline" className="w-full" onClick={handleUseCurrentLocation}>
                            <LocateFixed className="mr-2 h-4 w-4" /> Use current location
                        </Button>
                         <p className="text-sm text-muted-foreground">
                            Selected Address: <span className="font-medium text-foreground">{addressState?.street_name || "None"}</span>
                         </p>
                        <DialogFooter>
                            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Address"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

        </div>
    );

}

export default function VendorProfilePageWrapper() {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    const { isLoaded } = useLoadScript({
      googleMapsApiKey: apiKey || "",
      libraries,
    });
    
    if (!apiKey) {
        console.error("Google Maps API key is missing. Address search will not work.");
        return <VendorProfilePage />;
    }

    if (!isLoaded) return (
         <div className="space-y-8">
            <h1 className="text-3xl font-bold font-headline">Your Restaurant Profile</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8"><Skeleton className="h-96 w-full" /></div>
                <div className="space-y-8"><Skeleton className="h-64 w-full" /></div>
            </div>
        </div>
    );

    return <VendorProfilePage />;
}
