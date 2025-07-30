
"use client";

import { useState, useEffect } from "react";
import { getRestaurantMenu } from "@/lib/api";
import type { Restaurant, MenuItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, ArrowLeft, Star, MapPin } from "lucide-react";
import { notFound, useParams } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export default function RestaurantMenuPage() {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const params = useParams();
  const restaurantId = params.restaurantId as string;

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (restaurantId) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          // Since we don't have restaurant details endpoint, we can't fetch it directly.
          // We will get the menu items and display them.
          const menuData = await getRestaurantMenu(restaurantId);
          setMenuItems(menuData);
          // Mock restaurant data for display purposes since we can't fetch it.
          // In a real app, the menu endpoint might return restaurant info.
          if (menuData.length > 0) {
              setRestaurant({ id: restaurantId, name: "Restaurant", rating: "4.5", address: "123 Foodie Lane, Ikeja, Lagos", description: "Delicious meals just for you", image_url: "", owner: {} as any, is_active: true, created_at: "", updated_at: "" });
          }
        } catch (error) {
          console.error("Failed to fetch restaurant data:", error);
          setRestaurant(null); // Ensure we trigger notFound if fetches fail
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [restaurantId]);

  const handleAddToCart = (item: MenuItem) => {
    addToCart(item);
    toast({
      title: "Added to cart",
      description: `${item.name} has been added to your cart.`,
    });
  };

  if (isLoading) {
    return (
        <div className="py-12">
           <Skeleton className="h-10 w-48 mb-8" />
           <div className="mb-12">
                <Skeleton className="h-10 w-3/4 mx-auto mb-4" />
                <Skeleton className="h-6 w-1/2 mx-auto" />
           </div>
           <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[...Array(8)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader className="p-0"><Skeleton className="h-48 w-full" /></CardHeader>
                            <CardContent className="pt-6">
                                <Skeleton className="h-6 w-3/4 mb-2" />
                                <Skeleton className="h-4 w-full" />
                            </CardContent>
                            <CardFooter className="flex justify-between items-center">
                                <Skeleton className="h-8 w-1/3" />
                                <Skeleton className="h-10 w-1/2" />
                            </CardFooter>
                        </Card>
                    ))}
                </div>
           </div>
      </div>
    )
  }
  
  if (!menuItems || menuItems.length === 0) {
    // This will show a "not found" page if the menu is empty or fails to load.
    notFound();
  }

  return (
    <div className="flex-grow">
        <div className="py-12">
            <div className="mb-8">
                <Button asChild variant="outline">
                    <Link href="/customer/dashboard">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Restaurants
                    </Link>
                </Button>
            </div>
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold font-headline">Restaurant Menu</h1>
                <p className="text-muted-foreground mt-2 text-lg">Browse through the delicious offerings.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {menuItems.map((item) => (
                  <Card key={item.id} className="flex flex-col overflow-hidden">
                      <CardHeader className="p-0">
                      <Image
                          src={item.image_url && item.image_url !== 'string' ? item.image_url : "https://placehold.co/400x250.png"}
                          alt={item.name}
                          width={400}
                          height={250}
                          className="rounded-t-lg object-cover w-full aspect-video"
                      />
                      </CardHeader>
                      <CardContent className="pt-6 flex-grow">
                      <CardTitle className="font-headline text-xl">{item.name}</CardTitle>
                      {item.description && <CardDescription className="mt-2">{item.description}</CardDescription>}
                      </CardContent>
                      <CardFooter className="flex items-center justify-between mt-auto pt-4">
                          <p className="text-lg font-semibold text-primary">₦{parseFloat(item.price).toFixed(2)}</p>
                          <Button onClick={() => handleAddToCart(item)} className="w-full sm:w-auto">
                              <PlusCircle className="mr-2 h-4 w-4" /> Add to Cart
                          </Button>
                      </CardFooter>
                  </Card>
                  ))}
              </div>
        </div>
    </div>
  );
}
