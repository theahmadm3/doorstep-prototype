
"use client";

import { LoginResponse, SignupPayload, SignupResponse, User, ProfileUpdatePayload, CustomerSignupPayload, OtpVerificationPayload, VerifyOtpResponse } from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

if (!BASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_BASE_URL environment variable");
}

export async function sendLoginOTP(phoneNumber: string): Promise<{ detail: string }> {
    const res = await fetch(`${BASE_URL}/auth/customer/send-otp/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone_number: phoneNumber }),
    });

    if (!res.ok) {
        const errorBody = await res.json();
        throw new Error(errorBody.detail || `API Error: ${res.status}`);
    }
    return res.json();
}

export async function signupCustomer(credentials: CustomerSignupPayload): Promise<{ detail: string }> {
    const res = await fetch(`${BASE_URL}/auth/signup/customer/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
    });

    if (!res.ok) {
        const errorBody = await res.json();
        const errorMessage = errorBody.detail || `API Error: ${res.status}`;
        if (typeof errorMessage === 'object') {
            throw new Error(JSON.stringify(errorMessage));
        }
        throw new Error(errorMessage);
    }
    return res.json();
}

export async function verifyLoginOTP(payload: OtpVerificationPayload): Promise<VerifyOtpResponse> {
    const res = await fetch(`${BASE_URL}/auth/customer/login-otp/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const errorBody = await res.json();
        throw new Error(errorBody.detail || `API Error: ${res.status}`);
    }
    return res.json();
}

export async function resendOTP(phoneNumber: string): Promise<{ detail: string }> {
    const res = await fetch(`${BASE_URL}/auth/regenerate-otp/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone_number: phoneNumber }),
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

export async function updateUserProfile(data: ProfileUpdatePayload): Promise<User> {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
    }
    
    const res = await fetch(`${BASE_URL}/auth/users/me/update/`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const errorBody = await res.json();
        throw new Error(errorBody.detail || `API Error: ${res.status}`);
    }

    return res.json();
}


export async function logoutUser(): Promise<void> {
    // This function is kept for potential future use where a backend logout endpoint is used.
    // Currently, logout is handled purely on the client-side by clearing local storage and state.
}
