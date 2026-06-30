# Next.js → Vite + React + MUI Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the Doorstep prototype from Next.js (App Router) to a client-side React + TypeScript SPA on Vite 6 + React Router v6, replacing shadcn/ui with Material UI while keeping Tailwind for layout.

**Architecture:** In-place rewrite on branch `feature/rewriting-codebase-in-react`. Scaffold the Vite + React Router shell and an MUI theme first, then run mechanical codemods for Next APIs, then convert each `src/components/ui/*` primitive to render MUI internally **behind its existing public API** (so the 72 consuming files barely change), then convert bespoke components, then PWA, then dependency cleanup. TanStack Query, Zustand, react-hook-form + Zod, the `lib/api.ts` fetch layer, Paystack, Google Maps, recharts, framer-motion, and the Tailwind config/`globals.css` all stay.

**Tech Stack:** Vite 6, `@vitejs/plugin-react`, `vite-plugin-pwa`, `vite-tsconfig-paths`, React 18, `react-router-dom@6`, `@mui/material` + `@mui/icons-material` + `@emotion/react` + `@emotion/styled`, TypeScript 5, Tailwind 3, TanStack Query, Zustand.

---

## Important migration notes (read before starting)

- **The build will be RED from the end of Phase 1 until the end of Phase 5.** This is unavoidable in a framework swap: the Vite entry exists before all `next/*` imports are removed. Intermediate verification uses the **TypeScript error count trend** (`npx tsc --noEmit 2>&1 | measure`), which must strictly decrease task-over-task. The final green gate is `npm run build` passing at the end of Phase 5/8.
- **Preserve public APIs.** When converting `src/components/ui/*`, keep the same exported names and prop shapes. Consumers pass Tailwind `className`; MUI components forward `className`, so utility classes keep working. Keep `cn()` (`src/lib/utils.ts`), `clsx`, and `tailwind-merge`.
- **`asChild` / Radix `Slot`.** Several primitives (`Button`, `SidebarMenuButton`, etc.) use `asChild` to render a child (often `<Link>`). Keep `@radix-ui/react-slot` installed and keep the `asChild` behavior in those wrappers — do NOT remove it. Only Radix packages that back a converted component get removed.
- **Run commands from the repo root** `c:\Users\dell\doorstep-prototype`. Shell is PowerShell; commands below use cross-platform npm/npx. For counting tsc errors use: `npx tsc --noEmit 2>&1 | Measure-Object -Line`.
- **Commit after every task.** Use the `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` trailer.

---

## File Structure (created / moved / removed)

**Created:**
- `index.html` (repo root) — Vite HTML entry with meta/title/manifest tags
- `vite.config.ts` — Vite + React + PWA + tsconfig-paths config
- `src/main.tsx` — React root, mounts `<App/>`
- `src/App.tsx` — providers + router composition
- `src/routes.tsx` — React Router route tree
- `src/theme.ts` — MUI theme matching `globals.css` palette/typography
- `src/components/layout/RoleLayout` usage — existing `*/layout.tsx` become layout route elements
- `src/pages/NotFound.tsx` — replaces `notFound()`
- `.env.example` — documents the four `VITE_*` vars
- `src/vite-env.d.ts` — `import.meta.env` typing + asset module declarations

**Moved / renamed:**
- `src/app/globals.css` → `src/index.css` (imported in `main.tsx`); content unchanged
- `src/app/**/page.tsx` / `layout.tsx` → `src/pages/**` route components (see Phase 3 mapping). Filenames lose the `page.tsx`/`layout.tsx` convention.

**Removed:**
- `next.config.ts`, `next-pwa.d.ts`, `src/ai/` (genkit), `src/app/api/`, `src/app/layout.tsx` (replaced by `index.html` + `App.tsx`), `.next/` build output, `components.json` (shadcn config no longer needed; optional)

**Unchanged:** `tailwind.config.ts`, `postcss.config.mjs`, `src/lib/*` (except env access), `src/stores/*`, `src/hooks/*` (except env/router access), `public/*`.

---

## Phase 0: Baseline safety

### Task 0: Confirm clean tree and record baseline

**Files:** none

- [ ] **Step 1: Confirm working tree is clean and on the right branch**

Run: `git status` and `git branch --show-current`
Expected: clean tree, branch `feature/rewriting-codebase-in-react`.

- [ ] **Step 2: Record the current dependency list for reference**

Run: `git log --oneline -1`
Expected: prints the latest commit (the design-doc commit). No changes to make; this task is a checkpoint only.

---

## Phase 1: Vite + tooling scaffold

### Task 1: Rewrite package.json deps and scripts

**Files:**
- Modify: `c:\Users\dell\doorstep-prototype\package.json`

- [ ] **Step 1: Replace scripts and dependency blocks**

Set `scripts` to:

```json
"scripts": {
  "dev": "vite --port 9002",
  "build": "tsc --noEmit && vite build",
  "preview": "vite preview --port 9002",
  "lint": "eslint . --ext ts,tsx",
  "typecheck": "tsc --noEmit"
}
```

Remove these dependencies: `next`, `next-pwa`, `@genkit-ai/googleai`, `@genkit-ai/next`, `genkit`, and from devDependencies `genkit-cli`, `ts-node` (Vite uses esbuild), `postcss` stays.

Keep these dependencies: `@hookform/resolvers`, all `@radix-ui/*` (removed later per-component in Phase 5), `@react-google-maps/api`, `@tanstack/react-query`, `class-variance-authority`, `clsx`, `date-fns`, `dotenv`, `embla-carousel-react`, `firebase`, `framer-motion`, `lucide-react`, `react`, `react-day-picker`, `react-dom`, `react-error-boundary`, `react-hook-form`, `react-paystack`, `recharts`, `tailwind-merge`, `tailwindcss-animate`, `use-places-autocomplete`, `uuid`, `zod`, `zustand`.

Add to dependencies:

```json
"react-router-dom": "^6.26.0",
"@mui/material": "^6.1.0",
"@mui/icons-material": "^6.1.0",
"@emotion/react": "^11.13.0",
"@emotion/styled": "^11.13.0"
```

Add to devDependencies:

```json
"vite": "^6.0.0",
"@vitejs/plugin-react": "^4.3.0",
"vite-plugin-pwa": "^0.21.0",
"vite-tsconfig-paths": "^5.1.0"
```

- [ ] **Step 2: Install**

Run: `npm install`
Expected: completes; `node_modules/vite` and `node_modules/@mui/material` exist. Peer-dep warnings are acceptable.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: swap Next.js/genkit deps for Vite + MUI + React Router"
```

### Task 2: Add Vite config, tsconfig updates, env typing

**Files:**
- Create: `c:\Users\dell\doorstep-prototype\vite.config.ts`
- Modify: `c:\Users\dell\doorstep-prototype\tsconfig.json`
- Create: `c:\Users\dell\doorstep-prototype\src\vite-env.d.ts`
- Remove: `c:\Users\dell\doorstep-prototype\next-pwa.d.ts`, `c:\Users\dell\doorstep-prototype\next.config.ts`

- [ ] **Step 1: Create `vite.config.ts`** (PWA wired in Phase 7; keep minimal here)

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: { port: 9002 },
  build: { outDir: "dist" },
});
```

