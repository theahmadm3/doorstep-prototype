
"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { CustomerOrder, OrderDetail } from "@/lib/types";
import { orderStatusSteps } from "@/lib/data";
import { Check, CheckCircle, CircleDotDashed, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";
import Image from "next/image";

interface CustomerOrderTimelineProps {
    order: CustomerOrder;
    details?: OrderDetail;
    isLoadingDetails?: boolean;
    onConfirmDelivery?: (orderId: string) => void;
    isConfirming?: boolean;
}

const DetailsSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
            <Skeleton className="h-6 w-1/2 mb-4" />
            <Skeleton className="h-24 w-full" />
        </div>
        <div>
            <Skeleton className="h-6 w-1/3 mb-4" />
            <Skeleton className="h-40 w-full" />
        </div>
    </div>
);

export default function CustomerOrderTimeline({ order, details, isLoadingDetails, onConfirmDelivery, isConfirming }: CustomerOrderTimelineProps) {
    const currentStatusIndex = orderStatusSteps.indexOf(order.status);
    
    return (
        <Card className="shadow-md border-muted">
            <CardContent className="pt-6">
                {isLoadingDetails ? <DetailsSkeleton /> : details ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <CardHeader className="flex flex-row items-center gap-4">
                                    <Image 
                                        src={(details.restaurant.image_url && details.restaurant.image_url.startsWith('http')) ? details.restaurant.image_url : "https://placehold.co/64x64.png"}
                                        alt={details.restaurant.name}
                                        width={64}
                                        height={64}
                                        className="rounded-lg object-cover"
                                    />
                                    <div>
                                        <CardTitle>{details.restaurant.name}</CardTitle>
                                        <CardDescription className="flex items-center gap-1 mt-1">
                                            <Star className="w-4 h-4 text-yellow-400" /> {details.restaurant.rating}
                                        </CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{details.restaurant.description}</p>
                                    <p className="text-sm mt-2"><strong>Address:</strong> {details.restaurant.address?.street_name || 'N/A'}</p>
                                </CardContent>
                            </Card>
                            
                             <Card>
                                <CardHeader>
                                    <CardTitle>Items Ordered</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-3">
                                        {details.items.map(item => (
                                            <li key={item.item_name} className="flex justify-between items-center text-sm">
                                                <span>{item.quantity} x {item.item_name}</span>
                                                <span className="font-medium">₦{(item.quantity * parseFloat(item.item_price)).toFixed(2)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <Separator className="my-4" />
                                     <div className="flex justify-between font-bold">
                                        <span>Total</span>
                                        <span>₦{parseFloat(details.total_amount).toFixed(2)}</span>
                                     </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h4 className="font-semibold mb-4 text-md">Delivery To</h4>
                                <div className="text-sm p-3 bg-muted rounded-md border">
                                    {details.delivery_address ? (
                                        <>
                                            <p className="font-semibold">{details.delivery_address.address_nickname || 'Address Details'}</p>
                                            <p>{details.delivery_address.street_address}, {details.delivery_address.city}</p>
                                        </>
                                    ) : (
                                        <p>Address not available.</p>
                                    )}
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-6 text-md">Status</h4>
                                <ol className="relative border-s border-gray-200 dark:border-gray-700">                  
                                {orderStatusSteps.map((status, index) => {
                                        const isCompleted = index < currentStatusIndex;
                                        const isCurrent = index === currentStatusIndex;

                                        return (
                                        <li className="mb-10 ms-6" key={status}>            
                                            <span className={cn(
                                                "absolute flex items-center justify-center w-6 h-6 rounded-full -start-3 ring-8 ring-white dark:ring-gray-900",
                                                isCompleted ? "bg-green-200 dark:bg-green-900" : "bg-gray-100 dark:bg-gray-700",
                                                isCurrent && "bg-blue-200 dark:bg-blue-900"
                                            )}>
                                                {isCompleted ? <Check className="w-4 h-4 text-green-500 dark:text-green-400" /> : <CircleDotDashed className="w-3 h-3 text-gray-500" />}
                                            </span>
                                            <h3 className={cn("font-semibold", isCurrent ? "text-primary" : "text-gray-900 dark:text-white")}>{status}</h3>
                                        </li>
                                        )
                                })}
                                </ol>
                            </div>
                        </div>
                    </div>
                ) : <p className="text-muted-foreground">Could not load order details.</p>}
            </CardContent>
             {order.status === 'On the Way' && onConfirmDelivery && (
                <CardFooter className="flex-col items-stretch pt-4 border-t">
                    <Button
                        onClick={() => onConfirmDelivery(order.id)}
                        disabled={isConfirming}
                    >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {isConfirming ? "Confirming..." : "Confirm Delivery"}
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}
