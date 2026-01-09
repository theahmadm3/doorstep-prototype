
// This is the centralized API client.
// It handles attaching the access token to requests and orchestrates the token refresh flow.

import { useAuthStore } from "@/stores/useAuthStore";
import { refreshToken as performTokenRefresh } from "./auth-api";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

if (!BASE_URL) {
	throw new Error("Missing NEXT_PUBLIC_BASE_URL environment variable");
}

type FailedRequest = {
	resolve: (value: unknown) => void;
	reject: (reason?: any) => void;
	config: RequestConfig & { endpoint: string };
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
			// When retrying, we pass the new token directly to the request function
			prom.resolve(request(prom.config.endpoint, prom.config, token as string));
		}
	});
	failedQueue = [];
};

// Global logout function to be called on refresh failure.
const handleLogout = () => {
	// This uses a custom event to signal a logout, which can be listened to elsewhere.
	// We do this to avoid circular dependencies with React components/hooks.
	// This ensures a clean, global logout without tight coupling.
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

	// Do not set Content-Type for FormData, the browser does it automatically.
	if (!isFormData) {
		headers["Content-Type"] = "application/json";
	}

	const fetchOptions: RequestInit = {
		method,
		headers,
	};

	if (body) {
		fetchOptions.body = isFormData ? body : JSON.stringify(body);
	}

	try {
		const response = await fetch(`${BASE_URL}${endpoint}`, fetchOptions);

		// The access token has expired.
		if (response.status === 401) {
			// SECURITY: If a refresh is already happening, queue this request to avoid multiple refresh attempts.
			// This is the "single-flight" pattern.
			if (isRefreshing) {
				return new Promise((resolve, reject) => {
					failedQueue.push({
						resolve,
						reject,
						config: { ...config, endpoint },
					});
				}) as Promise<T>;
			}

			isRefreshing = true;

			try {
				const currentRefreshToken = useAuthStore.getState().refreshToken;
				
				// SECURITY: If there's no refresh token in memory, we cannot refresh.
				// This will happen on page reload. The user must log in again.
				if (!currentRefreshToken) {
					throw new Error("No refresh token available.");
				}

				const { access, refresh } = await performTokenRefresh({
					refresh: currentRefreshToken,
				});
				
				// Store the new tokens in memory
				useAuthStore.getState().setTokens(access, refresh);

				// After successful refresh, retry all the requests that were queued.
				processQueue(null, access);
				
				// Retry the original failed request with the new token.
				return await request(endpoint, config, access);

			} catch (refreshError) {
				// The refresh token is invalid or expired. The session is terminated.
				console.error("Token refresh failed, logging out:", refreshError);
				processQueue(refreshError, null);
				handleLogout(); // Trigger global logout.
				throw refreshError;

			} finally {
				isRefreshing = false;
			}
		}

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({
				detail: "An unknown error occurred with the network request.",
			}));
			throw new Error(errorData.detail || `API Error: ${response.status}`);
		}

		// Handle cases with no content in response body
		const contentType = response.headers.get("content-type");
		if (response.status === 204 || !contentType || !contentType.includes("application/json")) {
			return undefined as T;
		}

		return response.json();
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
