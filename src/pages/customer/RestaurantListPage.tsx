
import { useParams, useLocation, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getDashboard } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/query-keys";
import type { DashboardRestaurant } from "@/lib/types";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardRestaurantCard } from "@/components/dashboard/restaurant-card";

const SECTION_TITLES: Record<string, string> = {
	popular: "Popular Near You",
	featured: "Featured Selections",
};

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
		// Same key as the dashboard page — both fetch page 1 of the same
		// payload, so the section page can reuse the cached result
		queryKey: QUERY_KEYS.dashboard,
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
						<DashboardRestaurantCard key={r.id} restaurant={r} />
					))}
				</div>
			)}
		</div>
	);
}