- [ ] **Step 2: Update `tsconfig.json`** to Vite/bundler settings while keeping the `@/*` alias

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `src/vite-env.d.ts`**

```ts
/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_BASE_URL: string;
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  readonly VITE_PAYSTACK_PUBLIC_KEY: string;
  readonly VITE_VAPID_PUBLIC_KEY: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.png";
declare module "*.jpg";
declare module "*.svg";
```

- [ ] **Step 4: Delete Next config files**

Run: `git rm next.config.ts next-pwa.d.ts`
Expected: both removed.

- [ ] **Step 5: Commit**

```bash
git add vite.config.ts tsconfig.json src/vite-env.d.ts
git commit -m "chore: add Vite config, bundler tsconfig, env typing"
```

### Task 3: Create HTML entry, move globals.css, drop Next entry & genkit

**Files:**
- Create: `c:\Users\dell\doorstep-prototype\index.html`
- Move: `src/app/globals.css` → `src/index.css`
- Remove: `src/ai/` (whole dir), `src/app/api/` (whole dir), `src/app/layout.tsx`
- Create: `c:\Users\dell\doorstep-prototype\.env.example`

- [ ] **Step 1: Create `index.html`** at repo root (port the metadata/viewport/manifest from the old `src/app/layout.tsx`)

```html
<!doctype html>
<html lang="en" class="h-full">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#005380" />
    <link rel="manifest" href="/manifest.json" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Doorstep" />
    <meta name="description" content="Your favourite food, delivered to your doorstep." />
    <title>Doorstep</title>
  </head>
  <body class="antialiased flex flex-col h-full bg-background">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Move globals.css** (content unchanged — it already `@import`s the Inter/Poppins Google Fonts and declares the Tailwind layers and CSS variables)

Run: `git mv src/app/globals.css src/index.css`
Expected: file now at `src/index.css`.

- [ ] **Step 3: Remove genkit, the empty API route, and the old root layout**

Run: `git rm -r src/ai src/app/api && git rm src/app/layout.tsx`
Expected: all removed.

- [ ] **Step 4: Create `.env.example`**

```bash
VITE_BASE_URL=https://your-backend.example.com/api
VITE_GOOGLE_MAPS_API_KEY=
VITE_PAYSTACK_PUBLIC_KEY=
VITE_VAPID_PUBLIC_KEY=
```

- [ ] **Step 5: Commit**

```bash
git add index.html src/index.css .env.example
git commit -m "chore: add HTML entry, move globals.css, drop genkit + Next root layout"
```

---

## Phase 2: MUI theme & app shell providers

### Task 4: Create the MUI theme matching globals.css

**Files:**
- Create: `c:\Users\dell\doorstep-prototype\src\theme.ts`

- [ ] **Step 1: Create `src/theme.ts`** (palette mirrors the HSL CSS variables in `index.css`: primary `hsl(201 100% 25%)` = `#005380`; destructive ≈ `#ef4444`; background `#f3f3f3`. Typography uses the already-loaded Poppins (headings) / Inter (body).)

```ts
import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: { main: "#005380", contrastText: "#fafafa" },
    secondary: { main: "#f5f5f5", contrastText: "#171717" },
    error: { main: "#ef4444", contrastText: "#fafafa" },
    background: { default: "#f3f3f3", paper: "#ffffff" },
    text: { primary: "#36404a" },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: "Inter, system-ui, sans-serif",
    h1: { fontFamily: "Poppins, sans-serif" },
    h2: { fontFamily: "Poppins, sans-serif" },
    h3: { fontFamily: "Poppins, sans-serif" },
    h4: { fontFamily: "Poppins, sans-serif" },
    button: { textTransform: "none", fontWeight: 500 },
  },
  components: {
    // Tailwind preflight + MUI both reset. Disable MUI's global baseline
    // scrollbar overrides to avoid fighting Tailwind; keep component resets.
    MuiButtonBase: { defaultProps: { disableRipple: false } },
  },
});
```

- [ ] **Step 2: Typecheck the theme file in isolation**

Run: `npx tsc --noEmit src/theme.ts --jsx react-jsx --moduleResolution bundler --skipLibCheck`
Expected: no errors (or only the known project-wide errors, none originating in `theme.ts`).

- [ ] **Step 3: Commit**

```bash
git add src/theme.ts
git commit -m "feat: add MUI theme mirroring globals.css palette and fonts"
```

### Task 5: Create main.tsx and App.tsx (providers + router shell)

**Files:**
- Create: `c:\Users\dell\doorstep-prototype\src\main.tsx`
- Create: `c:\Users\dell\doorstep-prototype\src\App.tsx`
- Reference (do not edit yet): `src/components/providers.tsx`

> **CssBaseline vs Tailwind preflight:** Both reset base styles. Mount order is `ThemeProvider` → `CssBaseline` → app, and Tailwind's `@tailwind base` (in `index.css`, imported in `main.tsx` **after** nothing — CSS import order: import `index.css` first). Because Tailwind classes are used for layout and MUI for components, keep BOTH but import `index.css` in `main.tsx` so Tailwind's preflight loads, and rely on MUI components carrying their own styles via emotion (higher specificity at runtime). Do not set `enableColorScheme`.

- [ ] **Step 1: Create `src/main.tsx`**

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 2: Create `src/App.tsx`** (wraps existing `Providers` with MUI + Router; `RouterProvider` from Phase 3 supplies `router`)

```tsx
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { RouterProvider } from "react-router-dom";
import { Providers } from "@/components/providers";
import { theme } from "@/theme";
import { router } from "@/routes";

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme={false} />
      <Providers>
        <RouterProvider router={router} />
      </Providers>
    </ThemeProvider>
  );
}
```

> Note: `src/routes.tsx` is created in Phase 3 (Task 6). Until then `@/routes` will not resolve — expected during the red window. Do not run a full build yet.

- [ ] **Step 3: Commit**

```bash
git add src/main.tsx src/App.tsx
git commit -m "feat: add React root and app shell (MUI + Providers + Router)"
```

---

## Phase 3: Routing (App Router → React Router v6)

### Task 6: Build the route tree and move pages/layouts

**Files:**
- Create: `c:\Users\dell\doorstep-prototype\src\routes.tsx`
- Create: `c:\Users\dell\doorstep-prototype\src\pages\NotFound.tsx`
- Move every `src/app/**/page.tsx` and `layout.tsx` into `src/pages/**` (see mapping table). The blank `secret/.../login/page.tsx` keeps its deep path.

**Route mapping (path → component file):**

