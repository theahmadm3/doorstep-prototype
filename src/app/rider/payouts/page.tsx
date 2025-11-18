
"use client";

import PayoutManagement from "@/components/payouts/payout-management";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useRef } from "react";

interface PayoutManagementRef {
    refetch: () => void;
}

export default function RiderPayoutsPage() {
    const payoutManagementRef = useRef<PayoutManagementRef>(null);

    const handleRefresh = () => {
        payoutManagementRef.current?.refetch();
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-headline">
                        Payouts
                    </h1>
                    <p className="text-muted-foreground">
                        Manage your wallet balance and payout destinations.
                    </p>
                </div>
                <Button onClick={handleRefresh} variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Data
                </Button>
            </div>
            <PayoutManagement ref={payoutManagementRef} />
        </div>
    );
}
