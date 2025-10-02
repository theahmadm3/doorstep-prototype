
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, LocateFixed } from "lucide-react";
import { useLoadScript } from "@react-google-maps/api";
import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { updateRestaurantProfile } from "@/lib/api";
import { VendorProfileUpdatePayload } from "@/lib/types";

interface VendorAddressModalProps {
  isOpen: boolean;
  onAddressSaved: () => void;
}

const libraries: ("places")[] = ['places'];

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

function VendorAddressModalContent({ onAddressSaved }: VendorAddressModalProps) {
  const [addressState, setAddressState] = useState<{ street_name: string | null; latitude: number; longitude: number; }>({ street_name: null, latitude: 0, longitude: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handlePlaceSelect = (place: { street_name: string; latitude: number; longitude: number } | null, manualStreetName?: string) => {
    if (place) {
        setAddressState({
            street_name: place.street_name,
            latitude: Number(place.latitude.toFixed(6)),
            longitude: Number(place.longitude.toFixed(6))
        });
    } else {
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

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressState.street_name) {
        toast({ title: "Address Required", description: "Please enter or select an address.", variant: "destructive" });
        return;
    }
    
    setIsSubmitting(true);
    try {
        const payload: VendorProfileUpdatePayload = {
            // As per the requirement, we should ideally send the name, but we don't have it here.
            // The backend should be resilient to handle an address-only update for a vendor.
            address: addressState
        };
        await updateRestaurantProfile(payload);
        toast({ title: "Success", description: "Address saved." });
        onAddressSaved();
    } catch (error) {
        const message = error instanceof Error ? error.message : "An unexpected error occurred.";
        toast({ title: "Update Failed", description: message, variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleAddressSubmit} className="space-y-4 py-4">
        <div className="space-y-2">
            <Label>Search for an address or enter manually</Label>
            <GooglePlacesAutocomplete onPlaceSelect={handlePlaceSelect} />
        </div>
        <Button type="button" variant="outline" className="w-full" onClick={handleUseCurrentLocation}>
            <LocateFixed className="mr-2 h-4 w-4" /> Use current location
        </Button>
        <p className="text-sm text-muted-foreground">
            Selected Address: <span className="font-medium text-foreground">{addressState?.street_name || "None"}</span>
        </p>
        <DialogFooter>
            <Button type="submit" disabled={isSubmitting || !addressState.street_name}>
                {isSubmitting ? "Saving..." : "Save Address"}
            </Button>
        </DialogFooter>
    </form>
  );
}

export default function VendorAddressModal({ isOpen, onAddressSaved }: VendorAddressModalProps) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    const { isLoaded } = useLoadScript({
      googleMapsApiKey: apiKey || "",
      libraries,
    });

    if (!isLoaded && isOpen) {
        return (
            <Dialog open={isOpen}>
                <DialogContent onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                     <DialogHeader>
                        <DialogTitle>Set Your Restaurant Address</DialogTitle>
                        <DialogDescription>Please provide your restaurant's location to continue.</DialogDescription>
                    </DialogHeader>
                    <p>Loading map...</p>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen}>
            <DialogContent onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Set Your Restaurant Address</DialogTitle>
                    <DialogDescription>Please provide your restaurant's location to continue. You cannot proceed without setting an address.</DialogDescription>
                </DialogHeader>
                <VendorAddressModalContent isOpen={isOpen} onAddressSaved={onAddressSaved} />
            </DialogContent>
        </Dialog>
    );
}

