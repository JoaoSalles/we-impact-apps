# shadcn + AppSidebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make shadcn/Tailwind real in the `we-impact` host and ship a working `AppSidebar` that replaces the top `AppNav`, wired to the existing session/auth.

**Architecture:** Add Tailwind v4 (`@tailwindcss/vite`) + an `@` alias to the host, create the shadcn support files (`cn`, `use-mobile`, theme CSS), then adapt the copied `AppSidebar`/`RootLayout` to React Router 7 and `useSession()`. The sidebar mounts inside `RequireAuth` in `root.tsx`.

**Tech Stack:** React 19, React Router 7 (SPA/framework mode), Vite, Tailwind CSS v4, shadcn/ui, Radix, lucide-react, Vitest + Testing Library.

## Global Constraints

- Router imports come from `react-router`, never `react-router-dom` (not installed).
- The `@` path alias resolves to `apps/we-impact/app` (e.g. `@/lib/cn`, `@/components/ui/sidebar`, `@/lib/use-mobile`).
- All ui components import `cn` from `@/lib/cn` (keep this exact path).
- `tsconfig.base.json` sets `noUnusedLocals: true` and `strict: true` — no unused imports/vars.
- Tests live under `apps/we-impact/tests/**` and import app code by relative path (`../../app/...`). The `@` alias resolves in tests via `vite.config.mts` `resolve.alias`.
- No `@testing-library/jest-dom` in the host — assert with `getByText`/`queryByText`, not `toBeInTheDocument`.
- Deps are installed at the workspace root (`pnpm add -w`), consistent with how `react`/`react-router` live at the root.
- Do NOT commit unless explicitly told (user asked to skip commits). Commit steps below are written per convention but SKIP the actual `git commit` — stage only or leave as-is per the executing session's instruction.

---

### Task 1: shadcn + Tailwind foundation

Make every copied `ui/*` component type-check and make Tailwind load. This folds in deps, config, alias, theme CSS, and support files because none of them are independently testable — the deliverable is a green `typecheck` + a Tailwind-styled dev boot.

**Files:**
- Modify: root `package.json` (deps, via `pnpm add -w`)
- Modify: `apps/we-impact/vite.config.mts`
- Modify: `apps/we-impact/tsconfig.app.json`
- Modify: `apps/we-impact/tsconfig.spec.json`
- Modify: `apps/we-impact/app/root.tsx` (stylesheet link only)
- Create: `apps/we-impact/components.json`
- Create: `apps/we-impact/app/lib/cn.ts`
- Create: `apps/we-impact/app/lib/use-mobile.ts`
- Create: `apps/we-impact/app/app.css`
- Delete: `apps/we-impact/app/components/ui/{card,command,dialog,popover,table}.tsx` (unused by the sidebar; avoid extra deps)

**Interfaces:**
- Produces: `cn(...inputs: ClassValue[]): string` from `@/lib/cn`; `useIsMobile(): boolean` from `@/lib/use-mobile`; the `@` → `app` alias; Tailwind theme tokens (`--sidebar*`, `--border`, `--text`, `bg-background-selected`, etc.).
- Consumes: nothing from other tasks.

- [ ] **Step 1: Delete the unused copied ui components**

```bash
git rm -f --ignore-unmatch \
  apps/we-impact/app/components/ui/card.tsx \
  apps/we-impact/app/components/ui/command.tsx \
  apps/we-impact/app/components/ui/dialog.tsx \
  apps/we-impact/app/components/ui/popover.tsx \
  apps/we-impact/app/components/ui/table.tsx
# they are untracked, so also remove from disk if git rm skipped them:
rm -f apps/we-impact/app/components/ui/{card,command,dialog,popover,table}.tsx
```

Then verify only the needed ones remain:

```bash
ls apps/we-impact/app/components/ui
# expect: button.tsx input.tsx separator.tsx sheet.tsx sidebar.tsx skeleton.tsx tooltip.tsx
```

- [ ] **Step 2: Install dependencies at the workspace root**

Run:

