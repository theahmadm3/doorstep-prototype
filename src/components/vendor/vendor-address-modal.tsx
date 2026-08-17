

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

type VendorPlaceResult = { street_name: string; latitude: number; longitude: number };

const GooglePlacesAutocomplete = ({
    onPlaceSelect,
    onClearSelection,
}: {
    onPlaceSelect: (place: VendorPlaceResult) => void;
    onClearSelection?: () => void;
}) => {
    const {
        ready,
        value,
        suggestions: { status, data },
        setValue,
        clearSuggestions,
    } = usePlacesAutocomplete({
        requestOptions: {},
        debounce: 300,
    });
    const { toast } = useToast();

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value);
        onClearSelection?.();
    };

    const handleSelect = (suggestion: { description: string }) => () => {
        setValue(suggestion.description, false);
        clearSuggestions();

        getGeocode({ address: suggestion.description })
            .then((results) => {
                const { lat, lng } = getLatLng(results[0]);
                onPlaceSelect({
                    street_name: suggestion.description,
                    latitude: lat,
                    longitude: lng,
                });
            })
            .catch(() => {
                toast({ title: "Location Error", description: "Could not get coordinates for this address. Please try another.", variant: "destructive" });
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
    const [isGpsLocated, setIsGpsLocated] = useState(false);
    const [addressLabelError, setAddressLabelError] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handlePlaceSelect = (place: VendorPlaceResult) => {
        setAddressState({
            street_name: place.street_name,
            latitude: Number(place.latitude.toFixed(6)),
            longitude: Number(place.longitude.toFixed(6)),
        });
        setIsGpsLocated(false);
    };

    const handleClearAddressSelection = () => {
        setAddressState(prev => ({ ...prev, latitude: 0, longitude: 0 }));
        setIsGpsLocated(false);
    };

    const handleUseCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                setAddressState({
                    street_name: "",
                    latitude: Number(position.coords.latitude.toFixed(6)),
                    longitude: Number(position.coords.longitude.toFixed(6)),
                });
                setIsGpsLocated(true);
                toast({ title: "Location captured", description: "Enter an address label below to identify this location." });
            }, () => {
                toast({ title: "Geolocation Error", description: "Unable to retrieve your location.", variant: "destructive" });
            });
        }
    };

    const handleAddressSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (addressState.latitude === 0 && addressState.longitude === 0) {
            toast({ title: "Address Required", description: "Please select an address from the suggestions or use the GPS button.", variant: "destructive" });
            return;
        }
        if (isGpsLocated && !addressState.street_name?.trim()) {
            setAddressLabelError(true);
            return;
        }

        setIsSubmitting(true);
        try {
            const payload: VendorProfileUpdatePayload = { address: addressState };
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
                <Label>Search for your address</Label>
                <GooglePlacesAutocomplete
                    onPlaceSelect={handlePlaceSelect}
                    onClearSelection={handleClearAddressSelection}
                />
            </div>
            <Button type="button" variant="outline" className="w-full" onClick={handleUseCurrentLocation}>
                <LocateFixed className="mr-2 h-4 w-4" /> Use current location
            </Button>
            {isGpsLocated && (
                <div className="space-y-2">
                    <Label htmlFor="address-label-modal">Address label</Label>
                    <Input
                        id="address-label-modal"
                        placeholder="e.g. 14 Adeola Odeku Street, Victoria Island"
                        value={addressState.street_name || ""}
                        onChange={(e) => {
                            setAddressState(prev => ({ ...prev, street_name: e.target.value }));
                            setAddressLabelError(false);
                        }}
                        className={addressLabelError ? "border-destructive" : ""}
                    />
                    {addressLabelError ? (
                        <p className="text-xs text-destructive">Address label is required.</p>
                    ) : (
                        <p className="text-xs text-muted-foreground">GPS coordinates captured. Enter a readable address label.</p>
                    )}
                </div>
            )}
            {!isGpsLocated && addressState.latitude !== 0 && (
                <p className="text-sm text-muted-foreground">
                    Selected: <span className="font-medium text-foreground">{addressState.street_name}</span>
                </p>
            )}
            <DialogFooter>
                <Button type="submit" disabled={isSubmitting || addressState.latitude === 0}>
                    {isSubmitting ? "Saving..." : "Save Address"}
                </Button>
            </DialogFooter>
        </form>
    );
}

export default function VendorAddressModal({ isOpen, onAddressSaved }: VendorAddressModalProps) {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

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