| URL path | Component (moved from) |
|---|---|
| `/` | `src/pages/Login.tsx` (from `src/app/page.tsx` + `page.client` if any) |
| `/menu` | `src/pages/Menu.tsx` (from `src/app/menu/page.tsx`) |
| `/verify-otp` | `src/pages/VerifyOtp.tsx` |
| `/signup` | `src/pages/signup/Signup.tsx` |
| `/signup/rider` | `src/pages/signup/SignupRider.tsx` |
| `/signup/vendor` | `src/pages/signup/SignupVendor.tsx` |
| `/rider/signup` | `src/pages/rider/RiderSignup.tsx` |
| `/restaurants/:restaurantId` | `src/pages/restaurants/RestaurantDetail.tsx` |
| `/secret/non-accessible/to/customers/login` | `src/pages/secret/SecretLogin.tsx` |
| customer layout | `src/pages/customer/CustomerLayout.tsx` (from `customer/layout.tsx`) |
| `/customer/dashboard` | `src/pages/customer/Dashboard.tsx` (+ keep `Dashboard.client.tsx`) |
| `/customer/orders` | `src/pages/customer/Orders.tsx` |
| `/customer/profile` | `src/pages/customer/Profile.tsx` |
| `/customer/search` | `src/pages/customer/Search.tsx` |
| `/customer/restaurants/:restaurantId` | `src/pages/customer/RestaurantDetail.tsx` |
| vendor layout | `src/pages/vendor/VendorLayout.tsx` |
| `/vendor/{dashboard,orders,analytics,config,payouts,profile,signup}` | `src/pages/vendor/*.tsx` |
| rider layout | `src/pages/rider/RiderLayout.tsx` |
| `/rider/{dashboard,orders,payouts,profile}` | `src/pages/rider/*.tsx` |
| admin layout | `src/pages/admin/AdminLayout.tsx` |
| `/admin/{dashboard,orders,analytics,config,riders,vendors}` | `src/pages/admin/*.tsx` |

- [ ] **Step 1: Move the files with `git mv`** following the table above. Example commands:

```bash
git mv src/app/page.tsx src/pages/Login.tsx
git mv src/app/menu/page.tsx src/pages/Menu.tsx
git mv src/app/customer/layout.tsx src/pages/customer/CustomerLayout.tsx
git mv src/app/customer/dashboard/page.tsx src/pages/customer/Dashboard.tsx
git mv src/app/customer/dashboard/page.client.tsx src/pages/customer/Dashboard.client.tsx
# ...repeat for every row in the mapping table...
```
After moving all, remove the now-empty tree: `git rm -r src/app` (only if empty of tracked files).

- [ ] **Step 2: Convert each layout to render `<Outlet/>`** instead of `{children}`. In every `*Layout.tsx`, replace the prop signature and the `{children}` slot:

Replace:
```tsx
export default function CustomerLayout({ children }: { children: React.ReactNode }) {
```
with:
```tsx
import { Outlet } from "react-router-dom";
export default function CustomerLayout() {
```
and replace the single `{children}` usage in the JSX with `<Outlet />`.

- [ ] **Step 3: Create `src/pages/NotFound.tsx`**

```tsx
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">404 — Page not found</h1>
      <Link to="/" className="text-primary underline">Go home</Link>
    </div>
  );
}
```

- [ ] **Step 4: Create `src/routes.tsx`** with `createBrowserRouter`

```tsx
import { createBrowserRouter } from "react-router-dom";
import Login from "@/pages/Login";
import Menu from "@/pages/Menu";
import VerifyOtp from "@/pages/VerifyOtp";
import Signup from "@/pages/signup/Signup";
import SignupRider from "@/pages/signup/SignupRider";
import SignupVendor from "@/pages/signup/SignupVendor";
import RiderSignup from "@/pages/rider/RiderSignup";
import RestaurantDetail from "@/pages/restaurants/RestaurantDetail";
import SecretLogin from "@/pages/secret/SecretLogin";
import NotFound from "@/pages/NotFound";

import CustomerLayout from "@/pages/customer/CustomerLayout";
import CustomerDashboard from "@/pages/customer/Dashboard";
import CustomerOrders from "@/pages/customer/Orders";
import CustomerProfile from "@/pages/customer/Profile";
import CustomerSearch from "@/pages/customer/Search";
import CustomerRestaurantDetail from "@/pages/customer/RestaurantDetail";

import VendorLayout from "@/pages/vendor/VendorLayout";
import VendorDashboard from "@/pages/vendor/Dashboard";
import VendorOrders from "@/pages/vendor/Orders";
import VendorAnalytics from "@/pages/vendor/Analytics";
import VendorConfig from "@/pages/vendor/Config";
import VendorPayouts from "@/pages/vendor/Payouts";
import VendorProfile from "@/pages/vendor/Profile";
import VendorSignup from "@/pages/vendor/Signup";

import RiderLayout from "@/pages/rider/RiderLayout";
import RiderDashboard from "@/pages/rider/Dashboard";
import RiderOrders from "@/pages/rider/Orders";
import RiderPayouts from "@/pages/rider/Payouts";
import RiderProfile from "@/pages/rider/Profile";

import AdminLayout from "@/pages/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminOrders from "@/pages/admin/Orders";
import AdminAnalytics from "@/pages/admin/Analytics";
import AdminConfig from "@/pages/admin/Config";
import AdminRiders from "@/pages/admin/Riders";
import AdminVendors from "@/pages/admin/Vendors";

export const router = createBrowserRouter([
  { path: "/", element: <Login /> },
  { path: "/menu", element: <Menu /> },
  { path: "/verify-otp", element: <VerifyOtp /> },
  { path: "/signup", element: <Signup /> },
  { path: "/signup/rider", element: <SignupRider /> },
  { path: "/signup/vendor", element: <SignupVendor /> },
  { path: "/rider/signup", element: <RiderSignup /> },
  { path: "/restaurants/:restaurantId", element: <RestaurantDetail /> },
  { path: "/secret/non-accessible/to/customers/login", element: <SecretLogin /> },
  {
    path: "/customer",
    element: <CustomerLayout />,
    children: [
      { path: "dashboard", element: <CustomerDashboard /> },
      { path: "orders", element: <CustomerOrders /> },
      { path: "profile", element: <CustomerProfile /> },
      { path: "search", element: <CustomerSearch /> },
      { path: "restaurants/:restaurantId", element: <CustomerRestaurantDetail /> },
    ],
  },
  {
    path: "/vendor",
    element: <VendorLayout />,
    children: [
      { path: "dashboard", element: <VendorDashboard /> },
      { path: "orders", element: <VendorOrders /> },
      { path: "analytics", element: <VendorAnalytics /> },
      { path: "config", element: <VendorConfig /> },
      { path: "payouts", element: <VendorPayouts /> },
      { path: "profile", element: <VendorProfile /> },
      { path: "signup", element: <VendorSignup /> },
    ],
  },
  {
    path: "/rider",
    element: <RiderLayout />,
    children: [
      { path: "dashboard", element: <RiderDashboard /> },
      { path: "orders", element: <RiderOrders /> },
      { path: "payouts", element: <RiderPayouts /> },
      { path: "profile", element: <RiderProfile /> },
    ],
  },
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { path: "dashboard", element: <AdminDashboard /> },
      { path: "orders", element: <AdminOrders /> },
      { path: "analytics", element: <AdminAnalytics /> },
      { path: "config", element: <AdminConfig /> },
      { path: "riders", element: <AdminRiders /> },
      { path: "vendors", element: <AdminVendors /> },
    ],
  },
  { path: "*", element: <NotFound /> },
]);
```

> Note: `vendor/signup` exists both as `/vendor/signup` (under layout) and there is a top-level `/signup/vendor`. Keep both; they were both present in the original app.

