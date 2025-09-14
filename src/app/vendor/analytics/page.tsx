
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { getVendorAnalytics } from "@/lib/api";
import { VendorAnalyticsData } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const chartConfig = {
    orders: {
      label: "Orders",
      color: "hsl(var(--chart-1))",
    },
};

export default function VendorAnalyticsPage() {
    const [analytics, setAnalytics] = useState<VendorAnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchAnalytics = useCallback(async () => {
        try {
            const data = await getVendorAnalytics();
            setAnalytics(data);
        } catch (error) {
            toast({
                title: "Error fetching analytics",
                description: "Could not retrieve your analytics data. Retrying in 60s.",
                variant: "destructive"
            });
        } finally {
            if (isLoading) setIsLoading(false);
        }
    }, [toast, isLoading]);

    useEffect(() => {
        fetchAnalytics();
        const interval = setInterval(fetchAnalytics, 60000);
        return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const formatCurrency = (value: string | number | undefined) => {
        if (value === undefined || value === null) return "₦0.00";
        return `₦${parseFloat(String(value)).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <div className="space-y-8">
             <h1 className="text-3xl font-bold font-headline">Your Analytics</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Total Revenue</CardTitle>
                        <CardDescription>All time revenue</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-10 w-3/4" /> : <p className="text-4xl font-bold">{formatCurrency(analytics?.total_revenue)}</p>}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Total Orders</CardTitle>
                        <CardDescription>All time orders</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-10 w-1/2" /> : <p className="text-4xl font-bold">{analytics?.total_orders.toLocaleString()}</p>}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Average Order Value</CardTitle>
                        <CardDescription>All time average</CardDescription>
                    </CardHeader>
                    <CardContent>
                         {isLoading || !analytics || analytics.total_orders === 0 ? 
                            (isLoading ? <Skeleton className="h-10 w-3/4" /> : <p className="text-4xl font-bold">₦0.00</p>) : 
                            <p className="text-4xl font-bold">{formatCurrency(parseFloat(analytics.total_revenue) / analytics.total_orders)}</p>
                         }
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Top Selling Items</CardTitle>
                    <CardDescription>Your best performing items of all time.</CardDescription>
                </CardHeader>
                 <CardContent>
                     {isLoading ? <Skeleton className="h-[300px] w-full" /> : (
                        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                            <BarChart accessibilityLayer data={analytics?.top_items} layout="vertical">
                                <CartesianGrid horizontal={false} />
                                <YAxis
                                    dataKey="item_name"
                                    type="category"
                                    tickLine={false}
                                    tickMargin={10}
                                    axisLine={false}
                                    tickFormatter={(value) => value.slice(0, 20)}
                                    width={120}
                                />
                                <XAxis type="number" dataKey="orders" hide/>
                                <Tooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="orders" fill="var(--color-orders)" radius={4} layout="vertical" name="Orders" />
                            </BarChart>
                        </ChartContainer>
                     )}
                </CardContent>
            </Card>
        </div>
    );
}
