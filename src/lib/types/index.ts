
import * as z from 'zod';

// Generic
export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

// User and Auth
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
export type LoginCredentials = z.infer<typeof loginSchema>;

export interface LoginResponse {
    access: string;
    user: User;
}

export const signupSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  confirmPassword: z.string(),
}).refine(data => data.password === data.password, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export type SignupPayload = Omit<z.infer<typeof signupSchema>, 'confirmPassword'>;
export type SignupCredentials = z.infer<typeof signupSchema>;


export interface SignupResponse {
    user: User;
    token: string;
}


export interface User {
    id: string;
    full_name: string;
    email: string;
    phone_number: string | null;
    role: "customer" | "restaurant" | "admin" | "driver";
    status: "Pending" | "Active" | "Suspended";
    avatar_url: string | null;
    created_at: string;
    login_count: number;
}

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  phone_number: string | null;
  role: string;
  status: string;
  is_active: boolean;
}

// Restaurant and Menu
export interface Owner {
    id: string;
    full_name: string;
    email: string;
    phone_number: string | null;
    role: "restaurant" | "customer" | "rider" | "admin";
    status: "Pending" | "Active" | "Suspended";
    avatar_url: string | null;
    created_at: string;
}

export interface RestaurantAddress {
    id: string;
    street_name: string;
    latitude: string;
    longitude: string;
}

export interface Restaurant {
    id: string;
    owner: Owner;
    name: string;
    description: string | null;
    address: RestaurantAddress | null;
    image_url: string | null;
    rating: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface MenuItem {
    id: string;
    restaurant: string;
    name: string;
    description: string | null;
    price: string;
    image_url: string | null;
    is_available: boolean;
    category?: string;
    created_at: string;
    updated_at: string;
}

export interface MenuItemPayload {
    name: string;
    description: string;
    price: string;
    is_available: boolean;
    image_url?: string;
}

// Order Management Types
export type OrderStatus = 'unsubmitted' | 'Order Placed' | 'Vendor Accepted' | 'Preparing' | 'Order Ready' | 'Rider Assigned' | 'Rider on the Way' | 'Delivered' | 'Cancelled' | 'Pending' | 'Accepted' | 'Ready for Pickup' | 'On the Way' | 'Arrived at Restaurant' | 'pickedup' | 'Arrived at Destination' | 'Picked Up by Customer' | 'Rejected' | 'Driver Assigned';

export interface OrderItem extends MenuItem {
  quantity: number;
}

export interface Order {
  id: string;
  restaurantId: string;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  date?: string;
  customerId?: string;
  distance?: number;
  deliveryFee?: number;
}

export interface GuestCart {
  restaurantId: string | null;
  items: OrderItem[];
}

export interface OrderItemPayload {
  menu_item_id: string;
  quantity: number;
}

export interface OrderPayload {
  restaurant_id: string;
  delivery_address_id?: string;
  items: OrderItemPayload[];
  payment_reference: string;
  delivery_fee: string;
  order_type: 'delivery' | 'pickup';
}

export interface CustomerOrder {
    id: string;
    restaurant_name: string;
    total_amount: string;
    status: OrderStatus;
    created_at: string;
    delivery_address: OrderDetailAddress;
    order_type: 'delivery' | 'pickup';
}

export interface OrderItemDetail {
    quantity: number;
    item_name: string;
    item_price: string;
}

export interface OrderDetailRestaurant {
    id: string;
    name: string;
    description: string;
    address: RestaurantAddress | null;
    image_url: string;
    rating: string;
}

export interface OrderDetailAddress {
    street_address: string | null;
    city: string | null;
    nearest_landmark: string | null;
    address_nickname: string | null;
    latitude: string | null;
    longitude: string | null;
}

export interface OrderDetail {
    id: string;
    restaurant: OrderDetailRestaurant;
    delivery_address: OrderDetailAddress;
    status: OrderStatus;
    total_amount: string;
    items: OrderItemDetail[];
    created_at: string;
    delivery_otp?: string;
    order_type: 'delivery' | 'pickup';
}

export interface VendorOrder {
    id: string;
    customer_name: string;
    total_amount: string;
    status: OrderStatus;
    created_at: string;
    order_type: 'delivery' | 'pickup';
}

export interface AdminOrder {
    id: string;
    customer_name: string;
    restaurant_name: string;
    total_amount: string;
    status: OrderStatus;
    payment_method: string | null;
    created_at: string;
    order_type: 'delivery' | 'pickup';
}

export interface PickupConfirmationPayload {
    status: "Picked Up by Customer";
    otp: string;
}

// Vendor Rider Types
export interface Rider {
    name: string;
    phone: string;
}

export interface RiderListResponse {
    drivers: Rider[];
}

const nigerianPhoneRegex = /^(070|080|081|090|091)\d{8}$/;

export const riderSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    phone: z.string().regex(nigerianPhoneRegex, "Please enter a valid Nigerian phone number."),
});

