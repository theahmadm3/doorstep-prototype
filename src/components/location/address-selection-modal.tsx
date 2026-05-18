
"use client";

import { useUIStore } from "@/stores/useUIStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, LocateFixed, Search, Save } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { Skeleton } from "../ui/skeleton";
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { addAddress } from "@/lib/api";
import { AddressPostData } from "@/lib/types";
import { useLoadScript } from "@react-google-maps/api";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import { useAddresses } from "@/hooks/use-addresses";

const libraries: ("places")[] = ['places'];

interface AddressSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const GooglePlacesAutocomplete = ({ onPlaceSelect }) => {
    const {
        ready,
        value,
        suggestions: { status, data },
        setValue,
        clearSuggestions,
    } = usePlacesAutocomplete({
        requestOptions: { /* Define search scope here */ },
        debounce: 300,
    });

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value);
    };

    const handleSelect = ({ description, place_id }) => () => {
        setValue(description, false);
        clearSuggestions();

        getGeocode({ address: description }).then((results) => {
            const { lat, lng } = getLatLng(results[0]);
            console.log("📍 Coordinates: ", { lat, lng });

            // Fetch Place Details
            const service = new window.google.maps.places.PlacesService(document.createElement('div'));
            service.getDetails({ placeId: place_id }, (place, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
                    onPlaceSelect(place);
                } else {
                    console.error('Failed to fetch place details:', status);
                }
            });
        });
    };

    const renderSuggestions = () =>
        data.map((suggestion) => {
            const {
                place_id,
                structured_formatting: { main_text, secondary_text },
            } = suggestion;

            return (
                <div
                    key={place_id}
                    onClick={handleSelect(suggestion)}
                    className="p-3 hover:bg-muted cursor-pointer text-sm"
                >
                    <strong>{main_text}</strong> <small>{secondary_text}</small>
                </div>
            );
        });

    return (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
                value={value}
                onChange={handleInput}
                disabled={!ready}
                placeholder="Search for a location..."
                className="pl-10"
            />
            {status === "OK" && (
                 <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg">
                    <ScrollArea className="h-auto max-h-60">
                        {renderSuggestions()}
                    </ScrollArea>
                </div>
            )}
        </div>
    );
};


