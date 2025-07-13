
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
  User,
  Utensils
} from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function RiderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/rider/dashboard">
                  <Home />
                  Dashboard
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/rider/orders">
                  <Package />
                  Orders
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/rider/profile">
                  <User />
                  Profile
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <SidebarFooter>
            <div className="flex items-center gap-3 p-2 rounded-md bg-muted">
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" alt="@rider" />
                <AvatarFallback>R</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">Rider User</span>
                <span className="text-xs text-muted-foreground">
                  rider@doorstep.com
                </span>
              </div>
              <Link href="/login" className="ml-auto">
                <LogOut className="w-5 h-5 text-muted-foreground hover:text-foreground" />
              </Link>
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <div className="p-4 flex items-center gap-4 bg-background border-b sticky top-0">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold">Rider Panel</h1>
          </div>
          <div className="p-4">{children}</div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
