
"use client";

import { useState, useEffect } from "react";
import { getRestaurantMenu } from "@/lib/api";
import type { Restaurant, MenuItem, User, Order } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, ArrowLeft } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import CheckoutModal from "@/components/checkout/checkout-modal";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/useCartStore";
import { useUIStore } from "@/stores/useUIStore";

export default function RestaurantMenuPage() {
	const { addOrUpdateOrder, addToGuestCart, clearGuestCart, orders } = useCartStore();
    const { viewedRestaurant } = useUIStore();
	const { toast } = useToast();
	const params = useParams();
	const router = useRouter();
	const restaurantId = params.restaurantId as string;

	const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [user, setUser] = useState<User | null>(null);

	const [showClearCartDialog, setShowClearCartDialog] = useState(false);
	const [showIsThatAllDialog, setShowIsThatAllDialog] = useState(false);
	const [itemToAdd, setItemToAdd] = useState<MenuItem | null>(null);

	const [isCheckoutOpen, setCheckoutOpen] = useState(false);
	const [orderForCheckout, setOrderForCheckout] = useState<Order | null>(null);

	useEffect(() => {
		const storedUser = localStorage.getItem("user");
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
				} catch (error) {
					console.error("Failed to fetch restaurant data:", error);
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
		router.push("/customer/dashboard");
	};

	const handleIsThatAllYes = () => {
		setShowIsThatAllDialog(false);
		const unsubmittedOrder = orders.find(
			(o) => o.restaurantId === restaurantId && o.status === "unsubmitted",
		);
		if (unsubmittedOrder) {
			setOrderForCheckout(unsubmittedOrder);
			setCheckoutOpen(true);
		}
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
								<CardHeader className="p-0">
									<Skeleton className="h-48 w-full" />
								</CardHeader>
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
		);
	}

	if (!menuItems || menuItems.length === 0) {
		notFound();
	}

	return (
		<div className="flex-grow">
			<CheckoutModal
				isOpen={isCheckoutOpen}
				onClose={() => setCheckoutOpen(false)}
				order={orderForCheckout}
			/>
			{/* Dialog for guest users clearing cart */}
			<AlertDialog
				open={showClearCartDialog}
				onOpenChange={setShowClearCartDialog}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Start a New Cart?</AlertDialogTitle>
						<AlertDialogDescription>
							You have items from another restaurant in your cart. Would you
							like to clear it to add this item?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setItemToAdd(null)}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction onClick={handleConfirmClearCart}>
							Clear Cart & Add
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Dialog for logged-in users after adding an item */}
			<AlertDialog
				open={showIsThatAllDialog}
				onOpenChange={setShowIsThatAllDialog}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Is that all?</AlertDialogTitle>
						<AlertDialogDescription>
							Your item has been added to an order. Would you like to proceed to
							checkout or continue shopping?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={handleIsThatAllNo}>
							No, continue shopping
						</AlertDialogCancel>
						<AlertDialogAction onClick={handleIsThatAllYes}>
							Yes, go to checkout
						</AlertDialogAction>
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
					<h1 className="text-4xl font-bold font-headline">
						{viewedRestaurant?.name || "Restaurant"} Menu
					</h1>
					<p className="text-muted-foreground mt-2 text-lg">
						Browse through the delicious offerings.
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
					{menuItems.map((item) => {
						const imageUrl =
							item.image_url && item.image_url.startsWith("http")
								? item.image_url
								: "https://placehold.co/400x250.png";
						return (
							<Card
								key={item.id}
								className={cn("flex flex-col overflow-hidden", {
									"opacity-50": !item.is_available,
								})}
							>
								<CardHeader className="p-0">
									{item.is_available ? (
										<Image
											src={imageUrl}
											alt={item.name}
											width={400}
											height={250}
											className="rounded-t-lg object-cover w-full aspect-video"
										/>
									) : (
										<div className="flex items-center justify-center text-center aspect-video bg-muted rounded-t-lg">
											<p className="text-sm text-muted-foreground p-4">
												Item not available at the moment — will be back soon.
											</p>
										</div>
									)}
								</CardHeader>
								<CardContent className="pt-6 flex-grow">
									<CardTitle className="font-headline text-xl">
										{item.name}
									</CardTitle>
									{item.description && (
										<CardDescription className="mt-2">
											{item.description}
										</CardDescription>
									)}
								</CardContent>
								<CardFooter className="flex md:flex-col items-center justify-between mt-auto pt-4">
									<p className="inline-flex gap-2 text-md font-semibold text-primary text-center w-full mb-4">
										<span className="hidden md:block w-fit">Price:</span>₦
										{parseFloat(item.price).toFixed(2)}
									</p>
									<Button
										onClick={() => handleAddItem(item)}
										className="w-full sm:w-auto"
										disabled={!item.is_available}
									>
										{!item.is_available ? (
											"Unavailable"
										) : (
											<>
												<PlusCircle className="mr-2 h-4 w-4" />{" "}
												{user ? "Add to Order" : "Add to Cart"}
											</>
										)}
									</Button>
								</CardFooter>
							</Card>
						);
					})}
				</div>
			</div>
		</div>
	);
}
