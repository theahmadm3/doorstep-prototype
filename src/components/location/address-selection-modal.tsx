
"use client";

import { useOrder } from "@/hooks/use-order";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, LocateFixed, Search } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { Skeleton } from "../ui/skeleton";

interface AddressSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AddressSelectionModal({ isOpen, onClose }: AddressSelectionModalProps) {
    const { addresses, setSelectedAddress, isAddressesLoading } = useOrder();

    const handleSelectAddress = (addressId: string) => {
        const address = addresses.find(a => a.id === addressId);
        if (address) {
            setSelectedAddress(address);
        }
        onClose();
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
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
                    <Button variant="outline" className="w-full">
                        <LocateFixed className="mr-2 h-4 w-4" />
                        Use your current location
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
                                        <p className="font-semibold">{address.address_nickname || address.street_address}</p>
                                        <p className="text-sm text-muted-foreground">{address.street_address}, {address.city}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-muted-foreground py-10">
                                <p>You have no saved addresses.</p>
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}
