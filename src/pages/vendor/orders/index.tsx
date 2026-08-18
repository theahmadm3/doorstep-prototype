import { safeParseFloat } from "@/lib/format";
import { ITEMS_PER_PAGE, displayStatus } from "./helpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
	MapPin,
} from "lucide-react";
import { useState, useEffect } from "react";
import type { VendorOrder, Rider } from "@/lib/types";
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
import OrderList from "./OrderList";

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
				variant: "destructive",
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
											₦{safeParseFloat(item.item_price)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
						<div className="flex justify-between items-center text-sm border-t pt-3">
							<span className="font-semibold">Order Total</span>
							<span className="font-semibold">
								₦{safeParseFloat(detailOrder?.subtotal_amount)}
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
