
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
} from "@/components/ui/sidebar";
import { Home, Package, User, Utensils } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ClientHeader from "@/components/layout/client-header";
import LogoutButton from "@/components/auth/logout-button";
import { useEffect, useState } from "react";
import type { User as UserType } from "@/lib/types";
import AddressSelectionModal from "@/components/location/address-selection-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { useAddresses } from "@/hooks/use-addresses";

export default function CustomerLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const [user, setUser] = useState<UserType | null>(null);
	const { addresses, isAddressesLoading } = useAddresses();
	const [isAddressModalRequired, setAddressModalRequired] = useState(false);
	const [isClient, setIsClient] = useState(false);

	useEffect(() => {
		setIsClient(true);
		const storedUser = localStorage.getItem("user");
		if (storedUser) {
			setUser(JSON.parse(storedUser));
		}
	}, []);

	useEffect(() => {
		// Only trigger for logged-in customers after initial address load has finished
		if (user && user.role === "customer" && !isAddressesLoading) {
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
			<AddressSelectionModal
				isOpen={isAddressModalRequired}
				onClose={handleModalClose}
			/>
			
			<div className="flex min-h-screen w-full">
				<Sidebar className="hidden md:flex md:flex-col">
					<SidebarHeader className="p-4 border-b">
						<div className="flex items-center gap-2">
							<Utensils className="w-8 h-8 text-primary" />
							<span className="text-xl font-bold font-headline">Doorstep</span>
						</div>
					</SidebarHeader>
					
					<SidebarContent className="flex-1 overflow-y-auto py-4">
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
					</SidebarContent>
					
					<SidebarFooter className="p-4 border-t">
						{!isClient || !user ? (
							<div className="flex items-center gap-3 p-3">
								<Skeleton className="h-10 w-10 rounded-full" />
								<div className="flex-1 space-y-2">
									<Skeleton className="h-4 w-24" />
									<Skeleton className="h-3 w-32" />
								</div>
							</div>
						) : (
							<div className="flex flex-col gap-3 p-3 rounded-lg bg-muted">
								<div className="flex items-center gap-3">
									<Avatar className="h-10 w-10">
										<AvatarImage
											src={user.avatar_url || "https://github.com/shadcn.png"}
											alt={user.full_name || "Customer"}
										/>
										<AvatarFallback>
											{user.full_name?.[0]?.toUpperCase() || "C"}
										</AvatarFallback>
									</Avatar>
									<div className="flex flex-col min-w-0 flex-1">
										<span className="text-sm font-semibold truncate">
											{user.full_name || "Customer User"}
										</span>
										<span className="text-xs text-muted-foreground truncate">
											{user.email || "customer@doorstep.com"}
										</span>
									</div>
								</div>
								<LogoutButton />
							</div>
						)}
					</SidebarFooter>
				</Sidebar>
				
				<div className="flex flex-1 flex-col min-w-0">
					<ClientHeader />
					<main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
						{children}
					</main>
				</div>
			</div>
		</SidebarProvider>
	);
}
