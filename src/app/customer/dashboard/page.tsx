
"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { getCustomerDashboard } from "@/lib/api";
import { useAddresses } from "@/hooks/use-addresses";
import { Skeleton } from "@/components/ui/skeleton";
import CustomerDashboardClient from "./page.client";
import { Button } from "@/components/ui/button";
import AddressSelectionModal from "@/components/location/address-selection-modal";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MapPin } from "lucide-react";

function DashboardSkeleton() {
    return (
        <div className="space-y-12">
            <div className="text-left space-y-3">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-5 w-3/4" />
            </div>

            {[...Array(3)].map((_, i) => (
                 <div key={i} className="space-y-4">
                    <Skeleton className="h-6 w-1/3 mb-4" />
                    <div className="flex gap-4 overflow-hidden pb-2">
                        {[...Array(3)].map((_, j) => (
                             <div key={j} className="w-[280px] flex-shrink-0 space-y-3">
                                 <Skeleton className="h-44 w-full rounded-2xl" />
                                 <Skeleton className="h-5 w-5/6" />
                                 <Skeleton className="h-4 w-3/4" />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}


export default function CustomerDashboardPage() {
    const { selectedAddress, isAddressesLoading } = useAddresses();
    const [isAddressModalOpen, setAddressModalOpen] = useState(false);

	const {
		data,
		error,
		fetchNextPage,
		hasNextPage,
		isFetching,
		isFetchingNextPage,
		status,
	} = useInfiniteQuery({
		queryKey: ['customerDashboard', selectedAddress?.latitude, selectedAddress?.longitude],
		queryFn: ({ pageParam = 1 }) => getCustomerDashboard(Number(selectedAddress!.latitude), Number(selectedAddress!.longitude), pageParam),
		getNextPageParam: (lastPage) => 
            lastPage.pagination.hasMore ? lastPage.pagination.currentPage + 1 : undefined,
		enabled: !!selectedAddress?.latitude && !!selectedAddress?.longitude,
        refetchOnWindowFocus: false,
	});

    if (isAddressesLoading) {
        return <DashboardSkeleton />;
    }
    
    if (!selectedAddress) {
        return (
            <>
                <AddressSelectionModal 
                    isOpen={isAddressModalOpen}
                    onClose={() => setAddressModalOpen(false)}
                />
                <div className="flex items-center justify-center h-[50vh]">
                     <Alert className="max-w-md">
                        <MapPin className="h-4 w-4" />
                        <AlertTitle>No Address Selected</AlertTitle>
                        <AlertDescription>
                            Please select a delivery address to see restaurants near you.
                             <Button variant="link" className="p-0 h-auto ml-1" onClick={() => setAddressModalOpen(true)}>
                                Select an address
                            </Button>
                        </AlertDescription>
                    </Alert>
                </div>
            </>
        )
    }

	if (status === 'pending') {
		return <DashboardSkeleton />;
	}

	if (status === 'error') {
		return <p>Error: {error.message}</p>;
	}
    
    const dashboardData = data.pages[0];
    const allRestaurants = data.pages.flatMap(page => page.allRestaurants);

	return (
		<CustomerDashboardClient
			popularNearYou={dashboardData.popularNearYou}
			featuredSelections={dashboardData.featuredSelections}
			comboDeals={dashboardData.comboDeals}
            allRestaurants={allRestaurants}
			onLoadMore={fetchNextPage}
			canLoadMore={!!hasNextPage}
			isLoadingMore={isFetchingNextPage}
		/>
	);
}
