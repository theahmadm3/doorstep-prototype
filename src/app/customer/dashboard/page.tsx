
"use client";

import { restaurants } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Utensils } from "lucide-react";

export default function CustomerDashboardPage() {
  return (
    <div className="space-y-12">
        <div className="text-left">
            <h1 className="text-4xl font-bold font-headline">Explore & Order</h1>
            <p className="text-muted-foreground mt-2 text-lg">Find your next favorite meal from our curated list of restaurants.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {restaurants.map((restaurant) => (
              <Link key={restaurant.id} href={`/restaurants/${restaurant.id}`} passHref>
                <Card className="flex flex-col h-full overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1">
                  <CardHeader className="p-0">
                    <Image
                      src={`https://placehold.co/400x250.png`}
                      alt={restaurant.name}
                      width={400}
                      height={250}
                      data-ai-hint="restaurant storefront"
                      className="object-cover w-full aspect-video"
                    />
                  </CardHeader>
                  <CardContent className="pt-6 flex-grow flex flex-col">
                    <CardTitle className="font-headline text-xl">{restaurant.name}</CardTitle>
                    <CardDescription className="mt-2 flex items-center gap-2">
                        <Utensils className="h-4 w-4" />
                        View Menu
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            ))}
        </div>
    </div>
  );
}
