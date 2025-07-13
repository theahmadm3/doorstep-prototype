"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { analyticsData } from "@/lib/data";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const chartConfig = {
    sales: {
      label: "Sales ($)",
      color: "hsl(var(--chart-1))",
    },
};

export default function VendorAnalyticsPage() {
    return (
        <div className="space-y-8">
             <h1 className="text-3xl font-bold font-headline">Your Analytics</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Total Sales</CardTitle>
                        <CardDescription>Last 30 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">$45,231</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Total Orders</CardTitle>
                        <CardDescription>Last 30 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">350</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Average Order Value</CardTitle>
                        <CardDescription>Last 30 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">$129.23</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Top Selling Items</CardTitle>
                    <CardDescription>Your best performing items this month.</CardDescription>
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
        </div>
    );
}