```bash
pnpm add -w \
  tailwindcss @tailwindcss/vite \
  class-variance-authority clsx tailwind-merge lucide-react \
  @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-tooltip @radix-ui/react-separator
```

Expected: install succeeds; the packages appear in root `package.json` `dependencies`.

- [ ] **Step 3: Create the `cn` helper**

Create `apps/we-impact/app/lib/cn.ts`:

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 4: Create the `use-mobile` hook**

Create `apps/we-impact/app/lib/use-mobile.ts`:

```ts
import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
```

- [ ] **Step 5: Create the Tailwind theme CSS**

Create `apps/we-impact/app/app.css` (ported from the example, minus the fontsource import and `#root` rule; `--sans` uses the Inter loaded via the Google Fonts link in `root.tsx`):

```css
@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--bg-surface);
  --color-foreground: var(--text-h);
  --color-background-selected: var(--bg-surface-selected);
  --color-border: var(--border);
  --color-input: var(--border);
  --color-ring: var(--accent);
  --color-popover: var(--bg-surface);
  --color-popover-foreground: var(--text-h);
  --color-primary: var(--accent);
  --color-primary-foreground: var(--bg-base);
  --color-muted: var(--bg-surface);
  --color-muted-foreground: var(--text);
  --color-accent-custom: var(--accent-bg);
  --color-accent-foreground: var(--text-h);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);

  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 48px;

  --ease-standard: var(--motion-standard);
  --ease-out-fast: var(--motion-out-fast);
  --shadow-ambient: var(--shadow-card);
  --shadow-float: var(--shadow);
}

:root {
  /* neutrals */
  --text: #6b6375;
  --text-h: #08060d;
  --bg-base: #ffffff;
  --bg-surface: #ffffff;
  --bg-surface-selected: #1c1c1c;
  --border: #e5e4e7;
  --code-bg: #f4f3ec;

  /* accent */
  --accent: #1c1c1c;
  --accent-bg: rgba(28, 28, 28, 0.1);
  --accent-border: rgba(28, 28, 28, 0.5);

  /* elevation */
  --shadow: rgba(0, 0, 0, 0.1) 0 10px 15px -3px, rgba(0, 0, 0, 0.05) 0 4px 6px -2px;
  --shadow-card: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

  /* motion */
  --motion-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --motion-out-fast: cubic-bezier(0, 0, 0.2, 1);

  /* sidebar — light mode */
  --sidebar: #ffffff;
  --sidebar-foreground: #08060d;
  --sidebar-primary: #1c1c1c;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: rgba(28, 28, 28, 0.05);
  --sidebar-accent-foreground: #08060d;
  --sidebar-border: #e5e4e7;
  --sidebar-ring: #1c1c1c;

  --sans: 'Inter', system-ui, sans-serif;
  --heading: 'Inter', system-ui, sans-serif;

  font: 18px/145% var(--sans);
  letter-spacing: 0.18px;
  color-scheme: light dark;
  color: var(--text);
  background: var(--bg-base);
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  @media (max-width: 1024px) {
    font-size: 16px;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --text: #9ca3af;
    --text-h: #f3f4f6;
    --bg-base: #111111;
    --bg-surface: #1c1c1c;
    --bg-surface-selected: #ffffff;
    --border: #2e303a;
    --code-bg: #1f2028;
    --accent: #1c1c1c;
    --accent-bg: rgba(0, 0, 0, 0.15);
    --accent-border: rgba(28, 28, 28, 0.5);
    --shadow: rgba(0, 0, 0, 0.4) 0 10px 15px -3px, rgba(0, 0, 0, 0.25) 0 4px 6px -2px;
    --shadow-card: 0 1px 2px 0 rgba(0, 0, 0, 0.2);
  }
}

html,
body {
  height: 100%;
}

body {
  margin: 0;
}

h1,
h2 {
  font-family: var(--heading);
  font-weight: 500;
  color: var(--text-h);
}

/* sidebar — dark mode (class-based for shadcn sidebar component) */
.dark {
  --sidebar: hsl(240 5.9% 10%);
  --sidebar-foreground: hsl(240 4.8% 95.9%);
  --sidebar-primary: #ffffff;
  --sidebar-primary-foreground: #08060d;
  --sidebar-accent: hsl(240 3.7% 15.9%);
  --sidebar-accent-foreground: hsl(240 4.8% 95.9%);
  --sidebar-border: hsl(240 3.7% 15.9%);
  --sidebar-ring: hsl(240 4.8% 95.9%);
}
```

