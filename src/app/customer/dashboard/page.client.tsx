"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Utensils, MapPin, Star } from "lucide-react";
import type { Restaurant } from "@/lib/types";
import { useUIStore } from "@/stores/useUIStore";

interface CustomerDashboardClientProps {
	restaurants: Restaurant[];
}

export default function CustomerDashboardClient({
	restaurants,
}: CustomerDashboardClientProps) {
	const { setViewedRestaurant } = useUIStore();

	return (
		<div className="space-y-12">
			<div className="text-left">
				<h1 className="text-2xl md:text-4xl font-bold font-headline">
					Explore & Order
				</h1>
				<p className="text-muted-foreground mt-2 md:text-lg">
					Find your next favorite meal from our curated list of restaurants.
				</p>
			</div>

			{/* New Restaurant List Section */}
			<div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2">
				{restaurants.map((restaurant) => (
					<Link
						key={restaurant.id}
						href={`/customer/restaurants/${restaurant.id}`}
						onClick={() => setViewedRestaurant(restaurant)}
						className="flex-shrink-0 w-[280px] snap-start"
					>
						<Card className="overflow-hidden border-0 shadow-md rounded-2xl">
							<div className="relative h-44">
								<Image
									src={
										restaurant.image_url && restaurant.image_url !== "string"
											? restaurant.image_url
											: `https://placehold.co/400x250.png`
									}
									alt={restaurant.name}
									fill
									className="object-cover"
								/>
							</div>
							<div className="p-3">
								<h3 className="font-bold text-base mb-2 line-clamp-1">
									{restaurant.name}
								</h3>
								<div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
									<div className="flex items-center gap-1">
										<Star className="w-4 h-4 fill-amber-400 text-amber-400" />
										<span className="font-semibold text-gray-900">
											{restaurant.rating || "4.5"}
										</span>
									</div>
									<span>•</span>
									<span>₦500</span>
									<span>•</span>
									<span>20-30 min</span>
								</div>
								{restaurant.address?.street_name && (
									<p className="text-xs text-gray-500 truncate">
										{restaurant.address.street_name}
									</p>
								)}
							</div>
						</Card>
					</Link>
				))}
			</div>
		</div>
	);
}
