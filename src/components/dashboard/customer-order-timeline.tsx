
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { CustomerOrder } from "@/lib/types";
import { orderStatusSteps } from "@/lib/data";
import { Check, CheckCircle, CircleDotDashed } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomerOrderTimelineProps {
    order: CustomerOrder;
    onConfirmDelivery?: (orderId: string) => void;
    isConfirming?: boolean;
}

export default function CustomerOrderTimeline({ order, onConfirmDelivery, isConfirming }: CustomerOrderTimelineProps) {
    const currentStatusIndex = orderStatusSteps.indexOf(order.status);
    
    return (
        <Card className="shadow-md border-muted">
            <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h4 className="font-semibold mb-4 text-md">Delivery To</h4>
                        <div className="text-sm p-3 bg-muted rounded-md border">
                            <p className="font-semibold">{order.delivery_address.address_nickname || 'Address Details'}</p>
                            <p>{order.delivery_address.street_address}, {order.delivery_address.city}</p>
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
