
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MapPin, DollarSign, CheckCircle, Package, Send } from "lucide-react";

// Mock data for available deliveries
const availableDeliveries = [
  { id: 'ORD101', restaurant: 'Pizza Palace', destination: '123 Allen Avenue, Ikeja', payout: 7.50 },
  { id: 'ORD102', restaurant: 'Burger Barn', destination: '456 Ademola Adetokunbo, Wuse II', payout: 6.00 },
  { id: 'ORD103', restaurant: 'Sushi Station', destination: '789 Bourdillon Rd, Ikoyi', payout: 8.25 },
];

export default function RiderDashboardPage() {
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold font-headline">Rider Dashboard</h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Available Deliveries</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">3</div>
                        <p className="text-xs text-muted-foreground">New opportunities nearby</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">8</div>
                        <p className="text-xs text-muted-foreground">Keep up the great work!</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Earnings Today</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₦62.50</div>
                        <p className="text-xs text-muted-foreground">Your current payout</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Available Deliveries</CardTitle>
                    <CardDescription>Accept a new delivery to get started.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead>From</TableHead>
                                <TableHead>To</TableHead>
                                <TableHead className="text-right">Payout</TableHead>
                                <TableHead>Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {availableDeliveries.map((delivery) => (
                                <TableRow key={delivery.id}>
                                    <TableCell className="font-medium">#{delivery.id}</TableCell>
                                    <TableCell>{delivery.restaurant}</TableCell>
                                    <TableCell>{delivery.destination}</TableCell>
                                    <TableCell className="text-right font-semibold">₦{delivery.payout.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Button variant="outline" size="sm">
                                            <Send className="mr-2 h-4 w-4" /> Accept
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
