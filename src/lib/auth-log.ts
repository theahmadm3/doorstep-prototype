export type AuthLogEvent =
	| "logout_refresh_rejected"
	| "logout_retry_401"
	| "manual_logout"
	| "guard_no_auth"
	| "restored_from_backup"
	| "proactive_refresh_rejected";

interface AuthLogEntry {
	event: AuthLogEvent;
	detail?: string;
	at: string;
}

const LOG_KEY = "doorstep-auth-log";
const MAX_ENTRIES = 30;

// Diagnostic trail for session-loss reports: which logout path fired and when.
// Readable on a tester's device via DevTools/Safari inspector. Best-effort —
// must never throw into an auth flow.
export function logAuthEvent(event: AuthLogEvent, detail?: string): void {
	const entry: AuthLogEntry = { event, detail, at: new Date().toISOString() };
	console.warn("[auth]", entry.event, detail ?? "");
	try {
		const raw = localStorage.getItem(LOG_KEY);
		const parsed: unknown = raw ? JSON.parse(raw) : [];
		const list = Array.isArray(parsed) ? parsed : [];
		localStorage.setItem(
			LOG_KEY,
			JSON.stringify([...list, entry].slice(-MAX_ENTRIES)),
		);
	} catch {
		/* diagnostics only */
	}
}
