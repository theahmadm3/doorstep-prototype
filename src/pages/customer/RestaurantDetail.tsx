import { useState, useEffect, useMemo, useRef } from "react";
import { getRestaurantMenu } from "@/lib/api";
import type {
	MenuItem,
	User,
	Order,
	OptionChoice,
	ActiveDiscount,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
	Plus,
	ArrowLeft,
	Star,
	Clock,
	Search,
	X,
	MapPin,
	Heart,
	Share2,
} from "lucide-react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import CheckoutModal from "@/components/checkout/checkout-modal";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/useCartStore";
import { Input } from "@/components/ui/input";
import AddToCartModal from "@/components/checkout/add-to-cart-modal";

function useDebounce(value: string, delay: number) {
	const [debouncedValue, setDebouncedValue] = useState(value);
	useEffect(() => {
		const handler = setTimeout(() => setDebouncedValue(value), delay);
		return () => clearTimeout(handler);
	}, [value, delay]);
	return debouncedValue;
}

interface RestaurantNavState {
	id: string;
	name: string;
	image_url: string | null;
	rating: string;
	latitude: string | null;
	longitude: string | null;
	address: string;
}

function getDiscountedPrice(
	price: string,
	discounts: ActiveDiscount[],
): number | null {
	if (!discounts.length) return null;
	const base = parseFloat(price);
	const d = discounts[0];
	if (d.type === "fixed_amount") return Math.max(0, base - parseFloat(d.value));
	return base * (1 - parseFloat(d.value) / 100);
}

const MenuPageSkeleton = () => (
	<div className="pb-24">
		<div className="h-[260px] bg-muted animate-pulse" />
		<div className="-mt-5 rounded-t-3xl bg-background pt-6 px-4">
			<div className="space-y-2 mb-4">
				<Skeleton className="h-7 w-48" />
				<Skeleton className="h-4 w-64" />
				<Skeleton className="h-4 w-40" />
			</div>
			<div className="flex gap-2 mb-4">
				{[...Array(4)].map((_, i) => (
					<Skeleton key={i} className="h-9 w-20 rounded-full" />
				))}
			</div>
			<div className="space-y-4">
				{[...Array(5)].map((_, i) => (
					<div key={i} className="flex gap-3 py-4 border-b">
						<div className="flex-1 space-y-2">
							<Skeleton className="h-5 w-3/4" />
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-5 w-1/4" />
						</div>
						<Skeleton className="h-24 w-24 rounded-xl flex-shrink-0" />
					</div>
				))}
			</div>
		</div>
	</div>
);

function MenuItemRow({
	item,
	onAdd,
}: {
	item: MenuItem;
	onAdd: (item: MenuItem) => void;
}) {
	const discountedPrice = getDiscountedPrice(
		item.price,
		item.active_discounts ?? [],
	);
	const basePrice = parseFloat(item.price);
	const imageUrl = item.image_url?.startsWith("http")
		? item.image_url
		: "https://placehold.co/100x100.png";

	return (
		<div
			className={cn(
				"flex gap-3 py-4 border-b last:border-b-0",
				!item.is_available && "opacity-60",
			)}
		>
			<div className="flex-1 min-w-0">
				<h3 className="font-semibold text-base leading-tight">{item.name}</h3>
				{item.description && (
					<p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
						{item.description}
					</p>
				)}
				<div className="flex items-center gap-2 mt-2">
					{discountedPrice !== null ? (
						<>
							<span className="font-bold text-primary">
								₦
								{discountedPrice.toLocaleString("en-NG", {
									minimumFractionDigits: 2,
								})}
							</span>
							<span className="text-xs text-muted-foreground line-through">
								₦
								{basePrice.toLocaleString("en-NG", {
									minimumFractionDigits: 2,
								})}
							</span>
						</>
					) : (
						<span className="font-bold text-primary">
							₦{basePrice.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
						</span>
					)}
				</div>
			</div>
			<div className="relative flex-shrink-0 w-24 h-24">
				<img
					src={imageUrl}
					alt={item.name}
					className="w-full h-full rounded-xl object-cover"
				/>
				<button
					disabled={!item.is_available}
					onClick={() => onAdd(item)}
					aria-label={`Add ${item.name} to cart`}
					className="absolute bottom-1 right-1 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-md disabled:opacity-50 hover:bg-primary/90 transition-colors"
				>
					<Plus className="h-4 w-4" />
				</button>
			</div>
		</div>
	);
}

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
		<div className="fixed bottom-20 md:bottom-6 left-0 right-0 px-5 z-20 pointer-events-none max-w-md mx-auto">
			<button
				onClick={onCheckout}
				className="
                    pointer-events-auto w-full h-14 rounded-full
                    relative overflow-hidden
                    bg-primary text-primary-foreground font-semibold text-base
                    shadow-lg border border-primary/20
                    transition-all duration-200 ease-out
                    hover:opacity-90 hover:scale-[1.025] hover:shadow-xl
                    active:scale-[0.98]
                    flex items-center justify-between px-5
                "
			>
				{/* Crystal highlight streak */}
				<span className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 via-transparent to-transparent pointer-events-none" />
				<span className="relative bg-white/20 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0">
					{itemCount}
				</span>
				<span className="relative font-semibold tracking-wide">View Cart</span>
				<span className="relative font-bold">₦{order.total.toFixed(2)}</span>
			</button>
		</div>
	);
};

