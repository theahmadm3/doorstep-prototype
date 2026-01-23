"use client";

import { useState, useEffect, useMemo } from "react";
import { getRestaurantMenu } from "@/lib/api";
import type { MenuItem, User, Order, OptionChoice } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import {
	ArrowLeft,
	Star,
	Clock,
	ShoppingCart,
	Heart,
	Share2,
	MapPin,
	Search,
	X,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import CheckoutModal from "@/components/checkout/checkout-modal";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/useCartStore";
import { useUIStore } from "@/stores/useUIStore";
import AddToCartModal from "@/components/checkout/add-to-cart-modal";
import { Input } from "@/components/ui/input";

/* ---------- skeleton unchanged ---------- */

export default function RestaurantMenuPage() {
	const { addOrUpdateItem } = useCartStore();
	const orders = useCartStore((state) => state.orders);
	const { viewedRestaurant } = useUIStore();
	const { toast } = useToast();
	const params = useParams();
	const router = useRouter();
	const restaurantId = params.restaurantId as string;

	const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [user, setUser] = useState<User | null>(null);
	const [isCheckoutOpen, setCheckoutOpen] = useState(false);
	const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
	const [isAddToCartModalOpen, setAddToCartModalOpen] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState("All");

	/* --- search state --- */
	const [isSearchOpen, setIsSearchOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");

	useEffect(() => {
		const storedUser = localStorage.getItem("user");
		if (storedUser) {
			setUser(JSON.parse(storedUser));
		} else {
			router.push(`/login?redirect=/customer/restaurants/${restaurantId}`);
		}
	}, [router, restaurantId]);

	useEffect(() => {
		if (!restaurantId) return;

		(async () => {
			setIsLoading(true);
			try {
				const data = await getRestaurantMenu(restaurantId);
				setMenuItems(data);
			} finally {
				setIsLoading(false);
			}
		})();
	}, [restaurantId]);

	const currentOrder = orders.find(
		(o) => o.restaurantId === restaurantId && o.status === "unsubmitted",
	);

	/* ---------- categories ---------- */
	const categories = useMemo(() => {
		const names = menuItems
			.map((i) => i.category?.name)
			.filter(Boolean) as string[];
		return ["All", ...new Set(names)];
	}, [menuItems]);

	/* ---------- filtering (category + search) ---------- */
	const filteredMenuItems = useMemo(() => {
		return menuItems.filter((item) => {
			const matchesCategory =
				selectedCategory === "All" || item.category?.name === selectedCategory;

			const matchesSearch =
				searchQuery.trim() === "" ||
				item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				item.description?.toLowerCase().includes(searchQuery.toLowerCase());

			return matchesCategory && matchesSearch;
		});
	}, [menuItems, selectedCategory, searchQuery]);

	if (isLoading) return <Skeleton className="h-screen w-full" />;

	if (!viewedRestaurant) return null;

	return (
		<div className="h-screen flex flex-col bg-background">
			<CheckoutModal
				isOpen={isCheckoutOpen}
				onClose={() => setCheckoutOpen(false)}
				order={currentOrder}
			/>

			{selectedItem && (
				<AddToCartModal
					isOpen={isAddToCartModalOpen}
					onClose={() => setAddToCartModalOpen(false)}
					item={selectedItem}
					onAddToCart={(item, qty, opts) => {
						addOrUpdateItem(item, qty, opts);
						setAddToCartModalOpen(false);
					}}
				/>
			)}

			{/* ================= HEADER (NON-SCROLLING) ================= */}
			<div className="shrink-0">
				<div className="relative h-24">
					<Image
						src={viewedRestaurant.image_url || "https://placehold.co/1200x400"}
						alt={viewedRestaurant.name}
						fill
						className="object-cover"
					/>
					<div className="absolute inset-0 bg-gradient-to-b from-black/60 to-transparent" />

					<div className="absolute top-4 left-0 right-0 px-4 flex justify-between">
						<Button asChild size="icon" className="bg-white rounded-full">
							<Link href="/customer/dashboard">
								<ArrowLeft />
							</Link>
						</Button>

						<div className="flex gap-2">
							<Button
								size="icon"
								className="text-black bg-white rounded-full"
								onClick={() => setIsSearchOpen((v) => !v)}
							>
								{isSearchOpen ? <X /> : <Search />}
							</Button>

							<Button size="icon" className="text-black bg-white rounded-full">
								<Heart />
							</Button>

							<Button size="icon" className="text-black bg-white rounded-full">
								<Share2 />
							</Button>
						</div>
					</div>
				</div>

				{/* info */}
				<div className="px-4 py-2">
					<h1 className="text-2xl font-bold">{viewedRestaurant.name}</h1>

					<div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
						<div className="flex items-center gap-1">
							<Star className="h-4 w-4 fill-blue-600 text-blue-600" />
							{viewedRestaurant.rating}
						</div>
						<div className="flex items-center gap-1">
							<Clock className="h-4 w-4" />
							20–30 min
						</div>
					</div>

					{isSearchOpen && (
						<Input
							autoFocus
							placeholder="Search menu…"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="mt-4"
						/>
					)}
				</div>

				{/* categories */}
				<div className="border-b">
					<div className="flex gap-2 px-4 py-1 overflow-x-auto">
						{categories.map((c) => (
							<Button
								key={c}
								size="sm"
								variant={c === selectedCategory ? "default" : "outline"}
								onClick={() => setSelectedCategory(c)}
								className="rounded-full"
							>
								{c}
							</Button>
						))}
					</div>
				</div>
			</div>

			{/* ================= SCROLLABLE MENU ================= */}
			<div className="flex-1 overflow-y-auto px-4 py-4 pb-20 space-y-4">
				{filteredMenuItems.map((item) => (
					<Card key={item.id} className="border-0 shadow-sm">
						<CardContent className="p-4 flex gap-4">
							<div className="flex-1">
								<CardTitle className="text-base">{item.name}</CardTitle>
								<CardDescription className="line-clamp-2">
									{item.description}
								</CardDescription>
								<p className="font-bold mt-2">
									₦{Number(item.price).toFixed(2)}
								</p>
							</div>

							<div className="relative w-24 h-24">
								<Image
									src={item.image_url || "https://placehold.co/200"}
									alt={item.name}
									fill
									className="object-cover rounded-lg"
								/>
								<button
									className="absolute -bottom-2 -right-2 rounded-full bg-primary text-white h-6 w-6"
									onClick={() => setSelectedItem(item)}
								>
									+
								</button>
							</div>
						</CardContent>
					</Card>
				))}

				{filteredMenuItems.length === 0 && (
					<p className="text-center text-muted-foreground py-16">
						No items match your search.
					</p>
				)}
			</div>
		</div>
	);
}
