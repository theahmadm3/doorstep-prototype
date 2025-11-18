"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { getRestaurantMenu } from "@/lib/api";
import type { Restaurant, MenuItem, User, Order } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import {
	PlusCircle,
	ArrowLeft,
	Star,
	Clock,
	ShoppingCart,
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
import { Input } from "@/components/ui/input";
import AddToCartModal from "@/components/checkout/add-to-cart-modal";

// Custom hook for debouncing
function useDebounce(value, delay) {
	const [debouncedValue, setDebouncedValue] = useState(value);
	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);
		return () => {
			clearTimeout(handler);
		};
	}, [value, delay]);
	return debouncedValue;
}

const MenuPageSkeleton = () => (
	<div className="py-8">
		<Skeleton className="h-8 w-40 mb-8" />
		<div className="space-y-4 mb-12">
			<Skeleton className="h-10 w-3/4" />
			<Skeleton className="h-6 w-1/2" />
		</div>
		<Skeleton className="h-10 w-full mb-8" />
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
			{[...Array(8)].map((_, i) => (
				<div key={i} className="flex gap-4">
					<div className="flex-1 space-y-2">
						<Skeleton className="h-5 w-full" />
						<Skeleton className="h-4 w-3/4" />
						<Skeleton className="h-5 w-1/4 mt-2" />
					</div>
					<Skeleton className="h-24 w-24" />
				</div>
			))}
		</div>
	</div>
);

const FloatingCartButton = ({
	order,
	onCheckout,
}: {
	order: Order | undefined;
	onCheckout: () => void;
}) => {
	if (!order || order.items.length === 0) return null;

	const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

	return (
		<div className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-20">
			<Button
				onClick={onCheckout}
				size="lg"
				className="w-full h-14 rounded-full shadow-2xl flex justify-between items-center text-lg"
			>
				<div className="flex items-center gap-2">
					<ShoppingCart />
					<span>
						{itemCount} item{itemCount > 1 ? "s" : ""}
					</span>
				</div>
				<span>View Order</span>
				<span>₦{order.total.toFixed(2)}</span>
			</Button>
		</div>
	);
};

