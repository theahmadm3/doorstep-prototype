
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, ShieldOff, Trash2, Utensils, DollarSign, Package } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { restaurants, analyticsData } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const chartConfig = {
    sales: { label: "Sales (₦)", color: "hsl(var(--chart-1))" },
    orders: { label: "Orders", color: "hsl(var(--chart-2))" },
};

const ITEMS_PER_PAGE = 10;

export default function VendorsPage() {
    const { toast } = useToast();
    const [vendors, setVendors] = useState(restaurants);
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(vendors.length / ITEMS_PER_PAGE);
    const paginatedVendors = vendors.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const toggleVendorStatus = (id: number) => {
        toast({ title: "Vendor status changed", description: "This is a mock action." });
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold font-headline">Vendor Management</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
                        <Utensils className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{restaurants.length}</div>
                        <p className="text-xs text-muted-foreground">+2 since last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Vendor Sales</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₦1.1M</div>
                        <p className="text-xs text-muted-foreground">Across all vendors this month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Orders per Vendor</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">3,058</div>
                        <p className="text-xs text-muted-foreground">Average for last 30 days</p>
                    </CardContent>
                </Card>
            </div>
            
             <Card>
				<CardHeader>
					<CardTitle>Sales & Orders by Restaurant</CardTitle>
					<CardDescription>
						Performance of top restaurants over the last month.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<ChartContainer config={chartConfig} className="min-h-[400px] w-full">
						<BarChart accessibilityLayer data={analyticsData.topRestaurants}>
							<CartesianGrid vertical={false} />
							<XAxis
								dataKey="name"
								tickLine={false}
								tickMargin={10}
								axisLine={false}
							/>
							<YAxis yAxisId="left" stroke="hsl(var(--chart-1))" />
							<YAxis yAxisId="right" orientation="right" stroke="hsl(var(--chart-2))" />
							<Tooltip content={<ChartTooltipContent />} />
							<Bar dataKey="sales" fill="var(--color-sales)" radius={4} yAxisId="left" name="Sales" />
							<Bar dataKey="orders" fill="var(--color-orders)" radius={4} yAxisId="right" name="Orders" />
						</BarChart>
					</ChartContainer>
				</CardContent>
			</Card>

            <Card>
                <CardHeader>
                    <CardTitle>All Vendors</CardTitle>
                    <CardDescription>Approve, disable, or manage restaurant partners.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="w-full whitespace-nowrap">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedVendors.map(vendor => (
                                    <TableRow key={vendor.id}>
                                        <TableCell>#{vendor.id}</TableCell>
                                        <TableCell className="font-medium">{vendor.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="default" className="bg-green-600">Active</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => toggleVendorStatus(vendor.id)}>
                                                        <ShieldOff className="mr-2 h-4 w-4" /> Disable
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-600">
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
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
