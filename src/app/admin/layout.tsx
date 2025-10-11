
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
  SidebarContent,
} from '@/components/ui/sidebar';
import {
  Home,
  LineChart,
  Settings,
  Users,
  Utensils,
  LogOut,
  Bike,
  ShoppingBag,
} from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import LogoutButton from '@/components/auth/logout-button';
import { useEffect, useState } from 'react';
import type { User as UserType } from '@/lib/types';
import InstallPWAButton from '@/components/pwa/install-pwa-button';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<UserType | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <Utensils className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold font-headline">Doorstep</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/admin/dashboard">
                    <Home />
                    Dashboard
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/admin/orders">
                    <ShoppingBag />
                    Orders
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/admin/analytics">
                    <LineChart />
                    Analytics
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/admin/vendors">
                    <Utensils />
                    Vendors
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/admin/riders">
                    <Bike />
                    Riders
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/admin/config">
                    <Settings />
                    Config
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <div className="md:hidden mb-4 px-2">
              <InstallPWAButton />
            </div>
            <div className="flex items-center gap-3 p-2 rounded-md bg-muted">
              <Avatar>
                <AvatarImage src={user?.avatar_url || "https://github.com/shadcn.png"} alt={user?.full_name || "Admin"} />
                <AvatarFallback>{user?.full_name?.[0]?.toUpperCase() || 'A'}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">{user?.full_name || "Admin User"}</span>
                <span className="text-xs text-muted-foreground">
                   {user?.email || "admin@doorstep.com"}
                </span>
              </div>
              <LogoutButton />
            </div>
          </SidebarFooter>
        </Sidebar>
        <div className="flex flex-col flex-1 min-w-0">
          <div className="p-4 flex items-center gap-4 bg-background border-b sticky top-0 z-10">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold">Admin Panel</h1>
          </div>
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
