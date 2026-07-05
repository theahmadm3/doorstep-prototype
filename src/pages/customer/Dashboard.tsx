

import { getDashboard } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/query-keys";
import CustomerDashboardClient from "./Dashboard.client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

function DashboardSkeleton() {
	return (
		<div className="space-y-8">
			<div className="space-y-3">
				<Skeleton className="h-6 w-40" />
				<div className="flex gap-3">
					{[...Array(3)].map((_, i) => (
						<div key={i} className="flex-shrink-0 space-y-2">
							<Skeleton className="h-36 w-[200px] rounded-2xl" />
							<Skeleton className="h-4 w-32" />
							<Skeleton className="h-3 w-24" />
						</div>
					))}
				</div>
			</div>
			<div className="space-y-3">
				<Skeleton className="h-6 w-44" />
				<div className="flex gap-3">
					{[...Array(3)].map((_, i) => (
						<div key={i} className="flex-shrink-0 space-y-2">
							<Skeleton className="h-44 w-[240px] rounded-2xl" />
							<Skeleton className="h-4 w-36" />
						</div>
					))}
				</div>
			</div>
			<div className="space-y-3">
				<Skeleton className="h-6 w-28" />
				<div className="grid grid-cols-2 gap-3">
					{[...Array(4)].map((_, i) => (
						<div key={i} className="space-y-2">
							<Skeleton className="aspect-square w-full rounded-2xl" />
							<Skeleton className="h-4 w-20" />
							<Skeleton className="h-3 w-28" />
						</div>
					))}
				</div>
			</div>
			<div className="space-y-3">
				<Skeleton className="h-6 w-36" />
				{[...Array(3)].map((_, i) => (
					<div key={i} className="space-y-2">
						<Skeleton className="h-52 w-full rounded-2xl" />
						<Skeleton className="h-5 w-48" />
						<Skeleton className="h-4 w-32" />
					</div>
				))}
			</div>
		</div>
	);
}

const EMPTY_DASHBOARD = {
	popularNearYou: [],
	featuredSelections: [],
	allRestaurants: [],
	comboDeals: [],
	pagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: 10, hasMore: false },
};

export default function CustomerDashboardPage() {
	const { data, isLoading } = useQuery({
		queryKey: QUERY_KEYS.dashboard,
		queryFn: () => getDashboard(),
	});

	if (isLoading) return <DashboardSkeleton />;

	return <CustomerDashboardClient data={data ?? EMPTY_DASHBOARD} />;
}