- [ ] **Step 5: Fix default-export names** in moved files if the component function name should match (optional; React Router uses the imported binding, so internal function names need not change, but update any self-referential `displayName`).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add React Router route tree; move pages/layouts out of app dir"
```

---

## Phase 4: Next API codemods

> Apply these mechanically across the files listed. After each task, run `npx tsc --noEmit 2>&1 | Measure-Object -Line` and confirm the error count is **lower** than before the task.

### Task 7: Replace `next/link` with React Router `Link`

**Files (20):** `src/pages/admin/AdminLayout.tsx`, `src/pages/customer/Dashboard.client.tsx`, `src/pages/customer/CustomerLayout.tsx`, `src/pages/customer/RestaurantDetail.tsx`, `src/pages/customer/Search.tsx`, `src/pages/Menu.tsx`, `src/pages/Login.tsx`, `src/pages/restaurants/RestaurantDetail.tsx`, `src/pages/rider/RiderLayout.tsx`, `src/pages/rider/RiderSignup.tsx`, `src/pages/secret/SecretLogin.tsx`, `src/pages/signup/Signup.tsx`, `src/pages/signup/SignupRider.tsx`, `src/pages/signup/SignupVendor.tsx`, `src/pages/vendor/VendorLayout.tsx`, `src/pages/vendor/Signup.tsx`, `src/pages/VerifyOtp.tsx`, `src/components/auth/whatsapp-onboarding.tsx`, `src/components/layout/bottom-navigation.tsx`, `src/components/layout/client-header.tsx`

- [ ] **Step 1:** In each file replace the import:

```tsx
// from
import Link from "next/link";
// to
import { Link } from "react-router-dom";
```

- [ ] **Step 2:** Replace the `href` prop with `to` on every `<Link>` element in those files. For `<Link href="/x">` → `<Link to="/x">`. Where `<Button asChild><Link href="/x">…</Link></Button>` appears, keep the structure, only swap `href`→`to`.

- [ ] **Step 3: Verify error trend**

Run: `npx tsc --noEmit 2>&1 | Measure-Object -Line`
Expected: line count strictly lower than the Phase 3 baseline.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: replace next/link with react-router-dom Link"
```

### Task 8: Replace `next/navigation` hooks

**Files (12):** `src/pages/customer/CustomerLayout.tsx`, `src/pages/customer/RestaurantDetail.tsx`, `src/pages/Login.tsx`, `src/pages/restaurants/RestaurantDetail.tsx`, `src/pages/vendor/Dashboard.tsx`, `src/components/auth/login-form.tsx`, `src/components/auth/logout-button.tsx`, `src/components/auth/partner-login-form.tsx`, `src/components/auth/signup-form.tsx`, `src/components/auth/verify-otp-form.tsx`, `src/components/checkout/checkout-modal.tsx`, `src/components/layout/bottom-navigation.tsx`

- [ ] **Step 1: Replace imports** `from "next/navigation"` with `from "react-router-dom"`, mapping names:
  - `useRouter` → `useNavigate`
  - `usePathname` → `useLocation`
  - `useSearchParams` → `useSearchParams` (same name; different return — see Step 3)
  - `useParams` → `useParams`
  - `notFound` → remove import; replace call sites with `navigate("/404")` or render `<NotFound/>`.

- [ ] **Step 2: Rewrite router usage:**
  - `const router = useRouter();` → `const navigate = useNavigate();`
  - `router.push(x)` → `navigate(x)`
  - `router.replace(x)` → `navigate(x, { replace: true })`
  - `router.back()` → `navigate(-1)`
  - `router.refresh()` → remove (no equivalent; rely on React Query refetch).

- [ ] **Step 3: Rewrite pathname/search usage:**
  - `const pathname = usePathname();` → `const pathname = useLocation().pathname;`
  - `const searchParams = useSearchParams();` then `searchParams.get("x")` → with RR, `const [searchParams] = useSearchParams();` then `searchParams.get("x")` (RR returns a tuple). Update destructuring accordingly in `login-form.tsx`.

- [ ] **Step 4: Verify error trend**

Run: `npx tsc --noEmit 2>&1 | Measure-Object -Line`
Expected: strictly lower than after Task 7.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: replace next/navigation with react-router-dom hooks"
```

### Task 9: Replace `next/image` with `<img>`

**Files (12):** `src/pages/customer/Dashboard.client.tsx`, `src/pages/customer/Orders.tsx`, `src/pages/customer/RestaurantDetail.tsx`, `src/pages/customer/Search.tsx`, `src/pages/Menu.tsx`, `src/pages/restaurants/RestaurantDetail.tsx`, `src/pages/signup/SignupVendor.tsx`, `src/pages/vendor/Profile.tsx`, `src/components/checkout/add-to-cart-modal.tsx`, `src/components/checkout/checkout-modal.tsx`, `src/components/dashboard/customer-order-timeline.tsx`, `src/components/dashboard/vendor-item-management.tsx`

- [ ] **Step 1:** Remove `import Image from "next/image";` from each file.

- [ ] **Step 2:** Replace each `<Image .../>` with `<img .../>`. Drop Next-only props (`fill`, `priority`, `quality`, `placeholder`, `blurDataURL`, `loader`). Convert `fill` usage: where `<Image fill className="object-cover" />` was inside a relative container, use `<img className="absolute inset-0 h-full w-full object-cover" />`. Keep `src`, `alt`, `width`, `height`, `className`, `onError`, `loading`.

- [ ] **Step 3: Verify error trend**

Run: `npx tsc --noEmit 2>&1 | Measure-Object -Line`
Expected: strictly lower than after Task 8.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: replace next/image with native img"
```

### Task 10: Migrate env access to `import.meta.env`

**Files (6):** `src/lib/api.ts`, `src/lib/auth-api.ts`, `src/lib/push-notifications.ts`, `src/pages/vendor/Profile.tsx`, `src/components/checkout/checkout-modal.tsx`, `src/components/location/address-selection-modal.tsx`, `src/components/vendor/vendor-address-modal.tsx`

- [ ] **Step 1:** Replace each env reference:
  - `process.env.NEXT_PUBLIC_BASE_URL` → `import.meta.env.VITE_BASE_URL`
  - `process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` → `import.meta.env.VITE_GOOGLE_MAPS_API_KEY`
  - `process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` → `import.meta.env.VITE_PAYSTACK_PUBLIC_KEY`
  - `process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY` → `import.meta.env.VITE_VAPID_PUBLIC_KEY`

- [ ] **Step 2:** In `src/lib/api.ts` and `auth-api.ts`, the existing guard `if (!BASE_URL) throw new Error(...)` stays; just update the variable source. Update the error message text from `NEXT_PUBLIC_BASE_URL` to `VITE_BASE_URL`.

- [ ] **Step 3: Create a local `.env`** (untracked) so the dev server can boot:

