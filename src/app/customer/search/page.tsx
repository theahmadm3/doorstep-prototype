
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { searchItemsAndRestaurants, getRestaurantMenu } from "@/lib/api";
import {
	SearchResult,
	SearchResultMenuItem,
	SearchResultRestaurant,
	MenuItem,
	OptionChoice,
} from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Search as SearchIcon, Star, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";
import AddToCartModal from "@/components/checkout/add-to-cart-modal";
import { useCartStore } from "@/stores/useCartStore";
import { useToast } from "@/hooks/use-toast";

// Custom debounce hook
function useDebounce<T>(value: T, delay?: number): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value);

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedValue(value), delay || 500);

		return () => {
			clearTimeout(timer);
		};
	}, [value, delay]);

	return debouncedValue;
}

// Component for displaying a menu item search result
const MenuItemCard = ({
	item,
	onClick,
	isFetchingDetails,
}: {
	item: SearchResultMenuItem;
	onClick: (item: SearchResultMenuItem) => void;
	isFetchingDetails: boolean;
}) => {
	return (
		<Card
			className={cn(
				"hover:shadow-md transition-shadow cursor-pointer",
				!item.is_available && "opacity-60 bg-muted/50 cursor-not-allowed",
				isFetchingDetails && "cursor-wait opacity-70",
			)}
			onClick={() => onClick(item)}
		>
			<CardContent className="flex gap-4 p-4">
				<Image
					src={item.image_url || "https://placehold.co/100x100.png"}
					alt={item.name}
					width={80}
					height={80}
					className="rounded-md object-cover"
				/>
				<div className="flex-1">
					<p className="font-bold">{item.name}</p>
					<p className="text-sm text-muted-foreground line-clamp-2">
						{item.description}
					</p>
					<p className="text-sm font-semibold mt-1">
						₦{parseFloat(item.price).toFixed(2)}
					</p>
					<p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
						<Utensils className="h-3 w-3" /> {item.restaurant_name}
					</p>
				</div>
			</CardContent>
		</Card>
	);
};

// Component for displaying a restaurant search result
const RestaurantCard = ({
	restaurant,
}: {
	restaurant: SearchResultRestaurant;
}) => {
	return (
		<Link href={`/customer/restaurants/${restaurant.id}`}>
			<Card
				className={cn(
					"hover:shadow-md transition-shadow",
					!restaurant.is_active && "opacity-60 bg-muted/50 cursor-not-allowed",
				)}
			>
				<CardContent className="flex gap-4 p-4">
					<Image
						src={restaurant.image_url || "https://placehold.co/100x100.png"}
						alt={restaurant.name}
						width={80}
						height={80}
						className="rounded-md object-cover"
					/>
					<div className="flex-1">
						<p className="font-bold">{restaurant.name}</p>
						<p className="text-sm text-muted-foreground line-clamp-2">
							{restaurant.description}
						</p>
						<div className="flex items-center gap-1 text-sm mt-1">
							<Star className="w-4 h-4 text-yellow-400" />
							<span className="font-semibold">{restaurant.rating}</span>
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							{restaurant.address?.street_name}
						</p>
					</div>
				</CardContent>
			</Card>
		</Link>
	);
};