export default function RestaurantMenuPage() {
	const { addOrUpdateItem } = useCartStore();
	const orders = useCartStore(state => state.orders);
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

	const [isSearchOpen, setIsSearchOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const debouncedSearchQuery = useDebounce(searchQuery, 200);
	const searchInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const storedUser = localStorage.getItem("user");
		if (storedUser) {
			setUser(JSON.parse(storedUser));
		} else {
			// If no user, redirect to login, as this is a customer-only page
			router.push(`/login?redirect=/customer/restaurants/${restaurantId}`);
		}
	}, [router, restaurantId]);

	useEffect(() => {
		if (restaurantId) {
			const fetchData = async () => {
				setIsLoading(true);
				try {
					const menuData = await getRestaurantMenu(restaurantId);
					setMenuItems(menuData);
				} catch (error) {
					console.error("Failed to fetch restaurant data:", error);
				} finally {
					setIsLoading(false);
				}
			};
			fetchData();
		}
	}, [restaurantId]);

	const currentOrder = orders.find(
		(o) => o.restaurantId === restaurantId && o.status === "unsubmitted",
	);

	const handleOpenAddToCartModal = (item: MenuItem) => {
        if (!item.is_available) return;
        setSelectedItem(item);
        setAddToCartModalOpen(true);
    };

	const handleAddItem = (item: MenuItem, quantity: number) => {
		if (!user) {
			toast({
				title: "Authentication Error",
				description: "You must be logged in to add items to your cart.",
				variant: "destructive",
			});
			return;
		}
		addOrUpdateItem(item, quantity);
		toast({
			title: "Item Added",
			description: `${quantity} x ${item.name} has been added to your order.`,
		});
		setAddToCartModalOpen(false);
        setSelectedItem(null);
	};

	const handleCheckout = () => {
		if (currentOrder) {
			setCheckoutOpen(true);
		}
	};

	const filteredMenuItems = useMemo(() => {
		if (!debouncedSearchQuery) {
			return menuItems;
		}
		return menuItems.filter((item) =>
			item.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()),
		);
	}, [menuItems, debouncedSearchQuery]);

	const categories = useMemo(() => {
		return filteredMenuItems.reduce((acc, item) => {
			const category = item.category || "Other";
			if (!acc[category]) {
				acc[category] = [];
			}
			acc[category].push(item);
			return acc;
		}, {} as Record<string, MenuItem[]>);
	}, [filteredMenuItems]);

	const defaultTab = Object.keys(categories)[0] || "";

	useEffect(() => {
		if (isSearchOpen) {
			searchInputRef.current?.focus();
		}
	}, [isSearchOpen]);

	if (isLoading) {
		return <MenuPageSkeleton />;
	}

	if (!viewedRestaurant) {
		return (
			<div className="flex flex-col items-center justify-center h-full text-center">
				<p className="text-lg text-muted-foreground">
					Restaurant data not found.
				</p>
				<Button asChild variant="link">
					<Link href="/customer/dashboard">Go back to dashboard</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="pb-24">
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
                    onAddToCart={handleAddItem}
                />
            )}

			<div className="mb-4 w-full inline-flex items-center justify-between restaurant-header">
				<Button asChild variant="ghost" className="px-2">
					<Link href="/customer/dashboard">
						<ArrowLeft className="mr-2 h-4 w-4" />
						All Restaurants
					</Link>
				</Button>
				<div className="inline-flex items-center justify-between gap-2">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setIsSearchOpen(!isSearchOpen)}
					>
						<Search className="h-5 w-5" />
					</Button>
				</div>
			</div>

			{isSearchOpen && (
				<div className="relative w-full mb-4">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						ref={searchInputRef}
						type="text"
						placeholder="Search for a menu item..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9 pr-9"
					/>
					<Button
						variant="ghost"
						size="icon"
						className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
						onClick={() => {
							setSearchQuery("");
							setIsSearchOpen(false);
						}}
					>
						<X className="h-4 w-4" />
					</Button>
				</div>
			)}

			<div className="relative h-48 md:h-64 rounded-2xl overflow-hidden mb-8">
				<Image
					src={
						viewedRestaurant.image_url || "https://placehold.co/1200x400.png"
					}
					alt={viewedRestaurant.name}
					fill
					className="object-cover"
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
				<div className="absolute bottom-0 left-0 p-6">
					<h1 className="text-3xl md:text-4xl font-bold text-white font-headline">
						{viewedRestaurant?.name}
					</h1>
					<div className="flex items-center gap-4 text-white/90 mt-2">
						<div className="flex items-center gap-1">
							<Star className="h-4 w-4 text-yellow-400" />
							<span className="text-sm font-medium">
								{viewedRestaurant.rating}
							</span>
						</div>
						<div className="flex items-center gap-1">
							<Clock className="h-4 w-4" />
							<span className="text-sm font-medium">20-30 min</span>
						</div>
					</div>
				</div>
			</div>

			{Object.keys(categories).length > 0 ? (
				<Tabs defaultValue={defaultTab} className="w-full">
					<TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
						{Object.keys(categories).map((category) => (
							<TabsTrigger key={category} value={category}>
								{category}
							</TabsTrigger>
						))}
					</TabsList>
					{Object.entries(categories).map(([category, items]) => (
						<TabsContent key={category} value={category}>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
								{items.map((item) => {
									const imageUrl =
										item.image_url && item.image_url.startsWith("http")
											? item.image_url
											: "https://placehold.co/200x200.png";
									return (
										<Card
											key={item.id}
											className={cn(
												"overflow-hidden transition-all hover:shadow-md w-full flex flex-col cursor-pointer",
												{ "opacity-60 cursor-not-allowed": !item.is_available },
											)}
											onClick={() => handleOpenAddToCartModal(item)}
										>
											<CardContent className="p-4 flex gap-4 items-start flex-grow">
												<div className="flex-1">
													<CardTitle className="text-lg font-semibold mb-1">
														{item.name}
													</CardTitle>
													<CardDescription className="text-sm line-clamp-2">
														{item.description}
													</CardDescription>
													<p className="font-bold text-md mt-2">
														₦{parseFloat(item.price).toFixed(2)}
													</p>
												</div>
												<div className="relative w-24 h-24 flex-shrink-0">
													<Image
														src={imageUrl}
														alt={item.name}
														fill
														className="rounded-md object-cover"
													/>
												</div>
											</CardContent>
											<CardFooter className="p-4 pt-0 mt-auto">
												<Button
													size="sm"
													className="w-full"
													disabled={!item.is_available}
													aria-label={`Add ${item.name} to cart`}
												>
													<PlusCircle className="mr-2 h-4 w-4" />
													Add to cart
												</Button>
											</CardFooter>
										</Card>
									);
								})}
							</div>
						</TabsContent>
					))}
				</Tabs>
			) : (
				<div className="text-center py-16">
					<p className="text-muted-foreground">
						No menu items match your search for "{searchQuery}".
					</p>
				</div>
			)}

			<FloatingCartButton order={currentOrder} onCheckout={handleCheckout} />
		</div>
	);
}
