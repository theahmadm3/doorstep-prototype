import VendorItemManagement from "@/components/dashboard/vendor-item-management";

export default function VendorConfigPage() {
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold font-headline mb-8">Menu Configuration</h1>
            <VendorItemManagement />
        </div>
    );
}
