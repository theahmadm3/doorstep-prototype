
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { orders, restaurants } from "@/lib/data";
import { CheckCircle, Package, ThumbsUp } from "lucide-react";
import { useState } from "react";

const ITEMS_PER_PAGE = 10;

export default function RiderOrdersPage() {
  const ongoingOrders = orders.filter(o => o.status === "Rider Assigned" || o.status === "Rider on the Way" || o.status === "Order Ready");
  const pastOrders = orders.filter(o => o.status === "Delivered");

  const [ongoingPage, setOngoingPage] = useState(1);
  const [pastPage, setPastPage] = useState(1);

  const ongoingTotalPages = Math.ceil(ongoingOrders.length / ITEMS_PER_PAGE);
  const paginatedOngoingOrders = ongoingOrders.slice((ongoingPage - 1) * ITEMS_PER_PAGE, ongoingPage * ITEMS_PER_PAGE);

  const pastTotalPages = Math.ceil(pastOrders.length / ITEMS_PER_PAGE);
  const paginatedPastOrders = pastOrders.slice((pastPage - 1) * ITEMS_PER_PAGE, pastPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold font-headline">Your Deliveries</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Ongoing Deliveries</CardTitle>
          <CardDescription>Deliveries that you are currently handling.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Pickup</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOngoingOrders.map((order) => {
                const restaurant = restaurants.find(r => r.id === order.restaurantId);
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.id}</TableCell>
                    <TableCell>{restaurant?.name}</TableCell>
                    <TableCell>123 Customer Ave</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{order.status}</Badge>
                    </TableCell>
                    <TableCell className="space-x-2">
                        {(order.status === 'Rider Assigned' || order.status === 'Order Ready') && (
                            <Button variant="outline" size="sm">
                                <Package className="mr-2 h-4 w-4" />
                                Mark as Picked Up
                            </Button>
                        )}
                        {order.status === 'Rider on the Way' && (
                             <Button variant="outline" size="sm">
                                <ThumbsUp className="mr-2 h-4 w-4" />
                                Mark as Delivered
                            </Button>
                        )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
        <div className="flex items-center justify-end space-x-2 py-4 px-6">
            <Button
                variant="outline"
                size="sm"
                onClick={() => setOngoingPage(ongoingPage - 1)}
                disabled={ongoingPage === 1}
            >
                Previous
            </Button>
            <span className="text-sm">
                Page {ongoingPage} of {ongoingTotalPages}
            </span>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setOngoingPage(ongoingPage + 1)}
                disabled={ongoingPage === ongoingTotalPages}
            >
                Next
            </Button>
        </div>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Past Deliveries</CardTitle>
          <CardDescription>Your completed deliveries.</CardDescription>
        </CardHeader>
        <CardContent>
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Pickup</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Payout</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPastOrders.map((order) => {
                 const restaurant = restaurants.find(r => r.id === order.restaurantId);
                 return (
                    <TableRow key={order.id}>
                        <TableCell className="font-medium">#{order.id}</TableCell>
                        <TableCell>{restaurant?.name}</TableCell>
                        <TableCell>
                            <Badge variant='default' className='bg-green-600'>{order.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">₦7.50</TableCell>
                    </TableRow>
                 )
              })}
            </TableBody>
          </Table>
        </CardContent>
         <div className="flex items-center justify-end space-x-2 py-4 px-6">
            <Button
                variant="outline"
                size="sm"
                onClick={() => setPastPage(pastPage - 1)}
                disabled={pastPage === 1}
            >
                Previous
            </Button>
            <span className="text-sm">
                Page {pastPage} of {pastTotalPages}
            </span>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setPastPage(pastPage + 1)}
                disabled={pastPage === pastTotalPages}
            >
                Next
            </Button>
        </div>
      </Card>
    </div>
  );
}
