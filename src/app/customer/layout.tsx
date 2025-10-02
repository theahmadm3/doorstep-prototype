
"use client";

import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  Home,
  LogOut,
  Package,
  ShoppingCart,
  User,
  Utensils
} from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ClientHeader from '@/components/layout/client-header';
import LogoutButton from '@/components/auth/logout-button';
import { useEffect, useState } from 'react';
import type { User as UserType } from '@/lib/types';
import { useOrder } from '@/hooks/use-order';
import AddressSelectionModal from '@/components/location/address-selection-modal';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<UserType | null>(null);
  const { addresses, isAddressesLoading } = useOrder();
  const [isAddressModalRequired, setAddressModalRequired] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);
  
  useEffect(() => {
    // Only trigger for logged-in customers after initial address load has finished
    if (user && user.role === 'customer' && !isAddressesLoading) {
      if (addresses.length === 0) {
        setAddressModalRequired(true);
      } else {
        setAddressModalRequired(false);
      }
    }
  }, [user, addresses, isAddressesLoading]);

  const handleModalClose = () => {
    // Prevent closing if no addresses are saved
    if (addresses.length > 0) {
      setAddressModalRequired(false);
    }
  };


  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AddressSelectionModal 
            isOpen={isAddressModalRequired}
            onClose={handleModalClose}
        />
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <Utensils className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold font-headline">Doorstep</span>
            </div>
          </SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/customer/dashboard">
                  <Home />
                  Dashboard
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/customer/orders">
                  <Package />
                  My Orders
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/customer/profile">
                  <User />
                  Profile
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <SidebarFooter>
            {isClient && user && (
              <div className="flex items-center gap-3 p-2 rounded-md bg-muted">
                <Avatar>
                  <AvatarImage src={user?.avatar_url || "https://github.com/shadcn.png"} alt={user?.full_name || "Customer"} />
                  <AvatarFallback>{user?.full_name?.[0]?.toUpperCase() || 'C'}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{user?.full_name || "Customer User"}</span>
                  <span className="text-xs text-muted-foreground">
                    {user?.email || "customer@doorstep.com"}
                  </span>
                </div>
                <LogoutButton />
              </div>
            )}
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
            <ClientHeader />
            <div className="p-4">{children}</div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
