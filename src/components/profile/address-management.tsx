
"use client";

import { useState, useEffect } from "react";
import { v4 as uuidv4 } from 'uuid';
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
import type { Address, AddressFormData } from "@/lib/types";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import AddressForm from "./address-form";

const ADDRESS_STORAGE_KEY = "doorstepAddresses";

export default function AddressManagement() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const storedAddresses = localStorage.getItem(ADDRESS_STORAGE_KEY);
    if (storedAddresses) {
      const parsedAddresses: Address[] = JSON.parse(storedAddresses);
      setAddresses(parsedAddresses);
      if (parsedAddresses.length > 0) {
        setSelectedAddressId(parsedAddresses[0].id);
      }
    }
  }, []);

  const saveAddressesToStorage = (updatedAddresses: Address[]) => {
    localStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(updatedAddresses));
    setAddresses(updatedAddresses);
  };
  
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
     const updatedAddresses = addresses.filter(addr => addr.id !== selectedAddressId);
     saveAddressesToStorage(updatedAddresses);
     setSelectedAddressId(updatedAddresses.length > 0 ? updatedAddresses[0].id : null);
     toast({ title: "Address Deleted", description: "The selected address has been removed." });
  };


  const handleSaveAddress = (data: AddressFormData) => {
    if (editingAddress) {
      // Update existing address
      const updatedAddresses = addresses.map(addr =>
        addr.id === editingAddress.id ? { ...addr, ...data } : addr
      );
      saveAddressesToStorage(updatedAddresses);
      toast({ title: "Address Updated", description: "Your address has been successfully updated." });
    } else {
      // Add new address
      const newAddress: Address = { id: uuidv4(), ...data };
      const updatedAddresses = [...addresses, newAddress];
      saveAddressesToStorage(updatedAddresses);
      setSelectedAddressId(newAddress.id);
      toast({ title: "Address Added", description: "Your new address has been saved." });
    }
    setModalOpen(false);
    setEditingAddress(null);
  };

  const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
  
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
                    {addr.address_nickname || `${addr.street.substring(0, 20)}...`}
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
            <p>{selectedAddress.street}</p>
            <p>{selectedAddress.district_town}</p>
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
