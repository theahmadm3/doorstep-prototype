
"use client";

import { useState } from "react";
import { foodItems, restaurants } from "@/lib/data";
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

type FoodItem = (typeof foodItems)[0];

export default function RestaurantMenuPage() {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const params = useParams();
  const restaurantId = parseInt(params.restaurantId as string, 10);

  const restaurant = restaurants.find(r => r.id === restaurantId);
  const restaurantItems = foodItems.filter(item => item.restaurantId === restaurantId);

  if (!restaurant) {
    notFound();
  }

  const handleAddToCart = (item: FoodItem) => {
    addToCart(item);
    toast({
      title: "Added to cart",
      description: `${item.name} has been added to your cart.`,
    });
  };

  const categories = ["All", ...new Set(restaurantItems.map(item => item.category).filter(Boolean))] as string[];

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
                <p className="text-muted-foreground mt-2 text-lg">Browse through the delicious offerings.</p>
            </div>

            <Tabs defaultValue="All" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5 mb-8">
                    {categories.map(category => (
                        <TabsTrigger key={category} value={category}>{category}</TabsTrigger>
                    ))}
                </TabsList>
                <TabsContent value="All">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {restaurantItems.map((item) => (
                            <Card key={item.id} className="flex flex-col">
                                <CardHeader className="p-0">
                                <Image
                                    src={item.image}
                                    alt={item.name}
                                    width={400}
                                    height={250}
                                    data-ai-hint={item.dataAiHint}
                                    className="rounded-t-lg object-cover w-full aspect-video"
                                />
                                </CardHeader>
                                <CardContent className="pt-6 flex-grow">
                                <CardTitle className="font-headline text-xl">{item.name}</CardTitle>
                                <CardDescription className="mt-2">{item.description}</CardDescription>
                                </CardContent>
                                <CardFooter className="flex justify-between items-center">
                                <p className="text-lg font-semibold text-primary">${item.price.toFixed(2)}</p>
                                <Button onClick={() => handleAddToCart(item)}>
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
                        {restaurantItems.filter(item => item.category === category).map((item) => (
                            <Card key={item.id} className="flex flex-col">
                                <CardHeader className="p-0">
                                <Image
                                    src={item.image}
                                    alt={item.name}
                                    width={400}
                                    height={250}
                                    data-ai-hint={item.dataAiHint}
                                    className="rounded-t-lg object-cover w-full aspect-video"
                                />
                                </CardHeader>
                                <CardContent className="pt-6 flex-grow">
                                <CardTitle className="font-headline text-xl">{item.name}</CardTitle>
                                <CardDescription className="mt-2">{item.description}</CardDescription>
                                </CardContent>
                                <CardFooter className="flex justify-between items-center">
                                <p className="text-lg font-semibold text-primary">${item.price.toFixed(2)}</p>
                                <Button onClick={() => handleAddToCart(item)}>
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
