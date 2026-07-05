
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Star, ChevronRight, Loader2 } from "lucide-react";
import { getDashboard } from "@/lib/api";
import type { DashboardData, DashboardPagination, DashboardRestaurant, DashboardComboItem } from "@/lib/types";
import { getStoredUser } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useSelectedCoords } from "@/hooks/use-dashboard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	DashboardRestaurantCard,
	restaurantNavState,
} from "@/components/dashboard/restaurant-card";

interface Props {
	data: DashboardData;
}

function SectionHeader({ title, seeAllHref }: { title: string; seeAllHref: string }) {
	return (
		<div className="flex items-center justify-between mb-3">
			<h2 className="text-lg font-bold">{title}</h2>
			<Link
				to={seeAllHref}
				className="text-sm text-primary font-medium flex items-center gap-0.5"
			>
				See all <ChevronRight className="w-4 h-4" />
			</Link>
		</div>
	);
}

function RestaurantBadge({ badge }: { badge: string }) {
	return (
		<span className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide">
			{badge}
		</span>
	);
}

function HorizontalRestaurantCard({ restaurant }: { restaurant: DashboardRestaurant }) {
	return (
		<Link
			to={`/customer/restaurants/${restaurant.id}`}
			state={restaurantNavState(restaurant)}
			className="flex-shrink-0 w-[280px] snap-start"
		>
			<Card className="overflow-hidden border-0 shadow-md rounded-2xl">
				<div className="relative h-44">
					<img
						src={restaurant.image ?? "https://placehold.co/400x250.png"}
						alt={restaurant.name}
						className="absolute inset-0 h-full w-full object-cover"
					/>
					{restaurant.badge && <RestaurantBadge badge={restaurant.badge} />}
				</div>
				<div className="p-3">
					<h3 className="font-bold text-base mb-2 line-clamp-1">{restaurant.name}</h3>
					<div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
						<div className="flex items-center gap-1">
							<Star className="w-4 h-4 fill-amber-400 text-amber-400" />
							<span className="font-semibold text-gray-900">
								{restaurant.rating || "4.5"}
							</span>
						</div>
						<span>•</span>
						<span>{restaurant.preparationTime}</span>
					</div>
				</div>
			</Card>
		</Link>
	);
}

function ComboCard({ item }: { item: DashboardComboItem }) {
	return (
		<Link
			to={`/customer/restaurants/${item.restaurantId}`}
			className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-white"
		>
			<div className="relative aspect-square lg:h-36 lg:aspect-auto">
				<img
					src={item.image ?? "https://placehold.co/200x200.png"}
					alt={item.name}
					className="absolute inset-0 w-full h-full object-cover"
				/>
			</div>
			<div className="p-2.5">
				<p className="text-primary font-bold text-sm">
					₦{parseFloat(item.price).toLocaleString()}
				</p>
				<p className="text-sm font-semibold mt-0.5 line-clamp-1">{item.name}</p>
				<p className="text-xs text-orange-500 font-medium mt-0.5">{item.badge}</p>
			</div>
		</Link>
	);
}

function getGreeting(): string {
	const hour = new Date().getHours();
	if (hour < 12) return "Good morning";
	if (hour < 17) return "Good afternoon";
	return "Good evening";
}

export default function CustomerDashboardClient({ data }: Props) {
	const { popularNearYou, featuredSelections } = data;

	const { toast } = useToast();
	const coords = useSelectedCoords();
	const [firstName, setFirstName] = useState<string | null>(null);
	const [restaurants, setRestaurants] = useState<DashboardRestaurant[]>(data.allRestaurants);
	const [pagination, setPagination] = useState<DashboardPagination>(data.pagination);
	const [isLoadingMore, setIsLoadingMore] = useState(false);

	useEffect(() => {
		const user = getStoredUser();
		setFirstName(user?.full_name?.split(" ")[0] ?? null);
	}, []);

	const handleLoadMore = async () => {
		setIsLoadingMore(true);
		try {
			const next = await getDashboard({
				...coords,
				page: pagination.currentPage + 1,
			});
			setRestaurants((prev) => [...prev, ...next.allRestaurants]);
			setPagination(next.pagination);
		} catch {
			toast({
				title: "Couldn't load more restaurants",
				description: "Please check your connection and try again.",
				variant: "destructive",
			});
		} finally {
			setIsLoadingMore(false);
		}
	};

	return (
		<div className="space-y-8 md:px-4">
			<div className="pt-1 px-4">
				<h1 className="text-2xl font-bold">
					{getGreeting()}{firstName ? `, ${firstName}` : ""}
				</h1>
				<p className="text-muted-foreground mt-1">What would you like to eat today?</p>
			</div>

			{popularNearYou.length > 0 && (
				<section className="pl-4">
					<SectionHeader title="Popular Near You" seeAllHref="/customer/section/popular" />
					<div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 px-5 md:mx-0 md:px-0">
						{popularNearYou.map((r) => (
							<HorizontalRestaurantCard key={r.id} restaurant={r} />
						))}
					</div>
				</section>
			)}

			{featuredSelections.length > 0 && (
				<section className="pl-4">
					<SectionHeader
						title="Featured Selections"
						seeAllHref="/customer/section/featured"
					/>
					<div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 px-5 md:mx-0 md:px-0">
						{featuredSelections.map((r) => (
							<HorizontalRestaurantCard key={r.id} restaurant={r} />
						))}
					</div>
				</section>
			)}

			{data.comboDeals.length > 0 && (
				<section className="px-4">
					<div className="flex items-center justify-between mb-3">
						<h2 className="text-lg font-bold">Combo Deals</h2>
						<span className="text-xs bg-green-100 text-green-700 font-semibold px-2.5 py-1 rounded-full">
							LIMITED TIME
						</span>
					</div>
					<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
						{data.comboDeals.map((item) => (
							<ComboCard key={item.id} item={item} />
						))}
					</div>
				</section>
			)}

			{restaurants.length > 0 && (
				<section className="px-4">
					<h2 className="text-lg font-bold mb-3">All Restaurants</h2>
					<div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
						{restaurants.map((r) => (
							<DashboardRestaurantCard key={r.id} restaurant={r} className="h-52 lg:h-40" />
						))}
					</div>
					{pagination.hasMore && (
						<Button
							variant="outline"
							className="w-full mt-4"
							onClick={handleLoadMore}
							disabled={isLoadingMore}
						>
							{isLoadingMore ? (
								<>
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
									Loading...
								</>
							) : (
								"View More"
							)}
						</Button>
					)}
				</section>
			)}

			{popularNearYou.length === 0 &&
				featuredSelections.length === 0 &&
				restaurants.length === 0 && (
					<div className="flex flex-col items-center justify-center py-20 text-center">
						<p className="text-muted-foreground">No restaurants available right now.</p>
					</div>
				)}
		</div>
	);
}
