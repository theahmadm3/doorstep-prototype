import { safeParseFloat, formatOrderDate } from "@/lib/format";

export { safeParseFloat, formatOrderDate };

export const ITEMS_PER_PAGE = 5;

export function displayStatus(status: string): string {
	return status === "Picked Up by Customer" ? "Customer Picked Up" : status;
}

export const RIDER_ASSIGNED_STATUSES = new Set([
	"On the Way",
	"Rider Assigned",
	"Driver Assigned",
	"Arrived at Restaurant",
	"pickedup",
	"Arrived at Destination",
	"Delivered",
	"Completed",
]);

export function getStatusClassName(status: string): string {
	switch (status) {
		case "Pending":
			return "bg-orange-100 text-orange-700 border-orange-200";
		case "Accepted":
			return "bg-blue-100 text-blue-700 border-blue-200";
		case "Preparing":
			return "bg-purple-100 text-purple-700 border-purple-200";
		case "Ready for Pickup":
			return "bg-emerald-100 text-emerald-700 border-emerald-200";
		case "On the Way":
			return "bg-sky-100 text-sky-700 border-sky-200";
		case "Delivered":
		case "Completed":
			return "bg-emerald-600 text-white border-emerald-600";
		case "Cancelled":
		case "Rejected":
			return "bg-red-100 text-red-700 border-red-200";
		default:
			return "bg-muted text-muted-foreground border-border";
	}
}
