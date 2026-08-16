import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	getVendorOrders,
	updateVendorOrderStatus,
	getVendorRiders,
	assignRiderToOrder,
} from "@/lib/api";
import { QUERY_KEYS } from "@/lib/query-keys";
import {
	CheckCircle,
	Utensils,
	ThumbsUp,
	ThumbsDown,
	UserCheck,
	RefreshCw,
	Eye,
	MapPin,
	Phone,
	Package,
} from "lucide-react";
import { useState, useEffect } from "react";
import type { VendorOrder, VendorOrderItem, Rider } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import PickupConfirmationModal from "@/components/vendor/pickup-confirmation-modal";
import { useRefreshCooldown } from "@/hooks/use-refresh-cooldown";

const ITEMS_PER_PAGE = 5;

function displayStatus(status: string): string {
	return status === "Picked Up by Customer" ? "Customer Picked Up" : status;
}

const RIDER_ASSIGNED_STATUSES = new Set([
	"On the Way",
	"Rider Assigned",
	"Driver Assigned",
	"Arrived at Restaurant",
	"pickedup",
	"Arrived at Destination",
	"Delivered",
	"Completed",
]);

type OrderItemListProps = {
	items: VendorOrderItem[];
	large?: boolean;
};

const OrderItemList = ({ items, large = false }: OrderItemListProps) => {
	const visibleCount = large ? 4 : 3;
	const visibleItems = items.slice(0, visibleCount);
	const hiddenCount = items.length - visibleItems.length;
	return (
		<div
			className={`divide-y divide-border rounded-lg border overflow-hidden ${large ? "bg-muted/30" : "bg-muted/40"}`}
		>
			{visibleItems.map((item) => (
				<div
					key={item.id}
					className={
						large
							? "flex items-center gap-2.5 px-3 py-2.5"
							: "flex items-center gap-2 px-2.5 py-1.5"
					}
				>
					<span
						className={
							large
								? "shrink-0 inline-flex items-center justify-center rounded-md bg-primary/15 text-primary min-w-7 px-1.5 py-0.5 text-sm font-semibold"
								: "shrink-0 inline-flex items-center justify-center rounded-md bg-primary/10 text-primary min-w-6 px-1.5 py-0.5 text-xs font-semibold"
						}
					>
						{item.quantity}×
					</span>
					<span
						className={
							large
								? "min-w-0 flex-1 truncate text-base font-semibold text-foreground"
								: "min-w-0 flex-1 truncate text-sm font-medium text-foreground"
						}
					>
						{item.item_name}
					</span>
					<span
						className={
							large
								? "shrink-0 text-sm font-medium text-foreground/80"
								: "shrink-0 text-xs text-muted-foreground"
						}
					>
						₦{formatPrice(item.item_price)}
					</span>
				</div>
			))}
			{hiddenCount > 0 && (
				<div
					className={
						large
							? "px-3 py-2 text-sm text-muted-foreground"
							: "px-2.5 py-1.5 text-xs text-muted-foreground"
					}
				>
					+{hiddenCount} more
				</div>
			)}
		</div>
	);
};

function getStatusClassName(status: string): string {
	switch (status) {
		case "Pending":
			return "bg-orange-100 text-orange-700 border-orange-200";
		case "Accepted":
			return "bg-blue-100 text-blue-700 border-blue-200";
		case "Preparing":
			return "bg-purple-100 text-purple-700 border-purple-200";
		case "Ready for Pickup":
			return "bg-emerald-100 text-emerald-700 border-emerald-200";
		case "On the Way":
			return "bg-sky-100 text-sky-700 border-sky-200";
		case "Delivered":
		case "Completed":
			return "bg-emerald-600 text-white border-emerald-600";
		case "Cancelled":
		case "Rejected":
			return "bg-red-100 text-red-700 border-red-200";
		default:
			return "bg-muted text-muted-foreground border-border";
	}
}

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
										{order.created_at}
									</p>
									<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-1">
										Order Total
									</p>
									<p className="font-semibold text-sm text-foreground">
										₦{formatPrice(order.subtotal_amount)}
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

