import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import type { DashboardRestaurant } from "@/lib/types";

/**
 * Router state passed to /customer/restaurants/:id so the detail page can
 * render its header without refetching. Keep in sync with RestaurantNavState
 * in src/pages/customer/RestaurantDetail.tsx.
 */
export function restaurantNavState(restaurant: DashboardRestaurant) {
	return {
		id: restaurant.id,
		name: restaurant.name,
		image_url: restaurant.image,
		rating: restaurant.rating,
		latitude: restaurant.latitude,
		longitude: restaurant.longitude,
		address: restaurant.address,
	};
}

export function DashboardRestaurantCard({
	restaurant,
	className,
}: {
	restaurant: DashboardRestaurant;
	className?: string;
}) {
	return (
		<Link
			to={`/customer/restaurants/${restaurant.id}`}
			state={restaurantNavState(restaurant)}
			className="block rounded-2xl overflow-hidden border border-gray-100 shadow-sm"
		>
			<div className={`relative ${className ?? "h-52"}`}>
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
