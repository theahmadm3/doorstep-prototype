
import { useParams, useLocation, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getDashboard } from "@/lib/api";
import type { DashboardRestaurant } from "@/lib/types";
import { Star, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const SECTION_TITLES: Record<string, string> = {
	popular: "Popular Near You",
	featured: "Featured Selections",
};

function RestaurantCard({ restaurant }: { restaurant: DashboardRestaurant }) {
	return (
		<Link
			to={`/customer/restaurants/${restaurant.id}`}
			state={{ id: restaurant.id, name: restaurant.name, image_url: restaurant.image, rating: restaurant.rating, latitude: restaurant.latitude, longitude: restaurant.longitude, address: restaurant.address }}
			className="block rounded-2xl overflow-hidden border border-gray-100 shadow-sm"
		>
			<div className="relative h-52">
				<img
					src={restaurant.image ?? "https://placehold.co/400x208.png"}
					alt={restaurant.name}
					className="absolute inset-0 w-full h-full object-cover"
				/>
				{restaurant.badge && (
					<span className="absolute bottom-3 left-3 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
						{restaurant.badge}
					</span>
				)}
			</div>
			<div className="p-3">
				<div className="flex items-center justify-between">
					<span className="font-bold text-base">{restaurant.name}</span>
					<div className="flex items-center gap-1">
						<Star className="w-4 h-4 fill-amber-400 text-amber-400" />
						<span className="text-sm font-semibold">{restaurant.rating}</span>
					</div>
				</div>
				<p className="text-sm text-muted-foreground mt-1 truncate">
					{[restaurant.preparationTime, restaurant.address]
						.filter(Boolean)
						.join(" • ")}
				</p>
			</div>
		</Link>
	);
}

function ListSkeleton() {
	return (
		<div className="space-y-4">
			{[...Array(5)].map((_, i) => (
				<div key={i} className="space-y-2">
					<Skeleton className="h-52 w-full rounded-2xl" />
					<Skeleton className="h-5 w-48" />
					<Skeleton className="h-4 w-32" />
				</div>
			))}
		</div>
	);
}

interface LocationState {
	restaurants?: DashboardRestaurant[];
}

export default function RestaurantListPage() {
	const { type } = useParams<{ type: string }>();
	const location = useLocation();
	const stateRestaurants = (location.state as LocationState | null)?.restaurants;

	const { data, isLoading } = useQuery({
		queryKey: ["dashboard", "section", type],
		queryFn: () => getDashboard(),
		enabled: !stateRestaurants,
	});

	const restaurants =
		stateRestaurants ??
		(type === "popular" ? data?.popularNearYou : data?.featuredSelections) ??
		[];

	const title = SECTION_TITLES[type ?? ""] ?? "Restaurants";

	return (
		<div className="space-y-5">
			<div className="flex items-center gap-3">
				<Link
					to="/customer/dashboard"
					className="p-1.5 rounded-full hover:bg-muted transition-colors"
				>
					<ArrowLeft className="w-5 h-5" />
				</Link>
				<h1 className="text-xl font-bold">{title}</h1>
			</div>

			{isLoading && !stateRestaurants ? (
				<ListSkeleton />
			) : restaurants.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-20 text-center">
					<p className="text-muted-foreground">No restaurants to show.</p>
				</div>
			) : (
				<div className="space-y-4">
					{restaurants.map((r) => (
						<RestaurantCard key={r.id} restaurant={r} />
					))}
				</div>
			)}
		</div>
	);
}
