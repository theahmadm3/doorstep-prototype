
import { Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { getStoredToken, getStoredUser } from "@/lib/auth";
import { logAuthEvent } from "@/lib/auth-log";

export type AuthRole = "customer" | "restaurant" | "driver" | "admin";

/** Where each role's authenticated area lives. */
const ROLE_HOME: Record<AuthRole, string> = {
  customer: "/customer/dashboard",
  restaurant: "/vendor/dashboard",
  driver: "/rider/dashboard",
  admin: "/admin/dashboard",
};

interface StoredUser {
  role?: AuthRole;
}

/**
 * Read the logged-in user from localStorage. Returns null when there is no
 * token, no user, or the stored JSON is corrupt. This is the same shape the
 * login flows (`verify-otp-form`, `partner-login-form`) persist.
 */
function readAuth(): StoredUser | null {
  if (typeof window === "undefined") return null;
  const token = getStoredToken();
  const user = getStoredUser();
  if (!token || !user) return null;
  return user;
}

/**
 * Route guard for the role-specific dashboard areas. Redirects:
 *  - unauthenticated visitors to the public login (`/`)
 *  - authenticated users whose role does not match this area to their own home
 *
 * This is a SPA (createBrowserRouter, no SSR), so reading localStorage during
 * render is safe and lets us redirect before the protected layout paints.
 */
export default function RequireAuth({
  allow,
  children,
}: {
  allow: AuthRole;
  children: ReactNode;
}) {
  const location = useLocation();
  const user = readAuth();
  const isAuthed = user !== null;

  // Effect (not render) so StrictMode double-renders don't double-log
  useEffect(() => {
    if (!isAuthed) {
      logAuthEvent("guard_no_auth", location.pathname);
    }
  }, [isAuthed, location.pathname]);

  if (!user) {
    return (
      <Navigate to="/" replace state={{ from: location.pathname }} />
    );
  }

  if (user.role !== allow) {
    const home = user.role ? ROLE_HOME[user.role] : undefined;
    return <Navigate to={home ?? "/"} replace />;
  }

  return <>{children}</>;
}
