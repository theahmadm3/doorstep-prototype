
"use client";

import { useState, useEffect } from "react";
import { getRestaurantMenu } from "@/lib/api";
import type { MenuItem, User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

export default function RestaurantMenuPageClient() {
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();
  const restaurantId = params.restaurantId as string;

  const { data: menuItems = [], isLoading } = useQuery({
      queryKey: ['restaurantMenu', restaurantId],
      queryFn: () => getRestaurantMenu(restaurantId),
      enabled: !!restaurantId,
  });

  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
     const storedUser = localStorage.getItem('user');
     if (storedUser) {
        setUser(JSON.parse(storedUser));
     }
  }, []);

  const handleAddItem = (item: MenuItem) => {
    if (user) {
      router.push(`/customer/restaurants/${restaurantId}`);
    } else {
        toast({
            title: "Login Required",
            description: "Please log in to start ordering.",
            variant: "destructive"
        });
      router.push(`/login?redirect=/restaurants/${restaurantId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container py-12">
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
        </main>
        <Footer />
      </div>
    )
  }
  
  if (!isLoading && menuItems.length === 0) {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow flex items-center justify-center">
                <div className="text-center">
                    <p className="text-lg text-muted-foreground">This restaurant does not have a menu yet.</p>
                    <Button asChild variant="link">
                        <Link href="/menu">Browse other restaurants</Link>
                    </Button>
                </div>
            </main>
            <Footer />
        </div>
    );
  }

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
                <h1 className="text-4xl font-bold font-headline">Restaurant Menu</h1>
                <p className="text-muted-foreground mt-2 text-lg">Browse through the delicious offerings.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {menuItems.map((item) => (
                  <Card key={item.id} className={cn("flex flex-col overflow-hidden", { 'opacity-50': !item.is_available })}>
                      <CardHeader className="p-0">
                        {item.is_available ? (
                            <Image
                                src={item.image_url && item.image_url !== 'string' ? item.image_url : "https://placehold.co/400x250.png"}
                                alt={item.name}
                                width={400}
                                height={250}
                                className="rounded-t-lg object-cover w-full aspect-video"
                            />
                        ) : (
                             <div className="flex items-center justify-center text-center aspect-video bg-muted rounded-t-lg">
                                <p className="text-sm text-muted-foreground p-4">Item not available at the moment — will be back soon.</p>
                            </div>
                        )}
                      </CardHeader>
                      <CardContent className="pt-6 flex-grow">
                      <CardTitle className="font-headline text-xl">{item.name}</CardTitle>
                      {item.description && <CardDescription className="mt-2">{item.description}</CardDescription>}
                      </CardContent>
                      <CardFooter className="flex items-center justify-between mt-auto pt-4">
                          <p className="text-lg font-semibold text-primary">₦{parseFloat(item.price).toFixed(2)}</p>
                          <Button onClick={() => handleAddItem(item)} className="w-full sm:w-auto" disabled={!item.is_available}>
                            {!item.is_available ? 'Unavailable' : (
                                <>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add to Cart
                                </>
                            )}
                          </Button>
                      </CardFooter>
                  </Card>
                  ))}
              </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
