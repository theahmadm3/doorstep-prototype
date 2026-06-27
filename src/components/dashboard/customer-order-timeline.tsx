"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { CustomerOrder, OrderDetail, OrderStatus } from "@/lib/types";
import { orderStatusSteps, pickupOrderStatusSteps } from "@/lib/data";
import { Check, CheckCircle, Star, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CustomerOrderTimelineProps {
	order: CustomerOrder;
	details?: OrderDetail;
	isLoadingDetails?: boolean;
	onConfirmDelivery?: (orderId: string) => void;
	isConfirming?: boolean;
}

const DetailsSkeleton = () => (
	<div className="space-y-4">
		<div className="flex gap-4">
			<Skeleton className="h-14 w-14 rounded-lg flex-shrink-0" />
			<div className="flex-1 space-y-2">
				<Skeleton className="h-5 w-1/2" />
				<Skeleton className="h-4 w-1/3" />
			</div>
		</div>
		<Skeleton className="h-px w-full" />
		<div className="space-y-3">
			<Skeleton className="h-4 w-full" />
			<Skeleton className="h-4 w-3/4" />
			<Skeleton className="h-4 w-1/2" />
		</div>
	</div>
);

function StatusTimeline({
	steps,
	currentIndex,
}: {
	steps: OrderStatus[];
	currentIndex: number;
}) {
	return (
		<ol className="space-y-0">
			{steps.map((status, index) => {
				const isCompleted = index < currentIndex;
				const isCurrent = index === currentIndex;
				const isLast = index === steps.length - 1;

				return (
					<li key={status} className="flex gap-3">
						{/* Connector column — purely flexbox, no position */}
						<div className="flex flex-col items-center flex-shrink-0">
							<div
								className={cn(
									"w-5 h-5 rounded-full flex items-center justify-center border-2",
									isCompleted
										? "bg-green-100 border-green-500 dark:bg-green-900/40 dark:border-green-500"
										: isCurrent
										? "border-primary bg-primary/10"
										: "bg-muted border-border",
								)}
							>
								{isCompleted ? (
									<Check className="w-2.5 h-2.5 text-green-600 dark:text-green-400" />
								) : isCurrent ? (
									<div className="w-2 h-2 rounded-full bg-primary" />
								) : null}
							</div>
							{!isLast && (
								<div className="w-px flex-1 bg-border my-1 min-h-[0.75rem]" />
							)}
						</div>

						{/* Label */}
						<p
							className={cn(
								"text-sm leading-tight pb-4",
								isLast && "pb-0",
								isCurrent
									? "text-primary font-semibold"
									: isCompleted
									? "text-foreground"
									: "text-muted-foreground",
							)}
						>
							{status}
						</p>
					</li>
				);
			})}
		</ol>
	);
}

export default function CustomerOrderTimeline({
	order,
	details,
	isLoadingDetails,
	onConfirmDelivery,
	isConfirming,
}: CustomerOrderTimelineProps) {
	const isPickup = order.order_type === "pickup";
	const timelineSteps = isPickup ? pickupOrderStatusSteps : orderStatusSteps;

	let currentStatusIndex = timelineSteps.indexOf(order.status);
	if (isPickup && order.status === "Picked Up by Customer") {
		const completedIndex = timelineSteps.indexOf("Completed" as OrderStatus);
		if (completedIndex > -1) currentStatusIndex = completedIndex;
	}

	if (isLoadingDetails) return <DetailsSkeleton />;

	if (!details) {
		return <p className="text-sm text-muted-foreground">Could not load order details.</p>;
	}

	return (
		<div className="space-y-5">
			{/* Restaurant row */}
			<div className="flex items-center gap-3">
				<img
					src={
						details.restaurant.image_url?.startsWith("http")
							? details.restaurant.image_url
							: "https://placehold.co/56x56.png"
					}
					alt={details.restaurant.name}
					width={56}
					height={56}
					className="rounded-lg object-cover flex-shrink-0 w-14 h-14"
				/>
				<div className="min-w-0">
					<p className="font-semibold leading-tight">{details.restaurant.name}</p>
					<div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
						<Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 flex-shrink-0" />
						<span>{details.restaurant.rating}</span>
					</div>
					{details.restaurant.address?.street_name && (
						<p className="text-xs text-muted-foreground mt-0.5 truncate">
							{details.restaurant.address.street_name}
						</p>
					)}
				</div>
			</div>

			<Separator />

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Left: items + address */}
				<div className="lg:col-span-2 space-y-5">
					{/* Items */}
					<div>
						<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
							Items Ordered
						</p>
						<div className="space-y-2">
							{details.items.map((item, i) => (
								<div key={i} className="flex items-center justify-between text-sm">
									<span className="text-muted-foreground">
										{item.quantity}× {item.item_name}
									</span>
									<span className="font-medium">
										₦{(item.quantity * parseFloat(item.item_price)).toFixed(2)}
									</span>
								</div>
							))}
						</div>
						<Separator className="my-3" />
						<div className="flex items-center justify-between font-semibold text-sm">
							<span>Total</span>
							<span>₦{parseFloat(details.total_amount).toFixed(2)}</span>
						</div>
					</div>

					{/* Delivery / pickup address */}
					<div>
						<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
							{isPickup ? "Pickup Location" : "Delivery Address"}
						</p>
						<div className="bg-muted rounded-lg px-3 py-2.5 text-sm">
							{isPickup ? (
								<>
									<p className="font-medium">{details.restaurant.name}</p>
									<p className="text-muted-foreground text-xs mt-0.5">
										{details.restaurant.address?.street_name ?? "Address not available"}
									</p>
								</>
							) : details.delivery_address ? (
								<>
									<p className="font-medium">
										{details.delivery_address.address_nickname ?? "Address Details"}
									</p>
									<p className="text-muted-foreground text-xs mt-0.5">
										{[details.delivery_address.street_address, details.delivery_address.city]
											.filter(Boolean)
											.join(", ")}
									</p>
								</>
							) : (
								<p className="text-muted-foreground">Address not available.</p>
							)}
						</div>
					</div>
				</div>

				{/* Right: OTP + status timeline */}
				<div className="space-y-5">
					{details.delivery_otp && (
						<div>
							<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
								Order Code
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<Info className="h-3.5 w-3.5 cursor-help" />
										</TooltipTrigger>
										<TooltipContent>
											<p>Show this code to confirm your order.</p>
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							</p>
							<div className="bg-muted border rounded-lg py-3 text-center">
								<span className="text-2xl font-bold tracking-widest font-mono">
									{details.delivery_otp}
								</span>
							</div>
						</div>
					)}

					<div>
						<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
							Status
						</p>
						<StatusTimeline steps={timelineSteps} currentIndex={currentStatusIndex} />
					</div>
				</div>
			</div>

			{order.status === "On the Way" && onConfirmDelivery && !isPickup && (
				<>
					<Separator />
					<Button
						className="w-full"
						onClick={() => onConfirmDelivery(order.id)}
						disabled={isConfirming}
					>
						<CheckCircle className="mr-2 h-4 w-4" />
						{isConfirming ? "Confirming..." : "Confirm Delivery"}
					</Button>
				</>
			)}
		</div>
	);
}
