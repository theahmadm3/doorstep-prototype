# Doorstep — End-to-End Test Report

**Branch:** `feature/rewriting-codebase-in-react`
**Date:** 2026-06-13
**Tool:** Playwright 1.60 (`@playwright/test`)
**App under test:** Vite + React + React Router (dev server on `http://localhost:9002`)
**Browsers/viewports:** Desktop Chrome + Pixel 5 (mobile)

> **Update (2026-06-13):** Issues **1 & 2** below are now fixed and their specs
> de-`fixme`'d; **authenticated coverage** (customer / vendor / rider / admin)
> was added with a hermetic `page.route` API mock layer so tests never hit the
> live Render backend; and the suite is **wired into CI**
> ([`.github/workflows/e2e.yml`](../.github/workflows/e2e.yml)) with the HTML
> report uploaded as an artifact. See "Recommended next steps" for status.

---

## How to run

```bash
npm run test:e2e          # headless run (auto-starts the dev server)
npm run test:e2e:ui       # interactive UI mode
npm run test:e2e:report   # open the last HTML report
```

The Playwright `webServer` config boots `npm run dev` automatically, so no manual
server start is needed. Specs live in [`e2e/`](../e2e/); config in
[`playwright.config.ts`](../playwright.config.ts).

---

## Scope

**Public / unauthenticated surface** (deterministic without a live login):

- Home / customer login (`/`) — onboarding gate, phone validation, links, auth redirect
- Customer signup (`/signup`) — onboarding gate, field validation
- Partner login (secret route) — render, email validation, navigation
- Routing — 404 handling, `/login` route, protected-route auth guards
- Smoke — public pages load without uncaught JS / console errors

**Authenticated surface** (added — auth seeded via `localStorage`, API mocked
with `page.route`; see [`e2e/helpers.ts`](../e2e/helpers.ts) `mockApi`/`seedAuth`
and [`e2e/fixtures.ts`](../e2e/fixtures.ts)):

- Customer — dashboard restaurant list, open restaurant → menu → add to cart, orders list
- Vendor — dashboard summary, incoming order renders and Accept fires the backend call
- Rider — ongoing delivery renders and reaches OTP delivery confirmation
- Admin — users table, orders table, riders table render

The final **Paystack payment** hand-off (external gateway) is intentionally
left out of the customer flow — it cannot be exercised hermetically.

---

## Results summary

| Result | Count |
|--------|-------|
| ✅ Passed | 64 |
| ⏭️ Skipped | 0 |
| ❌ Unexpected failures | 0 |

(32 tests × 2 viewports.) The previously-skipped `test.fixme` specs for issues
1 & 2 now run and pass, enforcing the fixed behaviour.

---

## 🔴 Issues to fix (found by the tests)

### 1. No auth guard on any protected route — **High / security** — ✅ FIXED
Added [`RequireAuth`](../src/components/auth/require-auth.tsx) wrapping the
`/customer`, `/vendor`, `/rider`, `/admin` route groups in
[`routes.tsx`](../src/routes.tsx): unauthenticated visitors are redirected to
`/`, and users whose role doesn't match the area are sent to their own home.
The `test.fixme` markers on the 4 protected-route specs were removed and now
pass. _Original finding below._

Visiting `/customer/dashboard`, `/vendor/dashboard`, `/rider/dashboard`, or
`/admin/dashboard` **without being logged in** renders the dashboard layout
instead of redirecting to login. The layout components
(e.g. [`CustomerLayout.tsx`](../src/pages/customer/CustomerLayout.tsx)) read the
user from `localStorage` but never redirect when it is absent.

- **Evidence:** `e2e/routing.spec.ts` — 4 tests (×2 viewports = 8) confirm the
  URL stays on the protected route with no auth present.
- **Fix:** add a route guard (e.g. a `<RequireAuth>` wrapper / loader) on the
  `/customer`, `/vendor`, `/rider`, `/admin` route groups that redirects to `/`
  (and ideally enforces the correct role per group).

### 2. Dead `/login` route — **Medium / broken navigation** — ✅ FIXED
Added a `/login` route aliased to `<Login />` in
[`routes.tsx`](../src/routes.tsx), so all five `navigate("/login")` call sites
(logout, OTP + partner fallbacks) now resolve to the login screen instead of
404. The `test.fixme` marker on the `/login` spec was removed and now passes.
_Original finding below._

