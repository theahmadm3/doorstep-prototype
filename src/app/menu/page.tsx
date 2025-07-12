"use client";

import { foodItems } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle } from "lucide-react";

export default function MenuPage() {
  const { addToCart } = useCart();
  const { toast } = useToast();

  const handleAddToCart = (item: (typeof foodItems)[0]) => {
    addToCart(item);
    toast({
      title: "Added to cart",
      description: `${item.name} has been added to your cart.`,
    });
  };

  return (
    <div className="container py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold font-headline">Explore Our Menu</h1>
        <p className="text-muted-foreground mt-2 text-lg">Find your next favorite meal from our curated list of restaurants.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {foodItems.map((item) => (
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
  );
}
