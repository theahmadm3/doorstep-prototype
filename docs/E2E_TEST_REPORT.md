# Doorstep — End-to-End Test Report

**Branch:** `e2e/playwright-tests` (from `feature/rewriting-codebase-in-react`)
**Date:** 2026-06-13
**Tool:** Playwright 1.60 (`@playwright/test`)
**App under test:** Vite + React + React Router (dev server on `http://localhost:9002`)
**Browsers/viewports:** Desktop Chrome + Pixel 5 (mobile)

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

These tests cover the **unauthenticated / public surface** of the app, which is
what can be exercised deterministically without a live OTP/WhatsApp login or a
seeded backend:

- Home / customer login (`/`) — onboarding gate, phone validation, links, auth redirect
- Customer signup (`/signup`) — onboarding gate, field validation
- Partner login (secret route) — render, email validation, navigation
- Routing — 404 handling, `/login` route, protected-route auth guards
- Smoke — public pages load without uncaught JS / console errors

Authenticated flows (placing an order, vendor/rider/admin dashboards, payments,
payouts) are **not** covered yet — they require test credentials and a seeded
backend. See "Recommended next steps".

---

## Results summary

| Result | Count |
|--------|-------|
| ✅ Passed | 36 |
| ⏭️ Skipped (documented bugs, `test.fixme`) | 10 |
| ❌ Unexpected failures | 0 |

The 10 skipped tests are **real bugs** encoded as executable specs. They are
marked `test.fixme` so the suite stays green in CI; **remove the `fixme` line as
each bug is fixed** and the test will start enforcing the correct behaviour.

---

## 🔴 Issues to fix (found by the tests)

### 1. No auth guard on any protected route — **High / security**
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

### 2. Dead `/login` route — **Medium / broken navigation**
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

1. **Fix issues 1 & 2 first** (auth guard + `/login`) — both are user-facing and
   the tests are already written; just delete the `fixme` lines to lock them in.
2. **Add authenticated E2E coverage.** Introduce a test-login helper (seed
   tokens via `localStorage`, as `e2e/helpers.ts#seedAuth` already does, or a
   dedicated test endpoint) and cover: customer order flow, vendor order
   management, rider pickup/delivery, admin tables.
3. **Stabilise backend dependence.** Point E2E at a seeded staging backend or
   mock the API (`page.route`) so tests are hermetic and don't hit the live
   Render instance.
4. **Wire into CI** (`npm run test:e2e`) with the HTML report uploaded as an
   artifact.
