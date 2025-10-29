
import { PaginatedResponse, Restaurant, MenuItem, Address, AddressPostData, AddressFormData, OrderPayload, CustomerOrder, OrderItemDetail, OrderDetail, AdminUser, MenuItemPayload, VendorOrder, AdminOrder, Rider, RiderPayload, RiderListResponse, VendorAnalyticsData, VendorProfile, VendorProfileUpdatePayload, AvailableRiderOrder, RiderOrderResponse, PickupConfirmationPayload, RiderOrder } from "./types";
import type { InitializePaymentPayload, InitializePaymentResponse } from "./types/paystack";
import {format} from "date-fns"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

if (!BASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_BASE_URL environment variable");
}

async function fetcher<T>(url: string, options: RequestInit = {}): Promise<T> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}${url}`, { ...options, headers });
    
    if (!res.ok) {
        const errorBody = await res.text();
        console.error(`API Error: ${res.status} ${res.statusText}`, errorBody);
        try {
            const errorJson = JSON.parse(errorBody);
            throw new Error(errorJson.detail || `API Error: ${res.status}`);
        } catch {
             throw new Error(`API Error: ${res.status}. Body: ${errorBody}`);
        }
    }
    // Handle cases where the response might be empty (e.g., 204 No Content)
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return res.json();
    }
    return undefined as T;
}

export async function getRestaurants(): Promise<Restaurant[]> {
    const data = await fetcher<PaginatedResponse<Restaurant>>('/restaurants/');
    return data.results;
}

export async function getRestaurantDetails(restaurantId: string): Promise<Restaurant> {
    return fetcher<Restaurant>(`/restaurants/${restaurantId}/`);
}

export async function getRestaurantMenu(restaurantId: string): Promise<MenuItem[]> {
    const data = await fetcher<PaginatedResponse<MenuItem>>(`/restaurants/${restaurantId}/menu/`);
    // Mock categories for now as they are not in the API response
    return data.results.map((item, index) => ({
        ...item,
        category: index % 2 === 0 ? 'Pizzas' : 'Sides' 
    }));
}

// Address Management API Calls
export async function getAddresses(): Promise<Address[]> {
    const data = await fetcher<PaginatedResponse<Address>>('/addresses/');
    return data.results;
}

export async function addAddress(addressData: Partial<AddressPostData>): Promise<Address> {
    return fetcher<Address>('/addresses/', {
        method: 'POST',
        body: JSON.stringify(addressData),
    });
}

export async function updateAddress(addressId: string, addressData: Partial<AddressPostData>): Promise<Address> {
    return fetcher<Address>(`/addresses/${addressId}/`, {
        method: 'PUT',
        body: JSON.stringify(addressData),
    });
}

export async function deleteAddress(addressId: string): Promise<void> {
    await fetcher<void>(`/addresses/${addressId}/`, {
        method: 'DELETE',
    });
}

// Order Management API Calls
export async function placeOrder(orderData: OrderPayload): Promise<any> { // Replace 'any' with a proper Order response type if you have one
    return fetcher<any>('/orders/', {
        method: 'POST',
        body: JSON.stringify(orderData),
    });
}

export async function getCustomerOrders(): Promise<CustomerOrder[]> {
    const response = await fetcher<PaginatedResponse<CustomerOrder>>('/get-customer-order');
    return response.results.map(order => ({
        ...order,
        created_at: format(new Date(order.created_at), 'dd MMM yyyy, hh:mm a'),
    }));
}

export async function confirmOrderDelivery(orderId: string): Promise<void> {
    await fetcher<void>(`/customer/me/order/${orderId}/delivered/`, {
        method: 'POST',
    });
}


export async function getOrderDetails(orderId: string): Promise<OrderDetail> {
    const order = await fetcher<OrderDetail>(`/orders/${orderId}/`);
    return {
        ...order,
        created_at: format(new Date(order.created_at), "dd MMMM yyyy, h:mm:ss a"),
    };
}

// Admin API calls
export async function getAdminUsers(page: number = 1): Promise<PaginatedResponse<AdminUser>> {
    return fetcher<PaginatedResponse<AdminUser>>(`/admin/users/?page=${page}`);
}

export async function getAdminOrders(): Promise<AdminOrder[]> {
    const response = await fetcher<PaginatedResponse<AdminOrder>>('/admin/orders/');
    return response.results.map(order => ({
        ...order,
        created_at: format(new Date(order.created_at), "dd MMM yyyy, hh:mm a")
    }));
}

// Vendor API Calls
export async function getVendorMenuItems(): Promise<MenuItem[]> {
    const data = await fetcher<PaginatedResponse<MenuItem>>('/restaurants/me/menu/');
    return data.results;
}

export async function createVendorMenuItem(itemData: MenuItemPayload): Promise<MenuItem> {
    return fetcher<MenuItem>('/restaurants/me/menu/', {
        method: 'POST',
        body: JSON.stringify(itemData),
    });
}

export async function updateVendorMenuItem(itemId: string, itemData: MenuItemPayload): Promise<MenuItem> {
    return fetcher<MenuItem>(`/restaurants/me/menu/${itemId}/`, {
        method: 'PUT',
        body: JSON.stringify(itemData),
    });
}

export async function deleteVendorMenuItem(itemId: string): Promise<void> {
    await fetcher<void>(`/restaurants/me/menu/${itemId}/`, {
        method: 'DELETE',
    });
}


export async function updateMenuItemAvailability(itemId: string, is_available: boolean): Promise<MenuItem> {
    return fetcher<MenuItem>(`/restaurants/me/menu/${itemId}/availability/`, {
        method: 'PUT',
        body: JSON.stringify({ is_available }),
    });
}

export async function getVendorOrders(): Promise<VendorOrder[]> {
    const data = await fetcher<PaginatedResponse<VendorOrder>>('/restaurants/me/orders/');
    return data.results.map(order => ({
        ...order,
        created_at: format(new Date(order.created_at), "dd MMM yyyy, hh:mm a"),
    }));
}

export async function updateVendorOrderStatus(orderId: string, action: 'accept' | 'reject' | 'preparing' | 'ready', driverType?: 'doorstep' | 'inhouse'): Promise<void> {
    let body = {};
    if (action === 'ready' && driverType) {
        body = { driver_type: driverType };
    }

    await fetcher<void>(`/restaurants/me/orders/${orderId}/${action}/`, {
        method: 'POST',
        body: JSON.stringify(body),
    });
}

export async function assignRiderToOrder(orderId: string, driverName: string): Promise<void> {
    await fetcher<void>(`/restaurants/me/orders/${orderId}/ongoing/`, {
        method: 'POST',
        body: JSON.stringify({ driver_name: driverName }),
    });
}

export async function confirmPickupByCustomer(orderId: string, otp: string): Promise<void> {
    const payload: PickupConfirmationPayload = {
        status: "Picked Up by Customer",
        otp: otp,
    };
    await fetcher<void>(`/orders/${orderId}/pickup-status/`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });
}


// Vendor Rider Management API Calls
export async function getVendorRiders(): Promise<Rider[]> {
    const response = await fetcher<RiderListResponse>('/restaurants/me/drivers/');
    return response.drivers;
}

export async function createVendorRider(riderData: RiderPayload): Promise<Rider> {
    return fetcher<Rider>('/restaurants/me/drivers/', {
        method: 'POST',
        body: JSON.stringify(riderData),
    });
}

export async function updateVendorRider(riderData: RiderPayload): Promise<Rider> {
    return fetcher<Rider>(`/restaurants/me/drivers/`, {
        method: 'PUT',
        body: JSON.stringify(riderData),
    });
}

export async function deleteVendorRider(riderName: string): Promise<void> {
    await fetcher<void>(`/restaurants/me/drivers/`, {
        method: 'DELETE',
        body: JSON.stringify({ name: riderName }),
    });
}

// Vendor Analytics API
export async function getVendorAnalytics(): Promise<VendorAnalyticsData> {
    return fetcher<VendorAnalyticsData>('/restaurant/me/analytics');
}

// Vendor Profile API
export async function getRestaurantProfile(): Promise<VendorProfile> {
    return fetcher<VendorProfile>('/restaurants/me/');
}

export async function updateRestaurantProfile(payload: VendorProfileUpdatePayload): Promise<VendorProfile> {
    return fetcher<VendorProfile>('/restaurants/me/', {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
}

// Rider API
export async function getAvailableRiderOrders(): Promise<AvailableRiderOrder[]> {
    const response = await fetcher<{data: AvailableRiderOrder[]}>('/drivers/orders/available');
    return response.data;
}

export async function getRiderOrders(): Promise<RiderOrder[]> {
  const response = await fetcher<RiderOrderResponse>('/drivers/orders/');
  return response.data;
}

export async function performRiderAction(orderId: string, action: string, payload?: object): Promise<RiderOrder> {
    const response = await fetcher<{ data: RiderOrder }>(`/drivers/orders/${orderId}/${action}`, {
        method: 'POST',
        body: payload ? JSON.stringify(payload) : undefined,
    });
    return response.data;
}

export async function updateRiderLocation(latitude: number, longitude: number): Promise<void> {
    const payload = {
        current_latitude: String(latitude.toFixed(6)),
        current_longitude: String(longitude.toFixed(6)),
    };
    await fetcher<void>('/drivers/me/location', {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });
}


// Payment API
export async function initializePayment(payload: InitializePaymentPayload): Promise<InitializePaymentResponse> {
    return fetcher<InitializePaymentResponse>('/initialize/', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
}
