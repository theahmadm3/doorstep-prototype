
"use client";

import { LoginCredentials, LoginResponse, User } from "./types";
import { useToast } from "@/hooks/use-toast";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

if (!BASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_BASE_URL environment variable");
}

export async function loginUser(credentials: LoginCredentials): Promise<LoginResponse> {
    const res = await fetch(`${BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
    });

    if (!res.ok) {
        const errorBody = await res.json();
        throw new Error(errorBody.detail || `API Error: ${res.status}`);
    }
    return res.json();
}

export async function getAuthUser(): Promise<User> {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        throw new Error("No access token found");
    }

    const res = await fetch(`${BASE_URL}/auth/users/me/`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

     if (!res.ok) {
        const errorBody = await res.json();
        throw new Error(errorBody.detail || `API Error: ${res.status}`);
    }

    return res.json();
}

export async function logoutUser(): Promise<void> {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        // No token, nothing to do on the backend
        return;
    }

    const res = await fetch(`${BASE_URL}/auth/logout/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });

    if (!res.ok) {
        // Even if logout fails on the backend (e.g. token expired),
        // we should still proceed with client-side logout.
        // We can log the error for debugging.
        const errorBody = await res.text();
        console.error(`Logout failed: ${res.status}`, errorBody);
        // We don't throw an error here because the user should be logged out
        // on the client regardless of the server's response.
    }
}