export type RiderPayload = z.infer<typeof riderSchema>;

// Profile Page Schemas
export const profileSchema = z.object({
    full_name: z.string().min(2, "Full name must be at least 2 characters long."),
    phone_number: z.preprocess(
        (val) => (typeof val === 'string' ? val.replace(/\D/g, '') : val),
        z.string().regex(nigerianPhoneRegex, "Please enter a valid Nigerian phone number (e.g., 08012345678).")
    ),
});
export type ProfileFormData = z.infer<typeof profileSchema>;

export const passwordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z.string().min(8, "New password must be at least 8 characters."),
});
export type PasswordFormData = z.infer<typeof passwordSchema>;


export interface ProfileUpdatePayload {
  full_name: string;
  phone_number?: string;
}

export const addressSchema = z.object({
    street_address: z.string().min(5, "House number and street name is too short.").optional(),
    city: z.string().min(2, "District/Town is too short.").optional(),
    nearest_landmark: z.string().optional(),
    address_nickname: z.string().optional(),
    is_default: z.boolean().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
}).refine(data => data.street_address || (data.latitude && data.longitude), {
    message: "Either a street address or GPS coordinates must be provided.",
    path: ["street_address"],
});
export type AddressFormData = z.infer<typeof addressSchema>;

export interface AddressPostData extends Partial<AddressFormData> {
  is_default?: boolean;
}

export interface Address extends OrderDetailAddress {
  id: string;
  user: string;
  is_default: boolean;
}

// Analytics Types
export interface TopSellingItem {
    item_name: string;
    orders: number;
}

export interface VendorAnalyticsData {
    restaurant: string;
    total_revenue: string;
    platform_revenue_from_this_restaurant: string;
    total_orders: number;
    active_orders: number;
    delivered_orders: number;
    cancelled_orders: number;
    top_items: TopSellingItem[];
}

// Vendor Profile Type
export interface VendorProfileOwner {
    id: string;
    full_name: string;
    email: string;
    phone_number: string | null;
    role: "restaurant";
    status: "Pending" | "Active" | "Suspended";
    avatar_url: string | null;
}

export interface VendorProfileAddress {
    street_name: string | null;
    latitude: number;
    longitude: number;
}

export interface VendorProfile {
    id: string;
    owner: VendorProfileOwner;
    name: string;
    description: string | null;
    address: VendorProfileAddress | null;
    image_url: string | null;
    rating: string;
    is_active: boolean;
}

export interface VendorProfileUpdatePayload {
    name?: string;
    description?: string;
    is_active?: boolean;
    address?: {
        street_name: string | null;
        latitude: number;
        longitude: number;
    };
}


// Rider Module
export interface RiderCustomer {
    name: string;
    phone: string;
}

export interface RiderOrder {
    id: string;
    status: OrderStatus;
    total_amount: string;
    delivery_fee: string;
    restaurant_latitude: string;
    restaurant_longitude: string;
    delivery_latitude: string;
    delivery_longitude: string;
    order_type?: "delivery" | "pickup";
    customer: RiderCustomer;
    delivery_address_str: string;
    created_at: string;
    restaurant: string;
}

export interface RiderOrderResponse {
  success: boolean;
  data: RiderOrder[];
}

export interface AvailableRiderOrder {
    id: string;
    status: OrderStatus;
    total_amount: string;
    delivery_fee: string;
    restaurant_latitude: string;
    restaurant_longitude: string;
    delivery_latitude: string;
    delivery_longitude: string;
    customer: {
        name: string;
        phone: string;
    };
    delivery_address_str: string;
    created_at: string;
}

export const OTPSchema = z.object({
  otp: z.string().min(6, "OTP must be 6 digits.").max(6, "OTP must be 6 digits."),
});
export type OTPPayload = z.infer<typeof OTPSchema>;