- [ ] **Step 6: Create `components.json`**

Create `apps/we-impact/components.json`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "app/app.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/cn",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/lib"
  },
  "iconLibrary": "lucide"
}
```

- [ ] **Step 7: Wire Tailwind + the `@` alias into Vite**

Edit `apps/we-impact/vite.config.mts`. Add imports at the top:

```ts
import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { join } from 'node:path';
```

Change the `plugins` line to include Tailwind and add a `resolve.alias`:

```ts
  plugins: [!process.env.VITEST && reactRouter(), tailwindcss()],
  resolve: {
    alias: {
      '@': join(import.meta.dirname, 'app'),
    },
  },
```

(Place `resolve` as a sibling key of `plugins` inside the returned config object.)

- [ ] **Step 8: Add the `@/*` path mapping to both tsconfigs**

In `apps/we-impact/tsconfig.app.json`, add to `compilerOptions`:

```json
    "baseUrl": ".",
    "paths": {
      "@/*": ["./app/*"]
    },
```

In `apps/we-impact/tsconfig.spec.json`, add the same to `compilerOptions`:

```json
    "baseUrl": ".",
    "paths": {
      "@/*": ["./app/*"]
    },
```

- [ ] **Step 9: Link the stylesheet in `root.tsx`**

In `apps/we-impact/app/root.tsx`, add the import at the top (after the react-router import):

```ts
import appStylesHref from "./app.css?url";
```

Add this entry as the FIRST item of the array returned by `links`:

```ts
  { rel: "stylesheet", href: appStylesHref },
```

(Keep the existing Google Fonts preconnect/stylesheet links — the theme uses Inter.)

- [ ] **Step 10: Regenerate Nx metadata and type-check**

Run:

```bash
pnpm exec nx reset
pnpm exec nx typecheck we-impact
```

Expected: PASS. If it fails on a missing `@/...` module, re-check Steps 7–8. If it fails on an unused import in a ui file, that file is unused — confirm it was deleted in Step 1.

- [ ] **Step 11: Verify Tailwind compiles in a build**

Run:

```bash
pnpm exec nx build we-impact
```

Expected: build succeeds and emits CSS containing Tailwind utilities (no "Cannot find module '@tailwindcss/vite'" or PostCSS errors).

- [ ] **Step 12: Commit (stage only — do not run git commit per user instruction)**

```bash
git add apps/we-impact package.json pnpm-lock.yaml
# git commit -m "feat(we-impact): set up shadcn + Tailwind v4 foundation"  # SKIP: user asked not to commit
```

---

### Task 2: AppSidebar wired to session + router

Adapt the copied `AppSidebar` to `react-router` + `useSession()`, TDD-first.

**Files:**
- Modify: `apps/we-impact/app/layouts/AppSidebar.tsx`
- Test: `apps/we-impact/tests/layouts/AppSidebar.spec.tsx`

**Interfaces:**
- Consumes: `cn`/`@/components/ui/sidebar` (Task 1); `useSession()` from `app/auth/session-context` returning `{ status, profile?: { name?, picture?, ... }, signIn, signOut }`.
- Produces: `AppSidebar` (named export) — a `<Sidebar collapsible="icon">` with nav links to `/` and `/about`, and a footer showing the session display name + a sign-out action.

- [ ] **Step 1: Write the failing test**

Create `apps/we-impact/tests/layouts/AppSidebar.spec.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { SidebarProvider } from '../../app/components/ui/sidebar';
import { AppSidebar } from '../../app/layouts/AppSidebar';

const signOut = vi.fn();

vi.mock('../../app/auth/session-context', () => ({
  useSession: () => ({
    status: 'authenticated',
    profile: { sub: 'u1', name: 'Ada Lovelace' },
    signIn: vi.fn(),
    signOut,
  }),
}));

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
});

beforeEach(() => {
  signOut.mockClear();
});

function renderSidebar() {
  return render(
    <MemoryRouter>
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>
    </MemoryRouter>,
  );
}

test('renders nav items and the session display name', () => {
  renderSidebar();
  expect(screen.getByText('Home')).toBeTruthy();
  expect(screen.getByText('About')).toBeTruthy();
  expect(screen.getByText('Ada Lovelace')).toBeTruthy();
});

test('sign-out control calls session.signOut', () => {
  renderSidebar();
  fireEvent.click(screen.getByRole('button', { name: /sign out/i }));
  expect(signOut).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm exec nx test we-impact -- tests/layouts/AppSidebar.spec.tsx
```

Expected: FAIL — `AppSidebar.tsx` still imports `react-router-dom` and `@/store/user`, so the module fails to resolve.

- [ ] **Step 3: Rewrite `AppSidebar.tsx`**

Replace the entire contents of `apps/we-impact/app/layouts/AppSidebar.tsx` with:

```tsx
import { TrendingUp, Home, Info, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useSession } from '@/auth/session-context';

const navItems = [
  { name: 'Home', url: '/', icon: Home },
  { name: 'About', url: '/about', icon: Info },
];

function UserAvatar({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7" stroke="var(--border)" strokeWidth="1" />
      <text
        x="8"
        y="8"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="8"
        fontFamily="'Inter', system-ui, sans-serif"
        fontWeight="500"
        fill="var(--text)"
      >
        {initial}
      </text>
    </svg>
  );
}

export function AppSidebar() {
  const { pathname } = useLocation();
  const { profile, signOut } = useSession();
  const displayName = profile?.name ?? 'Account';

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex h-8 items-center gap-2 px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <TrendingUp size={16} className="shrink-0" style={{ color: 'var(--text)' }} />
          <span
            className="truncate text-sm font-medium group-data-[collapsible=icon]:hidden"
            style={{ color: 'var(--text-h)' }}
          >
            We Impact
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.name}
                  isActive={pathname === item.url}
                  className="data-[active=true]:bg-background-selected data-[active=true]:text-background"
                >
                  <Link to={item.url}>
                    <item.icon />
                    <span>{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={displayName}>
              {profile?.picture ? (
                <img src={profile.picture} alt="" className="size-4 rounded-full" />
              ) : (
                <UserAvatar name={displayName} />
              )}
              <span>{displayName}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Sign out" onClick={() => signOut()}>
              <LogOut />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:

```bash
pnpm exec nx test we-impact -- tests/layouts/AppSidebar.spec.tsx
```

Expected: PASS (both tests).

- [ ] **Step 5: Commit (stage only — do not run git commit per user instruction)**

```bash
git add apps/we-impact/app/layouts/AppSidebar.tsx apps/we-impact/tests/layouts/AppSidebar.spec.tsx
# git commit -m "feat(we-impact): AppSidebar wired to session + react-router"  # SKIP
```

---

### Task 3: RootLayout + mount the sidebar (replace AppNav)

Wrap the routes in the sidebar shell and remove the old top nav.

**Files:**
- Modify: `apps/we-impact/app/layouts/RootLayout.tsx`
- Modify: `apps/we-impact/app/root.tsx`
- Delete: `apps/we-impact/app/components/nav/app-nav.tsx`

**Interfaces:**
- Consumes: `AppSidebar` (Task 2); `SidebarProvider`, `SidebarInset`, `SidebarTrigger` from `@/components/ui/sidebar`; `RequireAuth` from `app/auth/require-auth`.
- Produces: `RootLayout` (named export) rendering the sidebar shell around `<Outlet />`.

- [ ] **Step 1: Rewrite `RootLayout.tsx`**

Replace the entire contents of `apps/we-impact/app/layouts/RootLayout.tsx` with:

```tsx
import { Outlet } from 'react-router';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';

export function RootLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SidebarTrigger />
        <div className="p-md">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

- [ ] **Step 2: Update `root.tsx` to use the sidebar and drop AppNav**

In `apps/we-impact/app/root.tsx`:

1. Remove the import `import { AppNav } from './components/nav/app-nav'`.
2. Add `import { RootLayout } from './layouts/RootLayout'`.
3. In `Layout`, remove the `<AppNav />` line (keep `<SessionProvider>` wrapping `{children}`).
4. Replace the default `App` export body with:

```tsx
export default function App() {
  return (
    <RequireAuth>
      <RootLayout />
    </RequireAuth>
  );
}
```

After edits, the `Layout` body should read:

```tsx
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
```

- [ ] **Step 3: Confirm AppNav has no other references, then delete it**

Run:

```bash
grep -rn "app-nav\|AppNav" apps/we-impact --include=*.ts --include=*.tsx | grep -v node_modules
```

Expected: no matches remain (only the file itself, if listed). Then delete:

```bash
rm -f apps/we-impact/app/components/nav/app-nav.tsx
rmdir apps/we-impact/app/components/nav 2>/dev/null || true
```

- [ ] **Step 4: Type-check and run the full test suite**

Run:

```bash
pnpm exec nx typecheck we-impact
pnpm exec nx test we-impact
```

Expected: both PASS. (The existing `tests/routes/_index.spec.tsx` and `tests/auth/session-context.spec.tsx` still pass; the new `AppSidebar` test passes.)

- [ ] **Step 5: Manually verify in the dev server**

Run the host (and the auth remote if you want the sign-in widget):

```bash
pnpm exec nx dev we-impact
```

Confirm in the browser: the left sidebar renders with Tailwind styling, "Home"/"About" links navigate, the footer shows the account name, the collapse trigger works, and "Sign out" calls the session logout (drops to `/auth`).

- [ ] **Step 6: Commit (stage only — do not run git commit per user instruction)**

```bash
git add apps/we-impact/app/layouts/RootLayout.tsx apps/we-impact/app/root.tsx
git add -A apps/we-impact/app/components/nav
# git commit -m "feat(we-impact): mount sidebar layout, remove top AppNav"  # SKIP
```

---

## Self-Review

**Spec coverage:**
- Tailwind v4 via `@tailwindcss/vite` → Task 1 Step 2/7. ✓
- `@` alias in vite + tsconfig → Task 1 Steps 7–8. ✓
- `components.json` → Task 1 Step 6. ✓
- Deps at root → Task 1 Step 2. ✓
- `app.css` theme + `root.tsx` link → Task 1 Steps 5/9. ✓
- `cn` (`@/lib/cn`) + `use-mobile` → Task 1 Steps 3–4. ✓ (Note: spec said `lib/utils`; corrected to `@/lib/cn` because every copied ui file imports from there.)
- AppSidebar: react-router, useSession footer + sign-out, nav = Home/About → Task 2. ✓
- RootLayout + root.tsx replace AppNav, delete app-nav → Task 3. ✓
- Tests + verification commands → Task 2 (unit), Task 3 Steps 4–5. ✓
- MF untouched → no task changes `mf-runtime.ts`/MF config. ✓
- Out of scope (zustand, auth remote, sign-in UI) → not touched. ✓

**Deviations from spec (intentional):**
- Deleted unused copied ui files (`card`, `command`, `dialog`, `popover`, `table`) to keep the dependency set minimal (YAGNI) — the spec only required the sidebar chain.
- `cn` lives at `@/lib/cn`, not `@/lib/utils`, to match the copied imports.

**Placeholder scan:** none — every code/config step is complete.

**Type consistency:** `useSession()` shape (`profile?.name`, `profile?.picture`, `signOut`) matches `session-context.tsx`. `useIsMobile`/`cn` names match their import sites. `AppSidebar`/`RootLayout` are named exports used consistently.
