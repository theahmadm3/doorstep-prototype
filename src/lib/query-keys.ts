export const QUERY_KEYS = {
	dashboard: ["dashboard"] as const,
	search: (term: string) => ["search", term] as const,
	addresses: ["addresses"] as const,
	customerOrders: ["customerOrders"] as const,
	vendorOrders: ["vendorOrders"] as const,
	riderOrders: ["riderOrders"] as const,
	availableRiderOrders: ["availableRiderOrders"] as const,
	vendorMenuItems: ["vendorMenuItems"] as const,
	menuCategories: ["menuCategories"] as const,
	menuOptions: ["menuOptions"] as const,
	vendorDiscounts: ["vendorDiscounts"] as const,
} as const;
