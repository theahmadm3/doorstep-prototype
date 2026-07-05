import type { ActiveDiscount, OptionChoice, OrderItem } from "@/lib/types";

/**
 * Base price after applying the first active item-level discount.
 * Single source of truth for item discount math — used by the menu page,
 * the add-to-cart modal, and the cart store so displayed and charged
 * prices can never drift apart.
 */
export function discountedBasePrice(
	price: string,
	discounts?: ActiveDiscount[] | null,
): number {
	const base = parseFloat(price);
	const discount = discounts?.[0];
	if (!discount) return base;
	return discount.type === "fixed_amount"
		? Math.max(0, base - parseFloat(discount.value))
		: base * (1 - parseFloat(discount.value) / 100);
}

export function optionsPrice(options: OptionChoice[]): number {
	return options.reduce((sum, o) => sum + parseFloat(o.price_adjustment), 0);
}

/** What the line would cost without any item-level discount. */
export function orderItemOriginalTotal(item: OrderItem): number {
	return (
		(parseFloat(item.menuItem.price) + optionsPrice(item.options)) *
		item.quantity
	);
}