```bash
VITE_BASE_URL=https://placeholder.invalid/api
```
Confirm `.env` is in `.gitignore` (Next's default ignores `.env*`; verify).

- [ ] **Step 4: Verify error trend**

Run: `npx tsc --noEmit 2>&1 | Measure-Object -Line`
Expected: strictly lower than after Task 9.

- [ ] **Step 5: Commit** (do not commit `.env`)

```bash
git add src/lib src/pages src/components
git commit -m "refactor: read config from import.meta.env (VITE_*)"
```

---

## Phase 5: Convert `src/components/ui/*` to MUI (keep public API)

> **Conversion recipe (applies to every component below):**
> 1. Keep the file path, exported names, and prop interfaces identical.
> 2. Render the MUI component internally; forward `className` (Tailwind classes still apply) and `ref`.
> 3. Map shadcn variant/size props to MUI props (tables below).
> 4. Remove that component's `@radix-ui/*` import. Keep `@radix-ui/react-slot` wherever `asChild` is supported.
> 5. After each task: `npx tsc --noEmit 2>&1 | Measure-Object -Line` must trend down.
> 6. Commit per task.

### Task 11: Button (pattern-setter — keep `asChild`, map variants)

**Files:** Modify `src/components/ui/button.tsx`

- [ ] **Step 1: Rewrite** keeping `ButtonProps`, `variant`, `size`, `asChild`, and a `buttonVariants` export (some files import it for styling other elements, so keep the CVA export intact). Render MUI `Button` unless `asChild`.

```tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import MuiButton from "@mui/material/Button";
import { cn } from "@/lib/utils";

// Kept for callers that import buttonVariants to style links/anchors.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: { default: "h-10 px-4 py-2", sm: "h-9 px-3", lg: "h-11 px-8", icon: "h-10 w-10" },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    // asChild path: keep Tailwind styling so wrapped <Link> looks right.
    if (asChild) {
      return (
        <Slot ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
      );
    }
    return (
      <MuiButton ref={ref} className={cn(className)} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

> Rationale: `asChild` is used to style `<Link>`/`<a>` as buttons (e.g. nav). Routing those through MUI Button + `component` is fragile, so the `asChild` branch keeps the Tailwind-styled Slot. The default branch uses MUI Button and lets Tailwind `className` fine-tune. Visual parity is acceptable per "MUI components + keep Tailwind."

- [ ] **Step 2: Verify error trend.** Run: `npx tsc --noEmit 2>&1 | Measure-Object -Line`. Expected: not higher.
- [ ] **Step 3: Commit.** `git add src/components/ui/button.tsx && git commit -m "refactor(ui): Button renders MUI Button, keeps asChild + variants"`

### Task 12: Layout/typography primitives — Card, Separator, Skeleton, Avatar, Badge, Label

**Files:** Modify `src/components/ui/{card,separator,skeleton,avatar,badge,label}.tsx`

| Component | MUI target | Notes |
|---|---|---|
| `Card`, `CardHeader`, `CardContent`, `CardFooter` | `@mui/material/Paper` (Card) + `<div>` subparts | Keep all 6 exports; `Card` = `Paper` with `elevation={0}` + Tailwind classes; subparts stay styled `<div>`/`<h3>`/`<p>` with their current Tailwind classes (these are pure layout — no Radix). |
| `Separator` | `@mui/material/Divider` | Keep `orientation`, `decorative` props; map `decorative`→`role="presentation"`. Remove `@radix-ui/react-separator`. |
| `Skeleton` | `@mui/material/Skeleton` | Keep `className`; render `<MuiSkeleton variant="rectangular" className={...} animation="wave" />`. |
| `Avatar`, `AvatarImage`, `AvatarFallback` | `@mui/material/Avatar` | Keep all 3 exports. `Avatar` = wrapper; `AvatarImage` renders `<MuiAvatar src=... />`; `AvatarFallback` renders children inside `<MuiAvatar>`. Remove `@radix-ui/react-avatar`. |
| `Badge` | `@mui/material/Chip` OR keep styled `<div>` | Simpler: keep the existing CVA `<div>` (pure Tailwind, no Radix) — leave as-is. Document that no change is needed. |
| `Label` | `@mui/material/FormLabel` or keep `<label>` | Keep `<label>` styled by CVA but remove `@radix-ui/react-label`; render a plain `<label>` forwarding props. |

- [ ] **Step 1:** Apply the conversions per the table. For `Card` example:

```tsx
import * as React from "react";
import Paper from "@mui/material/Paper";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <Paper ref={ref} elevation={0} className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)} {...props} />
  ),
);
Card.displayName = "Card";
// CardHeader/CardTitle/CardDescription/CardContent/CardFooter unchanged (plain styled elements).
```

For `Label` (remove Radix):

```tsx
import * as React from "react";
import { cn } from "@/lib/utils";
const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label ref={ref} className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)} {...props} />
  ),
);
Label.displayName = "Label";
export { Label };
```

- [ ] **Step 2: Verify error trend.** `npx tsc --noEmit 2>&1 | Measure-Object -Line`.
- [ ] **Step 3: Commit.** `git commit -am "refactor(ui): convert Card/Separator/Skeleton/Avatar/Label to MUI"`

### Task 13: Form inputs — Input, Textarea, Checkbox, Switch, RadioGroup, Slider

**Files:** Modify `src/components/ui/{input,textarea,checkbox,switch,radio-group,slider}.tsx`

| Component | MUI target | API to preserve | Remove |
|---|---|---|---|
| `Input` | `@mui/material/InputBase` (or keep native `<input>` for RHF compatibility) | `forwardRef`, all native input props, `className` | nothing (no Radix) |
| `Textarea` | native `<textarea>` keep | same | nothing |
| `Checkbox` | `@mui/material/Checkbox` | `checked`, `onCheckedChange`→map to `onChange`, `forwardRef` | `@radix-ui/react-checkbox` |
| `Switch` | `@mui/material/Switch` | `checked`, `onCheckedChange` | `@radix-ui/react-switch` |
| `RadioGroup`, `RadioGroupItem` | `@mui/material/RadioGroup` + `Radio` | `value`, `onValueChange`→`onChange`, `forwardRef` | `@radix-ui/react-radio-group` |
| `Slider` | `@mui/material/Slider` | `value`, `onValueChange`, `min`, `max`, `step` | `@radix-ui/react-slider` |

> **Critical for RHF:** `Input` and `Textarea` are used with `react-hook-form` `register` and inside the `Form` component (Task 16). Keep them as native `<input>`/`<textarea>` forwarding `ref` and all props — do NOT swap to MUI `TextField` (which manages its own state and would break `register`). MUI styling for these is applied via Tailwind classes already present. So `Input`/`Textarea` need **no change**; document this and leave them.

- [ ] **Step 1:** Convert Checkbox/Switch/RadioGroup/Slider. Example `Checkbox` mapping `onCheckedChange`:

```tsx
import * as React from "react";
import MuiCheckbox from "@mui/material/Checkbox";
import { cn } from "@/lib/utils";

interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
  id?: string;
}
const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => (
    <MuiCheckbox
      className={cn(className)}
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      {...props}
    />
  ),
);
Checkbox.displayName = "Checkbox";
export { Checkbox };
```

- [ ] **Step 2:** Leave `Input` and `Textarea` unchanged (note in commit).
- [ ] **Step 3: Verify error trend.** `npx tsc --noEmit 2>&1 | Measure-Object -Line`.
- [ ] **Step 4: Commit.** `git commit -am "refactor(ui): convert Checkbox/Switch/RadioGroup/Slider to MUI; keep native Input/Textarea for RHF"`

### Task 14: Overlays — Dialog, AlertDialog, Sheet, Popover, Tooltip

**Files:** Modify `src/components/ui/{dialog,alert-dialog,sheet,popover,tooltip}.tsx`

| Component family | MUI target | API to preserve | Remove |
|---|---|---|---|
| `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose` | `@mui/material/Dialog` + `DialogTitle`/`DialogContent` | controlled `open`/`onOpenChange`; `DialogTrigger asChild`; subparts as styled `<div>` | `@radix-ui/react-dialog` |
| `AlertDialog*` | `@mui/material/Dialog` | `AlertDialogAction`, `AlertDialogCancel`, `open`/`onOpenChange` | `@radix-ui/react-alert-dialog` |
| `Sheet` (side drawer) | `@mui/material/Drawer` | `side` prop → MUI `anchor`; `open`/`onOpenChange` | (sheet uses `@radix-ui/react-dialog`) |
| `Popover`, `PopoverTrigger`, `PopoverContent` | `@mui/material/Popover` | `open`/`onOpenChange`, `align`/`side`→`anchorOrigin` | `@radix-ui/react-popover` |
| `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider` | `@mui/material/Tooltip` | `TooltipProvider` becomes pass-through; `content` = children of `TooltipContent` | `@radix-ui/react-tooltip` |

> **Pattern for trigger-based components:** shadcn uses `<Dialog open onOpenChange><DialogTrigger asChild>…<DialogContent>…`. MUI controls open state on the root component. Reimplement with a small Context: the root stores `open`/`setOpen`; `*Trigger` calls `setOpen(true)` (cloning child if `asChild`); `*Content` renders the MUI `Dialog` with `open` + `onClose={()=>setOpen(false)}`. This keeps the existing consumer JSX working unchanged. Provide this Context pattern in each of the five files.

- [ ] **Step 1: Implement `Dialog` with the Context pattern** (template the other overlays follow):

```tsx
import * as React from "react";
import MuiDialog from "@mui/material/Dialog";
import { cn } from "@/lib/utils";

type Ctx = { open: boolean; setOpen: (o: boolean) => void };
const DialogCtx = React.createContext<Ctx | null>(null);

function Dialog({ open: openProp, onOpenChange, children }: {
  open?: boolean; onOpenChange?: (o: boolean) => void; children: React.ReactNode;
}) {
  const [internal, setInternal] = React.useState(false);
  const open = openProp ?? internal;
  const setOpen = (o: boolean) => { setInternal(o); onOpenChange?.(o); };
  return <DialogCtx.Provider value={{ open, setOpen }}>{children}</DialogCtx.Provider>;
}

function DialogTrigger({ asChild, children }: { asChild?: boolean; children: React.ReactElement }) {
  const ctx = React.useContext(DialogCtx)!;
  return React.cloneElement(children, { onClick: () => ctx.setOpen(true) });
}

function DialogContent({ className, children }: { className?: string; children: React.ReactNode }) {
  const ctx = React.useContext(DialogCtx)!;
  return (
    <MuiDialog open={ctx.open} onClose={() => ctx.setOpen(false)}>
      <div className={cn("p-6", className)}>{children}</div>
    </MuiDialog>
  );
}
const DialogHeader = (p: React.HTMLAttributes<HTMLDivElement>) => <div className={cn("flex flex-col space-y-1.5", p.className)} {...p} />;
const DialogFooter = (p: React.HTMLAttributes<HTMLDivElement>) => <div className={cn("flex justify-end gap-2 mt-4", p.className)} {...p} />;
const DialogTitle = (p: React.HTMLAttributes<HTMLHeadingElement>) => <h2 className={cn("text-lg font-semibold", p.className)} {...p} />;
const DialogDescription = (p: React.HTMLAttributes<HTMLParagraphElement>) => <p className={cn("text-sm text-muted-foreground", p.className)} {...p} />;
function DialogClose({ asChild, children }: { asChild?: boolean; children: React.ReactElement }) {
  const ctx = React.useContext(DialogCtx)!;
  return React.cloneElement(children, { onClick: () => ctx.setOpen(false) });
}
export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose };
```

- [ ] **Step 2:** Apply the same Context pattern to `alert-dialog.tsx` (export `AlertDialog`, `AlertDialogTrigger`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogFooter`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogAction`, `AlertDialogCancel`). `AlertDialogAction`/`Cancel` render `Button`s that also close.
- [ ] **Step 3:** `sheet.tsx` → MUI `Drawer` (`anchor` from `side` prop, default `"right"`), same Context trigger pattern.
- [ ] **Step 4:** `popover.tsx` → MUI `Popover` with an anchor ref captured in `PopoverTrigger`.
- [ ] **Step 5:** `tooltip.tsx` → MUI `Tooltip`; `TooltipProvider` returns `<>{children}</>`; `Tooltip` collects `TooltipTrigger` child + `TooltipContent` text and renders `<MuiTooltip title={content}>{trigger}</MuiTooltip>`.
- [ ] **Step 6: Verify error trend.** `npx tsc --noEmit 2>&1 | Measure-Object -Line`.
- [ ] **Step 7: Commit.** `git commit -am "refactor(ui): convert Dialog/AlertDialog/Sheet/Popover/Tooltip to MUI"`

### Task 15: Menus & disclosure — DropdownMenu, Menubar, Select, Tabs, Accordion, Collapsible, ScrollArea

**Files:** Modify `src/components/ui/{dropdown-menu,menubar,select,tabs,accordion,collapsible,scroll-area}.tsx`

| Component | MUI target | API to preserve | Remove |
|---|---|---|---|
| `DropdownMenu*` | `@mui/material/Menu` + `MenuItem` | `DropdownMenuTrigger asChild`, `DropdownMenuContent`, `DropdownMenuItem` (`onClick`), `DropdownMenuLabel`, `DropdownMenuSeparator` | `@radix-ui/react-dropdown-menu` |
| `Menubar*` | `@mui/material/Menu` per menu | same trigger/content/item exports | `@radix-ui/react-menubar` |
| `Select*` | `@mui/material/Select` + `MenuItem` | `Select` (`value`/`onValueChange`), `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem` (`value`) | `@radix-ui/react-select` |
| `Tabs*` | `@mui/material/Tabs` + `Tab` | `Tabs` (`value`/`onValueChange`/`defaultValue`), `TabsList`, `TabsTrigger` (`value`), `TabsContent` (`value`) | `@radix-ui/react-tabs` |
| `Accordion*` | `@mui/material/Accordion` | `type`, `collapsible`, `AccordionItem` (`value`), `AccordionTrigger`, `AccordionContent` | `@radix-ui/react-accordion` |
| `Collapsible*` | `@mui/material/Collapse` | `open`/`onOpenChange`, `CollapsibleTrigger asChild`, `CollapsibleContent` | `@radix-ui/react-collapsible` |
| `ScrollArea` | styled `<div>` with `overflow-auto` | `className`, children | `@radix-ui/react-scroll-area` |

> **Select with RHF/Context:** Reimplement `Select` so `SelectContent`/`SelectItem` register options into a Context the root reads, then render one MUI `Select`. Simpler equivalent: have `Select` render `<MuiSelect value={value} onChange={e=>onValueChange(e.target.value)}>` and have `SelectItem` render `<MuiMenuItem value={value}>`; `SelectTrigger`/`SelectValue` become no-op pass-throughs (return `null` or children) since MUI renders its own trigger. Verify each consumer still type-checks; adjust where `SelectValue placeholder` is used → pass `displayEmpty` + `renderValue` on MUI Select.

- [ ] **Step 1:** Implement each per the table. Provide the Context-collect pattern for `Select` and `Tabs`. For `ScrollArea`:

```tsx
import * as React from "react";
import { cn } from "@/lib/utils";
const ScrollArea = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("relative overflow-auto", className)} {...props}>{children}</div>
  ),
);
ScrollArea.displayName = "ScrollArea";
export { ScrollArea };
```

- [ ] **Step 2: Verify error trend.** `npx tsc --noEmit 2>&1 | Measure-Object -Line`.
- [ ] **Step 3: Commit.** `git commit -am "refactor(ui): convert DropdownMenu/Menubar/Select/Tabs/Accordion/Collapsible/ScrollArea to MUI"`

### Task 16: Progress, Alert, Table, Form, Calendar, Carousel

**Files:** Modify `src/components/ui/{progress,alert,table,form,calendar,carousel}.tsx`

| Component | Action | Remove |
|---|---|---|
| `Progress` | MUI `LinearProgress` with `variant="determinate" value={value}` | `@radix-ui/react-progress` |
| `Alert`, `AlertTitle`, `AlertDescription` | MUI `Alert`/`AlertTitle` (map `variant="destructive"`→`severity="error"`, default→`severity="info"`); keep 3 exports | none (no Radix) |
| `Table*` | keep native styled `<table>` elements (no Radix) — **no change** | none |
| `Form` (`form.tsx`) | This is the react-hook-form wrapper (`FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`, `useFormField`). It depends on `@radix-ui/react-label` (via `Label`) and `@radix-ui/react-slot`. Keep RHF logic intact; `FormControl` keeps using `Slot` (keep slot dep); `FormLabel` uses the converted `Label`. **Minimal change:** ensure imports still resolve after `Label` change. | none (keep slot) |
| `Calendar` | keep `react-day-picker` (already not Radix); ensure `Button`/`buttonVariants` import still valid | none |
| `Carousel` | keep `embla-carousel-react`; ensure `Button` import valid | none |

- [ ] **Step 1:** Convert `Progress` and `Alert`; verify `Table`, `Form`, `Calendar`, `Carousel` still type-check (they should need little/no change).

`Progress`:
```tsx
import * as React from "react";
import LinearProgress from "@mui/material/LinearProgress";
import { cn } from "@/lib/utils";
const Progress = React.forwardRef<HTMLDivElement, { value?: number; className?: string }>(
  ({ className, value = 0 }, ref) => (
    <div ref={ref} className={cn("w-full", className)}>
      <LinearProgress variant="determinate" value={value} />
    </div>
  ),
);
Progress.displayName = "Progress";
export { Progress };
```

- [ ] **Step 2: Verify error trend.** `npx tsc --noEmit 2>&1 | Measure-Object -Line`.
- [ ] **Step 3: Commit.** `git commit -am "refactor(ui): convert Progress/Alert to MUI; verify Table/Form/Calendar/Carousel"`

### Task 17: Toast system — toast, toaster, use-toast

**Files:** Modify `src/components/ui/toast.tsx`, `src/components/ui/toaster.tsx`, `src/hooks/use-toast.ts`

> `use-toast.ts` is a self-contained reducer/store (shadcn's) that does NOT depend on Radix — keep it as-is (it exposes `toast()` and `useToast()`). Only `toast.tsx` (Radix Toast primitives) and `toaster.tsx` (renderer) change. Reimplement the renderer with MUI `Snackbar` + `Alert`.

- [ ] **Step 1:** Confirm `src/hooks/use-toast.ts` has no `@radix-ui` import (it shouldn't). Leave it unchanged.
- [ ] **Step 2: Rewrite `toaster.tsx`** to render MUI Snackbars from the toast store:

```tsx
import { useToast } from "@/hooks/use-toast";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

