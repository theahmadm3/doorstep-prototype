import CategoryManagement from "@/components/vendor/category-management";
import OptionManagement from "@/components/vendor/option-management";
import VendorItemManagement from "@/components/dashboard/vendor-item-management";
import VendorRiderManagement from "@/components/vendor/vendor-rider-management";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function VendorConfigPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold font-headline mb-2">Configuration</h1>
				<p className="text-muted-foreground">
					Manage your menu items and delivery riders.
				</p>
			</div>
			<Tabs defaultValue="menu">
				<TabsList>
					<TabsTrigger value="menu">Menu Items</TabsTrigger>
					<TabsTrigger value="riders">Riders</TabsTrigger>
				</TabsList>
				<TabsContent value="menu" className="space-y-8 mt-6">
					<CategoryManagement />
					<OptionManagement />
					<VendorItemManagement />
				</TabsContent>
				<TabsContent value="riders" className="mt-6">
					<VendorRiderManagement />
				</TabsContent>
			</Tabs>
		</div>
	);
}
