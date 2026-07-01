

import { LoginResponse, SignupPayload, SignupResponse, User, ProfileUpdatePayload, CustomerSignupPayload, OtpVerificationPayload, VerifyOtpResponse, PartnerLoginCredentials } from "./types";
import { fetcher } from "./api";

const BASE_URL = import.meta.env.VITE_BASE_URL;

if (!BASE_URL) {
    throw new Error("Missing VITE_BASE_URL environment variable");
}

export async function loginUser(credentials: PartnerLoginCredentials): Promise<LoginResponse> {
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
    return fetcher<User>("/auth/users/me/");
}

export async function updateUserProfile(data: ProfileUpdatePayload): Promise<User> {
    return fetcher<User>("/auth/users/me/update/", {
        method: "PATCH",
        body: JSON.stringify(data),
    });
}


export async function logoutUser(): Promise<void> {
    // This function is kept for potential future use where a backend logout endpoint is used.
    // Currently, logout is handled purely on the client-side by clearing local storage and state.
}
