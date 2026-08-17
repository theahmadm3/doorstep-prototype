import { format } from "date-fns";

const Naira = new Intl.NumberFormat("en-NG", {
	style: "currency",
	currency: "NGN",
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
});

/**
 * Format a value as Nigerian Naira currency.
 * Accepts strings (e.g. from API), numbers, or nullish values.
 */
export function formatCurrency(
	value: string | number | undefined | null,
): string {
	if (value === undefined || value === null) return "₦0.00";
	const num = parseFloat(String(value));
	if (isNaN(num)) return "₦0.00";
	return Naira.format(num);
}

/**
 * Format an ISO date string for display.
 */
export function formatOrderDate(isoString: string): string {
	const date = new Date(isoString);
	return isNaN(date.getTime()) ? "—" : format(date, "dd MMM yyyy, hh:mm a");
}

/**
 * Safe float parsing — returns a number,
 * or 0 if the value is nullish / unparseable.
 */
export function parseNumber(
	value: string | number | undefined | null,
): number {
	const n = parseFloat(String(value ?? "0"));
	return isNaN(n) ? 0 : n;
}

/**
 * Safe float parsing — returns a string with 2 decimal places,
 * or "0.00" if the value is nullish / unparseable.
 */
export function safeParseFloat(
	value: string | number | undefined | null,
): string {
	const num = parseFloat(String(value ?? "0"));
	return isNaN(num) ? "0.00" : num.toFixed(2);
}
