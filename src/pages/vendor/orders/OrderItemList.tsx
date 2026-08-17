import type { VendorOrderItem } from "@/lib/types";
import { safeParseFloat } from "@/lib/format";

type OrderItemListProps = {
	items: VendorOrderItem[];
	large?: boolean;
};

const OrderItemList = ({ items, large = false }: OrderItemListProps) => {
	const visibleCount = large ? 4 : 3;
	const visibleItems = items.slice(0, visibleCount);
	const hiddenCount = items.length - visibleItems.length;
	return (
		<div
			className={`divide-y divide-border rounded-lg border overflow-hidden ${large ? "bg-muted/30" : "bg-muted/40"}`}
		>
			{visibleItems.map((item) => (
				<div
					key={item.id}
					className={
						large
							? "flex items-center gap-2.5 px-3 py-2.5"
							: "flex items-center gap-2 px-2.5 py-1.5"
					}
				>
					<span
						className={
							large
								? "shrink-0 inline-flex items-center justify-center rounded-md bg-primary/15 text-primary min-w-7 px-1.5 py-0.5 text-sm font-semibold"
								: "shrink-0 inline-flex items-center justify-center rounded-md bg-primary/10 text-primary min-w-6 px-1.5 py-0.5 text-xs font-semibold"
						}
					>
						{item.quantity}×
					</span>
					<span
						className={
							large
								? "min-w-0 flex-1 truncate text-base font-semibold text-foreground"
								: "min-w-0 flex-1 truncate text-sm font-medium text-foreground"
						}
					>
						{item.item_name}
					</span>
					<span
						className={
							large
								? "shrink-0 text-sm font-medium text-foreground/80"
								: "shrink-0 text-xs text-muted-foreground"
						}
					>
						₦{safeParseFloat(item.item_price)}
					</span>
				</div>
			))}
			{hiddenCount > 0 && (
				<div
					className={
						large
							? "px-3 py-2 text-sm text-muted-foreground"
							: "px-2.5 py-1.5 text-xs text-muted-foreground"
					}
				>
					+{hiddenCount} more
				</div>
			)}
		</div>
	);
};

export default OrderItemList;
