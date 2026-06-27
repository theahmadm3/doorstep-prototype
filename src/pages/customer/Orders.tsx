"use client";

import { useState, useEffect } from "react";
import {
	getCustomerOrders,
	confirmOrderDelivery,
	getOrderDetails,
} from "@/lib/api";
import type { CustomerOrder, OrderDetail, Order, OrderStatus } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import CustomerOrderTimeline from "@/components/dashboard/customer-order-timeline";
import {
	Accordion,
	AccordionItem,
	AccordionTrigger,
	AccordionContent,
} from "@/components/ui/accordion";
import { useCartStore } from "@/stores/useCartStore";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import CheckoutModal from "@/components/checkout/checkout-modal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingCart, Truck, History, RefreshCw, Clock } from "lucide-react";
import { useRefreshCooldown } from "@/hooks/use-refresh-cooldown";
import PostOrderReviewModal from "@/components/reviews/post-order-review-modal";
import { cn } from "@/lib/utils";

function getStatusClasses(status: OrderStatus): string {
	switch (status) {
		case "Delivered":
		case "Picked Up by Customer":
		case "Completed":
			return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
		case "Cancelled":
		case "Rejected":
			return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
		case "On the Way":
		case "Ready for Pickup":
			return "bg-primary/10 text-primary";
		default:
			return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
	}
}

function displayStatus(status: OrderStatus): string {
	if (status === "Delivered" || status === "Picked Up by Customer") return "Completed";
	return status;
}

const OrderSkeleton = () => (
	<div className="space-y-3">
		{[0, 1, 2].map((i) => (
			<div key={i} className="border rounded-xl p-4 space-y-3">
				<div className="flex items-center justify-between">
					<Skeleton className="h-4 w-1/3" />
					<Skeleton className="h-5 w-20 rounded-full" />
				</div>
				<Skeleton className="h-3 w-1/2" />
			</div>
		))}
	</div>
);

interface PlacedOrderListProps {
	orders: CustomerOrder[];
	isLoading: boolean;
	onToggle: (orderId: string | undefined) => void;
	orderDetails: Record<string, OrderDetail>;
	loadingDetailsId: string | null;
	onConfirmDelivery?: (orderId: string) => void;
	confirmingOrderId?: string | null;
	noOrdersMessage?: string;
	emptyIcon?: React.ElementType;
}

const PlacedOrderList = ({
	orders,
	isLoading,
	onToggle,
	orderDetails,
	loadingDetailsId,
	onConfirmDelivery,
	confirmingOrderId,
	noOrdersMessage,
	emptyIcon: EmptyIcon = Clock,
}: PlacedOrderListProps) => {
	if (isLoading) return <OrderSkeleton />;

	if (orders.length === 0) {
		return (
			<div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
				<EmptyIcon className="h-10 w-10 opacity-25" />
				<p className="text-sm">{noOrdersMessage ?? "No orders here."}</p>
			</div>
		);
	}

	return (
		<Accordion
			type="single"
			collapsible
			onValueChange={(val) => onToggle(typeof val === "string" ? val || undefined : undefined)}
		>
			{orders.map((order) => (
				<AccordionItem
					key={order.id}
					value={order.id}
					className="border rounded-xl mb-3 overflow-hidden"
				>
					<AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/40">
						<div className="flex items-center gap-3 w-full min-w-0 pr-2">
							<div className="flex-1 min-w-0 text-left">
								<p className="font-semibold text-sm truncate">{order.restaurant_name}</p>
								<p className="text-xs text-muted-foreground mt-0.5">
									{order.created_at} · #{order.id.slice(0, 8)}
								</p>
							</div>
							<div className="flex flex-col items-end gap-1.5 flex-shrink-0">
								<span className="text-sm font-bold">
									₦{parseFloat(order.total_amount).toFixed(2)}
								</span>
								<span
									className={cn(
										"text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap",
										getStatusClasses(order.status),
									)}
								>
									{displayStatus(order.status)}
								</span>
							</div>
						</div>
					</AccordionTrigger>
					<AccordionContent className="px-4 pb-4">
						<Separator className="mb-4" />
						<CustomerOrderTimeline
							order={order}
							details={orderDetails[order.id]}
							isLoadingDetails={loadingDetailsId === order.id}
							onConfirmDelivery={onConfirmDelivery}
							isConfirming={confirmingOrderId === order.id}
						/>
					</AccordionContent>
				</AccordionItem>
			))}
		</Accordion>
	);
};

