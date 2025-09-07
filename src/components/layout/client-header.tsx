
"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "../ui/sidebar";
import { useOrder } from "@/hooks/use-order";
import { Package } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { User } from "@/lib/types";

export default function ClientHeader() {
  const { orders } = useOrder();
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const unsubmittedOrderCount = orders.filter(o => o.status === 'unsubmitted').length;
  const firstName = user?.full_name?.split(' ')[0];

  return (
    <div className="p-4 flex items-center gap-4 bg-background border-b sticky top-0 z-10">
      <SidebarTrigger />
      <h1 className="text-lg font-semibold">
        {firstName ? `Hello, ${firstName}` : 'Customer Dashboard'}
      </h1>
      <div className="flex flex-1 items-center justify-end space-x-2">
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
  );
}
