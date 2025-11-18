
"use client";

import PayoutManagement from "@/components/payouts/payout-management";

export default function VendorPayoutsPage() {
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
            </div>
            <PayoutManagement />
        </div>
    );
}
