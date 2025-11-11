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
import { Utensils, MapPin } from "lucide-react";
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

			<div className="inline-flex w-full overflow-x-auto snap-x snap-mandatory gap-3 md:gap-6 py-4">
				{restaurants.map((restaurant) => (
					<Link
						key={restaurant.id}
						href={`/customer/restaurants/${restaurant.id}`}
						passHref
						onClick={() => setViewedRestaurant(restaurant)}
						className="group flex flex-col gap-4 flex-shrink-0 w-4/5 md:w-[380px]"
					>
						<Card className="relative h-[150px] md:h-[300px] w-full overflow-hidden border-0 bg-black rounded-top-3xl shadow-lg transition-all duration-500 hover:shadow-2xl hover:scale-[1.02]">
							{/* Full Background Image with Overlay */}
							<div className="absolute inset-0">
								<Image
									src={
										restaurant.image_url && restaurant.image_url !== "string"
											? restaurant.image_url
											: `https://placehold.co/400x250.png`
									}
									alt={restaurant.name}
									fill
									data-ai-hint="restaurant storefront"
									className="object-cover transition-transform duration-700 group-hover:scale-105"
								/>
								{/* Dynamic Gradient Overlay */}
								{/* <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
								<div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" /> */}
							</div>

							{/* Content Overlay */}
							<div className="relative h-full flex flex-col justify-between p-6">
								{/* Top Section - Status Badge & Rating */}
								<div className="flex justify-between items-start">
									{/* Rating Badge */}

									{/* Status Badge */}
									<div className="backdrop-blur-xl bg-gray-300 border border-white/20 px-4 py-2 rounded-full">
										<div className="flex  items-center gap-2">
											<div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
											<span className="text-white text-xs font-medium">
												Open
											</span>
										</div>
									</div>
								</div>

								{/* Bottom Section - Info */}
								<div className="space-y-4">
									{/* Restaurant Name */}
									<div className="space-y-2">
										{/* Location */}
										{/* <div className="flex items-center gap-2 text-white/80">
											<div className="p-1.5 bg-white/10 backdrop-blur-sm rounded-lg flex-shrink-0">
												<MapPin className="h-4 w-4" />
											</div>
											<span className="text-xs font-medium truncate">
												{restaurant.address?.street_name ||
													"Address not available"}
											</span>
										</div> */}
									</div>

									{/* Action Button */}
									{/* <div className="flex items-center justify-between backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 transition-all duration-300 group-hover:bg-white/20 group-hover:border-white/30">
										<div className="flex items-center gap-3">
											<div className="p-2 bg-white rounded-xl">
												<Utensils className="h-3 w-3 text-black" />
											</div>
											<span className="text-white text-xs font-semibold">
												View Menu
											</span>
										</div>

										<div className="p-2 bg-white/20 rounded-xl transition-transform duration-300 group-hover:translate-x-1">
											<svg
												className="h-5 w-5 text-white"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2.5}
													d="M13 7l5 5m0 0l-5 5m5-5H6"
												/>
											</svg>
										</div>
									</div> */}
								</div>
							</div>

							{/* Decorative Elements */}
							<div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl" />
							<div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-3xl" />
						</Card>
						<div className="w-full inline-flex justify-between items-center gap-2 pr-2">
							<h3 className="text-sm md:text-xl w-4/5 leading-tight tracking-tight line-clamp-2">
								{restaurant.name} - {restaurant.address?.street_name || ""}
							</h3>
							<div className="p-2 bg-white/10 rounded-full cursor-pointer hover:bg-white/20 transition">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="currentColor"
									viewBox="0 0 24 24"
									className="h-5 w-5 text-red-500"
								>
									<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
								</svg>
							</div>
						</div>
						<div className="pr-4 inline-flex items-center justify-between backdrop-blur-xl bg-white/10 border border-white/20 py-2 rounded-full">
							<div className="inline-flex items-center justify-between gap-1">
								<div className="flex items-center gap-2">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
										className="w-4 h-4"
									>
										<circle cx="5.5" cy="17.5" r="3.5" />
										<circle cx="18.5" cy="17.5" r="3.5" />
										<path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
										<path d="M12 17.5V14l-3-3 4-3 2 3h2" />
									</svg>
									<span className="text-sm font-medium">From ₦500</span>
								</div>
								<div className="border-l border-l-gray-400 px-1 text-sm">
									20 - 30 min
								</div>
							</div>
							<div className="flex items-center gap-2">
								<svg
									className="w-4 h-4 text-yellow-400 fill-yellow-400"
									viewBox="0 0 20 20"
								>
									<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
								</svg>
								<span className="text-sm font-bold">
									{restaurant.rating || "4.5"}
								</span>
							</div>
						</div>
					</Link>
				))}
			</div>
		</div>
	);
}
