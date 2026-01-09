
"use client";

import { apiClient } from "./api-client";
import {
	LoginResponse,
	User,
	ProfileUpdatePayload,
	CustomerSignupPayload,
	OtpVerificationPayload,
	PartnerLoginCredentials,
} from "./types";

export async function loginUser(
	credentials: PartnerLoginCredentials,
): Promise<LoginResponse> {
	// The API returns { access, refresh, user }.
	// We only use `access` and `user`, and discard `refresh` to avoid persisting it.
	return apiClient.post<LoginResponse>("/auth/login/", credentials);
}

export async function sendLoginOTP(
	phoneNumber: string,
): Promise<{ detail: string }> {
	return apiClient.post<{ detail: string }>("/auth/customer/send-otp/", {
		phone_number: phoneNumber,
	});
}

export async function signupCustomer(
	credentials: CustomerSignupPayload,
): Promise<{ detail: string }> {
	return apiClient.post<{ detail: string }>(
		"/auth/signup/customer/",
		credentials,
	);
}

export async function verifyLoginOTP(
	payload: OtpVerificationPayload,
): Promise<LoginResponse> {
	// The API returns { access, refresh, user }.
	// We only use `access` and `user`, and discard `refresh` to avoid persisting it.
	return apiClient.post<LoginResponse>(
		"/auth/customer/login-otp/",
		payload,
	);
}

export async function resendOTP(
	phoneNumber: string,
): Promise<{ detail: string }> {
	return apiClient.post<{ detail: string }>("/auth/regenerate-otp/", {
		phone_number: phoneNumber,
	});
}

export async function getAuthUser(): Promise<User> {
	return apiClient.get<User>("/auth/users/me/");
}

export async function updateUserProfile(
	data: ProfileUpdatePayload,
): Promise<User> {
	return apiClient.patch<User>("/auth/users/me/update/", data);
}

export async function refreshToken(): Promise<{ access: string }> {
	// This function will likely fail now unless the backend changes to use HttpOnly cookies.
	// We are keeping it for the single-flight lock mechanism in the API client.
	return apiClient.post<{ access: string }>("/auth/refresh_token/", {});
}

export async function logoutUser(): Promise<void> {
	// We don't have a refresh token to send, but we still call logout
	// to allow the backend to invalidate the session if it can.
	await apiClient.post("/auth/logout/", {});
}