export default function CustomerOrdersPage() {
	const { toast } = useToast();
	const { orders: unplacedOrders, removeUnsubmittedOrder } = useCartStore();
	const [orderDetails, setOrderDetails] = useState<Record<string, OrderDetail>>({});
	const [loadingDetailsId, setLoadingDetailsId] = useState<string | null>(null);
	const queryClient = useQueryClient();

	const [isCheckoutOpen, setCheckoutOpen] = useState(false);
	const [orderForCheckout, setOrderForCheckout] = useState<Order | null>(null);
	const [orderToReview, setOrderToReview] = useState<CustomerOrder | null>(null);
	const [activeTab, setActiveTab] = useState("active");
	const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null);

	const { isCooldownActive, remainingSeconds, triggerRefresh } = useRefreshCooldown();

	useEffect(() => {
		const savedTab = localStorage.getItem("customerOrdersTab");
		if (savedTab) setActiveTab(savedTab);
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

	const pastOrderStatuses: OrderStatus[] = [
		"Delivered",
		"Cancelled",
		"Picked Up by Customer",
		"Rejected",
	];
	const activeOrders = fetchedOrders.filter((o) => !pastOrderStatuses.includes(o.status));
	const pastOrders = fetchedOrders.filter((o) => pastOrderStatuses.includes(o.status));
	const unsubmittedOrders = unplacedOrders.filter((o) => o.status === "unsubmitted");

	useEffect(() => {
		if (isLoadingOrders || fetchedOrders.length === 0) return;

		const lastPastCount = parseInt(localStorage.getItem("lastPastOrderCount") || "0", 10);
		const currentPastCount = pastOrders.length;

		if (currentPastCount > lastPastCount) {
			const reviewedOrderIds: string[] = JSON.parse(
				localStorage.getItem("reviewedOrderIds") || "[]",
			);
			const mostRecentPastOrder = pastOrders.find(
				(order) => !reviewedOrderIds.includes(order.id),
			);

			if (mostRecentPastOrder) {
				if (
					mostRecentPastOrder.status === "Delivered" ||
					mostRecentPastOrder.status === "Picked Up by Customer"
				) {
					setOrderToReview(mostRecentPastOrder);
				}
				localStorage.setItem(
					"reviewedOrderIds",
					JSON.stringify([...reviewedOrderIds, mostRecentPastOrder.id]),
				);
			}
		}

		localStorage.setItem("lastPastOrderCount", String(currentPastCount));
	}, [pastOrders, fetchedOrders, isLoadingOrders]);

	const { mutate: confirmDeliveryMutation } = useMutation({
		mutationFn: confirmOrderDelivery,
		onSuccess: () => {
			setConfirmingOrderId(null);
			queryClient.invalidateQueries({ queryKey: ["customerOrders"] });
			toast({ title: "Delivery Confirmed", description: "Thank you for confirming your delivery!" });
		},
		onError: (error) => {
			setConfirmingOrderId(null);
			toast({ title: "Confirmation Failed", description: error.message, variant: "destructive" });
		},
	});

	const handleToggleAccordion = async (orderId: string | undefined) => {
		if (!orderId || orderDetails[orderId]) return;
		setLoadingDetailsId(orderId);
		try {
			const details = await getOrderDetails(orderId);
			setOrderDetails((prev) => ({ ...prev, [orderId]: details }));
		} catch {
			toast({ title: "Error", description: "Could not load order details.", variant: "destructive" });
		} finally {
			setLoadingDetailsId(null);
		}
	};

	const handleConfirmDelivery = (orderId: string) => {
		setConfirmingOrderId(orderId);
		confirmDeliveryMutation(orderId);
	};

	return (
		<div className="space-y-6 pb-10">
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

			{/* Header */}
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold font-headline">Your Orders</h1>
				<Button
					variant="outline"
					size="sm"
					onClick={() => triggerRefresh(() => refetch())}
					disabled={isFetching || isCooldownActive}
				>
					<RefreshCw className={cn("h-4 w-4 mr-1.5", isFetching && "animate-spin")} />
					{isCooldownActive ? `${remainingSeconds}s` : isFetching ? "Refreshing" : "Refresh"}
				</Button>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="w-full border-b bg-transparent rounded-none px-0 gap-0">
					<TabsTrigger
						value="cart"
						className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium"
					>
						<ShoppingCart className="h-4 w-4" />
						Cart
						{unsubmittedOrders.length > 0 && (
							<span className="ml-1 bg-primary text-primary-foreground text-xs rounded-full min-w-[1.125rem] h-[1.125rem] flex items-center justify-center px-1 font-semibold">
								{unsubmittedOrders.length}
							</span>
						)}
					</TabsTrigger>
					<TabsTrigger
						value="active"
						className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium"
					>
						<Truck className="h-4 w-4" />
						Active
						{activeOrders.length > 0 && (
							<span className="ml-1 bg-amber-500 text-white text-xs rounded-full min-w-[1.125rem] h-[1.125rem] flex items-center justify-center px-1 font-semibold">
								{activeOrders.length}
							</span>
						)}
					</TabsTrigger>
					<TabsTrigger
						value="past"
						className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium"
					>
						<History className="h-4 w-4" />
						Past
					</TabsTrigger>
				</TabsList>

				<AnimatePresence mode="wait">
					<motion.div
						key={activeTab}
						initial={{ y: 8, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						exit={{ y: -8, opacity: 0 }}
						transition={{ duration: 0.15 }}
						className="mt-5"
					>
						{/* Cart tab */}
						{activeTab === "cart" && (
							unsubmittedOrders.length === 0 ? (
								<div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
									<ShoppingCart className="h-10 w-10 opacity-25" />
									<p className="text-sm">Your cart is empty.</p>
								</div>
							) : (
								<div className="space-y-4">
									{unsubmittedOrders.map((order) => (
										<div key={order.id} className="border rounded-xl overflow-hidden">
											{/* Items */}
											<div className="p-4 space-y-3">
												{order.items.map((item) => (
													<div key={item.cartItemId} className="flex items-center gap-3">
														<img
															src={
																item.menuItem.image_url?.startsWith("http")
																	? item.menuItem.image_url
																	: "https://placehold.co/48x48.png"
															}
															alt={item.menuItem.name}
															width={48}
															height={48}
															className="rounded-lg object-cover flex-shrink-0 w-12 h-12"
														/>
														<div className="flex-1 min-w-0">
															<p className="text-sm font-medium truncate">{item.menuItem.name}</p>
															{item.options.length > 0 && (
																<p className="text-xs text-muted-foreground truncate mt-0.5">
																	{item.options.map((o) => o.name).join(", ")}
																</p>
															)}
														</div>
														<div className="text-right flex-shrink-0">
															<p className="text-sm font-semibold">₦{item.totalPrice.toFixed(2)}</p>
															<p className="text-xs text-muted-foreground">×{item.quantity}</p>
														</div>
													</div>
												))}
											</div>

											{/* Footer */}
											<div className="border-t bg-muted/30 px-4 py-3">
												<div className="flex items-center justify-between mb-3">
													<span className="text-sm text-muted-foreground">Order total</span>
													<span className="font-bold">₦{order.total.toFixed(2)}</span>
												</div>
												<div className="flex gap-2">
													<Button
														className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
														onClick={() => {
															setOrderForCheckout(order);
															setCheckoutOpen(true);
														}}
													>
														<ShoppingCart className="h-4 w-4 mr-2" />
														Checkout
													</Button>
													<Button
														variant="outline"
														className="flex-1 text-destructive border-destructive/40 hover:bg-destructive/5"
														onClick={() => {
															removeUnsubmittedOrder(order.id);
															toast({ title: "Order removed" });
														}}
													>
														Remove
													</Button>
												</div>
											</div>
										</div>
									))}
								</div>
							)
						)}

						{/* Active orders tab */}
						{activeTab === "active" && (
							<PlacedOrderList
								orders={activeOrders}
								isLoading={isLoadingOrders}
								onToggle={handleToggleAccordion}
								orderDetails={orderDetails}
								loadingDetailsId={loadingDetailsId}
								onConfirmDelivery={handleConfirmDelivery}
								confirmingOrderId={confirmingOrderId}
								noOrdersMessage="No active orders right now."
								emptyIcon={Truck}
							/>
						)}

						{/* Past orders tab */}
						{activeTab === "past" && (
							<PlacedOrderList
								orders={pastOrders}
								isLoading={isLoadingOrders}
								onToggle={handleToggleAccordion}
								orderDetails={orderDetails}
								loadingDetailsId={loadingDetailsId}
								noOrdersMessage="No past orders yet."
								emptyIcon={History}
							/>
						)}
					</motion.div>
				</AnimatePresence>
			</Tabs>
		</div>
	);
}
