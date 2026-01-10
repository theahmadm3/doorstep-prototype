
import { apiClient, PaginatedResponse } from "./api-client";
import {
	Restaurant,
	MenuItem,
	Address,
	AddressPostData,
	OrderPayload,
	CustomerOrder,
	OrderDetail,
	AdminUser,
	MenuItemPayload,
	VendorOrder,
	AdminOrder,
	Rider,
	RiderPayload,
	RiderListResponse,
	VendorAnalyticsData,
	VendorProfile,
	VendorProfileUpdatePayload,
	RiderOrderBatch,
	RiderOrderResponse,
	PickupConfirmationPayload,
	RiderOrder,
	WalletBalance,
	PayoutRecipient,
	CreateRecipientPayload,
	InitiatePayoutPayload,
	MenuCategory,
	CategoryPayload,
	OptionChoice,
	OptionPayload,
} from "./types";
import type {
	InitializePaymentPayload,
	InitializePaymentResponse,
} from "./types/paystack";
import { format } from "date-fns";

export async function getRestaurants(): Promise<Restaurant[]> {
	const data = await apiClient.get<PaginatedResponse<Restaurant>>(
		"/restaurants/",
	);
	return data.results;
}

export async function getRestaurantDetails(
	restaurantId: string,
): Promise<Restaurant> {
	return apiClient.get<Restaurant>(`/restaurants/${restaurantId}/`);
}

export async function getRestaurantMenu(
	restaurantId: string,
): Promise<MenuItem[]> {
	const data = await apiClient.get<PaginatedResponse<MenuItem>>(
		`/restaurants/${restaurantId}/menu/`,
	);
	return data.results;
}

// Address Management API Calls
export async function getAddresses(): Promise<Address[]> {
	const data = await apiClient.get<PaginatedResponse<Address>>("/addresses/");
	return data.results;
}

export async function addAddress(
	addressData: Partial<AddressPostData>,
): Promise<Address> {
	return apiClient.post<Address>("/addresses/", addressData);
}

export async function updateAddress(
	addressId: string,
	addressData: Partial<AddressPostData>,
): Promise<Address> {
	return apiClient.put<Address>(`/addresses/${addressId}/`, addressData);
}

export async function deleteAddress(addressId: string): Promise<void> {
	await apiClient.delete<void>(`/addresses/${addressId}/`);
}

// Order Management API Calls
export async function placeOrder(orderData: OrderPayload): Promise<any> {
	return apiClient.post<any>("/orders/", orderData);
}

export async function getCustomerOrders(): Promise<CustomerOrder[]> {
	const response = await apiClient.get<PaginatedResponse<CustomerOrder>>(
		"/get-customer-order",
	);
	return response.results.map((order) => ({
		...order,
		created_at: format(new Date(order.created_at), "dd MMM yyyy, hh:mm a"),
	}));
}

export async function confirmOrderDelivery(orderId: string): Promise<void> {
	await apiClient.post<void>(`/customer/me/order/${orderId}/delivered/`);
}

export async function getOrderDetails(orderId: string): Promise<OrderDetail> {
	const order = await apiClient.get<OrderDetail>(`/orders/${orderId}/`);
	return {
		...order,
		created_at: format(new Date(order.created_at), "dd MMMM yyyy, h:mm:ss a"),
	};
}

// Admin API calls
export async function getAdminUsers(
	page: number = 1,
): Promise<PaginatedResponse<AdminUser>> {
	return apiClient.get<PaginatedResponse<AdminUser>>(
		`/admin/users/?page=${page}`,
	);
}

export async function getAdminOrders(): Promise<AdminOrder[]> {
	const response = await apiClient.get<PaginatedResponse<AdminOrder>>(
		"/admin/orders/",
	);
	return response.results.map((order) => ({
		...order,
		created_at: format(new Date(order.created_at), "dd MMM yyyy, hh:mm a"),
	}));
}

// Vendor API Calls
export async function getVendorMenuItems(): Promise<MenuItem[]> {
	const data = await apiClient.get<PaginatedResponse<MenuItem>>(
		"/restaurants/me/menu/",
	);
	return data.results;
}

