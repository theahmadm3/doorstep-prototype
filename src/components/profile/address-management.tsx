
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Address, AddressFormData, AddressPostData } from "@/lib/types";
import { PlusCircle, Edit, Trash2, MapPin, LocateFixed, Search, Save } from "lucide-react";
import { updateAddress, deleteAddress, addAddress } from "@/lib/api";
import { Skeleton } from "../ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useOrder } from "@/hooks/use-order";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addressSchema } from "@/lib/types";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "../ui/checkbox";
import { ScrollArea } from "../ui/scroll-area";

export default function AddressManagement() {
  const { addresses, isAddressesLoading, refetchAddresses } = useOrder();
  const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);
  const [addressToEdit, setAddressToEdit] = useState<Address | null>(null);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  
  const [isAddingCurrentLocation, setIsAddingCurrentLocation] = useState(false);
  const [newLocation, setNewLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [nickname, setNickname] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { toast } = useToast();
  
  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    mode: "onChange",
  });

  useEffect(() => {
    refetchAddresses();
  }, [refetchAddresses]);

  useEffect(() => {
      if(addressToEdit) {
          form.reset({
            street_address: addressToEdit.street_address ?? "",
            city: addressToEdit.city ?? "",
            nearest_landmark: addressToEdit.nearest_landmark ?? "",
            address_nickname: addressToEdit.address_nickname ?? "",
            is_default: addressToEdit.is_default || false,
            latitude: addressToEdit.latitude ? Number(addressToEdit.latitude) : undefined,
            longitude: addressToEdit.longitude ? Number(addressToEdit.longitude) : undefined,
          });
      }
  }, [addressToEdit, form]);

  const handleEditClick = (address: Address) => {
    setAddressToEdit(address);
    setEditModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
     if (!addressToDelete) return;
     try {
        await deleteAddress(addressToDelete.id);
        toast({ title: "Address Deleted", description: "The selected address has been removed." });
        await refetchAddresses();
     } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to delete address.";
        toast({
            title: "Error",
            description: message,
            variant: "destructive",
        });
     } finally {
         setAddressToDelete(null);
     }
  };

  const handleSaveAddress = async (data: AddressFormData) => {
    if (!addressToEdit) return;
    try {
        const payload: Partial<AddressPostData> = { ...data };
        await updateAddress(addressToEdit.id, payload);
        toast({ title: "Address Updated", description: "Your address has been successfully updated." });
        await refetchAddresses();
    } catch (error) {
       const message = error instanceof Error ? error.message : "Failed to save address.";
       toast({
          title: "Error",
          description: message,
          variant: "destructive",
       });
    } finally {
        setEditModalOpen(false);
        setAddressToEdit(null);
    }
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
  
   const resetAddLocationState = () => {
        setIsAddingCurrentLocation(false);
        setNewLocation(null);
        setNickname("");
        setStreetAddress("");
        setCity("");
    }
    
  const handleSaveNewLocation = async () => {
    if (!newLocation) return;
    setIsSaving(true);

    const payload: AddressPostData = {
        latitude: Number(newLocation.latitude.toFixed(6)),
        longitude: Number(newLocation.longitude.toFixed(6)),
        address_nickname: nickname || `My Location`,
        street_address: streetAddress || undefined,
        city: city || undefined,
        is_default: false,
    };

    try {
        await addAddress(payload);
        toast({
            title: "Location Saved",
            description: "Your current location has been added to your addresses.",
        });
        await refetchAddresses();
        resetAddLocationState();
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


  return (
    <div className="space-y-4">
        <AlertDialog open={!!addressToDelete} onOpenChange={(open) => !open && setAddressToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete the address: <strong>{addressToDelete?.address_nickname || addressToDelete?.street_address}</strong>.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        <Dialog open={isEditModalOpen} onOpenChange={setEditModalOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Address</DialogTitle>
                    <DialogDescription>Update the details for this location.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form id="address-form" onSubmit={form.handleSubmit(handleSaveAddress)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="street_address"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>House number and street name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. 123 Allen Avenue" {...field} value={field.value ?? ''} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="city"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>District/LGA/Town</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Ikeja" {...field} value={field.value ?? ''}/>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="nearest_landmark"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Nearest Landmark (Optional)</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Opposite the big mosque" {...field} value={field.value ?? ''} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="address_nickname"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Address Nickname (Optional)</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Home, Work" {...field} value={field.value ?? ''} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="is_default"
                            render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                <FormLabel>Set as default address</FormLabel>
                                </div>
                            </FormItem>
                            )}
                        />
                    </form>
                </Form>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setEditModalOpen(false)}>Cancel</Button>
                    <Button type="submit" form="address-form" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        
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
            <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                    <p className="text-sm text-center text-muted-foreground">Location captured. Add details to save.</p>
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
                    <div className="flex gap-2">
                        <Input 
                            placeholder="Nickname (e.g. Home, Work)"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                        />
                        <Button onClick={handleSaveNewLocation} disabled={isSaving}>
                            <Save className="mr-2 h-4 w-4" />
                            {isSaving ? "Saving..." : "Save"}
                        </Button>
                    </div>
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
                        <Skeleton key={i} className="h-16 w-full" />
                    ))}
                </div>
            ) : addresses.length > 0 ? (
                    addresses.map(address => (
                    <div key={address.id} className="flex items-center gap-4 p-3 rounded-md hover:bg-muted">
                        <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                        <div className="flex-grow">
                            <p className="font-semibold">{address.address_nickname || `${address.street_address || `Location @ ${address.latitude?.toFixed(2)}, ${address.longitude?.toFixed(2)}`}`}</p>
                            <p className="text-sm text-muted-foreground">{address.street_address ? `${address.street_address}, ${address.city}` : "GPS Location"}</p>
                        </div>
                        <div className="flex gap-1">
                             <Button variant="ghost" size="icon" onClick={() => handleEditClick(address)}>
                                <Edit className="h-4 w-4"/>
                            </Button>
                             <Button variant="ghost" size="icon" onClick={() => setAddressToDelete(address)}>
                                <Trash2 className="h-4 w-4 text-red-500"/>
                            </Button>
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
  );
}
