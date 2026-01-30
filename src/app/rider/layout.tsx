
"use client";

import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
  SidebarContent,
} from '@/components/ui/sidebar';
import {
  Home,
  Package,
  User,
  Utensils,
  CreditCard,
} from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import LogoutButton from '@/components/auth/logout-button';
import { useEffect, useState, createContext, useContext } from 'react';
import type { User as UserType } from '@/lib/types';
import BottomNavigation from '@/components/layout/bottom-navigation';
import { useRiderLocation as useRiderLocationData, LocationStatus } from '@/hooks/use-rider-location-socket';
import { useNotificationListener } from '@/hooks/use-notification-listener';

const riderNavLinks = [
  { href: "/rider/dashboard", label: "Dashboard", icon: Home },
  { href: "/rider/orders", label: "Orders", icon: Package },
  { href: "/rider/payouts", label: "Payouts", icon: CreditCard },
  { href: "/rider/profile", label: "Profile", icon: User },
];

const LocationStatusContext = createContext<LocationStatus>({
  status: 'connecting',
  message: 'Connecting...',
  color: 'text-yellow-500',
});

export const useRiderLocation = () => useContext(LocationStatusContext);

function RiderLocationProvider({ children }: { children: React.ReactNode }) {
    const locationStatus = useRiderLocationData();
    return (
        <LocationStatusContext.Provider value={locationStatus}>
            {children}
        </LocationStatusContext.Provider>
    )
}

export default function RiderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useNotificationListener();
  const [user, setUser] = useState<UserType | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.role === 'driver') {
        setUser(parsedUser);
      }
    }
  }, []);

  return (
    <RiderLocationProvider>
        <SidebarProvider>
        <div className="flex min-h-screen">
            <Sidebar className="hidden md:flex md:flex-col">
            <SidebarHeader>
                <div className="flex items-center gap-2">
                <Utensils className="w-8 h-8 text-primary" />
                <span className="text-xl font-bold font-headline">Doorstep</span>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                {riderNavLinks.map(link => (
                    <SidebarMenuItem key={link.href}>
                    <SidebarMenuButton asChild>
                        <Link href={link.href}>
                        <link.icon />
                        {link.label}
                        </Link>
                    </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
                <div className="flex flex-col items-center gap-3 p-2 rounded-md bg-muted">
                <div className="w-full flex items-center gap-3">
                    <Avatar>
                    <AvatarImage src={user?.avatar_url || "https://github.com/shadcn.png"} alt={user?.full_name || "Rider"} />
                    <AvatarFallback>{user?.full_name?.[0]?.toUpperCase() || 'R'}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                    <span className="text-sm font-semibold truncate">{user?.full_name || "Rider User"}</span>
                    <span className="text-xs text-muted-foreground truncate">
                        {user?.email || "rider@doorstep.com"}
                    </span>
                    </div>
                </div>
                <LogoutButton />
                </div>
            </SidebarFooter>
            </Sidebar>
            <div className="flex flex-col flex-1 min-w-0">
            <div className="p-4 flex items-center gap-4 bg-background border-b sticky top-0 z-10 md:hidden">
                <SidebarTrigger />
                <h1 className="text-lg font-semibold">Rider Panel</h1>
            </div>
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
                {children}
            </main>
            <BottomNavigation links={riderNavLinks} />
            </div>
        </div>
        </SidebarProvider>
    </RiderLocationProvider>
  );
}
