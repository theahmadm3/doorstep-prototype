import type { User } from "./types";

export const AUTH_KEYS = {
	accessToken: "accessToken",
	refreshToken: "refreshToken",
	user: "user",
	currentUserRole: "currentUserRole",
	lastUserRole: "lastUserRole",
} as const;

/**
 * Persists tokens + user after a successful login. Tracks role history so
 * the app can reroute returning users without parsing the full user object.
 */
export function persistAuth(
	tokens: { access: string; refresh: string },
	user: User,
): void {
	localStorage.setItem(AUTH_KEYS.accessToken, tokens.access);
	localStorage.setItem(AUTH_KEYS.refreshToken, tokens.refresh);
	localStorage.setItem(AUTH_KEYS.user, JSON.stringify(user));

	// Rotate role history: if someone switches accounts, `lastUserRole` tells
	// us what kind of user was here before.
	const prev = localStorage.getItem(AUTH_KEYS.currentUserRole);
	if (prev && prev !== user.role) {
		localStorage.setItem(AUTH_KEYS.lastUserRole, prev);
	}
	localStorage.setItem(AUTH_KEYS.currentUserRole, user.role);
}

/**
 * Rotate access + refresh after a successful token refresh. Leaves the
 * stored user and role untouched — this is a token rotation, not a login.
 */
export function updateAccessToken(tokens: {
	access: string;
	refresh: string;
}): void {
	localStorage.setItem(AUTH_KEYS.accessToken, tokens.access);
	localStorage.setItem(AUTH_KEYS.refreshToken, tokens.refresh);
}

/**
 * Removes all auth-related keys. Call on logout and on unrecoverable 401.
 */
export function clearAuth(): void {
	Object.values(AUTH_KEYS).forEach((key) => localStorage.removeItem(key));
}

/**
 * Update only the user blob — call after profile mutations so the stored
 * object stays in sync without affecting tokens or role history.
 */
export function updateStoredUser(user: User): void {
	localStorage.setItem(AUTH_KEYS.user, JSON.stringify(user));
}

/**
 * Read the raw access token — use instead of localStorage.getItem("accessToken")
 * so key names stay in one place.
 */
export function getStoredToken(): string | null {
	return localStorage.getItem(AUTH_KEYS.accessToken);
}

/**
 * Fast role read — avoids JSON.parse of the full user object for rerouting.
 */
export function getStoredRole(): string | null {
	return localStorage.getItem(AUTH_KEYS.currentUserRole);
}

/**
 * Read the full stored user, or null if absent / corrupt.
 */
export function getStoredUser(): User | null {
	try {
		const raw = localStorage.getItem(AUTH_KEYS.user);
		return raw ? (JSON.parse(raw) as User) : null;
	} catch {
		return null;
	}
}