export async function createVendorMenuItem(
	itemData: MenuItemPayload,
): Promise<MenuItem> {
	return apiClient.post<MenuItem>("/restaurants/me/menu/", itemData);
}

export async function uploadMenuItemImage(
	itemId: string,
	image: File,
): Promise<MenuItem> {
	const formData = new FormData();
	formData.append("image", image);

	return apiClient.postFormData<MenuItem>(
		`/menu-items/${itemId}/upload-image/`,
		formData,
	);
}

export async function updateVendorMenuItem(
	itemId: string,
	itemData: Partial<MenuItemPayload>,
): Promise<MenuItem> {
	return apiClient.patch<MenuItem>(`/restaurants/me/menu/${itemId}/`, itemData);
}

export async function deleteVendorMenuItem(itemId: string): Promise<void> {
	await apiClient.delete<void>(`/restaurants/me/menu/${itemId}/`);
}

export async function updateMenuItemAvailability(
	itemId: string,
	is_available: boolean,
): Promise<MenuItem> {
	return apiClient.put<MenuItem>(`/restaurants/me/menu/${itemId}/availability/`, {
		is_available,
	});
}

export async function getVendorOrders(): Promise<VendorOrder[]> {
	const data = await apiClient.get<PaginatedResponse<VendorOrder>>(
		"/restaurants/me/orders/",
	);
	return data.results.map((order) => ({
		...order,
		created_at: format(new Date(order.created_at), "dd MMM yyyy, hh:mm a"),
	}));
}

export async function updateVendorOrderStatus(
	orderId: string,
	action: "accept" | "reject" | "preparing" | "ready",
	driverType?: "doorstep" | "inhouse",
): Promise<void> {
	let body = {};
	if (action === "ready" && driverType) {
		body = { driver_type: driverType };
	}

	await apiClient.post<void>(
		`/restaurants/me/orders/${orderId}/${action}/`,
		body,
	);
}

export async function assignRiderToOrder(
	orderId: string,
	driverName: string,
): Promise<void> {
	await apiClient.post<void>(`/restaurants/me/orders/${orderId}/ongoing/`, {
		driver_name: driverName,
	});
}

export async function confirmPickupByCustomer(
	orderId: string,
	otp: string,
): Promise<void> {
	const payload: PickupConfirmationPayload = {
		status: "Picked Up by Customer",
		otp: otp,
	};
	await apiClient.put<void>(`/orders/${orderId}/pickup-status/`, payload);
}

// Vendor Category Management
export async function getMenuCategories(): Promise<MenuCategory[]> {
	const response = await apiClient.get<PaginatedResponse<MenuCategory>>(
		"/restaurants/me/menu/categories",
	);
	return response.results;
}

export async function createMenuCategory(
	payload: CategoryPayload,
): Promise<MenuCategory> {
	return apiClient.post<MenuCategory>(
		"/restaurants/me/menu/categories",
		payload,
	);
}

export async function getMenuCategory(id: string): Promise<MenuCategory> {
	return apiClient.get<MenuCategory>(`/restaurants/me/menu/categories/${id}`);
}

export async function updateMenuCategory(
	id: string,
	payload: CategoryPayload,
): Promise<MenuCategory> {
	return apiClient.put<MenuCategory>(
		`/restaurants/me/menu/categories/${id}`,
		payload,
	);
}

export async function deleteMenuCategory(id: string): Promise<void> {
	await apiClient.delete<void>(`/restaurants/me/menu/categories/${id}`);
}

// Vendor Menu Option Management
export async function getMenuOptions(): Promise<OptionChoice[]> {
	const response = await apiClient.get<PaginatedResponse<OptionChoice>>(
		"/restaurants/me/options/",
	);
	return response.results;
}

export async function createMenuOption(
	payload: OptionPayload,
): Promise<OptionChoice> {
	return apiClient.post<OptionChoice>("/restaurants/me/options/", payload);
}

