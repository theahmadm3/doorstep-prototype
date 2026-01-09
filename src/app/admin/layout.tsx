
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
} from "@/components/ui/sidebar";
import { Home, LineChart, Settings, Bike, ShoppingBag, Utensils } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LogoutButton from "@/components/auth/logout-button";
import BottomNavigation from "@/components/layout/bottom-navigation";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";

const adminNavLinks = [
	{ href: "/admin/dashboard", label: "Dashboard", icon: Home },
	{ href: "/admin/orders", label: "Orders", icon: ShoppingBag },
	{ href: "/admin/analytics", label: "Analytics", icon: LineChart },
	{ href: "/admin/vendors", label: "Vendors", icon: Utensils },
	{ href: "/admin/riders", label: "Riders", icon: Bike },
	{ href: "/admin/config", label: "Config", icon: Settings },
];

export default function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { user, isLoading } = useAuth();
	
	return (
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
							{adminNavLinks.map((link) => (
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
						{isLoading ? (
							<div className="flex items-center gap-3 p-2 rounded-md bg-muted">
								<Skeleton className="h-10 w-10 rounded-full" />
								<div className="flex flex-col space-y-2">
									<Skeleton className="h-4 w-24" />
									<Skeleton className="h-3 w-32" />
								</div>
							</div>
						) : user ? (
							<div className="flex items-center gap-3 p-2 rounded-md bg-muted">
								<Avatar>
									<AvatarImage
										src={user.avatar_url || "https://github.com/shadcn.png"}
										alt={user.full_name || "Admin"}
									/>
									<AvatarFallback>
										{user.full_name?.[0]?.toUpperCase() || "A"}
									</AvatarFallback>
								</Avatar>
								<div className="flex flex-col">
									<span className="text-sm font-semibold">
										{user.full_name || "Admin User"}
									</span>
									<span className="text-xs text-muted-foreground">
										{user.email || "admin@doorstep.com"}
									</span>
								</div>
								<LogoutButton />
							</div>
						) : null}
					</SidebarFooter>
				</Sidebar>
				<div className="flex flex-col flex-1 min-w-0">
					<div className="p-4 flex items-center gap-4 bg-background border-b sticky top-0 z-10 md:hidden">
						<SidebarTrigger />
						<h1 className="text-lg font-semibold">Admin Panel</h1>
					</div>
					<main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
						{children}
					</main>
					<BottomNavigation links={adminNavLinks} />
				</div>
			</div>
		</SidebarProvider>
	);
}
