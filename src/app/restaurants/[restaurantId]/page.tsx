
import { getRestaurants } from "@/lib/api";
import RestaurantMenuPageClient from "./page.client";

// Return a list of `params` to populate the [slug] dynamic segment
export async function generateStaticParams() {
	// Instead of fetching from a live API during build,
	// we can return a static list or fetch from a static source.
	// This makes the build independent of the live API.
	return [
		{ restaurantId: "1" },
		{ restaurantId: "2" },
		{ restaurantId: "3" },
		{ restaurantId: "4" },
	];
}

export default function RestaurantMenuPage() {
    return <RestaurantMenuPageClient />;
}
