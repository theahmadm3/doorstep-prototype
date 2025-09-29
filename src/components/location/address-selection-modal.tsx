
"use client";

import { useOrder } from "@/hooks/use-order";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, LocateFixed, Search, Save } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { Skeleton } from "../ui/skeleton";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { addAddress } from "@/lib/api";
import { AddressPostData } from "@/lib/types";

interface AddressSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AddressSelectionModal({ isOpen, onClose }: AddressSelectionModalProps) {
    const { addresses, setSelectedAddress, isAddressesLoading, refetchAddresses } = useOrder();
    const [isAddingCurrentLocation, setIsAddingCurrentLocation] = useState(false);
    const [newLocation, setNewLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [nickname, setNickname] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const handleSelectAddress = (addressId: string) => {
        const address = addresses.find(a => a.id === addressId);
        if (address) {
            setSelectedAddress(address);
        }
        onClose();
    };

    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast({
                title: "Geolocation Not Supported",
                description: "Your browser does not support geolocation.",
                variant: "destructive",
            });
            return;
        }

        setIsAddingCurrentLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setNewLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            () => {
                toast({
                    title: "Geolocation Error",
                    description: "Unable to retrieve your location. Please ensure location services are enabled.",
                    variant: "destructive",
                });
                setIsAddingCurrentLocation(false);
            }
        );
    };

    const handleSaveNewLocation = async () => {
        if (!newLocation) return;
        setIsSaving(true);

        const payload: AddressPostData = {
            latitude: Number(newLocation.latitude.toFixed(6)),
            longitude: Number(newLocation.longitude.toFixed(6)),
            address_nickname: nickname || `My Location`,
            is_default: false,
        };

        try {
            await addAddress(payload);
            toast({
                title: "Location Saved",
                description: "Your current location has been added to your addresses.",
            });
            await refetchAddresses();
            // Reset state
            setIsAddingCurrentLocation(false);
            setNewLocation(null);
            setNickname("");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to save location.";
            toast({
                title: "Error",
                description: message,
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleClose = () => {
        // Reset state when closing the modal
        setIsAddingCurrentLocation(false);
        setNewLocation(null);
        setNickname("");
        onClose();
    }
    
    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Select a Delivery Address</DialogTitle>
                    <DialogDescription>
                        Choose where you'd like your order to be delivered.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input placeholder="Search for a location..." className="pl-10" />
                    </div>

                    {!isAddingCurrentLocation ? (
                        <Button variant="outline" className="w-full" onClick={handleUseCurrentLocation}>
                            <LocateFixed className="mr-2 h-4 w-4" />
                            Use your current location
                        </Button>
                    ) : newLocation ? (
                        <div className="space-y-2">
                             <p className="text-sm text-center text-muted-foreground">Location captured. Add a nickname to save.</p>
                            <div className="flex gap-2">
                                <Input 
                                    placeholder="e.g. Home, Work"
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                />
                                <Button onClick={handleSaveNewLocation} disabled={isSaving}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {isSaving ? "Saving..." : "Save"}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Button variant="outline" className="w-full" disabled>
                            <LocateFixed className="mr-2 h-4 w-4 animate-pulse" />
                            Getting your location...
                        </Button>
                    )}

                     <ScrollArea className="h-64 border rounded-md p-2">
                        {isAddressesLoading ? (
                            <div className="space-y-3">
                                {[...Array(3)].map((_, i) => (
                                    <Skeleton key={i} className="h-12 w-full" />
                                ))}
                            </div>
                        ) : addresses.length > 0 ? (
                             addresses.map(address => (
                                <div key={address.id} onClick={() => handleSelectAddress(address.id)} className="flex items-center gap-4 p-3 rounded-md hover:bg-muted cursor-pointer">
                                    <MapPin className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="font-semibold">{address.address_nickname || `${address.street_address || `Location @ ${address.latitude?.toFixed(2)}, ${address.longitude?.toFixed(2)}`}`}</p>
                                        <p className="text-sm text-muted-foreground">{address.street_address ? `${address.street_address}, ${address.city}` : "GPS Location"}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-muted-foreground py-10">
                                <p>You have no saved addresses.</p>
                                <p className="text-xs">Try adding one using your current location.</p>
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}
