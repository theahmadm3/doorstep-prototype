"use client";

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
import { analyticsData, users, restaurants } from "@/lib/data";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

const chartConfig = {
	sales: {
		label: "Sales ($)",
		color: "hsl(var(--chart-1))",
	},
	orders: {
		label: "Orders",
		color: "hsl(var(--chart-2))",
	},
};

export default function AnalyticsPage() {
	return (
		<div className="space-y-8">
			<h1 className="text-3xl font-bold font-headline">Analytics Overview</h1>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				<Card>
					<CardHeader>
						<CardTitle>Total Sales</CardTitle>
						<CardDescription>Last 30 days</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-4xl font-bold">$1.2M</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Total Orders</CardTitle>
						<CardDescription>Last 30 days</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-4xl font-bold">12,234</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>New Users</CardTitle>
						<CardDescription>Last 30 days</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-4xl font-bold">1,204</p>
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
							<Legend />
							<Bar
								dataKey="sales"
								fill="var(--color-sales)"
								radius={4}
								yAxisId="left"
								name="Sales"
							/>
							<Bar
								dataKey="orders"
								fill="var(--color-orders)"
								radius={4}
								yAxisId="right"
								name="Orders"
							/>
						</BarChart>
					</ChartContainer>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>All Users</CardTitle>
					<CardDescription>
						A list of all users on the platform.
					</CardDescription>
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
							{users.map((user) => (
								<TableRow key={user.id}>
									<TableCell className="font-medium">{user.name}</TableCell>
									<TableCell>{user.email}</TableCell>
									<TableCell className="text-right font-bold">
										{user.totalOrders}
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
