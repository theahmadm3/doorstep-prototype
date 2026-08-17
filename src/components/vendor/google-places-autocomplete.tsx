import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

export type VendorPlaceResult = { street_name: string; latitude: number; longitude: number };

export const GOOGLE_MAPS_LIBRARIES: ("places")[] = ["places"];

export const GooglePlacesAutocomplete = ({
    onPlaceSelect,
    onClearSelection,
    initialValue = "",
}: {
    onPlaceSelect: (place: VendorPlaceResult) => void;
    onClearSelection?: () => void;
    initialValue?: string;
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
        defaultValue: initialValue,
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
