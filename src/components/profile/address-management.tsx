
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
import { getAddresses, addAddress } from "@/lib/api";
import { Skeleton } from "../ui/skeleton";

export default function AddressManagement() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchAddresses = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedAddresses = await getAddresses(); 
      setAddresses(fetchedAddresses);
      if (fetchedAddresses.length > 0) {
        // Find a default address or fallback to the first one
        const defaultAddress = fetchedAddresses.find(a => a.is_default);
        setSelectedAddressId(defaultAddress ? defaultAddress.id : fetchedAddresses[0].id);
      } else {
        setSelectedAddressId(null);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load addresses.";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  
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

  const handleDeleteClick = () => {
     if (!selectedAddressId) return;
     // TODO: Implement API call for deletion
     console.log("Deleting address:", selectedAddressId);
     setAddresses(addresses.filter(addr => addr.id !== selectedAddressId));
     setSelectedAddressId(addresses.length > 1 ? addresses.find(addr => addr.id !== selectedAddressId)!.id : null);
     toast({ title: "Address Deleted", description: "The selected address has been removed." });
  };


  const handleSaveAddress = async (data: AddressFormData) => {
    try {
      if (editingAddress) {
        // TODO: Implement API call for updating an address
        console.log("Updating address:", { ...editingAddress, ...data });
        toast({ title: "Address Updated", description: "Your address has been successfully updated." });
      } else {
        const payload: AddressPostData = { ...data, is_default: addresses.length === 0 };
        await addAddress(payload); 
        toast({ title: "Address Added", description: "Your new address has been saved." });
      }
      fetchAddresses(); // Refresh addresses from the server
    } catch (error) {
       const message = error instanceof Error ? error.message : "Failed to save address.";
       toast({
          title: "Error",
          description: message,
          variant: "destructive",
       });
    }
    setModalOpen(false);
    setEditingAddress(null);
  };

  const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
  
  if (isLoading) {
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
            <Select onValueChange={setSelectedAddressId} value={selectedAddressId || ''}>
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
            <Button variant="ghost" size="icon" onClick={handleDeleteClick} disabled={!selectedAddressId}>
                <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">You have no saved addresses.</p>
        )}
      </div>

       {selectedAddress && (
        <div className="text-sm p-3 bg-muted rounded-md border">
            <p className="font-semibold">{selectedAddress.address_nickname}</p>
            <p>{selectedAddress.street_address}</p>
            <p>{selectedAddress.city}</p>
            {selectedAddress.nearest_landmark && <p className="text-muted-foreground">Landmark: {selectedAddress.nearest_landmark}</p>}
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
