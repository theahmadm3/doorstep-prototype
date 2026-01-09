
"use client";

import { apiClient } from "./api-client";
import {
	LoginResponse,
	User,
	ProfileUpdatePayload,
	CustomerSignupPayload,
	OtpVerificationPayload,
	PartnerLoginCredentials,
	RefreshTokenPayload,
	RefreshTokenResponse,
} from "./types";

export async function loginUser(
	credentials: PartnerLoginCredentials,
): Promise<LoginResponse> {
	// The API returns { access, refresh, user }.
	// The response is handled by the calling component to set tokens.
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
	// The response is handled by the calling component to set tokens.
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

export async function refreshToken(
	payload: RefreshTokenPayload,
): Promise<RefreshTokenResponse> {
	// This function is now just a direct API call.
	// The logic for handling it is centralized in api-client.ts
	return apiClient.post<RefreshTokenResponse>("/auth/refresh_token/", payload);
}

export async function logoutUser(): Promise<void> {
	// We don't have a refresh token to send here.
	// The backend should ideally invalidate the session based on the access token.
	// The client-side state will be cleared regardless.
	await apiClient.post("/auth/logout/", {});
}
