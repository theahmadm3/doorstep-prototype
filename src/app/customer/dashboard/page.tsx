
"use client";

import { getRestaurants } from "@/lib/api";
import CustomerDashboardClient from "./page.client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

function DashboardSkeleton() {
    return (
         <div className="space-y-12">
            <div className="text-left">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-6 w-1/2 mt-4" />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-6 w-3/4" />
                         <Skeleton className="h-4 w-1/2" />
                    </div>
                ))}
            </div>
        </div>
    )
}

export default function CustomerDashboardPage() {
    const { data: restaurants, isLoading } = useQuery({
        queryKey: ['restaurants'],
        queryFn: getRestaurants
    });

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    return (
        <CustomerDashboardClient restaurants={restaurants || []} />
    );
}