const formatPrice = (value: string | number | undefined | null): string => {
	const num = parseFloat(String(value ?? "0"));
	return isNaN(num) ? "0.00" : num.toFixed(2);
};

export default function VendorOrdersPage() {
	const { toast } = useToast();
	const { isCooldownActive, remainingSeconds, triggerRefresh } =
		useRefreshCooldown();

	const {
		data: orders = [],
		isLoading,
		isFetching,
		isError,
		refetch,
	} = useQuery<VendorOrder[], Error>({
		queryKey: QUERY_KEYS.vendorOrders,
		queryFn: getVendorOrders,
		staleTime: 30_000,
	});

	useEffect(() => {
		if (isError) {
			toast({
				title: "Error fetching orders",
				description: "Could not retrieve your orders. Please try again later.",
				variant: "destructive",
			});
		}
	}, [isError, toast]);

	const [isUpdating, setIsUpdating] = useState<string | null>(null);
	const [detailOrder, setDetailOrder] = useState<VendorOrder | null>(null);

	// State for rider assignment modal
	const [isAssignModalOpen, setAssignModalOpen] = useState(false);
	const [riders, setRiders] = useState<Rider[]>([]);
	const [selectedOrder, setSelectedOrder] = useState<VendorOrder | null>(null);
	const [selectedRiderName, setSelectedRiderName] = useState<string>("");
	const [isAssigning, setIsAssigning] = useState(false);

	// State for rider type selection modal
	const [isRiderTypeModalOpen, setRiderTypeModalOpen] = useState(false);
	const [orderForRiderSelection, setOrderForRiderSelection] =
		useState<VendorOrder | null>(null);

	// State for pickup confirmation modal
	const [isPickupModalOpen, setPickupModalOpen] = useState(false);
	const [orderForPickup, setOrderForPickup] = useState<VendorOrder | null>(
		null,
	);

	const handleRefresh = () => {
		triggerRefresh(() => refetch());
	};

	const handleUpdateStatus = async (
		orderId: string,
		action: "accept" | "reject" | "preparing" | "ready",
	) => {
		const orderToUpdate = orders.find((o) => o.id === orderId);
		if (!orderToUpdate) return;

		if (action === "ready") {
			if (orderToUpdate.order_type === "pickup") {
				setIsUpdating(orderId);
				try {
					await updateVendorOrderStatus(orderId, "ready", "inhouse");
					toast({
						title: "Success",
						description: "Order marked as Ready for Pickup.",
					});
					await refetch();
				} catch (error) {
					const message =
						error instanceof Error
							? error.message
							: "An unexpected error occurred.";
					toast({
						title: "Update Failed",
						description: message,
						variant: "destructive",
					});
				} finally {
					setIsUpdating(null);
				}
				return;
			} else {
				setOrderForRiderSelection(orderToUpdate);
				setRiderTypeModalOpen(true);
				return;
			}
		}

		setIsUpdating(orderId);
		try {
			await updateVendorOrderStatus(orderId, action);
			toast({
				title: "Success",
				description: `Order has been successfully updated.`,
			});
			await refetch();
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "An unexpected error occurred.";
			toast({
				title: "Update Failed",
				description: message,
				variant: "destructive",
			});
		} finally {
			setIsUpdating(null);
		}
	};

	const handleConfirmReadyForDelivery = async (
		driverType: "doorstep" | "inhouse",
	) => {
		if (!orderForRiderSelection) return;

		const orderId = orderForRiderSelection.id;
		setRiderTypeModalOpen(false);
		setIsUpdating(orderId);

		try {
			await updateVendorOrderStatus(orderId, "ready", driverType);
			toast({
				title: "Success",
				description: "Order marked as ready for pickup by rider.",
			});
			await refetch();
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "An unexpected error occurred.";
			toast({
				title: "Update Failed",
				description: message,
				variant: "destructive",
			});
		} finally {
			setIsUpdating(null);
			setOrderForRiderSelection(null);
		}
	};

	const handleOpenAssignModal = async (order: VendorOrder) => {
		setSelectedOrder(order);
		try {
			const fetchedRiders = await getVendorRiders();
			setRiders(fetchedRiders);
			if (fetchedRiders.length > 0) {
				setSelectedRiderName(fetchedRiders[0].name);
			}
			setAssignModalOpen(true);
		} catch (error) {
			toast({
				title: "Error",
				description: "Could not fetch your list of riders.",
			});
		}
	};

	const handleConfirmAssignment = async () => {
		if (!selectedOrder || !selectedRiderName) {
			toast({ title: "Error", description: "Please select a rider." });
			return;
		}
		setIsAssigning(true);
		try {
			await assignRiderToOrder(selectedOrder.id, selectedRiderName);
			toast({
				title: "Success!",
				description: `${selectedRiderName} has been assigned to the order.`,
			});
			setAssignModalOpen(false);
			await refetch();
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Assignment failed.";
			toast({ title: "Error", description: message, variant: "destructive" });
		} finally {
			setIsAssigning(false);
		}
	};

	const statusOrder = { Accepted: 1, Preparing: 2 };

	const incomingOrders = orders.filter((o) => o.status === "Pending");
	const ongoingOrders = orders
		.filter((o) => o.status === "Accepted" || o.status === "Preparing")
		.sort(
			(a, b) =>
				(statusOrder[a.status as keyof typeof statusOrder] || 0) -
				(statusOrder[b.status as keyof typeof statusOrder] || 0),
		);
	const readyForPickupOrders = orders.filter(
		(o) => o.status === "Ready for Pickup",
	);
	const onTheWayOrders = orders.filter((o) => o.status === "On the Way");
	const pastOrders = orders.filter(
		(o) =>
			![
				"Pending",
				"Accepted",
				"Preparing",
				"Ready for Pickup",
				"On the Way",
			].includes(o.status),
	);

	const [pages, setPages] = useState({
		incoming: 1,
		ongoing: 1,
		ready: 1,
		onTheWay: 1,
		past: 1,
	});

	const handlePageChange = (category: string, page: number) => {
		setPages((prev) => ({ ...prev, [category]: page }));
	};

	const paginate = (data: VendorOrder[], page: number) => {
		const start = (page - 1) * ITEMS_PER_PAGE;
		const end = start + ITEMS_PER_PAGE;
		return data.slice(start, end);
	};

	const paginatedIncoming = paginate(incomingOrders, pages.incoming);
	const paginatedOngoing = paginate(ongoingOrders, pages.ongoing);
	const paginatedReady = paginate(readyForPickupOrders, pages.ready);
	const paginatedOnTheWay = paginate(onTheWayOrders, pages.onTheWay);
	const paginatedPast = paginate(pastOrders, pages.past);

	const totalPages = {
		incoming: Math.ceil(incomingOrders.length / ITEMS_PER_PAGE),
		ongoing: Math.ceil(ongoingOrders.length / ITEMS_PER_PAGE),
		ready: Math.ceil(readyForPickupOrders.length / ITEMS_PER_PAGE),
		onTheWay: Math.ceil(onTheWayOrders.length / ITEMS_PER_PAGE),
		past: Math.ceil(pastOrders.length / ITEMS_PER_PAGE),
	};

	return (
		<div className="space-y-8">
			{orderForPickup && (
				<PickupConfirmationModal
					isOpen={isPickupModalOpen}
					onClose={() => setPickupModalOpen(false)}
					orderId={orderForPickup.id}
					onSuccess={() => {
						refetch();
						setOrderForPickup(null);
					}}
				/>
			)}
			<Dialog open={isAssignModalOpen} onOpenChange={setAssignModalOpen}>
				<DialogContent>
					{selectedOrder && (
						<>
							<DialogHeader>
								<DialogTitle>
									Assign Rider to Order #{selectedOrder.id.slice(0, 8)}
								</DialogTitle>
								<DialogDescription>
									Select an available rider to deliver this order.
								</DialogDescription>
							</DialogHeader>
							<div className="py-4">
								<Label htmlFor="rider-select">Rider</Label>
								<Select
									onValueChange={setSelectedRiderName}
									defaultValue={selectedRiderName}
								>
									<SelectTrigger id="rider-select">
										<SelectValue placeholder="Select a rider" />
									</SelectTrigger>
									<SelectContent>
										{riders.map((rider) => (
											<SelectItem key={rider.name} value={rider.name}>
												{rider.name} - {rider.phone}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<DialogFooter>
								<Button variant="outline" onClick={() => setAssignModalOpen(false)}>
									Cancel
								</Button>
								<Button
									onClick={handleConfirmAssignment}
									disabled={isAssigning || riders.length === 0}
								>
									{isAssigning ? "Assigning..." : "Confirm Assignment"}
								</Button>
							</DialogFooter>
						</>
					)}
				</DialogContent>
			</Dialog>

			<AlertDialog
				open={isRiderTypeModalOpen}
				onOpenChange={setRiderTypeModalOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Confirm Order is Ready</AlertDialogTitle>
						<AlertDialogDescription>
							Who will be handling the delivery for this order?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter className="sm:justify-center pt-4">
						<Button
							variant="outline"
							onClick={() => handleConfirmReadyForDelivery("inhouse")}
						>
							Use In-house Rider
						</Button>
						<Button onClick={() => handleConfirmReadyForDelivery("doorstep")}>
							Use Doorstep Rider
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<Dialog
				open={!!detailOrder}
				onOpenChange={(open) => {
					if (!open) setDetailOrder(null);
				}}
			>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>Order #{detailOrder?.id.slice(0, 8)}</DialogTitle>
						<DialogDescription>
							{detailOrder?.customer_name} · {detailOrder?.customer_phone}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-2">
						{detailOrder?.order_type === "delivery" &&
							detailOrder.delivery_address_str && (
								<div className="flex items-start gap-2 text-sm text-muted-foreground">
									<MapPin className="h-4 w-4 mt-0.5 shrink-0" />
									<span>{detailOrder.delivery_address_str}</span>
								</div>
							)}
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Item</TableHead>
									<TableHead className="text-center">Qty</TableHead>
									<TableHead>Options</TableHead>
									<TableHead className="text-right">Price</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{detailOrder?.items.map((item) => (
									<TableRow key={item.id}>
										<TableCell className="font-medium">
											{item.item_name}
										</TableCell>
										<TableCell className="text-center">
											{item.quantity}
										</TableCell>
										<TableCell className="text-muted-foreground text-sm">
											{item.selected_options.length > 0
												? item.selected_options.join(", ")
												: "—"}
										</TableCell>
										<TableCell className="text-right">
											₦{formatPrice(item.item_price)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
						<div className="flex justify-between items-center text-sm border-t pt-3">
							<span className="font-semibold">Order Total</span>
							<span className="font-semibold">
								₦{formatPrice(detailOrder?.subtotal_amount)}
							</span>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<h1 className="text-3xl font-bold font-headline">Manage Orders</h1>
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

			<Tabs defaultValue="incoming" className="w-full">
				<TabsList
					style={{ flexWrap: "nowrap" }}
					className="w-full overflow-x-auto [&_.MuiTabs-flexContainer]:gap-x-1 md:[&_.MuiTabs-flexContainer]:gap-x-4 lg:[&_.MuiTabs-flexContainer]:justify-between xl:[&_.MuiTabs-flexContainer]:gap-x-8"
				>
					<TabsTrigger value="incoming" className="min-[1000px]:!whitespace-nowrap">
						Incoming <Badge className="ml-2">{incomingOrders.length}</Badge>
					</TabsTrigger>
					<TabsTrigger value="ongoing" className="min-[1000px]:!whitespace-nowrap">
						Ongoing <Badge className="ml-2">{ongoingOrders.length}</Badge>
					</TabsTrigger>
					<TabsTrigger value="ready" className="min-[1000px]:!whitespace-nowrap">
						Ready for Pickup{" "}
						<Badge className="ml-2">{readyForPickupOrders.length}</Badge>
					</TabsTrigger>
					<TabsTrigger value="onTheWay" className="min-[1000px]:!whitespace-nowrap">
						On the Way <Badge className="ml-2">{onTheWayOrders.length}</Badge>
					</TabsTrigger>
				</TabsList>

				<TabsContent value="incoming">
					<OrderList
						title="Incoming Orders"
						description="New orders awaiting your confirmation."
						orders={paginatedIncoming}
						currentPage={pages.incoming}
						totalPages={totalPages.incoming}
						onPageChange={(p) => handlePageChange("incoming", p)}
						isLoading={isLoading}
						onViewDetails={setDetailOrder}
						actions={(order) => (
							<>
								<Button
									variant="outline"
									size="sm"
									onClick={() => handleUpdateStatus(order.id, "accept")}
									disabled={isUpdating === order.id}
								>
									<ThumbsUp className="mr-2 h-4 w-4" />
									Accept
								</Button>
								<Button
									variant="destructive"
									size="sm"
									onClick={() => handleUpdateStatus(order.id, "reject")}
									disabled={isUpdating === order.id}
								>
									<ThumbsDown className="mr-2 h-4 w-4" />
									Reject
								</Button>
							</>
						)}
					/>
				</TabsContent>
				<TabsContent value="ongoing">
					<OrderList
						title="Ongoing Orders"
						description="Orders you are currently preparing."
						orders={paginatedOngoing}
						currentPage={pages.ongoing}
						totalPages={totalPages.ongoing}
						onPageChange={(p) => handlePageChange("ongoing", p)}
						isLoading={isLoading}
						onViewDetails={setDetailOrder}
						actions={(order) =>
							order.status === "Accepted" ? (
								<Button
									variant="outline"
									size="sm"
									onClick={() => handleUpdateStatus(order.id, "preparing")}
									disabled={isUpdating === order.id}
								>
									<Utensils className="mr-2 h-4 w-4" />
									Mark as Preparing
								</Button>
							) : (
								<Button
									variant="outline"
									size="sm"
									onClick={() => handleUpdateStatus(order.id, "ready")}
									disabled={isUpdating === order.id}
								>
									<CheckCircle className="mr-2 h-4 w-4" />
									Mark as Ready
								</Button>
							)
						}
					/>
				</TabsContent>
				<TabsContent value="ready">
					<OrderList
						title="Ready for Pickup"
						description="Orders waiting for pickup by rider or customer."
						orders={paginatedReady}
						currentPage={pages.ready}
						totalPages={totalPages.ready}
						onPageChange={(p) => handlePageChange("ready", p)}
						isLoading={isLoading}
						onViewDetails={setDetailOrder}
						actions={(order) =>
							order.order_type === "pickup" ? (
								<Button
									variant="default"
									size="sm"
									onClick={() => {
										setOrderForPickup(order);
										setPickupModalOpen(true);
									}}
									disabled={isUpdating === order.id}
								>
									<UserCheck className="mr-2 h-4 w-4" />
									Confirm Pickup
								</Button>
							) : (
								<span>Awaiting Doorstep rider</span>
							)
						}
					/>
				</TabsContent>
				<TabsContent value="onTheWay">
					<OrderList
						title="On the Way"
						description="Orders currently out for delivery."
						orders={paginatedOnTheWay}
						currentPage={pages.onTheWay}
						totalPages={totalPages.onTheWay}
						onPageChange={(p) => handlePageChange("onTheWay", p)}
						isLoading={isLoading}
						onViewDetails={setDetailOrder}
						showActions={false}
						actions={() => null}
					/>
				</TabsContent>
			</Tabs>

			<div className="mt-12">
				<OrderList
					title="Past Orders"
					description="Completed or cancelled orders."
					orders={paginatedPast}
					currentPage={pages.past}
					totalPages={totalPages.past}
					onPageChange={(p) => handlePageChange("past", p)}
					isLoading={isLoading}
					onViewDetails={setDetailOrder}
					showActions={false}
					actions={(order) => (
						<Badge
							variant={order.status === "Delivered" ? "default" : "outline"}
							className={order.status === "Delivered" ? "bg-green-600" : ""}
						>
							{displayStatus(order.status)}
						</Badge>
					)}
				/>
			</div>
		</div>
	);
}
