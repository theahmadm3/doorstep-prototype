
import { getRestaurants } from "@/lib/api";
import RestaurantMenuPageClient from "./page.client";

export async function generateStaticParams() {
  const restaurants = await getRestaurants();
 
  return restaurants.map((restaurant) => ({
    restaurantId: restaurant.id,
  }));
}

export default function RestaurantMenuPage() {
    return <RestaurantMenuPageClient />;
}
