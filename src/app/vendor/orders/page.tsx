
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getVendorOrders, updateVendorOrderStatus, getVendorRiders, assignRiderToOrder } from "@/lib/api";
import { CheckCircle, Clock, Utensils, ThumbsUp, Bike, ThumbsDown, Send } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import type { VendorOrder, Rider } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
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
  AlertDialogAction,
  AlertDialogCancel,
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


const ITEMS_PER_PAGE = 5;

const OrderTable = ({ title, description, orders, actions, currentPage, onPageChange, totalPages, isLoading, showActions = true }) => {
    if (isLoading) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Total</TableHead>
                                {showActions && <TableHead>Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...Array(3)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                    {showActions && <TableCell><Skeleton className="h-8 w-24" /></TableCell>}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        )
    }

    if (orders.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-center py-8">No orders in this category.</p>
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
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Total</TableHead>
                            {showActions && <TableHead>Actions</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.map((order) => (
                            <TableRow key={order.id}>
                                <TableCell className="font-medium">#{order.id.slice(0, 8)}</TableCell>
                                <TableCell>{order.customer_name}</TableCell>
                                <TableCell>{order.created_at}</TableCell>
                                <TableCell>
                                    <Badge variant={order.status === 'Preparing' ? 'destructive' : 'secondary'}>{order.status}</Badge>
                                </TableCell>
                                <TableCell>₦{parseFloat(order.total_amount).toFixed(2)}</TableCell>
                                {showActions && (
                                    <TableCell className="space-x-2">
                                        {actions(order)}
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
             {totalPages > 1 && (
                <div className="flex items-center justify-end space-x-2 py-4 px-6">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </Button>
                    <span className="text-sm">
                        Page {currentPage} of {totalPages}
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


export default function VendorOrdersPage() {
    const [orders, setOrders] = useState<VendorOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const { toast } = useToast();
    
    // State for rider assignment modal
    const [isAssignModalOpen, setAssignModalOpen] = useState(false);
    const [riders, setRiders] = useState<Rider[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<VendorOrder | null>(null);
    const [selectedRiderName, setSelectedRiderName] = useState<string>("");
    const [isAssigning, setIsAssigning] = useState(false);
    
    // State for rider type selection modal
    const [isRiderTypeModalOpen, setRiderTypeModalOpen] = useState(false);
    const [orderForRiderSelection, setOrderForRiderSelection] = useState<VendorOrder | null>(null);


    const fetchOrders = useCallback(async () => {
        // Only show main loading skeleton on initial load
        if (orders.length === 0) setIsLoading(true);
        try {
            const data = await getVendorOrders();
            setOrders(data);
        } catch (error) {
            toast({
                title: "Error fetching orders",
                description: "Could not retrieve your orders. Please try again later.",
                variant: "destructive"
            });
        } finally {
            if (isLoading) setIsLoading(false);
        }
    }, [toast, isLoading, orders.length]);

    useEffect(() => {
        fetchOrders(); // Initial fetch
        const interval = setInterval(fetchOrders, 60000); // Poll every 60 seconds

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    const handleUpdateStatus = async (orderId: string, action: 'accept' | 'reject' | 'preparing' | 'ready') => {
        if (action === 'ready') {
            const orderToUpdate = orders.find(o => o.id === orderId);
            if (orderToUpdate) {
                setOrderForRiderSelection(orderToUpdate);
                setRiderTypeModalOpen(true);
            }
            return;
        }

        setIsUpdating(orderId);
        try {
            await updateVendorOrderStatus(orderId, action);
            toast({
                title: "Success",
                description: `Order has been successfully updated.`,
            });
            await fetchOrders(); // Refetch orders to update the tables
        } catch (error) {
             const message = error instanceof Error ? error.message : "An unexpected error occurred.";
             toast({
                title: "Update Failed",
                description: message,
                variant: "destructive",
             });
        } finally {
            setIsUpdating(null);
        }
    };
    
    const handleConfirmReady = async (driverType: 'doorstep' | 'inhouse') => {
        if (!orderForRiderSelection) return;

        const orderId = orderForRiderSelection.id;
        setRiderTypeModalOpen(false);
        setIsUpdating(orderId);

        try {
            await updateVendorOrderStatus(orderId, 'ready', driverType);
            toast({
                title: "Success",
                description: "Order marked as ready for pickup.",
            });
            await fetchOrders();
        } catch (error) {
            const message = error instanceof Error ? error.message : "An unexpected error occurred.";
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
            toast({ title: "Error", description: "Could not fetch your list of riders." });
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
            toast({ title: "Success!", description: `${selectedRiderName} has been assigned to the order.` });
            setAssignModalOpen(false);
            await fetchOrders();
        } catch (error) {
             const message = error instanceof Error ? error.message : "Assignment failed.";
             toast({ title: "Error", description: message, variant: "destructive" });
        } finally {
            setIsAssigning(false);
        }
    };


    const statusOrder = { 'Accepted': 1, 'Preparing': 2 };

    const incomingOrders = orders.filter(o => o.status === "Pending");
    const ongoingOrders = orders
        .filter(o => o.status === "Accepted" || o.status === "Preparing")
        .sort((a, b) => (statusOrder[a.status as keyof typeof statusOrder] || 0) - (statusOrder[b.status as keyof typeof statusOrder] || 0));
    const readyForPickupOrders = orders.filter(o => o.status === "Ready for Pickup");
    const onTheWayOrders = orders.filter(o => o.status === "On the Way");
    const pastOrders = orders.filter(o => !["Pending", "Accepted", "Preparing", "Ready for Pickup", "On the Way"].includes(o.status));

    const [pages, setPages] = useState({
        incoming: 1,
        ongoing: 1,
        ready: 1,
        onTheWay: 1,
        past: 1,
    });
    
    const handlePageChange = (category, page) => {
        setPages(prev => ({ ...prev, [category]: page }));
    };

    const paginate = (data, page) => {
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
            <Dialog open={isAssignModalOpen} onOpenChange={setAssignModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Rider to Order #{selectedOrder?.id.slice(0, 8)}</DialogTitle>
                        <DialogDescription>
                            Select an available rider to deliver this order.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="rider-select">Rider</Label>
                        <Select onValueChange={setSelectedRiderName} defaultValue={selectedRiderName}>
                            <SelectTrigger id="rider-select">
                                <SelectValue placeholder="Select a rider" />
                            </SelectTrigger>
                            <SelectContent>
                                {riders.map(rider => (
                                    <SelectItem key={rider.name} value={rider.name}>
                                        {rider.name} - {rider.phone}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAssignModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleConfirmAssignment} disabled={isAssigning || riders.length === 0}>
                            {isAssigning ? "Assigning..." : "Confirm Assignment"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

             <AlertDialog open={isRiderTypeModalOpen} onOpenChange={setRiderTypeModalOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Order is Ready</AlertDialogTitle>
                        <AlertDialogDescription>
                            Who will be handling the delivery for this order?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="sm:justify-center pt-4">
                        <Button variant="outline" onClick={() => handleConfirmReady('inhouse')}>
                            Use In-house Rider
                        </Button>
                        <Button onClick={() => handleConfirmReady('doorstep')}>
                            Use Doorstep Rider
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <h1 className="text-3xl font-bold font-headline">Manage Orders</h1>

            <Tabs defaultValue="incoming">
                <TabsList>
                    <TabsTrigger value="incoming">
                        Incoming <Badge className="ml-2">{incomingOrders.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="ongoing">
                        Ongoing <Badge className="ml-2">{ongoingOrders.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="ready">
                        Ready for Pickup <Badge className="ml-2">{readyForPickupOrders.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="onTheWay">
                        On the Way <Badge className="ml-2">{onTheWayOrders.length}</Badge>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="incoming">
                     <OrderTable
                        title="Incoming Orders"
                        description="New orders awaiting your confirmation."
                        orders={paginatedIncoming}
                        currentPage={pages.incoming}
                        totalPages={totalPages.incoming}
                        onPageChange={(p) => handlePageChange('incoming', p)}
                        isLoading={isLoading}
                        actions={(order) => (
                            <>
                                <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(order.id, 'accept')} disabled={isUpdating === order.id}>
                                    <ThumbsUp className="mr-2 h-4 w-4" />
                                    Accept
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => handleUpdateStatus(order.id, 'reject')} disabled={isUpdating === order.id}>
                                    <ThumbsDown className="mr-2 h-4 w-4" />
                                    Reject
                                </Button>
                            </>
                        )}
                    />
                </TabsContent>
                <TabsContent value="ongoing">
                    <OrderTable
                        title="Ongoing Orders"
                        description="Orders you are currently preparing."
                        orders={paginatedOngoing}
                        currentPage={pages.ongoing}
                        totalPages={totalPages.ongoing}
                        onPageChange={(p) => handlePageChange('ongoing', p)}
                        isLoading={isLoading}
                        actions={(order) => (
                            order.status === 'Accepted' ? (
                                <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(order.id, 'preparing')} disabled={isUpdating === order.id}>
                                    <Utensils className="mr-2 h-4 w-4" />
                                    Mark as Preparing
                                </Button>
                            ) : (
                                <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(order.id, 'ready')} disabled={isUpdating === order.id}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Mark as Ready
                                </Button>
                            )
                        )}
                    />
                </TabsContent>
                 <TabsContent value="ready">
                    <OrderTable
                        title="Ready for Pickup"
                        description="Orders waiting for a rider to be assigned."
                        orders={paginatedReady}
                        currentPage={pages.ready}
                        totalPages={totalPages.ready}
                        onPageChange={(p) => handlePageChange('ready', p)}
                        isLoading={isLoading}
                        showActions={false}
                        actions={() => null}
                    />
                </TabsContent>
                 <TabsContent value="onTheWay">
                    <OrderTable
                        title="On the Way"
                        description="Orders currently out for delivery."
                        orders={paginatedOnTheWay}
                        currentPage={pages.onTheWay}
                        totalPages={totalPages.onTheWay}
                        onPageChange={(p) => handlePageChange('onTheWay', p)}
                        isLoading={isLoading}
                        showActions={false}
                        actions={() => null}
                    />
                </TabsContent>
            </Tabs>

            <div className="mt-12">
                 <OrderTable
                    title="Past Orders"
                    description="Completed or cancelled orders."
                    orders={paginatedPast}
                    currentPage={pages.past}
                    totalPages={totalPages.past}
                    onPageChange={(p) => handlePageChange('past', p)}
                    isLoading={isLoading}
                    showActions={false}
                    actions={(order) => (
                        <Badge variant={order.status === 'Delivered' ? 'default' : 'outline'} className={order.status === 'Delivered' ? 'bg-green-600' : ''}>{order.status}</Badge>
                    )}
                />
            </div>
        </div>
    );
}

    

    

    