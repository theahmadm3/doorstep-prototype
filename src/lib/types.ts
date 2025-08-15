
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

export interface Restaurant {
    id: string;
    owner: Owner;
    name: string;
    description: string | null;
    address: string;
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
    price: string; // Comes as a string from the API
    image_url: string | null;
    is_available: boolean;
    category?: string; // Adding optional category for frontend filtering
    created_at: string;
    updated_at: string;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

import * as z from 'zod';

// Login Schemas & Types
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
export type LoginCredentials = z.infer<typeof loginSchema>;

export interface LoginResponse {
    access: string;
    user: User;
}

// Signup Schemas & Types
export const signupSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export type SignupPayload = Omit<z.infer<typeof signupSchema>, 'confirmPassword'>;
export type SignupCredentials = z.infer<typeof signupSchema>;


export interface SignupResponse {
    user: User;
    token: string;
}


// User Type
export interface User {
    id: string;
    full_name: string;
    email: string;
    phone_number: string | null;
    role: "customer" | "restaurant" | "admin" | "rider";
    status: "Pending" | "Active" | "Suspended";
    avatar_url: string | null;
    created_at: string;
    login_count: number;
}


// Order Management Types
export type OrderStatus = 'unsubmitted' | 'Order Placed' | 'Vendor Accepted' | 'Preparing' | 'Order Ready' | 'Rider Assigned' | 'Rider on the Way' | 'Delivered' | 'Cancelled';

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
}

export interface GuestCart {
  restaurantId: string | null;
  items: OrderItem[];
}

// Profile Page Schemas
const nigerianPhoneRegex = /^(070|080|081|090|091)\d{8}$/;

export const profileSchema = z.object({
    full_name: z.string().min(2, "Full name must be at least 2 characters long."),
    phone_number: z.preprocess(
        // Strip non-numeric characters
        (val) => (typeof val === 'string' ? val.replace(/\D/g, '') : val),
        z.string().regex(nigerianPhoneRegex, "Please enter a valid Nigerian phone number (e.g., 08012345678).")
    ),
});
export type ProfileFormData = z.infer<typeof profileSchema>;

export const addressSchema = z.object({
    street: z.string().min(5, "House number and street name is too short."),
    district_town: z.string().min(2, "District/Town is too short."),
    nearest_landmark: z.string().optional(),
    address_nickname: z.string().optional(),
});
export type AddressFormData = z.infer<typeof addressSchema>;

// This represents a saved address, which includes an ID.
export interface Address extends AddressFormData {
  id: string;
}

export const passwordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z.string().min(8, "New password must be at least 8 characters."),
});
export type PasswordFormData = z.infer<typeof passwordSchema>;


export interface ProfileUpdatePayload {
  full_name: string;
  phone_number?: string;
}
