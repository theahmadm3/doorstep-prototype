
"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "../ui/sidebar";
import { useOrder } from "@/hooks/use-order";
import { Package, MapPin } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { User } from "@/lib/types";
import AddressSelectionModal from "../location/address-selection-modal";

export default function ClientHeader() {
  const { orders, selectedAddress } = useOrder();
  const [user, setUser] = useState<User | null>(null);
  const [isAddressModalOpen, setAddressModalOpen] = useState(false);
  
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const unsubmittedOrderCount = orders.filter(o => o.status === 'unsubmitted').length;
  const firstName = user?.full_name?.split(' ')[0];

  return (
    <>
      <AddressSelectionModal 
        isOpen={isAddressModalOpen}
        onClose={() => setAddressModalOpen(false)}
      />
      <div className="p-4 flex items-center gap-4 bg-background border-b sticky top-0 z-10">
        <SidebarTrigger />
        <h1 className="text-lg font-semibold">
          {firstName ? `Hello, ${firstName}` : 'Customer Dashboard'}
        </h1>
        <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" className="hidden sm:flex" onClick={() => setAddressModalOpen(true)}>
                <MapPin className="mr-2 h-4 w-4" />
                {selectedAddress ? (selectedAddress.address_nickname || selectedAddress.street_address) : "Select Address"}
            </Button>
        </div>
        <div className="flex items-center justify-end space-x-2">
           <Button variant="ghost" size="icon" asChild>
            <Link href="/customer/orders">
              <Package className="h-5 w-5" />
              {unsubmittedOrderCount > 0 && (
                <Badge className="absolute top-2 right-2 h-4 w-4 justify-center p-0">{unsubmittedOrderCount}</Badge>
              )}
              <span className="sr-only">Unsubmitted Orders</span>
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
}
