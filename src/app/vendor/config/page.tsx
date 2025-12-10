
import CategoryManagement from "@/components/vendor/category-management";
import OptionManagement from "@/components/vendor/option-management";
import VendorItemManagement from "@/components/dashboard/vendor-item-management";
import VendorRiderManagement from "@/components/dashboard/vendor-rider-management";
import { Separator } from "@/components/ui/separator";

export default function VendorConfigPage() {
	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-3xl font-bold font-headline mb-2">
					Menu Configuration
				</h1>
				<p className="text-muted-foreground">
					Add, edit, or remove categories, options, and items from your menu.
				</p>
			</div>
			<CategoryManagement />
			<Separator className="my-8" />
			<OptionManagement />
			<Separator className="my-8" />
			<VendorItemManagement />
			<Separator className="my-8" />
			<div>
				<h1 className="text-3xl font-bold font-headline mb-2">
					Rider Settings
				</h1>
				<p className="text-muted-foreground">
					Manage the riders for your restaurant.
				</p>
			</div>
			<VendorRiderManagement />
		</div>
	);
}
