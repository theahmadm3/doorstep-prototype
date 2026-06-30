# Design: Migrate Doorstep from Next.js to Vite + React + MUI

**Date:** 2026-05-21
**Branch:** feature/rewriting-codebase-in-react
**Status:** Approved (overall direction)

## Goal

Rewrite the Doorstep prototype from Next.js (App Router) to a client-side
React + TypeScript SPA built with **Vite 6** and **React Router v6**, and
replace **shadcn/ui** with **Material UI (MUI)**. The migration happens
**in place** on the current branch.

## Context: what the current app is

- Effectively a client-side SPA on Next.js App Router: 92 of ~125 `.ts(x)`
  files are `"use client"`, there are no server actions, no middleware, and
  the single API route (`src/app/api/auth/login/route.ts`) is blank.
- Data comes from an **external REST backend** via `NEXT_PUBLIC_BASE_URL`
  (Django-style, trailing slashes). Fetch layer lives in `src/lib/api.ts`
  and `src/lib/auth-api.ts`.
- State/data libraries: **TanStack Query**, **Zustand** (3 stores),
  **react-hook-form + Zod**. These are framework-agnostic and stay.
- UI: **shadcn/ui** — ~35 components in `src/components/ui/`, imported by
  **72 files**. Built on Radix + Tailwind + CVA.
- **Genkit AI** is configured (`src/ai/`) but **unused** — no flows imported
  anywhere. Will be dropped.
- **PWA** via `next-pwa`: service worker, `public/manifest.json`, custom
  `public/push-sw.js` push logic, install prompt. Will be kept.
- Next coupling is light: `next/navigation`, `next/link`, `next/font`,
  `next/image` (12 files), and `next-pwa`.
- Fonts (Inter/Poppins) are already loaded via a CSS `@import` at the top of
  `src/app/globals.css`, so `next/font` usage is redundant.
- Four role areas: **admin, customer, rider, vendor**, plus auth/OTP,
  Paystack, Google Maps, push notifications.
- Env vars in use: `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`,
  `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`.

## Decisions (from clarifying questions)

| Decision | Choice |
|---|---|
| Build/routing stack | Vite 6 + React Router v6 |
| MUI styling | MUI components, **keep Tailwind** for layout/utilities |
| Project layout | Replace in place on this branch |
| Genkit AI | Drop it |
| PWA | Keep (via `vite-plugin-pwa`) |
| Verification | `tsc` clean + `vite build` + manual run; no automated tests |

## Migration sequencing — chosen approach

**Scaffold-first, then port bottom-up.** Stand up the Vite + React Router
shell and MUI theme provider first; then port leaf `ui/` primitives, then
shared components, then route pages role-by-role
(customer → vendor → rider → admin → auth). The `@/components/ui/*` import
surface is preserved, so the 72 consuming files barely change. The app stays
type-checkable throughout, keeping risk low.

(Rejected: big-bang rewrite — app won't compile until the end; route-by-route
vertical slices — repeated churn on shared `ui/` components.)

## Design

### 1. Build tooling & structure

- **Remove:** `next`, `next-pwa`, `@genkit-ai/*`, `genkit`, `genkit-cli`,
  `next.config.ts`, `next-pwa.d.ts`, `src/ai/`, the genkit npm scripts.
- **Add:** `vite@6`, `@vitejs/plugin-react`, `vite-plugin-pwa`,
  `vite-tsconfig-paths`, `react-router-dom@6`, `@mui/material`,
  `@mui/icons-material`, `@emotion/react`, `@emotion/styled`.
- **Entry:** `index.html` at repo root + `src/main.tsx` mounting `<App/>`.
- **Keep:** `src/` tree and the `@/` path alias (resolved by
  `vite-tsconfig-paths`); `tailwind.config.ts`, `postcss.config.mjs`, and
  `globals.css` stay **as-is** (move/import globals from `src/index.css` or
  keep its current path and import it in `main.tsx`).
- **Scripts:** `dev` → `vite --port 9002`; `build` → `tsc --noEmit && vite build`;
  `preview` → `vite preview`; `typecheck` → `tsc --noEmit`.

### 2. Routing (App Router → React Router v6)

- Central `src/routes.tsx` (or `App.tsx` with `createBrowserRouter`) maps the
  existing folder routes 1:1.
- `*/layout.tsx` files become route-level layout elements that render
  `<Outlet/>` in place of `{children}`.
- Dynamic segment `[restaurantId]` → `:restaurantId`.
- The blank `api/auth/login/route.ts` is deleted.
- Add a `NotFound` route to replace `notFound()`.

### 3. Next API replacements

