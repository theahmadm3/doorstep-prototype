"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { orders } from "@/lib/data";
import { CheckCircle, Clock } from "lucide-react";
import { useState } from "react";

const ITEMS_PER_PAGE = 10;

export default function VendorOrdersPage() {
  const ongoingOrders = orders.filter(o => o.status !== "Delivered" && o.status !== "Cancelled" && o.status !== "Order Ready" && o.status !== "Rider Assigned" && o.status !== "Rider on the Way");
  const pastOrders = orders.filter(o => o.status === "Delivered" || o.status === "Cancelled" || o.status === "Order Ready" || o.status === "Rider Assigned" || o.status === "Rider on the Way");

  const [ongoingPage, setOngoingPage] = useState(1);
  const [pastPage, setPastPage] = useState(1);

  const ongoingTotalPages = Math.ceil(ongoingOrders.length / ITEMS_PER_PAGE);
  const paginatedOngoingOrders = ongoingOrders.slice((ongoingPage - 1) * ITEMS_PER_PAGE, ongoingPage * ITEMS_PER_PAGE);

  const pastTotalPages = Math.ceil(pastOrders.length / ITEMS_PER_PAGE);
  const paginatedPastOrders = pastOrders.slice((pastPage - 1) * ITEMS_PER_PAGE, pastPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold font-headline">Manage Orders</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Ongoing Orders</CardTitle>
          <CardDescription>Orders that are currently in progress.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOngoingOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.id}</TableCell>
                  <TableCell>Customer #{order.customerId}</TableCell>
                  <TableCell>
                    <Badge variant={order.status === 'Preparing' ? 'destructive' : 'secondary'}>{order.status}</Badge>
                  </TableCell>
                  <TableCell>${order.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark as Ready
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
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
          <CardTitle>Past Orders</CardTitle>
          <CardDescription>Completed or cancelled orders.</CardDescription>
        </CardHeader>
        <CardContent>
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPastOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.id}</TableCell>
                  <TableCell>Customer #{order.customerId}</TableCell>
                  <TableCell>
                     <Badge variant={order.status === 'Delivered' ? 'default' : 'outline'} className={order.status === 'Delivered' ? 'bg-green-600' : ''}>{order.status}</Badge>
                  </TableCell>
                  <TableCell>${order.total.toFixed(2)}</TableCell>
                </TableRow>
              ))}
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
