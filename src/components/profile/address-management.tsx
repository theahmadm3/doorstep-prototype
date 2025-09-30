
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
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { updateAddress, deleteAddress } from "@/lib/api";
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
import AddressSelectionModal from "../location/address-selection-modal";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addressSchema } from "@/lib/types";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "../ui/checkbox";

export default function AddressManagement() {
  const { addresses, isAddressesLoading, refetchAddresses, selectedAddress, setSelectedAddress } = useOrder();
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);
  const [addressToEdit, setAddressToEdit] = useState<Address | null>(null);
  const { toast } = useToast();
  
  const selectedAddressId = selectedAddress?.id || (addresses.length > 0 ? addresses[0].id : null);

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

  const handleEditClick = () => {
    const currentAddress = addresses.find(addr => addr.id === selectedAddressId);
    if (currentAddress) {
      setAddressToEdit(currentAddress);
      setEditModalOpen(true);
    }
  };

  const handleDeleteClick = () => {
      const currentAddress = addresses.find(addr => addr.id === selectedAddressId);
      if (currentAddress) {
          setAddressToDelete(currentAddress);
      }
  }

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

  if (isAddressesLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
        <AddressSelectionModal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} />
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

      <div className="space-y-2">
          {addresses.length > 0 && selectedAddress ? (
            <div className="text-sm p-3 bg-muted rounded-md border">
                <p className="font-semibold">{selectedAddress.address_nickname || 'Address Details'}</p>
                {selectedAddress.street_address ? (
                    <>
                        <p>{selectedAddress.street_address}</p>
                        <p>{selectedAddress.city}</p>
                    </>
                ) : (
                    <p>GPS: {Number(selectedAddress.latitude)?.toFixed(6)}, {Number(selectedAddress.longitude)?.toFixed(6)}</p>
                )}
                {selectedAddress.nearest_landmark && <p className="text-muted-foreground">Landmark: {selectedAddress.nearest_landmark}</p>}
            </div>
        ) : (
            <div className="text-sm p-3 bg-muted rounded-md border text-center text-muted-foreground">
                You have no saved addresses.
            </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button variant="outline" className="w-full" onClick={() => setAddModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Address
        </Button>
        {addresses.length > 0 && (
            <>
                <Button variant="outline" className="w-full" onClick={handleEditClick}>
                    <Edit className="mr-2 h-4 w-4" /> Edit Selected
                </Button>
                <Button variant="destructive" className="w-full" onClick={handleDeleteClick}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Selected
                </Button>
            </>
        )}
      </div>
    </div>
  );
}
