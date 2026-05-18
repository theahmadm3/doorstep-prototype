
"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "../ui/sidebar";
import { useCartStore } from "@/stores/useCartStore";
import { useUIStore } from "@/stores/useUIStore";
import { useAddresses } from "@/hooks/use-addresses";
import { Package, MapPin, Bell } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { User } from "@/lib/types";
import AddressSelectionModal from "../location/address-selection-modal";
import { usePushManager, usePushStore } from "@/hooks/use-push-manager";

export default function ClientHeader() {
	const orders = useCartStore((state) => state.orders);
	const selectedAddress = useUIStore((state) => state.selectedAddress);
	const { isAddressesLoading } = useAddresses();
	const [user, setUser] = useState<User | null>(null);
	const [isAddressModalOpen, setAddressModalOpen] = useState(false);
	const [isClient, setIsClient] = useState(false);
	const { isSupported, isSubscribed, isSubscribing, platformInfo } =
		usePushStore();
	const { handleSubscribe } = usePushManager();

	useEffect(() => {
		setIsClient(true);
		const storedUser = localStorage.getItem("user");
		if (storedUser) {
			setUser(JSON.parse(storedUser));
		}
	}, []);

	const unsubmittedOrderCount = orders.filter(
		(o) => o.status === "unsubmitted",
	).length;
	const firstName = user?.full_name?.split(" ")[0];

	return (
		<>
			<AddressSelectionModal
				isOpen={isAddressModalOpen}
				onClose={() => setAddressModalOpen(false)}
			/>
			<div className="p-4 flex justify-between items-center gap-4 bg-background shadow-sm border-b sticky top-0 z-10">
				<div className="flex items-center gap-2">
					<SidebarTrigger />
					{isClient ? (
						<Button
							variant="outline"
							className="text-xs sm:text-sm"
							onClick={() => setAddressModalOpen(true)}
							disabled={isAddressesLoading}
						>
							<MapPin className="mr-2 h-4 w-4" />
							{isAddressesLoading
								? "Loading..."
								: selectedAddress
								? selectedAddress.address_nickname ||
								  selectedAddress.street_address?.split(",")[0]
								: "Select Address"}
						</Button>
					) : (
						<Button variant="outline" disabled>
							<MapPin className="mr-2 h-4 w-4" />
							Select Address
						</Button>
					)}
				</div>

				<div className="flex items-center justify-end space-x-1">
					{isClient && isSupported && (
						<Button
							variant="ghost"
							size="icon"
							onClick={handleSubscribe}
							disabled={
								isSubscribed || isSubscribing || platformInfo.needsPWAInstall
							}
							title={
								isSubscribed
									? "Notifications enabled"
									: "Enable notifications"
							}
						>
							<Bell className="h-5 w-5" />
							{isSubscribed && (
								<span className="absolute top-2.5 right-2.5 flex h-2 w-2">
									<span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
								</span>
							)}
						</Button>
					)}
					<Button variant="ghost" size="icon" asChild>
						<Link href="/customer/orders">
							<Package className="h-5 w-5" />
							{isClient && unsubmittedOrderCount > 0 && (
								<Badge className="absolute top-2 right-2 h-4 w-4 justify-center p-0">
									{unsubmittedOrderCount}
								</Badge>
							)}
							<span className="sr-only">Unsubmitted Orders</span>
						</Link>
					</Button>
				</div>
			</div>
		</>
	);
}
