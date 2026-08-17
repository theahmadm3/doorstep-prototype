import React from "react";
import type { VendorOrder } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
	formatOrderDate,
	safeParseFloat,
	getStatusClassName,
	RIDER_ASSIGNED_STATUSES,
	displayStatus,
} from "./helpers";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Phone, Package } from "lucide-react";
import OrderItemList from "./OrderItemList";

type OrderListProps = {
	title: string;
	description?: string;
	orders: VendorOrder[];
	actions: (order: VendorOrder) => React.ReactNode;
	currentPage: number;
	onPageChange: (page: number) => void;
	totalPages: number;
	isLoading: boolean;
	showActions?: boolean;
	onViewDetails: (order: VendorOrder) => void;
};

const OrderList = ({
	title,
	description,
	orders,
	actions,
	currentPage,
	onPageChange,
	totalPages,
	isLoading,
	showActions = true,
	onViewDetails,
}: OrderListProps) => {
	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>{title}</CardTitle>
					<CardDescription>{description}</CardDescription>
				</CardHeader>
				<CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
					{[...Array(3)].map((_, i) => (
						<div key={i} className="rounded-lg border bg-card p-4 space-y-3">
							<div className="flex items-center justify-between">
								<Skeleton className="h-4 w-20" />
								<div className="flex gap-2">
									<Skeleton className="h-5 w-16 rounded-full" />
									<Skeleton className="h-5 w-16 rounded-full" />
								</div>
							</div>
							<Skeleton className="h-5 w-32" />
							<div className="flex gap-2">
								<Skeleton className="h-6 w-32 rounded-md" />
								<Skeleton className="h-6 w-24 rounded-md" />
							</div>
							<div className="flex items-center justify-between pt-1 border-t">
								<Skeleton className="h-4 w-32" />
								<div className="flex gap-2">
									<Skeleton className="h-8 w-8" />
									<Skeleton className="h-8 w-24" />
								</div>
							</div>
						</div>
					))}
				</CardContent>
			</Card>
		);
	}

	if (orders.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>{title}</CardTitle>
					<CardDescription>{description}</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
						<Package className="h-8 w-8 opacity-40" />
						<p className="text-sm">No orders in this category.</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
				{orders.map((order) => {
					const isDelivery = order.order_type === "delivery";
					const riderAssigned =
						isDelivery && RIDER_ASSIGNED_STATUSES.has(order.status);
					let contactLabel: string | null = null;
					let contactName = "";
					let contactPhone = "";
					if (!isDelivery) {
						contactLabel = "Customer";
						contactName = order.customer_name;
						contactPhone = order.customer_phone;
					} else if (riderAssigned) {
						contactLabel = "Rider";
						contactName = order.driver_name ?? "";
						contactPhone = order.driver_phone ?? "";
					}
					const showContact = contactLabel !== null && contactName !== "";
					return (
						<div
							key={order.id}
							className="rounded-lg border bg-card p-4 flex flex-col gap-3 h-full hover:shadow-md transition-shadow"
						>
							{/* Top row: order ID + badges */}
							<div className="flex items-start justify-between gap-3 flex-wrap">
								<div className="min-w-0">
									<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
										Order ID
									</p>
									<p className="text-xs font-mono text-muted-foreground truncate">
										#{order.id.slice(0, 8)}
									</p>
								</div>
								<div className="flex items-start gap-3 shrink-0">
									<div>
										<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
											Order Type
										</p>
										<span
											className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${order.order_type === "delivery" ? "bg-sky-50 text-sky-700 border-sky-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}
										>
											{order.order_type === "delivery" ? "Delivery" : "Pickup"}
										</span>
									</div>
									<div className="min-w-0">
										<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
											Order Status
										</p>
										<span
											className={`inline-flex max-w-full items-center rounded-md border px-2 py-0.5 text-xs font-medium truncate ${getStatusClassName(order.status)}`}
										>
											{displayStatus(order.status)}
										</span>
									</div>
								</div>
							</div>

							{/* Items */}
							{!!order.items?.length && (
								<>
									<span className="text-sm font-bold uppercase tracking-wide">
										{" "}
										Items
									</span>
									<OrderItemList
										items={order.items ?? []}
										large={isDelivery && !riderAssigned}
									/>
								</>
							)}

							{/* Contact: Customer (pickup) or Rider (delivery) */}
							{showContact && (
								<div className="min-w-0">
									<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
										{contactLabel}
									</p>
									<p className="font-semibold text-sm truncate">
										{contactName}
									</p>
									{contactPhone && (
										<a
											href={`tel:${contactPhone}`}
											className="text-xs hover:border-b hover:border-b-gray-900 flex items-center gap-1 mt-0.5 w-fit"
										>
											<Phone className="h-3 w-3" />
											<span>{contactPhone}</span>
										</a>
									)}
								</div>
							)}

							{/* Footer: date, total, actions */}
							<div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-auto border-t">
								<div className="min-w-0">
									<p className="text-xs text-muted-foreground truncate">
										{formatOrderDate(order.created_at)}
									</p>
									<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-1">
										Order Total
									</p>
									<p className="font-semibold text-sm text-foreground">
										₦{safeParseFloat(order.subtotal_amount)}
									</p>
								</div>
								<div className="flex items-center gap-1.5">
									<Button
										variant="ghost"
										size="icon"
										aria-label="View order details"
										onClick={() => onViewDetails(order)}
										className="h-8 w-8"
									>
										<Eye className="h-4 w-4" />
									</Button>
									{showActions && (
										<div className="flex items-center gap-1.5">
											{actions(order)}
										</div>
									)}
								</div>
							</div>
						</div>
					);
				})}
			</CardContent>
			{totalPages > 1 && (
				<div className="flex items-center justify-end gap-2 py-4 px-6 border-t">
					<Button
						variant="outline"
						size="sm"
						onClick={() => onPageChange(currentPage - 1)}
						disabled={currentPage === 1}
					>
						Previous
					</Button>
					<span className="text-sm text-muted-foreground">
						{currentPage} / {totalPages}
					</span>
					<Button
						variant="outline"
						size="sm"
						onClick={() => onPageChange(currentPage + 1)}
						disabled={currentPage === totalPages}
					>
						Next
					</Button>
				</div>
			)}
		</Card>
	);
};

export default OrderList;
