
"use client";

import { foodItems, restaurants } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

type FoodItem = (typeof foodItems)[0];

export default function CustomerDashboardPage() {
  const { addToCart } = useCart();
  const { toast } = useToast();

  const handleAddToCart = (item: FoodItem) => {
    addToCart(item);
    toast({
      title: "Added to cart",
      description: `${item.name} has been added to your cart.`,
    });
  };

  const itemsByRestaurant = restaurants.map(restaurant => ({
    ...restaurant,
    items: foodItems.filter(item => item.restaurantId === restaurant.id),
  }));

  const itemsByCategory = (items: FoodItem[]) => {
    return items.reduce((acc, item) => {
      const category = item.category || "Miscellaneous";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {} as Record<string, FoodItem[]>);
  };


  return (
    <div className="space-y-8">
        <div className="text-left mb-12">
            <h1 className="text-4xl font-bold font-headline">Explore & Order</h1>
            <p className="text-muted-foreground mt-2 text-lg">Find your next favorite meal from our curated list of restaurants.</p>
        </div>
        
        <Accordion type="multiple" className="w-full space-y-4">
          {itemsByRestaurant.map(restaurant => (
            <AccordionItem value={`restaurant-${restaurant.id}`} key={restaurant.id} className="border-none">
                <Card>
                    <AccordionTrigger className="p-6 hover:no-underline">
                        <h2 className="text-2xl font-bold font-headline">{restaurant.name}</h2>
                    </AccordionTrigger>
                    <AccordionContent className="p-6 pt-0">
                      {Object.entries(itemsByCategory(restaurant.items)).map(([category, items]) => (
                        <div key={category} className="mb-8">
                            <h3 className="text-xl font-semibold mb-4 capitalize">{category}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {items.map((item) => (
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
                        </div>
                      ))}
                    </AccordionContent>
                </Card>
            </AccordionItem>
          ))}
        </Accordion>
    </div>
  );
}
