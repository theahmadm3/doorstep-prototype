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
import {
	Home,
	LineChart,
	Settings,
	ShoppingBag,
	Tag,
	User,
	CreditCard,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LogoutButton from "@/components/auth/logout-button";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User as UserType } from "@/lib/types";
import { getRestaurantProfile } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/query-keys";
import VendorAddressModal from "@/components/vendor/vendor-address-modal";
import BottomNavigation from "@/components/layout/bottom-navigation";
import { useNotificationListener } from "@/hooks/use-notification-listener";
import { Link, Outlet } from "react-router-dom";
import { getStoredUser } from "@/lib/auth";

const vendorNavLinks = [
	{ href: "/vendor/dashboard", label: "Dashboard", icon: Home },
	{ href: "/vendor/orders", label: "Orders", icon: ShoppingBag },
	{ href: "/vendor/analytics", label: "Analytics", icon: LineChart },
	{ href: "/vendor/config", label: "Config", icon: Settings },
	{ href: "/vendor/payouts", label: "Payouts", icon: CreditCard },
	{ href: "/vendor/discounts", label: "Discounts", icon: Tag },
	{ href: "/vendor/profile", label: "Profile", icon: User },
];

export default function VendorLayout() {
	useNotificationListener();
	const queryClient = useQueryClient();
	const [user, setUser] = useState<UserType | null>(null);

	useEffect(() => {
		document.title = "Doorstep - Vendor";
		return () => {
			document.title = "Doorstep";
		};
	}, []);

	useEffect(() => {
		const storedUser = getStoredUser();
		if (storedUser) setUser(storedUser);
	}, []);

	const { data: profile } = useQuery({
		queryKey: QUERY_KEYS.vendorProfile,
		queryFn: getRestaurantProfile,
		enabled: !!user && user.role === "restaurant",
	});

	const showAddressModal = !!user && user.role === "restaurant" && !!profile && !profile.address;

	const handleAddressSaved = () => {
		queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vendorProfile });
	};

	return (
		<SidebarProvider>
			<div className="flex min-h-screen">
				<VendorAddressModal
					isOpen={showAddressModal}
					onAddressSaved={handleAddressSaved}
				/>
				<Sidebar className="hidden md:flex md:flex-col">
					<SidebarHeader>
						<div className="flex items-center gap-2">
							<img
								src="/doorstep-logo.png"
								alt="Doorstep"
								className="h-8 w-auto max-w-full"
							/>
						</div>
					</SidebarHeader>
					<SidebarContent>
						<SidebarMenu>
							{vendorNavLinks.map((link) => (
								<SidebarMenuItem key={link.href}>
									<SidebarMenuButton asChild>
										<Link to={link.href}>
											<link.icon />
											{link.label}
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarContent>
					<SidebarFooter className="mt-auto">
						<div className="flex flex-col items-center gap-2 p-2 rounded-md bg-muted">
							<div className="w-full flex items-center gap-2 min-w-0">
								<Avatar>
									<AvatarImage
										src={
											profile?.image_url?.startsWith("http")
												? profile.image_url
												: undefined
										}
										alt={user?.full_name || "Vendor"}
									/>
									<AvatarFallback>
										{user?.full_name?.[0]?.toUpperCase() || "V"}
									</AvatarFallback>
								</Avatar>
								<div className="flex flex-col min-w-0">
									<span className="text-sm font-semibold truncate">
										{user?.full_name || ""}
									</span>
									<span className="text-xs text-muted-foreground truncate">
										{user?.email || ""}
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
						<h1 className="text-lg font-semibold">Vendor Panel</h1>
					</div>
					<main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-20 md:pb-8 max-w-6xl w-full">
						<Outlet />
					</main>
					<BottomNavigation links={vendorNavLinks} />
				</div>
			</div>
		</SidebarProvider>
	);
}
