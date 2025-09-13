
import { PaginatedResponse, Restaurant, MenuItem, Address, AddressPostData, AddressFormData, OrderPayload, CustomerOrder, OrderItemDetail, OrderDetail, AdminUser, MenuItemPayload, VendorOrder, AdminOrder, Rider, RiderPayload } from "./types";
import {format} from "date-fns"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

if (!BASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_BASE_URL environment variable");
}

async function fetcher<T>(url: string, options: RequestInit = {}): Promise<T> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
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

export async function addAddress(addressData: AddressPostData): Promise<Address> {
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

export async function getOrderDetails(orderId: string): Promise<OrderDetail> {
    return fetcher<OrderDetail>(`/orders/${orderId}/`);
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

export async function updateVendorOrderStatus(orderId: string, action: 'accept' | 'reject' | 'preparing' | 'ready'): Promise<void> {
    await fetcher<void>(`/restaurants/me/orders/${orderId}/${action}/`, {
        method: 'POST',
    });
}

// Vendor Rider Management API Calls
export async function getVendorRiders(): Promise<Rider[]> {
    const response = await fetcher<PaginatedResponse<Rider>>('/restaurants/me/riders/');
    return response.results;
}

export async function createVendorRider(riderData: RiderPayload): Promise<Rider> {
    return fetcher<Rider>('/restaurants/me/riders/', {
        method: 'POST',
        body: JSON.stringify(riderData),
    });
}

export async function updateVendorRider(riderId: string, riderData: RiderPayload): Promise<Rider> {
    return fetcher<Rider>(`/restaurants/me/riders/${riderId}/`, {
        method: 'PUT',
        body: JSON.stringify(riderData),
    });
}

export async function deleteVendorRider(riderId: string): Promise<void> {
    await fetcher<void>(`/restaurants/me/riders/${riderId}/`, {
        method: 'DELETE',
    });
}