// Loading skeletons
const SearchSkeleton = () => (
	<div className="space-y-8">
		<div>
			<Skeleton className="h-8 w-48 mb-4" />
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{[...Array(2)].map((_, i) => (
					<Card key={i}>
						<CardContent className="flex gap-4 p-4">
							<Skeleton className="h-20 w-20 rounded-md" />
							<div className="flex-1 space-y-2">
								<Skeleton className="h-5 w-3/4" />
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-1/2" />
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
		<div>
			<Skeleton className="h-8 w-48 mb-4" />
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{[...Array(2)].map((_, i) => (
					<Card key={i}>
						<CardContent className="flex gap-4 p-4">
							<Skeleton className="h-20 w-20 rounded-md" />
							<div className="flex-1 space-y-2">
								<Skeleton className="h-5 w-3/4" />
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-1/2" />
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	</div>
);

export default function SearchPage() {
	const [searchTerm, setSearchTerm] = useState("");
	const debouncedSearchTerm = useDebounce(searchTerm, 300);
	const { toast } = useToast();
	const { addOrUpdateItem } = useCartStore();

	const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
	const [isAddToCartModalOpen, setAddToCartModalOpen] = useState(false);
	const [isFetchingItemDetails, setIsFetchingItemDetails] = useState(false);

	const { data: searchResults, isLoading } = useQuery({
		queryKey: ["search", debouncedSearchTerm],
		queryFn: () => searchItemsAndRestaurants(debouncedSearchTerm),
		enabled: !!debouncedSearchTerm,
	});

	const { menuItems, restaurants } = useMemo(() => {
		const items: SearchResultMenuItem[] = [];
		const rests: SearchResultRestaurant[] = [];
		searchResults?.result?.forEach((result) => {
			if (result.result_type === "menu_item") {
				items.push(result.data as SearchResultMenuItem);
			} else if (result.result_type === "restaurant") {
				rests.push(result.data as SearchResultRestaurant);
			}
		});
		return { menuItems: items, restaurants: rests };
	}, [searchResults]);

	const handleOpenAddToCartModal = useCallback(
		async (item: SearchResultMenuItem) => {
			if (!item.is_available || isFetchingItemDetails) return;
			setIsFetchingItemDetails(true);
			toast({ title: "Getting item details..." });

			try {
				const menu = await getRestaurantMenu(item.restaurant_id);
				const fullMenuItem = menu.find((mi) => mi.id === item.id);

				if (fullMenuItem) {
					setSelectedItem(fullMenuItem);
					setAddToCartModalOpen(true);
				} else {
					toast({
						title: "Error",
						description: "Could not retrieve item details.",
						variant: "destructive",
					});
				}
			} catch (error) {
				toast({
					title: "Error",
					description: "Failed to fetch menu.",
					variant: "destructive",
				});
			} finally {
				setIsFetchingItemDetails(false);
			}
		},
		[isFetchingItemDetails, toast],
	);

	const handleAddItem = (
		menuItem: MenuItem,
		quantity: number,
		selectedOptions: OptionChoice[],
	) => {
		addOrUpdateItem(menuItem, quantity, selectedOptions);
		toast({
			title: "Item Added",
			description: `${quantity} x ${menuItem.name} has been added to your order.`,
		});
		setAddToCartModalOpen(false);
		setSelectedItem(null);
	};

	const hasResults = menuItems.length > 0 || restaurants.length > 0;
	const showNoResults = !isLoading && debouncedSearchTerm && !hasResults;
	const showInitialState = !debouncedSearchTerm && !isLoading;

	return (
		<div className="space-y-6">
			{selectedItem && (
				<AddToCartModal
					isOpen={isAddToCartModalOpen}
					onClose={() => setAddToCartModalOpen(false)}
					item={selectedItem}
					onAddToCart={handleAddItem}
				/>
			)}
			<h1 className="text-3xl font-bold font-headline">Search</h1>
			<div className="sticky top-[73px] bg-background py-4 z-10 -mt-6 -mx-4 px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8 border-b">
				<div className="relative">
					<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
					<Input
						type="search"
						placeholder="Search for restaurants or food..."
						className="pl-10 text-base h-12"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
				</div>
			</div>

			<div className="mt-8">
				{isLoading && <SearchSkeleton />}

				{showInitialState && (
					<div className="text-center py-20">
						<p className="text-muted-foreground">
							Search for your favorite food or restaurants.
						</p>
					</div>
				)}

				{showNoResults && (
					<div className="text-center py-20">
						<p className="font-semibold">
							No results found for "{debouncedSearchTerm}"
						</p>
						<p className="text-muted-foreground text-sm mt-2">
							Try a different search term.
						</p>
					</div>
				)}

				{hasResults && (
					<div className="space-y-8">
						{menuItems.length > 0 && (
							<div>
								<h2 className="text-2xl font-bold font-headline mb-4">
									Menu Items
								</h2>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{menuItems.map((item) => (
										<MenuItemCard
											key={item.id}
											item={item}
											onClick={handleOpenAddToCartModal}
											isFetchingDetails={isFetchingItemDetails}
										/>
									))}
								</div>
							</div>
						)}
						{restaurants.length > 0 && (
							<div>
								<h2 className="text-2xl font-bold font-headline mb-4">
									Restaurants
								</h2>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{restaurants.map((rest) => (
										<RestaurantCard key={rest.id} restaurant={rest} />
									))}
								</div>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