export default function RestaurantMenuPage() {
	const { addOrUpdateItem } = useCartStore();
	const orders = useCartStore((state) => state.orders);
	const { toast } = useToast();
	const params = useParams();
	const navigate = useNavigate();
	const location = useLocation();
	const restaurantId = params.restaurantId as string;
	const restaurantHeader = location.state as RestaurantNavState | null;

	const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [user, setUser] = useState<User | null>(null);
	const [isCheckoutOpen, setCheckoutOpen] = useState(false);
	const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
	const [isAddToCartModalOpen, setAddToCartModalOpen] = useState(false);
	const [isSearchOpen, setIsSearchOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [activeCategory, setActiveCategory] = useState("All");
	const debouncedSearchQuery = useDebounce(searchQuery, 200);
	const searchInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const storedUser = localStorage.getItem("user");
		if (storedUser) {
			setUser(JSON.parse(storedUser));
		} else {
			navigate(`/login?redirect=/customer/restaurants/${restaurantId}`);
		}
	}, [navigate, restaurantId]);

	useEffect(() => {
		if (restaurantId) {
			setIsLoading(true);
			getRestaurantMenu(restaurantId)
				.then(setMenuItems)
				.catch((e) => console.error("Failed to fetch menu:", e))
				.finally(() => setIsLoading(false));
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

	const handleAddItem = (
		menuItem: MenuItem,
		quantity: number,
		selectedOptions: OptionChoice[],
	) => {
		if (!user) {
			toast({
				title: "Authentication Error",
				description: "You must be logged in to add items.",
				variant: "destructive",
			});
			return;
		}
		addOrUpdateItem(menuItem, quantity, selectedOptions);
		toast({
			title: "Item Added",
			description: `${quantity} x ${menuItem.name} added to your order.`,
		});
		setAddToCartModalOpen(false);
		setSelectedItem(null);
	};

	const filteredMenuItems = useMemo(() => {
		if (!debouncedSearchQuery) return menuItems;
		return menuItems.filter((item) =>
			item.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()),
		);
	}, [menuItems, debouncedSearchQuery]);

	const categories = useMemo(() => {
		const names = filteredMenuItems
			.map((item) => item.category?.name)
			.filter((n): n is string => !!n);
		return ["All", ...Array.from(new Set(names))];
	}, [filteredMenuItems]);

	// Reset active category if it no longer exists in filtered results
	useEffect(() => {
		if (activeCategory !== "All" && !categories.includes(activeCategory)) {
			setActiveCategory("All");
		}
	}, [categories, activeCategory]);

	useEffect(() => {
		if (isSearchOpen) searchInputRef.current?.focus();
	}, [isSearchOpen]);

	const categoryGroups = useMemo(() => {
		const catNames = categories.filter((c) => c !== "All");
		return catNames.map((cat) => ({
			category: cat,
			items: filteredMenuItems.filter((item) => item.category?.name === cat),
		}));
	}, [categories, filteredMenuItems]);

	const displayedGroups = useMemo(() => {
		if (activeCategory === "All") return categoryGroups;
		return categoryGroups.filter((g) => g.category === activeCategory);
	}, [categoryGroups, activeCategory]);

	// Items with no category
	const uncategorizedItems = useMemo(() => {
		if (activeCategory !== "All") return [];
		return filteredMenuItems.filter((item) => !item.category);
	}, [filteredMenuItems, activeCategory]);

	if (isLoading) return <MenuPageSkeleton />;

	return (
		<div className="pb-24 -mx-5 md:-mx-6 lg:-mx-8">
			<CheckoutModal
				isOpen={isCheckoutOpen}
				onClose={() => setCheckoutOpen(false)}
				order={currentOrder}
				restaurantInfo={restaurantHeader}
			/>
			{selectedItem && (
				<AddToCartModal
					isOpen={isAddToCartModalOpen}
					onClose={() => {
						setAddToCartModalOpen(false);
						setSelectedItem(null);
					}}
					item={selectedItem}
					onAddToCart={handleAddItem}
				/>
			)}

			{/* Hero image — full bleed */}
			<div className="relative h-[260px] bg-muted">
				<img
					src={
						restaurantHeader?.image_url || "https://placehold.co/800x260.png"
					}
					alt={restaurantHeader?.name ?? "Restaurant"}
					className="w-full h-full object-cover"
				/>
				<div className="absolute inset-0 bg-black/10" />
				<button
					onClick={() => navigate("/customer/dashboard")}
					className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md"
				>
					<ArrowLeft className="h-5 w-5" />
				</button>
				<div className="absolute top-4 right-4 flex gap-2">
					<button className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md">
						<Heart className="h-5 w-5" />
					</button>
					<button className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md">
						<Share2 className="h-5 w-5" />
					</button>
				</div>
			</div>

			{/* Content card — restore gutters to match layout padding */}
			<div className="-mt-3 rounded-t-3xl bg-background pt-5 px-5 md:px-6 lg:px-8">
				{/* Restaurant info + search icon */}
				<div className="mb-4">
					<div className="flex justify-between items-start mb-2">
						<h1 className="text-2xl font-bold flex-1 pr-2 leading-tight">
							{restaurantHeader?.name ?? "Menu"}
						</h1>
						<div className="flex items-center gap-1.5 flex-shrink-0">
							{restaurantHeader && (
								<div className="flex items-center gap-1 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
									<Star className="h-3.5 w-3.5 fill-current" />
									{restaurantHeader.rating}
								</div>
							)}
							{!isSearchOpen && (
								<Button
									variant="ghost"
									size="icon"
									className="h-9 w-9 text-muted-foreground"
									onClick={() => setIsSearchOpen((v) => !v)}
									aria-label="Search menu"
								>
									<Search className="h-4 w-4" />
								</Button>
							)}
						</div>
					</div>
					{restaurantHeader?.address && (
						<div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
							<MapPin className="h-3.5 w-3.5 flex-shrink-0" />
							<span className="line-clamp-1">{restaurantHeader.address}</span>
						</div>
					)}
					<div className="flex items-center gap-1.5 text-sm text-muted-foreground">
						<Clock className="h-3.5 w-3.5 flex-shrink-0" />
						<span>20–30 min</span>
					</div>

					{/* Inline search input */}
					{isSearchOpen && (
						<div className="inline-flex items-center justify-between mt-3 border rounded-md px-1 h-11 w-full max-w-[600px]">
							<input
								ref={searchInputRef}
								type="text"
								placeholder="Search menu..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="border-0 shadow-none h-full p-2 outline-none w-full text-sm bg-transparent placeholder:text-muted-foreground"
								
							/>
							<div className="inline-flex items-center justify-center gap-2">
								<button className="h-7 w-7 shrink-0" disabled>
									<Search className="" />
								</button>
								<button
									className="h-7 w-7 shrink-0"
									onClick={() => {
										setSearchQuery("");
										setIsSearchOpen(false);
									}}
								>
									<X className="" />
								</button>
							</div>
						</div>
					)}
				</div>

				{/* Category pills — sticky, full-width background */}
				{categories.length > 1 && (
					<div className="sticky top-0 bg-background py-3 z-10 -mx-5 md:-mx-6 lg:-mx-8 px-5 md:px-6 lg:px-8 border-b mb-2">
						<div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
							{categories.map((category) => (
								<button
									key={category}
									onClick={() => setActiveCategory(category)}
									className={cn(
										"px-4 py-2 rounded-full text-sm whitespace-nowrap font-medium transition-colors flex-shrink-0",
										activeCategory === category
											? "bg-primary text-primary-foreground"
											: "border border-border text-muted-foreground hover:bg-muted",
									)}
								>
									{category}
								</button>
							))}
						</div>
					</div>
				)}

				{/* Menu sections */}
				{displayedGroups.length === 0 && uncategorizedItems.length === 0 ? (
					<div className="text-center py-16">
						<p className="text-muted-foreground">
							{debouncedSearchQuery
								? `No items match "${debouncedSearchQuery}"`
								: "No menu items available."}
						</p>
					</div>
				) : (
					<>
						{displayedGroups.map(({ category, items }) => (
							<div key={category} id={`cat-${category}`}>
								<h2 className="font-bold text-lg mt-5 mb-1">{category}</h2>
								{items.map((item) => (
									<MenuItemRow
										key={item.id}
										item={item}
										onAdd={handleOpenAddToCartModal}
									/>
								))}
							</div>
						))}
						{uncategorizedItems.length > 0 && (
							<div>
								<h2 className="font-bold text-lg mt-5 mb-1">Other</h2>
								{uncategorizedItems.map((item) => (
									<MenuItemRow
										key={item.id}
										item={item}
										onAdd={handleOpenAddToCartModal}
									/>
								))}
							</div>
						)}
					</>
				)}
			</div>

			<FloatingCartButton
				order={currentOrder}
				onCheckout={() => currentOrder && setCheckoutOpen(true)}
			/>
		</div>
	);
}
