
"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock, Star, Zap } from "lucide-react";
import type { DashboardRestaurant, ComboDeal, Restaurant } from "@/lib/types";
import { useUIStore } from "@/stores/useUIStore";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
import {
	Card,
	CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CustomerDashboardClientProps {
	popularNearYou: DashboardRestaurant[];
	featuredSelections: DashboardRestaurant[];
	comboDeals: ComboDeal[];
	allRestaurants: DashboardRestaurant[];
    onLoadMore: () => void;
    canLoadMore: boolean;
    isLoadingMore: boolean;
}

const RestaurantCard = ({ restaurant }: { restaurant: DashboardRestaurant }) => {
	const { setViewedRestaurant } = useUIStore();

	const handleRestaurantClick = () => {
		const restaurantForStore: Restaurant = {
			id: restaurant.id,
			name: restaurant.name,
			image_url: restaurant.image,
			rating: restaurant.rating,
			description: restaurant.description,
			address: {
				id: '', // Not available from this endpoint
				street_name: restaurant.address,
				latitude: restaurant.latitude,
				longitude: restaurant.longitude,
			},
			owner: {} as any,
			is_active: true,
			created_at: "",
			updated_at: "",
		};
		setViewedRestaurant(restaurantForStore);
	};

	return (
		<Link
			href={`/customer/restaurants/${restaurant.id}`}
			onClick={handleRestaurantClick}
		>
			<div className="overflow-hidden border-0 shadow-md rounded-2xl group">
                <div className="relative h-44">
                    <Image
                        src={restaurant.image || "https://placehold.co/400x250.png"}
                        alt={restaurant.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {restaurant.badge && (
                        <Badge variant={restaurant.badge.type === 'promo' ? 'destructive' : 'default'} className="absolute top-2 left-2">
                           {restaurant.badge.text}
                        </Badge>
                    )}
                </div>
                <div className="p-3 bg-card">
                    <h3 className="font-bold text-base mb-2 line-clamp-1">
                        {restaurant.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                            <span className="font-semibold text-foreground">
                                {restaurant.rating || "4.5"}
                            </span>
                        </div>
                        <span>•</span>
                         <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{restaurant.preparationTime}</span>
                        </div>
                    </div>
                </div>
            </div>
		</Link>
	);
};

const ComboDealCard = ({ deal }: { deal: ComboDeal }) => {
	return (
		<Link href={`/customer/restaurants/${deal.restaurantId}`}>
			<div className="overflow-hidden border-0 shadow-md rounded-2xl group">
				<div className="relative h-44">
					<Image
						src={deal.image || `https://placehold.co/400x250.png`}
						alt={deal.name}
						fill
						className="object-cover transition-transform duration-300 group-hover:scale-105"
					/>
                     <Badge variant="default" className="absolute top-2 left-2 bg-green-600">
                        {deal.badge}
                    </Badge>
				</div>
				<div className="p-3 bg-card">
					<h3 className="font-bold text-base mb-2 line-clamp-1">{deal.name}</h3>
					<div className="flex items-center gap-2">
						<p className="font-bold text-lg text-primary">₦{deal.price}</p>
						<p className="text-sm text-muted-foreground line-through">
							₦{deal.originalPrice.toLocaleString()}
						</p>
					</div>
				</div>
			</div>
		</Link>
	);
};


const RestaurantCarousel = ({ title, restaurants }: { title: string, restaurants: DashboardRestaurant[] }) => {
    if (restaurants.length === 0) return null;

    return (
        <div className="space-y-4">
             <h2 className="text-2xl font-bold font-headline">{title}</h2>
             <Carousel opts={{ align: "start", loop: false }} className="w-full">
                <CarouselContent className="-ml-4">
                    {restaurants.map((restaurant, index) => (
                        <CarouselItem key={index} className="basis-3/4 md:basis-1/3 lg:basis-1/4 pl-4">
                             <RestaurantCard restaurant={restaurant} />
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="hidden md:flex"/>
                <CarouselNext className="hidden md:flex"/>
            </Carousel>
        </div>
    )
}

const ComboDealsCarousel = ({ deals }: { deals: ComboDeal[] }) => {
    if (deals.length === 0) return null;

    return (
        <div className="space-y-4">
             <h2 className="text-2xl font-bold font-headline flex items-center gap-2">
                <Zap className="h-6 w-6 text-primary" />
                Hot Combo Deals
            </h2>
             <Carousel opts={{ align: "start", loop: false }} className="w-full">
                <CarouselContent className="-ml-4">
                    {deals.map((deal, index) => (
                        <CarouselItem key={index} className="basis-3/4 md:basis-1/3 lg:basis-1/4 pl-4">
                            <ComboDealCard deal={deal} />
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="hidden md:flex"/>
                <CarouselNext className="hidden md:flex"/>
            </Carousel>
        </div>
    )
}

export default function CustomerDashboardClient({
	popularNearYou,
	featuredSelections,
	comboDeals,
	allRestaurants,
    onLoadMore,
    canLoadMore,
    isLoadingMore
}: CustomerDashboardClientProps) {

	return (
		<div className="space-y-12">
            <RestaurantCarousel title="Popular Near You" restaurants={popularNearYou} />
            <ComboDealsCarousel deals={comboDeals} />
            <RestaurantCarousel title="Featured Selections" restaurants={featuredSelections} />

            <div className="space-y-6">
                <h2 className="text-2xl font-bold font-headline">All Restaurants</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {allRestaurants.map(restaurant => (
                        <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                    ))}
                </div>
                 {canLoadMore && (
                    <div className="flex justify-center">
                        <Button onClick={onLoadMore} disabled={isLoadingMore}>
                            {isLoadingMore ? "Loading..." : "Load More"}
                        </Button>
                    </div>
                )}
            </div>
		</div>
	);
}