const AddressSelectionContent = ({ isOpen, onClose }: AddressSelectionModalProps) => {
    const { addresses, isAddressesLoading, refetchAddresses } = useAddresses();
    const { setSelectedAddress } = useUIStore();
    const { toast } = useToast();

    const [isAddingCurrentLocation, setIsAddingCurrentLocation] = useState(false);
    const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null);
    const [nickname, setNickname] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [newLocation, setNewLocation] = useState<{ latitude: number, longitude: number } | null>(null);
    const [streetAddress, setStreetAddress] = useState("");
    const [city, setCity] = useState("");
    
    // The modal is mandatory if the user has no addresses.
    const isMandatory = addresses.length === 0 && isAddressesLoading === false;


    const handleSelectAddress = (addressId: string) => {
        const address = addresses.find(a => a.id === addressId);
        if (address) {
            setSelectedAddress(address);
        }
        onClose();
    };

    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast({ title: "Geolocation Not Supported", variant: "destructive" });
            return;
        }
        setIsAddingCurrentLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setNewLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
                setIsAddingCurrentLocation(false);
            },
            () => {
                toast({ title: "Geolocation Error", description: "Unable to retrieve your location.", variant: "destructive" });
                setIsAddingCurrentLocation(false);
            }
        );
    };

    const handlePlaceSelect = useCallback((place: google.maps.places.PlaceResult) => {
        setSelectedPlace(place);
        setNewLocation(null);
    }, []);

    const handleSaveNewLocation = async () => {
        let payload: AddressPostData;
        if (selectedPlace?.geometry?.location) {
            const lat = selectedPlace.geometry.location.lat();
            const lng = selectedPlace.geometry.location.lng();
            payload = {
                latitude: Number(lat.toFixed(6)),
                longitude: Number(lng.toFixed(6)),
                address_nickname: nickname || undefined,
                street_address: selectedPlace.formatted_address,
                is_default: isMandatory, // Make first address default
            };
        } else if (newLocation) {
            payload = {
                latitude: Number(newLocation.latitude.toFixed(6)),
                longitude: Number(newLocation.longitude.toFixed(6)),
                address_nickname: nickname || undefined,
                street_address: streetAddress || undefined,
                city: city || undefined,
                is_default: isMandatory, // Make first address default
            };
        } else {
            return;
        }
        
        setIsSaving(true);
        try {
            await addAddress(payload);
            toast({ title: "Location Saved" });
            await refetchAddresses();
            resetAddLocationState();
            // If the modal was mandatory, it will now close because addresses.length > 0
            if (isMandatory) {
                onClose();
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to save location.";
            toast({ title: "Error", description: message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };
    
    const resetAddLocationState = () => {
        setSelectedPlace(null);
        setNewLocation(null);
        setNickname("");
        setStreetAddress("");
        setCity("");
    }

    const handleClose = () => {
        // Prevent closing the mandatory modal
        if (isMandatory) return;
        resetAddLocationState();
        onClose();
    }
    
    const canSave = selectedPlace || newLocation;
    
    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent 
                className="sm:max-w-md"
                onInteractOutside={(e) => { if (isMandatory) e.preventDefault(); }}
                onEscapeKeyDown={(e) => { if (isMandatory) e.preventDefault(); }}
            >
                <DialogHeader>
                    <DialogTitle>{isMandatory ? "Add a Delivery Address" : "Select a Delivery Address"}</DialogTitle>
                    <DialogDescription>
                         {isMandatory 
                            ? "You need to add at least one address to continue."
                            : "Choose where you'd like your order to be delivered or add a new one."}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                   <GooglePlacesAutocomplete onPlaceSelect={handlePlaceSelect} />
                    
                    {(selectedPlace || newLocation) && (
                        <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                             {newLocation && (
                                <div className="space-y-2">
                                     <Input 
                                        placeholder="House number & street name (Optional)"
                                        value={streetAddress}
                                        onChange={(e) => setStreetAddress(e.target.value)}
                                    />
                                    <Input 
                                        placeholder="District/LGA/Town (Optional)"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                    />
                                </div>
                             )}
                             <div className="flex gap-2">
                                <Input 
                                    placeholder="Nickname (e.g. Home, Work)"
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                />
                                <Button onClick={handleSaveNewLocation} disabled={isSaving || !canSave}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {isSaving ? "Saving..." : "Save"}
                                </Button>
                            </div>
                        </div>
                    )}

                    <Button variant="outline" className="w-full" onClick={handleUseCurrentLocation} disabled={isAddingCurrentLocation}>
                        <LocateFixed className="mr-2 h-4 w-4" />
                        {isAddingCurrentLocation ? "Getting your location..." : "Use your current location"}
                    </Button>

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
                                        <p className="font-semibold">{address.address_nickname || `${address.street_address || `Location @ ${Number(address.latitude)?.toFixed(2)}, ${Number(address.longitude)?.toFixed(2)}`}`}</p>
                                        <p className="text-sm text-muted-foreground">{address.street_address ? `${address.street_address}, ${address.city || ''}`.trim().replace(/,$/, '') : "GPS Location"}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-muted-foreground py-10">
                                <p>You have no saved addresses.</p>
                                <p className="text-xs">Try adding one using search or your current location.</p>
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function AddressSelectionModalWrapper(props: AddressSelectionModalProps) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    const { isLoaded } = useLoadScript({
      googleMapsApiKey: apiKey || "",
      libraries,
    });
    
    if (!apiKey) {
        console.error("Google Maps API key is missing. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable.");
        // Render a version without Google Maps functionality
        return <AddressSelectionContent {...props} />;
    }

    if (!isLoaded && props.isOpen) {
        return (
            <Dialog open={props.isOpen} onOpenChange={props.onClose}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Loading Address Selector</DialogTitle>
                        <DialogDescription>Please wait a moment...</DialogDescription>
                    </DialogHeader>
                    <Skeleton className="h-96 w-full" />
                </DialogContent>
            </Dialog>
        );
    }

    return <AddressSelectionContent {...props} />;
}

    