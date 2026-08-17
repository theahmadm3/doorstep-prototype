

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocateFixed } from "lucide-react";
import { useLoadScript } from "@react-google-maps/api";
import { GooglePlacesAutocomplete } from "./google-places-autocomplete";
import { useAddressForm } from "./use-address-form";
import { useToast } from "@/hooks/use-toast";
import { updateRestaurantProfile } from "@/lib/api";
import { VendorProfileUpdatePayload } from "@/lib/types";

interface VendorAddressModalProps {
  isOpen: boolean;
  onAddressSaved: () => void;
}

const libraries: ("places")[] = ['places'];

function VendorAddressModalContent({ onAddressSaved }: VendorAddressModalProps) {
    const {
        addressState, setAddressState,
        isGpsLocated,
        addressLabelError, setAddressLabelError,
        handlePlaceSelect, handleClearAddressSelection,
        handleUseCurrentLocation, validateAddress,
    } = useAddressForm();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleAddressSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateAddress()) return;

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