export function Toaster() {
  const { toasts } = useToast();
  return (
    <>
      {toasts.map(({ id, title, description, variant, open }) => (
        <Snackbar key={id} open={open} autoHideDuration={5000} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
          <Alert severity={variant === "destructive" ? "error" : "success"} variant="filled">
            {title}{description ? <div>{description}</div> : null}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
}
```

- [ ] **Step 3: Replace `toast.tsx`** Radix primitives with simple type re-exports so any direct imports still resolve. If nothing imports `toast.tsx` directly (only `toaster.tsx` and `use-toast.ts` are used), delete `toast.tsx` and remove its imports. Verify with: `git grep "components/ui/toast\"" src` — if no hits, `git rm src/components/ui/toast.tsx`.
- [ ] **Step 4:** Add `Toaster` mount: it was in the old root layout; ensure it's rendered. Add `<Toaster />` to `src/App.tsx` inside `<Providers>` (alongside `<RouterProvider/>`), plus the old `PWAInstallPrompt` and `PushInitializer` (Task 21).
- [ ] **Step 5:** Remove `@radix-ui/react-toast` usage. Verify error trend.
- [ ] **Step 6: Commit.** `git commit -am "refactor(ui): MUI Snackbar-based toaster; keep use-toast store"`

### Task 18: Sidebar (bespoke)

**Files:** Modify `src/components/ui/sidebar.tsx`

> `sidebar.tsx` is a large shadcn composite (uses `@radix-ui/react-slot`, `Sheet`, `Tooltip`, `Button`, `Skeleton`, the `use-mobile` hook). It exports many parts: `Sidebar`, `SidebarProvider`, `SidebarHeader`, `SidebarContent`, `SidebarFooter`, `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton` (uses `asChild`), `SidebarTrigger`, etc. Consumers: the four `*Layout.tsx` files.

- [ ] **Step 1:** Keep the component's structure and exports. Replace internal Radix `Sheet` (mobile) with the converted MUI-backed `Sheet` (Task 14) — it already exposes the same API, so the import path `@/components/ui/sheet` is unchanged; no edit may be needed beyond confirming it compiles. Keep `@radix-ui/react-slot` for `SidebarMenuButton asChild`. Keep Tailwind styling.
- [ ] **Step 2:** If `sidebar.tsx` imports `@radix-ui/react-slot` directly, keep it. Remove any other Radix import now unused.
- [ ] **Step 3: Verify error trend.** `npx tsc --noEmit 2>&1 | Measure-Object -Line`.
- [ ] **Step 4: Commit.** `git commit -am "refactor(ui): sidebar uses MUI-backed Sheet; keep asChild via slot"`

### Task 19: Chart wrapper

**Files:** Modify `src/components/ui/chart.tsx`

> `chart.tsx` wraps `recharts` with theming via CSS variables. recharts stays. Only ensure no Radix dependency and that the `ChartContainer`/`ChartTooltip`/`ChartTooltipContent`/`ChartLegend` exports compile.

- [ ] **Step 1:** Confirm `chart.tsx` has no `@radix-ui` import (it typically doesn't). If it imports a converted `ui` component, confirm it resolves. Leave recharts logic intact.
- [ ] **Step 2: Verify error trend.** `npx tsc --noEmit 2>&1 | Measure-Object -Line`.
- [ ] **Step 3: Commit (if changed).** `git commit -am "refactor(ui): verify chart wrapper compiles post-migration"`

### Task 20: First green build

**Files:** none (verification + fixups)

- [ ] **Step 1: Full typecheck**

Run: `npx tsc --noEmit`
Expected: **zero errors.** If errors remain, fix them in the offending files (most likely residual `next/*` imports, prop-shape mismatches from a converted `ui` component, or `SelectValue`/`Tabs` Context wiring). Re-run until clean. Commit fixes as `fix: resolve type errors after MUI conversion`.

- [ ] **Step 2: Full build**

Run: `npm run build`
Expected: `tsc --noEmit` passes and `vite build` writes `dist/` with no errors.

- [ ] **Step 3: Commit any build fixups**

```bash
git add -A
git commit -m "fix: app builds green on Vite after MUI + router migration"
```

---

## Phase 6: PWA

### Task 21: Wire vite-plugin-pwa + push SW + install prompt

**Files:**
- Modify: `c:\Users\dell\doorstep-prototype\vite.config.ts`
- Modify: `src/App.tsx`
- Reference: `public/manifest.json`, `public/push-sw.js`, `src/components/pwa-install-prompt.tsx`, `src/components/pwa/push-initializer.tsx`, `src/hooks/use-push-manager.ts`

- [ ] **Step 1: Add VitePWA to `vite.config.ts`** using `injectManifest` so the existing custom `public/push-sw.js` push logic is preserved:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "public",
      filename: "push-sw.js",
      registerType: "autoUpdate",
      manifest: false, // use existing public/manifest.json (linked in index.html)
      injectManifest: { maximumFileSizeToCacheInBytes: 10 * 1024 * 1024 },
      devOptions: { enabled: false },
    }),
  ],
  server: { port: 9002 },
  build: { outDir: "dist" },
});
```

> If `push-sw.js` is a pure push handler without a Workbox `precacheAndRoute` call, `injectManifest` will warn that the injection point is missing. In that case switch to `strategies: "generateSW"` + `injectRegister: "auto"` and register `push-sw.js` separately in `push-initializer.tsx` via `navigator.serviceWorker.register("/push-sw.js")` (which the existing code likely already does). Choose based on the file's contents.

- [ ] **Step 2:** Mount `PWAInstallPrompt` and `PushInitializer` in `src/App.tsx` (they were in the old root layout). Update `src/App.tsx`:

```tsx
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { RouterProvider } from "react-router-dom";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";
import PWAInstallPrompt from "@/components/pwa-install-prompt";
import PushInitializer from "@/components/pwa/push-initializer";
import { theme } from "@/theme";
import { router } from "@/routes";

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme={false} />
      <Providers>
        <RouterProvider router={router} />
        <PWAInstallPrompt />
        <Toaster />
        <PushInitializer />
      </Providers>
    </ThemeProvider>
  );
}
```

- [ ] **Step 3:** Ensure `pwa-install-prompt.tsx` and `push-initializer.tsx` have no `next/*` imports left (covered by Phase 4, but re-verify with `git grep "next/" src`).
- [ ] **Step 4: Build with PWA**

Run: `npm run build`
Expected: build succeeds; `dist/` contains the service worker output and `manifest.json` is referenced.

- [ ] **Step 5: Commit.** `git commit -am "feat: PWA via vite-plugin-pwa, preserve push SW + install prompt"`

---

## Phase 7: Dependency cleanup & final verification

### Task 22: Remove now-unused dependencies

**Files:** Modify `c:\Users\dell\doorstep-prototype\package.json`

- [ ] **Step 1: Find which Radix packages are still imported**

Run: `git grep -h "@radix-ui/" src | Sort-Object -Unique` (PowerShell) or `git grep -ho "@radix-ui/[a-z-]*" src | sort -u`
Expected: only packages still in use (likely just `@radix-ui/react-slot`).

- [ ] **Step 2:** Remove from `package.json` every `@radix-ui/*` package that no longer appears in the grep output. Keep `@radix-ui/react-slot` if `asChild` paths still use it. Also remove `tailwindcss-animate` only if `tailwind.config.ts` no longer references it (check the `plugins` array — if it does, keep it).

- [ ] **Step 3:** Run: `npm install`
Expected: lockfile updates; no missing-dependency errors.

- [ ] **Step 4: Typecheck + build**

Run: `npm run build`
Expected: still green.

- [ ] **Step 5: Commit.** `git add package.json package-lock.json && git commit -m "chore: drop unused Radix/shadcn dependencies"`

### Task 23: Final manual smoke verification

**Files:** none

- [ ] **Step 1: Start dev server**

Run: `npm run dev`
Expected: Vite serves on `http://localhost:9002` with no startup errors.

- [ ] **Step 2: Load each top-level route** in a browser (or via the Playwright MCP if available) and confirm it renders without console errors. Routes to check: `/`, `/menu`, `/signup`, `/verify-otp`, `/customer/dashboard`, `/vendor/dashboard`, `/rider/dashboard`, `/admin/dashboard`. Backend calls will fail against the placeholder `VITE_BASE_URL` — that's expected; verify the UI shell, layout, sidebar, and MUI components render and that there are no React/router runtime errors.

- [ ] **Step 3: Verify production build serves**

Run: `npm run build; npm run preview`
Expected: preview serves `dist/` on 9002; routes render; deep-linking to e.g. `/customer/orders` works (SPA fallback). If deep links 404 in preview, confirm `vite preview` SPA fallback (it handles this by default for `createBrowserRouter`).

- [ ] **Step 4: Confirm no Next/genkit references remain**

Run: `git grep -n "next/\|next-pwa\|genkit\|process.env.NEXT_PUBLIC" src`
Expected: **no results.**

- [ ] **Step 5: Final commit / branch is ready**

```bash
git add -A
git commit -m "chore: finalize Next.js -> Vite + React + MUI migration" --allow-empty
git log --oneline -15
```

---

## Self-Review (completed against the spec)

- **Build stack (Vite 6 + React Router):** Tasks 1–3 (Vite), Task 6 (React Router). ✓
- **MUI components + keep Tailwind:** Phase 5 (Tasks 11–19) converts each `ui` primitive to MUI while keeping Tailwind classes/`cn()`; Task 4 themes MUI to match `globals.css`. ✓
- **Replace in place on branch:** all `git mv`/in-place edits on `feature/rewriting-codebase-in-react`. ✓
- **Drop genkit:** Task 3 removes `src/ai/` and Task 1 drops genkit deps. ✓
- **Keep PWA:** Task 21 (vite-plugin-pwa + push SW + install prompt). ✓
- **Env `NEXT_PUBLIC_*` → `VITE_*`:** Task 10 + Task 2 typing + Task 3 `.env.example`. ✓
- **Verification = typecheck + build + manual run:** Task 20 (first green), Task 22 (post-cleanup green), Task 23 (manual smoke). ✓
- **Next API coverage:** `next/link` (Task 7), `next/navigation` (Task 8), `next/image` (Task 9), `next/font` (dropped, Task 3 — fonts via CSS import), root layout metadata (Task 3 → `index.html`). ✓
- **All 35 `ui` components addressed:** button(11); card/separator/skeleton/avatar/badge/label(12); input/textarea/checkbox/switch/radio-group/slider(13); dialog/alert-dialog/sheet/popover/tooltip(14); dropdown-menu/menubar/select/tabs/accordion/collapsible/scroll-area(15); progress/alert/table/form/calendar/carousel(16); toast/toaster(17); sidebar(18); chart(19). Count = 35. ✓
- **Placeholder scan:** no TBD/TODO; every code step shows code; commands have expected output. ✓
- **Type consistency:** preserved public APIs (`onCheckedChange`, `onValueChange`, `open`/`onOpenChange`, `asChild`, `buttonVariants`) match across tasks and consumers. ✓
