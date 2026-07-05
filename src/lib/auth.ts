import type { User } from "./types";
import {
	writeAuthBackup,
	readAuthBackup,
	clearAuthBackup,
} from "./token-backup";
import { logAuthEvent } from "./auth-log";

export const AUTH_KEYS = {
	accessToken: "accessToken",
	refreshToken: "refreshToken",
	user: "user",
	currentUserRole: "currentUserRole",
	lastUserRole: "lastUserRole",
} as const;

/**
 * Mirror the current localStorage auth state into IndexedDB. iOS/WKWebView
 * can evict localStorage and IndexedDB independently, so a second copy lets
 * us survive a one-sided wipe. Fire-and-forget: backup failures must never
 * break an auth flow.
 */
function mirrorAuthToBackup(): void {
	const access = localStorage.getItem(AUTH_KEYS.accessToken);
	const refresh = localStorage.getItem(AUTH_KEYS.refreshToken);
	const user = localStorage.getItem(AUTH_KEYS.user);
	if (!access || !refresh || !user) return;
	void writeAuthBackup({
		access,
		refresh,
		user,
		currentUserRole: localStorage.getItem(AUTH_KEYS.currentUserRole),
	}).catch(() => {});
}

/**
 * If localStorage lost the session but the IndexedDB mirror still has it,
 * copy it back. Call before the app renders so the route guard sees the
 * restored tokens. Returns true when a restore happened.
 */
export async function restoreAuthFromBackup(): Promise<boolean> {
	if (
		localStorage.getItem(AUTH_KEYS.accessToken) &&
		localStorage.getItem(AUTH_KEYS.refreshToken)
	) {
		return false;
	}
	const snapshot = await readAuthBackup().catch(() => null);
	if (!snapshot) return false;
	localStorage.setItem(AUTH_KEYS.accessToken, snapshot.access);
	localStorage.setItem(AUTH_KEYS.refreshToken, snapshot.refresh);
	localStorage.setItem(AUTH_KEYS.user, snapshot.user);
	if (snapshot.currentUserRole) {
		localStorage.setItem(AUTH_KEYS.currentUserRole, snapshot.currentUserRole);
	}
	logAuthEvent("restored_from_backup");
	return true;
}

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

	mirrorAuthToBackup();

	// Ask the browser to treat this origin's storage as non-evictable. Safari
	// honors it inconsistently, but it's free and can only help.
	if (typeof navigator !== "undefined" && navigator.storage?.persist) {
		void navigator.storage.persist().catch(() => {});
	}
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
	mirrorAuthToBackup();
}

/**
 * Removes all auth-related keys. Call on logout and on unrecoverable 401.
 */
export function clearAuth(): void {
	Object.values(AUTH_KEYS).forEach((key) => localStorage.removeItem(key));
	void clearAuthBackup().catch(() => {});
}

/**
 * Update only the user blob — call after profile mutations so the stored
 * object stays in sync without affecting tokens or role history.
 */
export function updateStoredUser(user: User): void {
	localStorage.setItem(AUTH_KEYS.user, JSON.stringify(user));
	mirrorAuthToBackup();
}

/**
 * Decode a JWT's expiry as epoch milliseconds, or null if the token isn't a
 * decodable JWT. Used for proactive refresh — never for trust decisions.
 */
export function getTokenExpiryMs(token: string): number | null {
	try {
		const payload = token.split(".")[1];
		const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
		const claims: unknown = JSON.parse(json);
		if (
			typeof claims === "object" &&
			claims !== null &&
			typeof (claims as { exp?: unknown }).exp === "number"
		) {
			return (claims as { exp: number }).exp * 1000;
		}
		return null;
	} catch {
		return null;
	}
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
