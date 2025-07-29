
"use client";

import { useState, useEffect } from "react";
import { getRestaurantById, getRestaurantMenu } from "@/lib/api";
import type { Restaurant, MenuItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, ArrowLeft } from "lucide-react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
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
          const [restaurantData, menuData] = await Promise.all([
            getRestaurantById(restaurantId),
            getRestaurantMenu(restaurantId),
          ]);
          setRestaurant(restaurantData);
          setMenuItems(menuData);
        } catch (error) {
          console.error("Failed to fetch restaurant data:", error);
          // notFound() could be called here if the page should 404
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
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container py-12">
           <Skeleton className="h-10 w-48 mb-8" />
           <div className="text-center mb-12">
               <Skeleton className="h-10 w-3/4 mx-auto mb-4" />
               <Skeleton className="h-6 w-1/2 mx-auto" />
           </div>
           <div className="space-y-8">
                <Skeleton className="h-10 w-full mb-8" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader><Skeleton className="h-48 w-full" /></CardHeader>
                            <CardContent className="pt-6">
                                <Skeleton className="h-6 w-3/4 mb-2" />
                                <Skeleton className="h-4 w-full" />
                            </CardContent>
                            <CardFooter>
                                <Skeleton className="h-8 w-1/3" />
                                <Skeleton className="h-10 w-1/2" />
                            </CardFooter>
                        </Card>
                    ))}
                </div>
           </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!restaurant) {
    notFound();
  }
  
  const categories = ["All", ...new Set(menuItems.map(item => item.category).filter(Boolean))] as string[];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <div className="container py-12">
            <div className="mb-8">
                <Button asChild variant="outline">
                    <Link href="/menu">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Restaurants
                    </Link>
                </Button>
            </div>
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold font-headline">{restaurant.name}'s Menu</h1>
                <p className="text-muted-foreground mt-2 text-lg">{restaurant.description || "Browse through the delicious offerings."}</p>
            </div>

            <Tabs defaultValue="All" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5 mb-8">
                    {categories.map(category => (
                        <TabsTrigger key={category} value={category}>{category}</TabsTrigger>
                    ))}
                </TabsList>
                
                <TabsContent value="All">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {menuItems.map((item) => (
                            <Card key={item.id} className="flex flex-col">
                                <CardHeader className="p-0">
                                <Image
                                    src={item.image_url || "https://placehold.co/400x250.png"}
                                    alt={item.name}
                                    width={400}
                                    height={250}
                                    className="rounded-t-lg object-cover w-full aspect-video"
                                />
                                </CardHeader>
                                <CardContent className="pt-6 flex-grow">
                                <CardTitle className="font-headline text-xl">{item.name}</CardTitle>
                                <CardDescription className="mt-2">{item.description}</CardDescription>
                                </CardContent>
                                <CardFooter className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-lg font-semibold text-primary">${parseFloat(item.price).toFixed(2)}</p>
                                <Button onClick={() => handleAddToCart(item)} className="w-full sm:w-auto">
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add to Cart
                                </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
                {categories.filter(c => c !== 'All').map(category => (
                    <TabsContent key={category} value={category}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {menuItems.filter(item => item.category === category).map((item) => (
                            <Card key={item.id} className="flex flex-col">
                                <CardHeader className="p-0">
                                <Image
                                    src={item.image_url || "https://placehold.co/400x250.png"}
                                    alt={item.name}
                                    width={400}
                                    height={250}
                                    className="rounded-t-lg object-cover w-full aspect-video"
                                />
                                </CardHeader>
                                <CardContent className="pt-6 flex-grow">
                                <CardTitle className="font-headline text-xl">{item.name}</CardTitle>
                                <CardDescription className="mt-2">{item.description}</CardDescription>
                                </CardContent>
                                <CardFooter className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-lg font-semibold text-primary">${parseFloat(item.price).toFixed(2)}</p>
                                <Button onClick={() => handleAddToCart(item)} className="w-full sm:w-auto">
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add to Cart
                                </Button>
                                </CardFooter>
                            </Card>
                            ))}
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
