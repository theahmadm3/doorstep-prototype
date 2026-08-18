import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { VendorPlaceResult } from "./google-places-autocomplete";

export interface AddressState {
    street_name: string | null;
    latitude: number;
    longitude: number;
}

export function useAddressForm(initialAddress?: { street_name?: string | null; latitude?: number; longitude?: number }) {
    const { toast } = useToast();
    const [addressState, setAddressState] = useState<AddressState>({
        street_name: initialAddress?.street_name ?? null,
        latitude: initialAddress?.latitude ?? 0,
        longitude: initialAddress?.longitude ?? 0,
    });
    const [isGpsLocated, setIsGpsLocated] = useState(false);
    const [addressLabelError, setAddressLabelError] = useState(false);

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
            }, (error) => {
                const description = error.code === error.PERMISSION_DENIED
                    ? "Location permission denied. Please enable location access in your browser settings."
                    : error.code === error.TIMEOUT
                        ? "Location request timed out. Please try again."
                        : "Unable to retrieve your location.";
                toast({ title: "Geolocation Error", description, variant: "destructive" });
            }, { timeout: 10000, maximumAge: 300000 });
        }
    };

    const validateAddress = (): boolean => {
        if (addressState.latitude === 0 && addressState.longitude === 0) {
            toast({
                title: "Address not located",
                description: "Please select an address from the suggestions or use the GPS button.",
                variant: "destructive",
            });
            return false;
        }
        if (isGpsLocated && !addressState.street_name?.trim()) {
            setAddressLabelError(true);
            return false;
        }
        return true;
    };

    return {
        addressState,
        setAddressState,
        isGpsLocated,
        setIsGpsLocated,
        addressLabelError,
        setAddressLabelError,
        handlePlaceSelect,
        handleClearAddressSelection,
        handleUseCurrentLocation,
        validateAddress,
    };
}
