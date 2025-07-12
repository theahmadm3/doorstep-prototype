"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { analyticsData } from "@/lib/data";

const chartConfig = {
    sales: {
      label: "Sales ($)",
      color: "hsl(var(--primary))",
    },
};

export default function AdminStats() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Top Performing Restaurants</CardTitle>
                    <CardDescription>By total sales this month.</CardDescription>
                </CardHeader>
                <CardContent>
                     <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                        <BarChart accessibilityLayer data={analyticsData.topRestaurants}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="name"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                                tickFormatter={(value) => value.slice(0, 10)}
                            />
                            <YAxis />
                            <Tooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Top Selling Items</CardTitle>
                    <CardDescription>By total units sold this month.</CardDescription>
                </CardHeader>
                 <CardContent>
                     <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                        <BarChart accessibilityLayer data={analyticsData.topItems} layout="vertical">
                            <CartesianGrid horizontal={false} />
                            <YAxis
                                dataKey="name"
                                type="category"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                                tickFormatter={(value) => value.slice(0, 15)}
                                width={100}
                            />
                            <XAxis type="number" dataKey="sales" hide/>
                            <Tooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="sales" fill="var(--color-sales)" radius={4} layout="vertical" />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
            <Card className="lg:col-span-2">
                 <CardHeader>
                    <CardTitle>Top Customers</CardTitle>
                    <CardDescription>Users who have placed the most orders.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead className="text-right">Total Orders</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {analyticsData.topUsers.map(user => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell className="text-right font-bold">{user.totalOrders}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
