# Institutions Tabs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shadcn `tabs` component and use it on the Institutions route as a persistent, URL-synced layout with Creation and List tabs whose state survives switching.

**Architecture:** Add the standard shadcn `tabs.tsx` (Radix-backed) to `app/components/ui`. Rebuild `Institutions.tsx` as a single route component rendering a **controlled** `<Tabs>` whose active value comes from a `?tab=` search param (`useSearchParams`), writing changes back with `{ replace: true }`. Both `<TabsContent>` panels use `forceMount` so both stay mounted and preserve state; Radix applies the `hidden` attribute to the inactive one.

**Tech Stack:** React 19, React Router 7 (`react-router`), Radix UI (`@radix-ui/react-tabs`), Tailwind, Vitest + @testing-library/react (jsdom, globals on).

## Global Constraints

- shadcn conventions in this repo: `cn` from `@/lib/cn`, `neutral` base color, `tsx`, no class prefix. Match the existing `forwardRef` component style used in `app/components/ui/separator.tsx`.
- `@/*` resolves to `apps/we-impact/app/*` (tsconfig paths + vite alias).
- Route file stays a single component; **do not** add nested routes. `app/routes.tsx` is unchanged.
- Tab content is placeholder only (heading + stub text). No real form fields or data.
- Tests run via `pnpm exec nx test we-impact -- <file>`. Vitest globals are on (no need to import `test`/`expect`/`vi`).
- Commit with explicit `git add <paths>` only — the repo has unrelated staged work; never `git add -A`/`.`.

---

### Task 1: Add the shadcn `tabs` component

**Files:**
- Modify: root `package.json` (add `@radix-ui/react-tabs` dependency — done via `pnpm add`)
- Create: `apps/we-impact/app/components/ui/tabs.tsx`
- Test: `apps/we-impact/tests/components/ui/tabs.spec.tsx`

**Interfaces:**
- Produces: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` exported from `@/components/ui/tabs`. `Tabs` is `TabsPrimitive.Root` (accepts `value`, `defaultValue`, `onValueChange`, `className`). `TabsContent` accepts Radix `forceMount`.

- [ ] **Step 1: Install the Radix dependency**

Run (from repo root):
```bash
pnpm add -w @radix-ui/react-tabs
```
Expected: root `package.json` gains `@radix-ui/react-tabs` under dependencies and `pnpm-lock.yaml` updates. Then refresh Nx metadata:
```bash
pnpm exec nx reset
```

- [ ] **Step 2: Write the failing test**

Create `apps/we-impact/tests/components/ui/tabs.spec.tsx`:
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../app/components/ui/tabs';

function renderTabs() {
  return render(
    <Tabs defaultValue="a">
      <TabsList>
        <TabsTrigger value="a">Alpha</TabsTrigger>
        <TabsTrigger value="b">Bravo</TabsTrigger>
      </TabsList>
      <TabsContent value="a">Panel A</TabsContent>
      <TabsContent value="b">Panel B</TabsContent>
    </Tabs>,
  );
}

test('renders triggers and the default panel, switches on click', () => {
  renderTabs();
  expect(screen.getByRole('tab', { name: 'Alpha' }).getAttribute('aria-selected')).toBe('true');
  expect(screen.getByText('Panel A')).toBeTruthy();

  fireEvent.click(screen.getByRole('tab', { name: 'Bravo' }));
  expect(screen.getByRole('tab', { name: 'Bravo' }).getAttribute('aria-selected')).toBe('true');
  expect(screen.getByText('Panel B')).toBeTruthy();
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm exec nx test we-impact -- tests/components/ui/tabs.spec.tsx`
Expected: FAIL — cannot resolve `../../../app/components/ui/tabs` (module not found).

- [ ] **Step 4: Create the component**

Create `apps/we-impact/app/components/ui/tabs.tsx`:
```tsx
import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/cn"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm exec nx test we-impact -- tests/components/ui/tabs.spec.tsx`
Expected: PASS (1 passing).

- [ ] **Step 6: Commit**

```bash
git add apps/we-impact/app/components/ui/tabs.tsx apps/we-impact/tests/components/ui/tabs.spec.tsx package.json pnpm-lock.yaml
git commit -m "feat(ui): add shadcn tabs component"
```
Note: `pnpm-lock.yaml` also carries unrelated prior edits — include it here since the install touched it; this is expected.

---

### Task 2: URL-synced Institutions tabs

**Files:**
- Modify (full rewrite): `apps/we-impact/app/routes/institutions/Institutions.tsx`
- Test: `apps/we-impact/tests/routes/institutions.spec.tsx`

