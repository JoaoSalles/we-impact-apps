# shadcn + AppSidebar in the we-impact host — Design

**Date:** 2026-07-14
**Status:** Approved (not committed, per user request)

## Problem

`apps/we-impact/app/components/ui/*` and `apps/we-impact/app/layouts/*` were copied
verbatim from the `web-my-inflation` project but are non-functional in the host:

- They import from `react-router-dom`; the host uses `react-router` (v7 framework
  mode) and does not install `react-router-dom`.
- They import `@/components/ui/*`, `@/lib/utils`, `@/hooks/use-mobile`, and
  `@/store/user`; the host has **no `@` path alias**, no `lib/utils` (`cn`), no
  `use-mobile` hook, and no zustand store.
- There is **no Tailwind** in the host (no `@tailwindcss/vite`, no
  `@import "tailwindcss"`, no CSS theme tokens). The sidebar references tokens like
  `var(--text)`, `var(--border)`, `bg-background-selected`, `sidebar-*`.
- None of the shadcn runtime deps are installed, and there is no `components.json`.

This work makes shadcn real in the host and wires up a working `AppSidebar` that
**replaces the current top `AppNav`**, adapting the sidebar to React Router 7 and
the host's existing session/auth.

## Decisions (from brainstorming)

- **Layout:** the sidebar **replaces** the top `<AppNav />`. Routes are wrapped in
  `SidebarProvider` + `AppSidebar` + `SidebarInset` (mirrors the example's
  `RootLayout`).
- **User source:** the sidebar footer reuses the existing **`useSession()`**
  (`profile.name` / `profile.picture`), not zustand. It also exposes a **sign-out**
  action via `session.signOut()`.
- **Nav items:** the real host routes — **Home (`/`)** and **About (`/about`)**.
- **Theme:** port the example's neutral/carbon light+dark theme verbatim as the
  host baseline (the example is the reference). Drop the
  `@fontsource-variable/inter` import; reuse the Inter font already loaded via the
  Google Fonts `<link>` in `root.tsx`.

## Scope of changes

### Tooling & config

- **`apps/we-impact/vite.config.mts`**
  - Add `@tailwindcss/vite` to `plugins`.
  - Add `resolve.alias` mapping `@` → `<dirname>/app`.
- **`apps/we-impact/tsconfig.app.json`**
  - Add `compilerOptions.paths` mapping `@/*` → `./app/*`.
- **`apps/we-impact/components.json`** (new)
  - shadcn config with `aliases` pointing at `app/…`
    (`components: "@/components"`, `ui: "@/components/ui"`, `utils: "@/lib/utils"`,
    `lib: "@/lib"`, `hooks: "@/hooks"`), `iconLibrary: "lucide"`,
    `tailwind.css: "app/app.css"`, `cssVariables: true`, `baseColor: "neutral"`,
    `rsc: false`, `tsx: true`.
- **Root `package.json`** (deps live at the workspace root in this pnpm/Nx setup)
  - Add: `tailwindcss`, `@tailwindcss/vite`, `class-variance-authority`, `clsx`,
    `tailwind-merge`, `lucide-react`, `@radix-ui/react-slot`,
    `@radix-ui/react-dialog`, `@radix-ui/react-tooltip`,
    `@radix-ui/react-separator`.
  - Run `pnpm install` then `pnpm exec nx reset`.

### Styling

- **`apps/we-impact/app/app.css`** (new)
  - `@import "tailwindcss";`
  - Port the example's `@custom-variant dark`, `@theme inline { … }`, `:root { … }`,
    `@media (prefers-color-scheme: dark)`, and `.dark { … }` sidebar tokens.
  - Omit `@import '@fontsource-variable/inter'`; set font-family to the
    already-loaded `Inter`.
- **`apps/we-impact/app/root.tsx`**
  - `import appCss from "./app.css?url";` and add
    `{ rel: "stylesheet", href: appCss }` to the `links()` export.

### shadcn support files

- **`apps/we-impact/app/lib/utils.ts`** (new): standard shadcn `cn()`
  (`clsx` + `tailwind-merge`).
- **`apps/we-impact/app/hooks/use-mobile.ts`** (new): standard shadcn
  `useIsMobile` hook (required by `ui/sidebar.tsx`).

### Sidebar & layout

- **`apps/we-impact/app/layouts/AppSidebar.tsx`**
  - Imports `react-router-dom` → `react-router`.
  - Remove `useUserStore`; read display name/picture from `useSession()`.
  - Nav items: `Home` (`/`), `About` (`/about`).
  - Footer: show session display name + avatar (fall back to a generated
    initial avatar when no `picture`), plus a **sign-out** menu action.
  - Replace the "Meu IBGE" header label with a host-appropriate brand label.
- **`apps/we-impact/app/layouts/RootLayout.tsx`**
  - `Outlet` from `react-router`.
  - `SidebarProvider` + `AppSidebar` + `SidebarInset` + `SidebarTrigger`.
- **`apps/we-impact/app/root.tsx`**
  - Remove `<AppNav />` from `Layout`.
  - Default `App` becomes `RequireAuth` → `RootLayout`.
- **`apps/we-impact/app/components/nav/app-nav.tsx`**
  - Delete (superseded by the sidebar). Remove its import from `root.tsx`.

### ui components

- Confirm every `@/…` import in `app/components/ui/*` resolves under the new alias.
- The sidebar chain requires these ui files (already present in the copy):
  `sidebar`, `sheet`, `button`, `input`, `separator`, `tooltip`, `skeleton`.
  Any `react-router-dom` references in ui files (if present) switch to
  `react-router`.

## Module Federation note

The host wires the MF remote at runtime and shares React as a singleton
(`app/mf-runtime.ts`, per CLAUDE.md). Tailwind and the sidebar are host-only UI
concerns and do not touch the MF boundary. Adding `@tailwindcss/vite` to the host
vite config is independent of the remote's MF build plugin. No singleton/runtime
wiring changes.

## Testing & verification

- **Unit:** a vitest for `AppSidebar` that renders both nav items and the session
  display name, using a `SessionProvider` + `MemoryRouter` wrapper (mock the auth
  API calls so the session resolves to a known profile).
- **Verification commands** (must pass, with output confirmed):
  - `pnpm exec nx typecheck we-impact`
  - `pnpm exec nx test we-impact`
  - `pnpm exec nx dev we-impact` — confirm the sidebar renders, Tailwind styles
    load, nav links work, and sign-out is wired.

## Out of scope

- Restyling existing route pages beyond what the sidebar layout requires.
- Adding zustand or any new global state.
- Touching the auth remote (`apps/auth`) or MF configuration.
- Sign-in UI (already handled at the `/auth` route); only sign-out is added here.
