
"use client";

import { useState, useEffect } from "react";
import {
	getCustomerOrders,
	confirmOrderDelivery,
	getOrderDetails,
} from "@/lib/api";
import type {
	CustomerOrder,
	OrderDetail,
	Order,
	OrderStatus,
} from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import CustomerOrderTimeline from "@/components/dashboard/customer-order-timeline";
import {
	Accordion,
	AccordionItem,
	AccordionTrigger,
	AccordionContent,
} from "@/components/ui/accordion";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
	CardFooter,
} from "@/components/ui/card";
import { useCartStore } from "@/stores/useCartStore";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import CheckoutModal from "@/components/checkout/checkout-modal";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingCart, Truck, History, RefreshCw } from "lucide-react";
import { useRefreshCooldown } from "@/hooks/use-refresh-cooldown";
import PostOrderReviewModal from "@/components/reviews/post-order-review-modal";


const OrderList = ({
	title,
	orders,
	onConfirmDelivery,
	isConfirming,
	isPastOrder,
	isLoading,
	onToggle,
	orderDetails,
	loadingDetailsId,
	noOrdersMessage,
	children,
}) => {
	if (isLoading) {
		return (
			<div>
				<h2 className="text-2xl font-bold font-headline mt-8 mb-4">{title}</h2>
				<div className="space-y-4">
					<Skeleton className="h-20 w-full" />
					<Skeleton className="h-20 w-full" />
				</div>
			</div>
		);
	}

	if (children) {
		return <div className="space-y-4">{children}</div>;
	}

	if (orders.length === 0) {
		return (
			<div className="text-center py-16 text-muted-foreground">
				<p>{noOrdersMessage || "You have no orders in this category."}</p>
			</div>
		);
	}

	return (
		<Card>
			<CardContent className="p-0">
				<Accordion
					type="single"
					collapsible
					className="w-full"
					onValueChange={onToggle}
				>
					{orders.map((order) => (
						<AccordionItem value={order.id} key={order.id}>
							<AccordionTrigger className="px-6 py-4 hover:no-underline">
								<div className="flex justify-between items-center w-full">
									<div className="text-left">
										<p className="font-bold text-lg">
											Order #{order.id.slice(0, 8)}
										</p>
										<p className="text-sm text-muted-foreground">
											{order.restaurant_name} - {order.created_at}
										</p>
									</div>
									<div className="flex items-center gap-4">
										<span className="font-bold text-lg hidden sm:inline-block">
											₦{parseFloat(order.total_amount).toFixed(2)}
										</span>
										<Badge
											variant={
												order.status === "Delivered" ? "default" : "secondary"
											}
											className={
												order.status === "Delivered"
													? "bg-green-600 text-white"
													: ""
											}
										>
											{order.status}
										</Badge>
									</div>
								</div>
							</AccordionTrigger>
							<AccordionContent className="px-6 pb-6">
								<CustomerOrderTimeline
									order={order}
									details={orderDetails[order.id]}
									isLoadingDetails={loadingDetailsId === order.id}
									onConfirmDelivery={onConfirmDelivery}
									isConfirming={isConfirming === order.id}
								/>
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			</CardContent>
		</Card>
	);
};

export default function CustomerOrdersPage() {
	const { toast } = useToast();
	const { orders: unplacedOrders, removeUnsubmittedOrder } = useCartStore();
	const [orderDetails, setOrderDetails] = useState<Record<string, OrderDetail>>(
		{},
	);
	const [loadingDetailsId, setLoadingDetailsId] = useState<string | null>(null);
	const queryClient = useQueryClient();

	const [isCheckoutOpen, setCheckoutOpen] = useState(false);
	const [orderForCheckout, setOrderForCheckout] = useState<Order | null>(null);
	const [orderToReview, setOrderToReview] = useState<CustomerOrder | null>(null);

	const [activeTab, setActiveTab] = useState("active");

	const { isCooldownActive, remainingSeconds, triggerRefresh } =
		useRefreshCooldown();

	useEffect(() => {
		const savedTab = localStorage.getItem("customerOrdersTab");
		if (savedTab) {
			setActiveTab(savedTab);
		}
	}, []);

	useEffect(() => {
		localStorage.setItem("customerOrdersTab", activeTab);
	}, [activeTab]);

	const {
		data: fetchedOrders = [],
		isLoading: isLoadingOrders,
		isFetching,
		refetch,
	} = useQuery({
		queryKey: ["customerOrders"],
		queryFn: getCustomerOrders,
		refetchOnWindowFocus: false,
	});

	useEffect(() => {
		if (isLoadingOrders || fetchedOrders.length === 0) {
			return;
		}

		const completedOrders = fetchedOrders.filter(
			(order) => order.status === 'Delivered' || order.status === 'Picked Up by Customer'
		);
		const lastCompletedCount = parseInt(localStorage.getItem('lastCompletedOrderCount') || '0', 10);
		const currentCompletedCount = completedOrders.length;

		if (currentCompletedCount > lastCompletedCount) {
			const reviewedOrderIds: string[] = JSON.parse(localStorage.getItem('reviewedOrderIds') || '[]');
			
			const mostRecentCompletedOrder = completedOrders.find(
				(order) => !reviewedOrderIds.includes(order.id)
			);

			if (mostRecentCompletedOrder) {
				setOrderToReview(mostRecentCompletedOrder);
				
				const updatedReviewedIds = [...reviewedOrderIds, mostRecentCompletedOrder.id];
				localStorage.setItem('reviewedOrderIds', JSON.stringify(updatedReviewedIds));
			}
		}

		localStorage.setItem('lastCompletedOrderCount', String(currentCompletedCount));

	}, [fetchedOrders, isLoadingOrders]);

	const { mutate: confirmDeliveryMutation, isPending: isConfirmingMutation } =
		useMutation({
			mutationFn: confirmOrderDelivery,
			onSuccess: (data, orderId) => {
				queryClient.invalidateQueries({ queryKey: ["customerOrders"] });
				toast({
					title: "Delivery Confirmed",
					description: "Thank you for confirming your delivery!",
				});
			},
			onError: (error) => {
				toast({
					title: "Confirmation Failed",
					description: error.message,
					variant: "destructive",
				});
			},
		});

	const handleToggleAccordion = async (orderId: string | undefined) => {
		if (!orderId || orderDetails[orderId]) {
			return;
		}
		setLoadingDetailsId(orderId);
		try {
			const details = await getOrderDetails(orderId);
			setOrderDetails((prev) => ({ ...prev, [orderId]: details }));
		} catch (error) {
			toast({
				title: "Error",
				description: "Could not load order details.",
				variant: "destructive",
			});
		} finally {
			setLoadingDetailsId(null);
		}
	};

	const handleConfirmDelivery = (orderId: string) => {
		confirmDeliveryMutation(orderId);
	};

	const handleCompleteOrder = (order: Order) => {
		setOrderForCheckout(order);
		setCheckoutOpen(true);
	};

	const handleDeleteOrder = (orderId: string) => {
		removeUnsubmittedOrder(orderId);
		toast({
			title: "Order Removed",
			description: "The unplaced order has been removed.",
		});
	};

	const handleRefresh = () => {
		triggerRefresh(() => refetch());
	};

	const pastOrderStatuses: OrderStatus[] = [
		"Delivered",
		"Cancelled",
		"Picked Up by Customer",
		"Rejected",
	];
	const activeOrders = fetchedOrders.filter(
		(o) => !pastOrderStatuses.includes(o.status),
	);
	const pastOrders = fetchedOrders.filter((o) =>
		pastOrderStatuses.includes(o.status),
	);
	const unsubmittedOrders = unplacedOrders.filter(
		(o) => o.status === "unsubmitted",
	);

	const tabContent = {
		cart: (
			<OrderList
				title="My Cart"
				isLoading={false}
				orders={[]}
				noOrdersMessage="You have no items in your cart."
			>
				{unsubmittedOrders.length > 0 ? (
					unsubmittedOrders.map((order) => (
						<Card key={order.id} className="shadow-md">
							<CardHeader>
								<CardTitle>In-Progress Order</CardTitle>
								<CardDescription>
									You have unplaced items in your cart.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									{order.items.map((item) => (
										<div
											key={item.cartItemId}
											className="flex justify-between items-center text-sm"
										>
											<div className="flex items-center gap-3">
												<Image
													src={
														item.menuItem.image_url && item.menuItem.image_url.startsWith("http")
															? item.menuItem.image_url
															: "https://placehold.co/48x48.png"
													}
													alt={item.menuItem.name}
													width={40}
													height={40}
													className="rounded-md"
												/>
												<span>
													{item.quantity} x {item.menuItem.name}
												</span>
											</div>
											<span className="font-medium">
												₦{item.totalPrice.toFixed(2)}
											</span>
										</div>
									))}
								</div>
								<Separator className="my-4" />
								<div className="flex justify-between font-bold">
									<span>Total</span>
									<span>₦{order.total.toFixed(2)}</span>
								</div>
							</CardContent>
							<CardFooter className="flex flex-col sm:flex-row gap-2">
								<Button
									className="w-full"
									onClick={() => handleCompleteOrder(order)}
								>
									Complete Order
								</Button>
								<Button
									variant="destructive"
									className="w-full"
									onClick={() => handleDeleteOrder(order.id)}
								>
									Cancel Order
								</Button>
							</CardFooter>
						</Card>
					))
				) : (
					<div className="text-center py-16 text-muted-foreground">
						<p>You have no items in your cart.</p>
					</div>
				)}
			</OrderList>
		),
		active: (
			<OrderList
				title="Active Orders"
				orders={activeOrders}
				onConfirmDelivery={handleConfirmDelivery}
				isConfirming={
					isConfirmingMutation
						? activeOrders.find((o) => o.id === (isConfirmingMutation as any))
								?.id
						: undefined
				}
				isPastOrder={false}
				isLoading={isLoadingOrders}
				onToggle={handleToggleAccordion}
				orderDetails={orderDetails}
				loadingDetailsId={loadingDetailsId}
				noOrdersMessage="You have no active orders."
			/>
		),
		past: (
			<OrderList
				title="Past Orders"
				orders={pastOrders}
				isPastOrder={true}
				isLoading={isLoadingOrders}
				onToggle={handleToggleAccordion}
				orderDetails={orderDetails}
				loadingDetailsId={loadingDetailsId}
				noOrdersMessage="You have no past orders."
			/>
		),
	};

	return (
		<div className="container px-3 py-8 md:py-12">
			{orderToReview && (
				<PostOrderReviewModal
				isOpen={!!orderToReview}
				onClose={() => setOrderToReview(null)}
				restaurantName={orderToReview.restaurant_name}
				restaurantId={orderToReview.restaurant_id}
				/>
			)}
			<CheckoutModal
				isOpen={isCheckoutOpen}
				onClose={() => setCheckoutOpen(false)}
				order={orderForCheckout}
			/>
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
				<h1 className="text-3xl font-bold font-headline">Your Orders</h1>
				<Button
					onClick={handleRefresh}
					variant="outline"
					disabled={isFetching || isCooldownActive}
				>
					<RefreshCw
						className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
					/>
					{isCooldownActive
						? `Wait ${remainingSeconds}s`
						: isFetching
						? "Refreshing..."
						: "Refresh Orders"}
				</Button>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
				<TabsList className="sticky top-0 z-40 bg-background border-b rounded-none px-0 w-full grid grid-cols-3">
					<TabsTrigger value="cart" className="gap-2">
						<ShoppingCart className="h-4 w-4" />
						My Cart
						<Badge variant={activeTab === "cart" ? "default" : "secondary"}>
							{unsubmittedOrders.length}
						</Badge>
					</TabsTrigger>
					<TabsTrigger value="active" className="gap-2">
						<Truck className="h-4 w-4" />
						Active{" "}
						<Badge variant={activeTab === "active" ? "default" : "secondary"}>
							{activeOrders.length}
						</Badge>
					</TabsTrigger>
					<TabsTrigger value="past" className="gap-2">
						<History className="h-4 w-4" />
						Past{" "}
						<Badge variant={activeTab === "past" ? "default" : "secondary"}>
							{pastOrders.length}
						</Badge>
					</TabsTrigger>
				</TabsList>
				<AnimatePresence mode="wait">
					<motion.div
						key={activeTab}
						initial={{ y: 10, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						exit={{ y: -10, opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="mt-6"
					>
						{tabContent[activeTab]}
					</motion.div>
				</AnimatePresence>
			</Tabs>
		</div>
	);
}