**Interfaces:**
- Consumes: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` from `@/components/ui/tabs`; `useSearchParams` from `react-router`.
- Produces: default export `InstitutionsComponent` (unchanged name/shape; still the default rendered by `routes/institutions/index.tsx`).

- [ ] **Step 1: Write the failing test**

Create `apps/we-impact/tests/routes/institutions.spec.tsx`:
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import InstitutionsComponent from '../../app/routes/institutions/Institutions';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <InstitutionsComponent />
    </MemoryRouter>,
  );
}

test('renders both tab triggers', () => {
  renderAt('/institutions');
  expect(screen.getByRole('tab', { name: 'Creation' })).toBeTruthy();
  expect(screen.getByRole('tab', { name: 'List' })).toBeTruthy();
});

test('defaults to the Creation tab when no tab param is present', () => {
  renderAt('/institutions');
  expect(
    screen.getByRole('tab', { name: 'Creation' }).getAttribute('aria-selected'),
  ).toBe('true');
});

test('?tab=list selects the List tab', () => {
  renderAt('/institutions?tab=list');
  expect(
    screen.getByRole('tab', { name: 'List' }).getAttribute('aria-selected'),
  ).toBe('true');
});

test('both panels stay mounted so their state is preserved (forceMount)', () => {
  renderAt('/institutions?tab=list');
  // getByText finds elements even when Radix marks the inactive panel hidden
  expect(screen.getByText('Create institution')).toBeTruthy();
  expect(screen.getByText('Institutions list')).toBeTruthy();
});

test('clicking a trigger switches the active tab', () => {
  renderAt('/institutions');
  fireEvent.click(screen.getByRole('tab', { name: 'List' }));
  expect(
    screen.getByRole('tab', { name: 'List' }).getAttribute('aria-selected'),
  ).toBe('true');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec nx test we-impact -- tests/routes/institutions.spec.tsx`
Expected: FAIL — no `tab` roles found (current component only renders an `<h1>`).

- [ ] **Step 3: Rewrite the route component**

Replace the entire contents of `apps/we-impact/app/routes/institutions/Institutions.tsx`:
```tsx
import { useSearchParams } from "react-router";

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";

const TABS = ["create", "list"] as const;
type InstitutionsTab = (typeof TABS)[number];

const DEFAULT_TAB: InstitutionsTab = "create";

function isInstitutionsTab(value: string | null): value is InstitutionsTab {
  return value !== null && (TABS as readonly string[]).includes(value);
}

export default function InstitutionsComponent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const param = searchParams.get("tab");
  const activeTab: InstitutionsTab = isInstitutionsTab(param)
    ? param
    : DEFAULT_TAB;

  function handleTabChange(value: string) {
    setSearchParams(
      (prev) => {
        prev.set("tab", value);
        return prev;
      },
      { replace: true },
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold">Institutions</h1>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-4">
        <TabsList>
          <TabsTrigger value="create">Creation</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
        </TabsList>

        <TabsContent value="create" forceMount>
          <h2 className="text-lg font-medium">Create institution</h2>
          <p className="text-muted-foreground">Creation form coming soon.</p>
        </TabsContent>

        <TabsContent value="list" forceMount>
          <h2 className="text-lg font-medium">Institutions list</h2>
          <p className="text-muted-foreground">Institutions list coming soon.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm exec nx test we-impact -- tests/routes/institutions.spec.tsx`
Expected: PASS (5 passing).

- [ ] **Step 5: Typecheck**

Run: `pnpm exec nx typecheck we-impact`
Expected: no type errors.

- [ ] **Step 6: Commit**

```bash
git add apps/we-impact/app/routes/institutions/Institutions.tsx apps/we-impact/tests/routes/institutions.spec.tsx
git commit -m "feat(institutions): url-synced tabs layout with preserved state"
```

---

## Self-Review

**Spec coverage:**
- shadcn `tabs` component added + dependency → Task 1. ✓
- URL decides selected tab (`?tab=`, `useSearchParams`) → Task 2, Step 3 + test `?tab=list`. ✓
- State preserved across switches (`forceMount`) → Task 2, Step 3 + "both panels stay mounted" test. ✓
- `{ replace: true }` to avoid history spam → Task 2, Step 3. ✓
- Default to `create` when param missing/invalid → Task 2, `isInstitutionsTab`/`DEFAULT_TAB` + default test. ✓
- Placeholder content only → Task 2 panels. ✓
- Route stays single component, `routes.tsx` unchanged → not modified anywhere. ✓
- Tests: both triggers render, `?tab=list` selects List, click updates param/tab, both panels mounted → all in Task 2. ✓

**Placeholder scan:** No TBD/TODO; every code and test step shows full content. ✓

**Type consistency:** `Tabs/TabsList/TabsTrigger/TabsContent` exported in Task 1 are exactly what Task 2 imports; `InstitutionsTab`/`DEFAULT_TAB`/`isInstitutionsTab` used consistently within Task 2. ✓
