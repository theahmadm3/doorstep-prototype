
"use client";

import { apiClient } from "./api-client";
import {
	LoginResponse,
	User,
	ProfileUpdatePayload,
	CustomerSignupPayload,
	OtpVerificationPayload,
	VerifyOtpResponse,
	PartnerLoginCredentials,
} from "./types";

export async function loginUser(
	credentials: PartnerLoginCredentials,
): Promise<LoginResponse> {
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
): Promise<VerifyOtpResponse> {
	return apiClient.post<VerifyOtpResponse>(
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
	return apiClient.post<{ access: string }>("/auth/refresh_token/", {});
}

export async function logoutUser(): Promise<void> {
	await apiClient.post("/auth/logout/", {});
}
