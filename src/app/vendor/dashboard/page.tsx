
"use client";

import { useState, useEffect, useCallback }
from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
	getVendorAnalytics,
	getVendorOrders,
	getRestaurantProfile,
	updateRestaurantProfile,
} from "@/lib/api";
import {
	VendorAnalyticsData,
	VendorOrder,
	VendorProfile,
	VendorProfileUpdatePayload,
} from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import {
	DollarSign,
	ShoppingBag,
	CheckCircle,
	XCircle,
	ArrowUpRight,
	TrendingUp,
} from "lucide-react";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

const chartConfig = {
	revenue: {
		label: "Revenue",
		color: "hsl(var(--chart-1))",
	},
	orders: {
		label: "Orders",
		color: "hsl(var(--chart-2))",
	},
};

// Mock data for the revenue chart
const mockRevenueData = [
	{ date: "Mon", revenue: 4000 },
	{ date: "Tue", revenue: 3000 },
	{ date: "Wed", revenue: 5000 },
	{ date: "Thu", revenue: 4500 },
	{ date: "Fri", revenue: 6000 },
	{ date: "Sat", revenue: 7500 },
	{ date: "Sun", revenue: 7000 },
];

export default function VendorDashboardPage() {
	const [analytics, setAnalytics] = useState < VendorAnalyticsData | null > (null);
	const [recentOrders, setRecentOrders] = useState < VendorOrder[] > ([]);
	const [profile, setProfile] = useState < VendorProfile | null > (null);
	const [isLoading, setIsLoading] = useState(true);
	const [isToggleUpdating, setToggleUpdating] = useState(false);
	const { toast } = useToast();

	const fetchData = useCallback(async () => {
		try {
			const [analyticsData, ordersData, profileData] = await Promise.all([
				getVendorAnalytics(),
				getVendorOrders(),
				getRestaurantProfile(),
			]);
			setAnalytics(analyticsData);
			setRecentOrders(ordersData.slice(0, 5)); // Get latest 5
			setProfile(profileData);
		} catch (error) {
			toast({
				title: "Error fetching dashboard data",
				description: "Could not retrieve the latest data. Please try again.",
				variant: "destructive",
			});
		} finally {
			if (isLoading) {
				setIsLoading(false);
			}
		}
	}, [toast, isLoading]);

	useEffect(() => {
		fetchData();
		const interval = setInterval(fetchData, 60000); // Fetch data every 60 seconds
		return () => clearInterval(interval);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleStatusToggle = async (isActive: boolean) => {
		if (!profile) return;
		setToggleUpdating(true);
		try {
			const payload: VendorProfileUpdatePayload = { is_active: isActive };
			const updatedProfile = await updateRestaurantProfile(payload);
			setProfile(updatedProfile);
			toast({
				title: `Restaurant is now ${isActive ? "Open" : "Closed"}`,
				description: `You are now ${
          isActive ? "accepting" : "not accepting"
        } new orders.`,
			});
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Failed to update status.";
			toast({ title: "Update Failed", description: message, variant: "destructive" });
		} finally {
			setToggleUpdating(false);
		}
	};

	const formatCurrency = (value: string | number | undefined) => {
		if (value === undefined || value === null) return "₦0.00";
		return `₦${parseFloat(String(value)).toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
	};

	return (
		<div className="space-y-8">
			{/* Header Section */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					{isLoading ? (
						<>
							<Skeleton className="h-8 w-48 mb-2" />
							<Skeleton className="h-5 w-64" />
						</>
					) : (
						<>
							<h1 className="text-3xl font-bold font-headline">
								Welcome back, {profile?.name || "Vendor"}!
							</h1>
							<p className="text-muted-foreground">
								Here's a live look at your restaurant's performance.
							</p>
						</>
					)}
				</div>
				<div className="flex items-center space-x-3 rounded-lg border p-3">
					{isLoading || !profile ? (
						<Skeleton className="h-6 w-24" />
					) : (
						<>
							<div className="flex items-center space-x-2">
								<span
									className={`relative flex h-3 w-3 rounded-full ${
                    profile.is_active ? "bg-green-500" : "bg-red-500"
                  }`}
								>
									{profile.is_active && (
										<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
									)}
								</span>
								<Label htmlFor="restaurant-status" className="font-medium">
									{profile.is_active ? "Open" : "Closed"}
								</Label>
							</div>
							<Switch
								id="restaurant-status"
								checked={profile.is_active}
								onCheckedChange={handleStatusToggle}
								disabled={isToggleUpdating}
							/>
						</>
					)}
				</div>
			</div>

			{/* Quick Stats Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
						<DollarSign className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<Skeleton className="h-8 w-3/4" />
						) : (
							<div className="text-2xl font-bold">
								{formatCurrency(analytics?.total_revenue)}
							</div>
						)}
						<p className="text-xs text-muted-foreground">
							+20.1% from last month
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Orders</CardTitle>
						<ShoppingBag className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<Skeleton className="h-8 w-1/2" />
						) : (
							<div className="text-2xl font-bold">
								{analytics?.total_orders.toLocaleString()}
							</div>
						)}
						<p className="text-xs text-muted-foreground">
							+180.1% from last month
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Active Orders</CardTitle>
						<ShoppingBag className="h-4 w-4 text-blue-500" />
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<Skeleton className="h-8 w-1/2" />
						) : (
							<div className="text-2xl font-bold">
								+{analytics?.active_orders.toLocaleString()}
							</div>
						)}
						<p className="text-xs text-muted-foreground">
							Currently being processed
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Delivered Orders
						</CardTitle>
						<CheckCircle className="h-4 w-4 text-green-500" />
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<Skeleton className="h-8 w-1/2" />
						) : (
							<div className="text-2xl font-bold">
								{analytics?.delivered_orders.toLocaleString()}
							</div>
						)}
						<p className="text-xs text-muted-foreground">
							+19% from last month
						</p>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				{/* Revenue Chart & Top Items */}
				<div className="lg:col-span-2 space-y-8">
					<Card>
						<CardHeader>
							<CardTitle>Revenue Overview</CardTitle>
							<CardDescription>
								Your revenue trend for the past week.
							</CardDescription>
						</CardHeader>
						<CardContent>
							{isLoading ? (
								<Skeleton className="h-[250px] w-full" />
							) : (
								<ChartContainer
									config={chartConfig}
									className="min-h-[250px] w-full"
								>
									<BarChart accessibilityLayer data={mockRevenueData}>
										<CartesianGrid vertical={false} />
										<XAxis
											dataKey="date"
											tickLine={false}
											tickMargin={10}
											axisLine={false}
										/>
										<YAxis hide />
										<Tooltip
											cursor={false}
											content={<ChartTooltipContent />}
										/>
										<Bar
											dataKey="revenue"
											fill="var(--color-revenue)"
											radius={8}
										/>
									</BarChart>
								</ChartContainer>
							)}
						</CardContent>
					</Card>
				</div>
				<div className="space-y-8">
					<Card>
						<CardHeader>
							<CardTitle>Top Selling Items</CardTitle>
							<CardDescription>
								Your most popular items this month.
							</CardDescription>
						</CardHeader>
						<CardContent>
							{isLoading ? (
								<div className="space-y-4">
									<Skeleton className="h-8 w-full" />
									<Skeleton className="h-8 w-full" />
									<Skeleton className="h-8 w-full" />
								</div>
							) : analytics?.top_items && analytics.top_items.length > 0 ? (
								<ul className="space-y-4">
									{analytics.top_items.slice(0, 3).map((item) => (
										<li key={item.item_name} className="flex justify-between">
											<span className="text-sm font-medium truncate pr-2">
												{item.item_name}
											</span>
											<span className="text-sm font-bold">
												{item.orders.toLocaleString()} orders
											</span>
										</li>
									))}
								</ul>
							) : (
								<p className="text-sm text-muted-foreground text-center py-4">
									No sales data yet.
								</p>
							)}
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Recent Orders Table */}
			<Card>
				<CardHeader>
					<CardTitle>Recent Orders</CardTitle>
					<CardDescription>
						Your 5 most recent incoming or active orders.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Customer</TableHead>
									<TableHead>Amount</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Date</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{[...Array(3)].map((_, i) => (
									<TableRow key={i}>
										<TableCell>
											<Skeleton className="h-5 w-24" />
										</TableCell>
										<TableCell>
											<Skeleton className="h-5 w-16" />
										</TableCell>
										<TableCell>
											<Skeleton className="h-6 w-20" />
										</TableCell>
										<TableCell>
											<Skeleton className="h-5 w-28" />
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					) : recentOrders.length > 0 ? (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Customer</TableHead>
									<TableHead>Amount</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Date</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{recentOrders.map((order) => (
									<TableRow key={order.id}>
										<TableCell className="font-medium">
											{order.customer_name}
										</TableCell>
										<TableCell>{formatCurrency(order.total_amount)}</TableCell>
										<TableCell>
											<Badge variant="secondary">{order.status}</Badge>
										</TableCell>
										<TableCell>{order.created_at}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					) : (
						<div className="text-center py-12 text-muted-foreground">
							<p>No recent orders found.</p>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
