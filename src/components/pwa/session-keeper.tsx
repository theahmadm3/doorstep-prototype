import { useEffect } from "react";
import { getStoredToken, getTokenExpiryMs } from "@/lib/auth";
import { tryRefresh } from "@/lib/api";
import { logAuthEvent } from "@/lib/auth-log";

const NEAR_EXPIRY_MS = 60_000;

// Proactively refresh an expired/near-expiry access token when the app is
// (re)opened, instead of letting the first API call 401. Listens to pageshow
// specifically because iOS restores PWAs from the back-forward cache, which
// skips normal mount logic. tryRefresh is single-flight, so overlapping
// events cost one request at most; failures here never log the user out —
// the fetcher's 401 path stays the sole authority on dead sessions.
export default function SessionKeeper() {
	useEffect(() => {
		const check = () => {
			if (document.visibilityState !== "visible") return;
			const token = getStoredToken();
			if (!token) return;
			const expiresAt = getTokenExpiryMs(token);
			if (expiresAt === null) return;
			if (Date.now() > expiresAt - NEAR_EXPIRY_MS) {
				void tryRefresh().then((result) => {
					if (result.status === "unauthorized") {
						logAuthEvent("proactive_refresh_rejected");
					}
				});
			}
		};

		check();

		const handleVisibility = () => check();
		window.addEventListener("pageshow", check);
		document.addEventListener("visibilitychange", handleVisibility);
		window.addEventListener("focus", check);
		return () => {
			window.removeEventListener("pageshow", check);
			document.removeEventListener("visibilitychange", handleVisibility);
			window.removeEventListener("focus", check);
		};
	}, []);

	return null;
}