export async function updateMenuOption(
	id: string,
	payload: Partial<OptionPayload>,
): Promise<OptionChoice> {
	return apiClient.patch<OptionChoice>(`/restaurants/me/options/${id}/`, payload);
}

export async function deleteMenuOption(id: string): Promise<void> {
	await apiClient.delete<void>(`/restaurants/me/options/${id}/`);
}

// Vendor Rider Management API Calls
export async function getVendorRiders(): Promise<Rider[]> {
	const response = await apiClient.get<RiderListResponse>(
		"/restaurants/me/drivers/",
	);
	return response.drivers;
}

export async function createVendorRider(
	riderData: RiderPayload,
): Promise<Rider> {
	return apiClient.post<Rider>("/restaurants/me/drivers/", riderData);
}

export async function updateVendorRider(
	riderData: RiderPayload,
): Promise<Rider> {
	return apiClient.put<Rider>(`/restaurants/me/drivers/`, riderData);
}

export async function deleteVendorRider(riderName: string): Promise<void> {
	await apiClient.delete<void>(`/restaurants/me/drivers/`, {
		name: riderName,
	});
}

// Vendor Analytics API
export async function getVendorAnalytics(): Promise<VendorAnalyticsData> {
	return apiClient.get<VendorAnalyticsData>("/restaurant/me/analytics");
}

// Vendor Profile API
export async function getRestaurantProfile(): Promise<VendorProfile> {
	return apiClient.get<VendorProfile>("/restaurants/me/");
}

export async function updateRestaurantProfile(
	payload: VendorProfileUpdatePayload,
): Promise<VendorProfile> {
	return apiClient.patch<VendorProfile>("/restaurants/me/", payload);
}

// Rider API
export async function getAvailableRiderOrders(page: number = 1): Promise<PaginatedResponse<RiderOrderBatch>> {
	return apiClient.get<PaginatedResponse<RiderOrderBatch>>(
		`/drivers/orders/available?page=${page}`,
	);
}


export async function getRiderOrders(): Promise<RiderOrder[]> {
	const response = await apiClient.get<RiderOrderResponse>("/drivers/orders/");
	return response.data;
}

export async function performRiderAction(
	orderId: string,
	action: string,
	payload?: object,
): Promise<RiderOrder> {
	const response = await apiClient.post<{ data: RiderOrder }>(
		`/drivers/orders/${orderId}/${action}`,
		payload,
	);
	return response.data;
}

export async function updateRiderLocation(
	latitude: number,
	longitude: number,
): Promise<void> {
	const payload = {
		current_latitude: String(latitude.toFixed(6)),
		current_longitude: String(longitude.toFixed(6)),
	};
	await apiClient.patch<void>("/drivers/me/location", payload);
}

// Payment API
export async function initializePayment(
	payload: InitializePaymentPayload,
): Promise<InitializePaymentResponse> {
	return apiClient.post<InitializePaymentResponse>("/initialize/", payload);
}

// Push Notification API
export async function subscribeToNotifications(
	subscription: PushSubscription,
): Promise<void> {
	await apiClient.post<void>("/subscribe/", subscription.toJSON());
}

// Payout API
export async function getWalletBalance(): Promise<WalletBalance> {
	return apiClient.get<WalletBalance>("/wallet/");
}

export async function getPayoutRecipients(): Promise<PayoutRecipient[]> {
	return apiClient.get<PayoutRecipient[]>("/payout/recipients/");
}

export async function createPayoutRecipient(
	payload: CreateRecipientPayload,
): Promise<PayoutRecipient> {
	return apiClient.post<PayoutRecipient>("/payout/recipient/create/", payload);
}

export async function initiatePayout(
	payload: InitiatePayoutPayload,
): Promise<{ message: string }> {
	return apiClient.post<{ message: string }>("/payout/initiate/", payload);
}

export async function deletePayoutRecipient(
	recipientCode: string,
): Promise<void> {
	await apiClient.delete<void>(`/recipients/${recipientCode}/delete/`);
}
