export const QUERY_KEYS = {
	dashboard: (lat?: number, lon?: number) =>
		["dashboard", lat ?? null, lon ?? null] as const,
	search: (term: string) => ["search", term] as const,
	addresses: ["addresses"] as const,
	customerOrders: ["customerOrders"] as const,
	vendorOrders: ["vendorOrders"] as const,
	riderOrders: ["riderOrders"] as const,
	availableRiderOrders: ["availableRiderOrders"] as const,
	vendorMenuItems: ["vendorMenuItems"] as const,
	vendorMenuByCategory: ["vendorMenuByCategory"] as const,
	menuCategories: ["menuCategories"] as const,
	menuOptions: ["menuOptions"] as const,
	vendorDiscounts: ["vendorDiscounts"] as const,
	vendorRiders: ["vendorRiders"] as const,
	vendorProfile: ["vendorProfile"] as const,
	vendorAnalytics: ["vendorAnalytics"] as const,
} as const;
