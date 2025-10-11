
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
import {
	Home,
	LineChart,
	Settings,
	ShoppingBag,
	User,
	Utensils,
} from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LogoutButton from "@/components/auth/logout-button";
import { useEffect, useState, useCallback } from "react";
import type { User as UserType } from "@/lib/types";
import { getRestaurantProfile } from "@/lib/api";
import VendorAddressModal from "@/components/vendor/vendor-address-modal";
import InstallPWAButton from "@/components/pwa/install-pwa-button";

export default function VendorLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const [user, setUser] = useState<UserType | null>(null);
	const [showAddressModal, setShowAddressModal] = useState(false);

	const checkVendorAddress = useCallback(async () => {
		try {
			const profile = await getRestaurantProfile();
			if (!profile.address) {
				setShowAddressModal(true);
			}
		} catch (error) {
			console.error("Failed to fetch vendor profile:", error);
			// Handle error, maybe show a toast
		}
	}, []);

	useEffect(() => {
		const storedUser = localStorage.getItem("user");
		if (storedUser) {
			const parsedUser = JSON.parse(storedUser);
			setUser(parsedUser);
			if (parsedUser.role === "restaurant") {
				checkVendorAddress();
			}
		}
	}, [checkVendorAddress]);

	const handleAddressSaved = () => {
		setShowAddressModal(false);
		// Optionally, you can re-verify or simply trust the modal did its job.
		// For a better UX, we can just close it.
	};

	return (
		<SidebarProvider>
			<div className="flex min-h-screen">
				<VendorAddressModal
					isOpen={showAddressModal}
					onAddressSaved={handleAddressSaved}
				/>
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
									<Link href="/vendor/dashboard">
										<Home />
										Dashboard
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<SidebarMenuButton asChild>
									<Link href="/vendor/orders">
										<ShoppingBag />
										Orders
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<SidebarMenuButton asChild>
									<Link href="/vendor/analytics">
										<LineChart />
										Analytics
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<SidebarMenuButton asChild>
									<Link href="/vendor/config">
										<Settings />
										Config
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<SidebarMenuButton asChild>
									<Link href="/vendor/profile">
										<User />
										Profile
									</Link>								
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarContent>
					<SidebarFooter className="mt-auto">
						<div className="md:hidden mb-4 px-2">
							<InstallPWAButton />
						</div>
						<div className="flex flex-col items-center gap-3 p-2 rounded-md bg-muted">
							<div className="w-full flex items-center gap-2">
								<Avatar>
									<AvatarImage
										src={user?.avatar_url || "https://github.com/shadcn.png"}
										alt={user?.full_name || "Vendor"}
									/>
									<AvatarFallback>
										{user?.full_name?.[0]?.toUpperCase() || "V"}
									</AvatarFallback>
								</Avatar>
								<div className="flex flex-col">
									<span className="text-sm font-semibold">
										{user?.full_name || ""}
									</span>
									<span className="text-xs text-muted-foreground">
										{user?.email || ""}
									</span>
								</div>
							</div>
							<LogoutButton />
						</div>
					</SidebarFooter>
				</Sidebar>
				<div className="flex flex-col flex-1 min-w-0">
					<div className="p-4 flex items-center gap-4 bg-background border-b sticky top-0 z-10">
						<SidebarTrigger />
						<h1 className="text-lg font-semibold">Vendor Panel</h1>
					</div>
					<main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
						{children}
					</main>
				</div>
			</div>
		</SidebarProvider>
	);
}
