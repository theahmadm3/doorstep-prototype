

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

export type LoginCredentials = z.infer<typeof loginSchema>;

import * as z from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});


export interface User {
    id: string;
    full_name: string;
    email: string;
    phone_number: string | null;
    role: "customer" | "restaurant" | "admin" | "rider";
    status: "Pending" | "Active" | "Suspended";
    avatar_url: string | null;
    created_at: string;
}

export interface LoginResponse {
    access: string;
    user: User;
}