Five code paths navigate to `/login`, but **no `/login` route is defined** (only
`/`). Every one of these currently lands the user on the **404 page**:

- [`partner-login-form.tsx:76`](../src/components/auth/partner-login-form.tsx#L76) — customer-role partner login fallback
- [`verify-otp-form.tsx:43`](../src/components/auth/verify-otp-form.tsx#L43) and [`:159`](../src/components/auth/verify-otp-form.tsx#L159)
- [`bottom-navigation.tsx:58`](../src/components/layout/bottom-navigation.tsx#L58) and [`:74`](../src/components/layout/bottom-navigation.tsx#L74) — **logout** sends users to a 404

- **Evidence:** `e2e/routing.spec.ts` — "'/login' should show the login screen".
- **Fix:** either add a `/login` route (alias to the login page) **or** change
  these `navigate("/login")` calls to `navigate("/")`. Logout (bottom nav) is the
  most user-visible instance.

### 3. Protected pages never fire the `load` event — **Medium / investigate**
During the first run, navigations to the protected dashboards timed out waiting
for the browser `load` event (30s), while public pages loaded normally. This
indicates those pages keep network connections open or fire requests that never
settle (e.g. websockets / polling / backend calls with no timeout). Tests now
wait for `domcontentloaded` to work around it, but the underlying behaviour is
worth confirming — a request that never resolves can hang spinners and waste
battery/data on mobile.

- **Fix:** audit data-fetching on the dashboards (notification listener,
  rider-location socket, `useAddresses`, react-query calls) for requests without
  timeouts or error/abort handling.

---

## 🟡 Observations (not failing, worth noting)

- **WhatsApp onboarding gate is honor-system & non-persistent.** Both `/` and
  `/signup` hide the real form behind a "Continue" button with no verification
  and no persistence — users re-do it on every visit. Consider persisting the
  acknowledgement (e.g. `localStorage`) and/or treating it as UX-only.
- **`@playwright/test` was not a declared dependency.** Playwright was only
  resolvable via `npx`. It is now added to `devDependencies` along with npm
  scripts and a config so the suite is reproducible.

---

## ✅ What works (verified passing)

- Home page renders header + "Welcome Back!" card; onboarding gate correctly
  hides the phone form until "Continue".
- Phone-number validation (invalid → error, valid → error clears).
- Links from home → `/signup` and → partner login route.
- Already-authenticated customer (seeded `localStorage`) is redirected from `/`
  to `/customer/dashboard`.
- Signup page gating + name/email validation; "Log in" link returns to `/`.
- Partner login renders, validates email format, "Back to Home" works.
- 404 page renders for unknown routes; "Go home" returns to `/`.
- All public pages (`/`, `/signup`, `/signup/rider`, `/signup/vendor`, partner
  login) load with no uncaught JS / console errors (asset/PWA noise filtered).
- All of the above pass on both desktop and mobile (Pixel 5) viewports.

---

## Recommended next steps

1. ✅ **Done — Fixed issues 1 & 2** (auth guard + `/login`); the four `fixme`
   specs now run and pass.
2. ✅ **Done — Authenticated E2E coverage.** `seedAuth` + a new `mockApi`
   (`page.route`) layer drive role-specific specs: customer order flow, vendor
   order management, rider pickup/delivery, admin tables.
3. ✅ **Done — Hermetic backend.** `mockApi` intercepts every `${VITE_BASE_URL}`
   call and serves fixtures; unmatched calls get an empty-but-valid payload, so
   nothing reaches the live Render instance.
4. ✅ **Done — CI.** [`.github/workflows/e2e.yml`](../.github/workflows/e2e.yml)
   runs `npm run test:e2e` on push/PR and uploads the HTML report (and, on
   failure, traces/screenshots) as artifacts.

### Still open

- **Issue 3 (load event never fires on dashboards)** remains — the
  notification listener, rider-location ping, and react-query polling keep
  connections open. Tests work around it with `domcontentloaded` + mocked APIs,
  but the underlying battery/spinner concern is unaddressed.
- **Full customer checkout** (Paystack payment + `POST /orders/`) is not
  covered; it requires stubbing the external Paystack widget.
- **Deeper authenticated assertions** — vendor status transitions end-to-end,
  rider multi-step status progression, admin mutation actions (suspend/verify)
  — could be expanded on the foundation now in place.
