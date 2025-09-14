
import VendorItemManagement from "@/components/dashboard/vendor-item-management";
import VendorRiderManagement from "@/components/dashboard/vendor-rider-management";
import { Separator } from "@/components/ui/separator";

export default function VendorConfigPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline mb-2">Menu Configuration</h1>
                <p className="text-muted-foreground">Add, edit, or remove items from your menu.</p>
            </div>
            <VendorItemManagement />
            <Separator className="my-8" />
            <div>
                <h1 className="text-3xl font-bold font-headline mb-2">Rider Settings</h1>
                <p className="text-muted-foreground">Manage the riders for your restaurant.</p>
            </div>
            <VendorRiderManagement />
        </div>
    );
}
