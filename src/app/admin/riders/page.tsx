
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, ShieldCheck, ShieldOff, Bike, CheckCircle, DollarSign } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { users } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";

const chartConfig = {
    deliveries: { label: "Deliveries", color: "hsl(var(--chart-1))" },
};

const mockRiders = users.map(u => ({ ...u, vehicle: "Bike", status: "Active", deliveries: Math.floor(Math.random() * 50) }));
const ITEMS_PER_PAGE = 10;


export default function RidersPage() {
    const { toast } = useToast();
    const [riders, setRiders] = useState(mockRiders);
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(riders.length / ITEMS_PER_PAGE);
    const paginatedRiders = riders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const toggleRiderStatus = (id: number) => {
        toast({ title: "Rider status changed", description: "This is a mock action." });
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold font-headline">Rider Management</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Riders</CardTitle>
                        <Bike className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{riders.length}</div>
                        <p className="text-xs text-muted-foreground">5 active in the last hour</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Deliveries Today</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">214</div>
                        <p className="text-xs text-muted-foreground">+12% from yesterday</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Payouts Today</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₦1,498</div>
                        <p className="text-xs text-muted-foreground">Pending for next cycle</p>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Top Performing Riders</CardTitle>
                    <CardDescription>By total deliveries this month.</CardDescription>
                </CardHeader>
                <CardContent>
                     <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                        <BarChart accessibilityLayer data={riders.slice(0, 5)}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="name"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                            />
                            <YAxis />
                            <Tooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="deliveries" fill="var(--color-deliveries)" radius={4} />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>All Riders</CardTitle>
                    <CardDescription>Onboard, verify, or manage delivery riders.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Vehicle</TableHead>
                                 <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedRiders.map(rider => (
                                <TableRow key={rider.id}>
                                    <TableCell className="font-medium">{rider.name}</TableCell>
                                    <TableCell>{rider.email}</TableCell>
                                    <TableCell>{rider.vehicle}</TableCell>
                                    <TableCell>
                                        <Badge variant="default" className="bg-green-600">{rider.status}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => toggleRiderStatus(rider.id)}>
                                                    <ShieldCheck className="mr-2 h-4 w-4" /> Verify
                                                </DropdownMenuItem>
                                                 <DropdownMenuItem onClick={() => toggleRiderStatus(rider.id)}>
                                                    <ShieldOff className="mr-2 h-4 w-4" /> Suspend
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
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
                        onClick={() => handlePageChange(currentPage - 1)}
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
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </Button>
                </div>
            </Card>
        </div>
    );
}
