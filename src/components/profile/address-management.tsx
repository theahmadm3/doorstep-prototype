
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import AddressForm from "./address-form";
import { addAddress, updateAddress, deleteAddress } from "@/lib/api";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useOrder } from "@/hooks/use-order";


export default function AddressManagement() {
  const { addresses, isAddressesLoading, refetchAddresses, selectedAddress, setSelectedAddress } = useOrder();
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const { toast } = useToast();

  const selectedAddressId = selectedAddress?.id || null;

  useEffect(() => {
    refetchAddresses();
  }, [refetchAddresses]);

  
  const handleAddClick = () => {
    setEditingAddress(null);
    setModalOpen(true);
  };

  const handleEditClick = () => {
    const addressToEdit = addresses.find(addr => addr.id === selectedAddressId);
    if (addressToEdit) {
      setEditingAddress(addressToEdit);
      setModalOpen(true);
    }
  };

  const handleDelete = async () => {
     if (!selectedAddressId) return;
     try {
        await deleteAddress(selectedAddressId);
        toast({ title: "Address Deleted", description: "The selected address has been removed." });
        await refetchAddresses(); // Refetch after delete
     } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to delete address.";
        toast({
            title: "Error",
            description: message,
            variant: "destructive",
        });
     }
  };


  const handleSaveAddress = async (data: AddressFormData) => {
    try {
      if (editingAddress) {
        const payload: Partial<AddressPostData> = { ...data };
        await updateAddress(editingAddress.id, payload);
        toast({ title: "Address Updated", description: "Your address has been successfully updated." });
      } else {
        const payload: AddressPostData = { ...data, is_default: addresses.length === 0 };
        await addAddress(payload); 
        toast({ title: "Address Added", description: "Your new address has been saved." });
      }
      await refetchAddresses(); // Refetch after save
    } catch (error) {
       const message = error instanceof Error ? error.message : "Failed to save address.";
       toast({
          title: "Error",
          description: message,
          variant: "destructive",
       });
    } finally {
        setModalOpen(false);
        setEditingAddress(null);
    }
  };

  const handleSelectAddress = (addressId: string) => {
      const address = addresses.find(a => a.id === addressId);
      if (address) {
          setSelectedAddress(address);
      }
  }

  const currentSelectedAddress = addresses.find(addr => addr.id === selectedAddressId);
  
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
      <div className="space-y-2">
        <label className="text-sm font-medium">Saved Addresses</label>
        {addresses.length > 0 ? (
          <div className="flex items-center gap-2">
            <Select onValueChange={handleSelectAddress} value={selectedAddressId || ''}>
              <SelectTrigger>
                <SelectValue placeholder="Select an address" />
              </SelectTrigger>
              <SelectContent>
                {addresses.map(addr => (
                  <SelectItem key={addr.id} value={addr.id}>
                    {addr.address_nickname || `${addr.street_address.substring(0, 20)}...`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" onClick={handleEditClick} disabled={!selectedAddressId}>
                <Edit className="h-4 w-4" />
            </Button>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={!selectedAddressId}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your
                        address.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">You have no saved addresses.</p>
        )}
      </div>

       {currentSelectedAddress && (
        <div className="text-sm p-3 bg-muted rounded-md border">
            <p className="font-semibold">{currentSelectedAddress.address_nickname || 'Address Details'}</p>
            <p>{currentSelectedAddress.street_address}</p>
            <p>{currentSelectedAddress.city}</p>
            {currentSelectedAddress.nearest_landmark && <p className="text-muted-foreground">Landmark: {currentSelectedAddress.nearest_landmark}</p>}
        </div>
       )}

      <Button variant="outline" className="w-full" onClick={handleAddClick}>
        <PlusCircle className="mr-2 h-4 w-4" /> Add New Address
      </Button>

      <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAddress ? 'Edit Address' : 'Add a New Address'}</DialogTitle>
            <DialogDescription>
              Please fill in the details for your delivery location.
            </DialogDescription>
          </DialogHeader>
          <AddressForm
            onSubmit={handleSaveAddress}
            defaultValues={editingAddress || undefined}
            isEditing={!!editingAddress}
          />
          <DialogFooter>
             <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
             <Button type="submit" form="address-form">
                {editingAddress ? 'Save Changes' : 'Save Address'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
