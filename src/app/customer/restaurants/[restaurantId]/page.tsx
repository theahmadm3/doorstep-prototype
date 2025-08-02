
"use client";

import { useState, useEffect } from "react";
import { getRestaurantMenu } from "@/lib/api";
import type { Restaurant, MenuItem, User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { useOrder } from "@/hooks/use-order";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, ArrowLeft, Star, MapPin } from "lucide-react";
import { notFound, useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function RestaurantMenuPage() {
  const { addOrUpdateOrder, guestCart, addToGuestCart, clearGuestCart } = useOrder();
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();
  const restaurantId = params.restaurantId as string;

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const [showClearCartDialog, setShowClearCartDialog] = useState(false);
  const [showIsThatAllDialog, setShowIsThatAllDialog] = useState(false);
  const [itemToAdd, setItemToAdd] = useState<MenuItem | null>(null);
  
  useEffect(() => {
     const storedUser = localStorage.getItem('user');
     if (storedUser) {
        setUser(JSON.parse(storedUser));
     }
  }, []);

  useEffect(() => {
    if (restaurantId) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const menuData = await getRestaurantMenu(restaurantId);
          setMenuItems(menuData);
          if (menuData.length > 0) {
              setRestaurant({ id: restaurantId, name: "Restaurant", rating: "4.5", address: "123 Foodie Lane, Ikeja, Lagos", description: "Delicious meals just for you", image_url: "", owner: {} as any, is_active: true, created_at: "", updated_at: "" });
          }
        } catch (error) {
          console.error("Failed to fetch restaurant data:", error);
          setRestaurant(null); 
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [restaurantId]);

  const handleAddItem = (item: MenuItem) => {
    if (user) {
      // Logged-in user flow
      addOrUpdateOrder(item);
      toast({
        title: "Item Added",
        description: `${item.name} has been added to your order for this restaurant.`,
      });
      setShowIsThatAllDialog(true);
    } else {
      // Guest user flow
      const success = addToGuestCart(item);
      if (success) {
          toast({
              title: "Added to cart",
              description: `${item.name} has been added to your cart.`,
          });
      } else {
          setItemToAdd(item);
          setShowClearCartDialog(true);
      }
    }
  };

  const handleConfirmClearCart = () => {
    if (itemToAdd) {
        clearGuestCart();
        addToGuestCart(itemToAdd);
        toast({
            title: "Cart Cleared & Item Added",
            description: `Your cart has been cleared and ${itemToAdd.name} has been added.`,
        });
    }
    setShowClearCartDialog(false);
    setItemToAdd(null);
  };
  
  const handleIsThatAllNo = () => {
    setShowIsThatAllDialog(false);
    router.push('/customer/dashboard');
  }

  const handleIsThatAllYes = () => {
     setShowIsThatAllDialog(false);
     const unsubmittedOrder = guestCart.items.length > 0 ? null : 'unsubmitted-order-id';
     if(unsubmittedOrder) {
        router.push(`/checkout?orderId=${unsubmittedOrder}`);
     } else {
        const order = addOrUpdateOrder(itemToAdd!);
        router.push(`/checkout?orderId=${order.id}`);
     }
  }


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
    notFound();
  }

  return (
    <div className="flex-grow">
        {/* Dialog for guest users clearing cart */}
        <AlertDialog open={showClearCartDialog} onOpenChange={setShowClearCartDialog}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Start a New Cart?</AlertDialogTitle>
                <AlertDialogDescription>
                    You have items from another restaurant in your cart. Would you like to clear it to add this item?
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setItemToAdd(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmClearCart}>Clear Cart & Add</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        {/* Dialog for logged-in users after adding an item */}
        <AlertDialog open={showIsThatAllDialog} onOpenChange={setShowIsThatAllDialog}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Is that all?</AlertDialogTitle>
                <AlertDialogDescription>
                    Your item has been added to an order. Would you like to proceed to checkout or continue shopping?
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={handleIsThatAllNo}>No, continue shopping</AlertDialogCancel>
                <AlertDialogAction onClick={handleIsThatAllYes}>Yes, go to checkout</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
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
                          <Button onClick={() => handleAddItem(item)} className="w-full sm:w-auto">
                              <PlusCircle className="mr-2 h-4 w-4" /> {user ? 'Add to Order' : 'Add to Cart'}
                          </Button>
                      </CardFooter>
                  </Card>
                  ))}
              </div>
        </div>
    </div>
  );
}

