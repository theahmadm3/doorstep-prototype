import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatCurrency, formatOrderDate } from "@/lib/format";
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
	toggleRestaurantOpenStatus,
} from "@/lib/api";
import { QUERY_KEYS } from "@/lib/query-keys";
import { useToast } from "@/hooks/use-toast";
import {
	DollarSign,
	ShoppingBag,
	CheckCircle,
} from "lucide-react";
import {
	ChartContainer,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useNavigate } from "react-router-dom";

const chartConfig = {
	count: {
		label: "Orders",
		color: "hsl(var(--chart-1))",
	},
};

export default function VendorDashboardPage() {
	const { toast } = useToast();
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const { data: analytics, isLoading: isLoadingAnalytics } = useQuery({
		queryKey: QUERY_KEYS.vendorAnalytics,
		queryFn: getVendorAnalytics,
		refetchInterval: 60000,
	});

	const { data: allOrders = [], isLoading: isLoadingOrders } = useQuery({
		queryKey: QUERY_KEYS.vendorOrders,
		queryFn: getVendorOrders,
		refetchInterval: 60000,
	});

	const { data: profile, isLoading: isLoadingProfile } = useQuery({
		queryKey: QUERY_KEYS.vendorProfile,
		queryFn: getRestaurantProfile,
		refetchInterval: 60000,
	});

	const isLoading = isLoadingAnalytics || isLoadingOrders || isLoadingProfile;
	const recentOrders = allOrders.slice(0, 5);

	const toggleMutation = useMutation({
		mutationFn: toggleRestaurantOpenStatus,
		onSuccess: (updatedProfile) => {
			queryClient.setQueryData(QUERY_KEYS.vendorProfile, updatedProfile);
			toast({
				title: `Restaurant is now ${updatedProfile.is_open ? "Open" : "Closed"}`,
				description: `You are now ${
					updatedProfile.is_open ? "accepting" : "not accepting"
				} new orders.`,
			});
		},
		onError: (error: Error) => {
			toast({ title: "Update Failed", description: error.message, variant: "destructive" });
		},
	});

	const handleStatusToggle = () => {
		toggleMutation.mutate();
	};

	const handleGoToOrders = () => {
		navigate("/vendor/orders");
	};

	const orderBreakdownData = analytics
		? [
				{ label: "Delivered", count: analytics.delivered_orders },
				{ label: "Active", count: analytics.active_orders },
				{ label: "Cancelled", count: analytics.cancelled_orders },
		  ]
		: [];

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
										profile.is_open ? "bg-green-500" : "bg-red-500"
									}`}
								>
									{profile.is_open && (
										<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
									)}
								</span>
								<Label htmlFor="restaurant-status" className="font-medium">
									{profile.is_open ? "Open for orders" : "Currently closed"}
								</Label>
							</div>
							<Switch
								id="restaurant-status"
								checked={profile.is_open}
								onCheckedChange={handleStatusToggle}
								disabled={toggleMutation.isPending}
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
								{analytics?.total_orders?.toLocaleString() ?? "—"}
							</div>
						)}
					</CardContent>
				</Card>

				<Card
					className="transition-all hover:shadow-md cursor-pointer"
					onClick={handleGoToOrders}
					role="button"
					tabIndex={0}
					onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleGoToOrders(); }}
				>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Active Orders</CardTitle>
						<ShoppingBag className="h-4 w-4 text-blue-500" />
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<Skeleton className="h-8 w-1/2" />
						) : (
							<div className="text-2xl font-bold">
								{analytics?.active_orders?.toLocaleString() ?? "—"}
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
								{analytics?.delivered_orders?.toLocaleString() ?? "—"}
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				<div className="lg:col-span-2 space-y-8">
					<Card>
						<CardHeader>
							<CardTitle>Order Breakdown</CardTitle>
							<CardDescription>
								Delivered, active, and cancelled orders.
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
									<BarChart accessibilityLayer data={orderBreakdownData}>
										<CartesianGrid vertical={false} />
										<XAxis
											dataKey="label"
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
											dataKey="count"
											fill="var(--color-count)"
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
									<TableHead>Items</TableHead>
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
											<Skeleton className="h-5 w-32" />
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
									<TableHead>Items</TableHead>
									<TableHead>Amount</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Date</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{recentOrders.map((order) => {
									const visibleItems = order.items?.slice(0, 2) ?? [];
									const hiddenCount =
										(order.items?.length ?? 0) - visibleItems.length;
									return (
										<TableRow key={order.id}>
											<TableCell className="font-medium">
												{order.customer_name}
											</TableCell>
											<TableCell>
												{visibleItems.length > 0 ? (
													<div className="flex flex-wrap gap-1">
														{visibleItems.map((item) => (
															<span
																key={item.id}
																className="bg-muted rounded-md px-2 py-0.5 text-xs whitespace-nowrap"
															>
																{item.quantity}× {item.item_name}
															</span>
														))}
														{hiddenCount > 0 && (
															<span className="text-xs text-muted-foreground">
																+{hiddenCount} more
															</span>
														)}
													</div>
												) : (
													<span className="text-muted-foreground">—</span>
												)}
											</TableCell>
											<TableCell>
												{formatCurrency(order.total_amount)}
											</TableCell>
											<TableCell>
												<Badge variant="secondary">{order.status}</Badge>
											</TableCell>
											<TableCell>{formatOrderDate(order.created_at)}</TableCell>
										</TableRow>
									);
								})}
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