| Next API | Replacement |
|---|---|
| `useRouter().push(x)` | `const navigate = useNavigate(); navigate(x)` |
| `usePathname()` | `useLocation().pathname` |
| `useParams()` | React Router `useParams()` |
| `useSearchParams()` | React Router `useSearchParams()` |
| `notFound()` | `navigate("/404")` / redirect to NotFound route |
| `next/link` `<Link href>` | RR `<Link to>` |
| `next/image` (12 files) | plain `<img>` (Tailwind classes already size it) |
| `next/font` | drop — fonts already loaded via CSS `@import` in globals.css |
| root `layout.tsx` `metadata`/`viewport` | static `<meta>`/`<title>` in `index.html` |

- `Providers` (React Query + `ErrorBoundary`) is retained, wrapped by MUI
  `ThemeProvider` + `CssBaseline` and the React Router provider.

### 4. shadcn → MUI (Tailwind retained) — highest-effort section

- Rewrite each `src/components/ui/*.tsx` so its **public API (export names and
  props) stays the same**, but internals render MUI components. This keeps the
  72 importing files largely untouched.
  - Examples: `Button` keeps `variant`/`size` props, renders
    `@mui/material/Button`; `Dialog`, `Select`, `Tabs`, `Tooltip`, `Accordion`,
    `Checkbox`, `Switch`, `RadioGroup`, `Slider`, `Popover`, `Avatar`, `Badge`,
    `Card`, `Input`/`Textarea`, `Label`, `Separator`, `Progress`,
    `Skeleton`, `Table`, `Alert`, `AlertDialog`, `DropdownMenu`, `Menubar`,
    `ScrollArea`, `Collapsible`, `Calendar` → MUI equivalents.
- Tailwind utility classes on consumers stay; MUI's `className` passthrough
  applies them. `cn()` / `tailwind-merge` / `clsx` stay.
- An MUI **theme** mirrors the CSS-variable palette in `globals.css`
  (primary `#005380`) and the Inter/Poppins typography so MUI defaults match
  the existing look.
- Bespoke reimplementations behind the same API:
  - `sidebar.tsx` — custom layout (no direct MUI 1:1); reuse MUI `Drawer`
    where helpful.
  - `chart.tsx` — keep **recharts**; reskin wrapper only.
  - `toaster.tsx` / `use-toast.ts` — MUI `Snackbar` + `Alert`.
  - `carousel.tsx` — keep `embla-carousel-react`.
  - `calendar.tsx` — keep `react-day-picker` (or MUI date pickers if simpler),
    behind same API.
- Remove `@radix-ui/*`, `class-variance-authority`, `tailwindcss-animate`
  dependencies as each component stops using them. `lucide-react` icons stay
  (or migrate to `@mui/icons-material` opportunistically — not required).

### 5. PWA

- `vite-plugin-pwa` with `registerType: 'autoUpdate'`, reusing the existing
  `public/manifest.json`.
- Preserve the custom `public/push-sw.js` push logic: use `injectManifest`
  strategy (or register the existing SW separately) so push behavior is kept.
- `pwa-install-prompt` and `use-push-manager` / `use-notification-listener`
  hooks port unchanged (only env access changes).

### 6. Env vars

- Rename `NEXT_PUBLIC_*` → `VITE_*`:
  - `VITE_BASE_URL`, `VITE_GOOGLE_MAPS_API_KEY`,
    `VITE_PAYSTACK_PUBLIC_KEY`, `VITE_VAPID_PUBLIC_KEY`.
- Access via `import.meta.env.VITE_*` instead of `process.env.*`.
- Provide a `.env.example` listing all four.

### 7. What stays identical

TanStack Query, Zustand stores, react-hook-form + Zod, `lib/api.ts` /
`lib/auth-api.ts` fetch layer (only env access changes), `react-paystack`,
`@react-google-maps/api` + `use-places-autocomplete`, `date-fns`,
`framer-motion`, `recharts`, Tailwind config + `globals.css`.

### 8. Verification

- `tsc --noEmit` passes with no errors (note: the old Next config ignored TS
  build errors; we aim for clean typecheck but may add targeted `// @ts-expect-error`
  only where the pre-existing code was already type-unsafe).
- `vite build` succeeds.
- `vite dev` / `vite preview` runs and every route renders without console
  errors (manual smoke pass across all role areas). Backend calls require
  `VITE_BASE_URL`; UI shell verified even if backend is unavailable.

## Out of scope

- No new features, no redesign of screens, no backend changes.
- No automated test suite.
- No migration of `lucide-react` icons to MUI icons (optional, not required).
