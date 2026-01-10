
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getRiderOrders } from "@/lib/api";
import { RiderOrder, OrderStatus } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { Phone, MapPin, DollarSign } from "lucide-react";
import RiderOrderActions from "@/components/rider/rider-order-actions";

const OngoingOrderCard = ({ order, onActionSuccess }: { order: RiderOrder, onActionSuccess: () => void }) => {
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Order #{order.id.slice(0, 8)}</CardTitle>
                        <CardDescription>{formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}</CardDescription>
                    </div>
                    <Badge variant="secondary">{order.status}</Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Customer</h4>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{order.customer.name} - {order.customer.phone}</span>
                    </div>
                </div>
                <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Restaurant Address</h4>
                     <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span className="text-xs">{order.restaurant}</span>
                    </div>
                </div>
                <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Delivery Address</h4>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span className="text-xs">{order.delivery_address_str}</span>
                    </div>
                </div>
                 <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Payout</h4>
                    <div className="flex items-center gap-2 font-bold text-green-600">
                        <DollarSign className="h-4 w-4" />
                        <span>₦{parseFloat(order.delivery_fee).toFixed(2)}</span>
                    </div>
                </div>
                <RiderOrderActions order={order} onSuccess={onActionSuccess} />
            </CardContent>
        </Card>
    );
};

const PastOrderRow = ({ order }: { order: RiderOrder }) => {
    return (
        <Card className="p-4 flex justify-between items-center">
            <div>
                <p className="font-semibold">Order #{order.id.slice(0,8)}</p>
                <p className="text-sm text-muted-foreground">{format(new Date(order.created_at), 'dd MMM yyyy')}</p>
            </div>
            <div className="text-right">
                <p className="font-bold">₦{parseFloat(order.delivery_fee).toFixed(2)}</p>
                <Badge variant={order.status === 'Delivered' ? 'default' : 'secondary'} className={order.status === 'Delivered' ? "bg-green-600 text-white" : ""}>
                    {order.status}
                </Badge>
            </div>
        </Card>
    );
}

const OrdersSkeleton = () => (
    <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
            <Card key={i}>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <Skeleton className="h-6 w-32 mb-2" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="h-6 w-20" />
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-12 w-full" />
                </CardContent>
            </Card>
        ))}
    </div>
);

export default function RiderOrdersPage() {
    const { toast } = useToast();
    const { data: orders = [], isLoading, isError, refetch } = useQuery({
        queryKey: ['riderOrders'],
        queryFn: getRiderOrders,
        onError: () => {
            toast({
                title: "Error fetching orders",
                description: "Could not retrieve your orders.",
                variant: "destructive"
            });
        }
    });

    const pastStatuses: OrderStatus[] = ["Delivered", "Cancelled", "Rejected"];
    const ongoingOrders = orders.filter(o => !pastStatuses.includes(o.status));
    const pastOrders = orders.filter(o => pastStatuses.includes(o.status));


    const handleActionSuccess = () => {
        refetch();
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold font-headline">Your Deliveries</h1>
            
            <div className="space-y-6">
                <h2 className="text-2xl font-semibold">Ongoing Deliveries</h2>
                {isLoading ? (
                    <OrdersSkeleton />
                ) : isError ? (
                    <p className="text-destructive text-center">Failed to load orders.</p>
                ) : ongoingOrders.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {ongoingOrders.map(order => (
                            <OngoingOrderCard key={order.id} order={order} onActionSuccess={handleActionSuccess} />
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-center py-8">You have no ongoing deliveries.</p>
                )}
            </div>
            
            <div className="space-y-6">
                <h2 className="text-2xl font-semibold">Past Deliveries</h2>
                 {isLoading ? (
                    <div className="space-y-4"><OrdersSkeleton /></div>
                ) : isError ? (
                     <p className="text-destructive text-center">Failed to load past orders.</p>
                ) : pastOrders.length > 0 ? (
                    <div className="space-y-4">
                        {pastOrders.map(order => (
                            <PastOrderRow key={order.id} order={order} />
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-center py-8">You have no past deliveries.</p>
                )}
            </div>
        </div>
    );
}
