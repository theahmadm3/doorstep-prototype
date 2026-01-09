
// This is the centralized API client.
// It handles attaching the access token to requests and orchestrates the token refresh flow.

import { useAuthStore } from "@/stores/useAuthStore";
import { refreshToken } from "./auth-api";
import { useQueryClient } from "@tanstack/react-query";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

if (!BASE_URL) {
	throw new Error("Missing NEXT_PUBLIC_BASE_URL environment variable");
}

type FailedRequest = {
	resolve: (value: unknown) => void;
	reject: (reason?: any) => void;
	config: RequestConfig;
};

// State for the token refresh mechanism
let isRefreshing = false;
let failedQueue: FailedRequest[] = [];

// Single-flight refresh: Processes the queue of failed requests.
const processQueue = (error: any, token: string | null = null) => {
	failedQueue.forEach((prom) => {
		if (error) {
			prom.reject(error);
		} else {
			prom.resolve(request(prom.config, token as string));
		}
	});
	failedQueue = [];
};

// Global logout function to be called on refresh failure.
const handleLogout = () => {
	// This uses a custom event to signal a logout, which can be listened to elsewhere.
	// We do this to avoid circular dependencies with React components/hooks.
	window.dispatchEvent(new Event("logout"));
};

type RequestConfig = {
	method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
	body?: any;
	isFormData?: boolean;
};

// The core request function.
async function request<T>(
	endpoint: string,
	config: RequestConfig = {},
	tokenOverride?: string,
): Promise<T> {
	const { method = "GET", body, isFormData = false } = config;

	// Use the token from the store, unless an override is provided (e.g., during a refresh retry).
	const token = tokenOverride || useAuthStore.getState().accessToken;

	const headers: HeadersInit = {};

	if (token) {
		headers["Authorization"] = `Bearer ${token}`;
	}

	// Do not set Content-Type for FormData, the browser does it.
	if (!isFormData) {
		headers["Content-Type"] = "application/json";
	}

	const fetchOptions: RequestInit = {
		method,
		headers,
		// Credentials must be included for HttpOnly cookies (like the refresh token) to be sent.
		credentials: "include",
	};

	if (body) {
		fetchOptions.body = isFormData ? body : JSON.stringify(body);
	}

	try {
		const response = await fetch(`${BASE_URL}${endpoint}`, fetchOptions);

		// The access token has expired.
		if (response.status === 401) {
			if (!isRefreshing) {
				isRefreshing = true;
				try {
					const { access } = await refreshToken();
					useAuthStore.getState().setAccessToken(access);
					// After successful refresh, retry all the requests that were queued.
					processQueue(null, access);
					// Retry the original failed request.
					return await request(endpoint, config, access);
				} catch (refreshError) {
					// The refresh token is invalid or has expired.
					console.error("Token refresh failed:", refreshError);
					processQueue(refreshError, null);
					handleLogout(); // Trigger global logout.
					throw refreshError;
				} finally {
					isRefreshing = false;
				}
			}

			// If a refresh is already in progress, queue this request.
			return new Promise((resolve, reject) => {
				failedQueue.push({ resolve, reject, config: { ...config, endpoint } });
			}) as Promise<T>;
		}

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({
				detail: "An unknown error occurred.",
			}));
			throw new Error(errorData.detail || `API Error: ${response.status}`);
		}
		
		const contentType = response.headers.get("content-type");
		if (contentType && contentType.includes("application/json")) {
			return response.json();
		}
		return undefined as T;
	} catch (error) {
		console.error("API client error:", error);
		throw error;
	}
}

// Exported API client methods for convenience.
export const apiClient = {
	get: <T>(endpoint: string) => request<T>(endpoint),
	post: <T>(endpoint: string, body: any) =>
		request<T>(endpoint, { method: "POST", body }),
	postFormData: <T>(endpoint: string, body: FormData) =>
		request<T>(endpoint, { method: "POST", body, isFormData: true }),
	put: <T>(endpoint: string, body: any) =>
		request<T>(endpoint, { method: "PUT", body }),
	patch: <T>(endpoint: string, body: any) =>
		request<T>(endpoint, { method: "PATCH", body }),
	delete: <T>(endpoint: string, body?: any) =>
		request<T>(endpoint, { method: "DELETE", body }),
};

export interface PaginatedResponse<T> {
	count: number;
	next: string | null;
	previous: string | null;
	results: T[];
}
