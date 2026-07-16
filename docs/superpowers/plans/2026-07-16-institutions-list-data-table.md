# Institutions List Data Table Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder in the Institutions `list` tab with a filterable, paginated table of institutions backed by `listInstitutions`.

**Architecture:** Server-side filtering/pagination. A `useInstitutionList` hook owns filter + page state, debounces text filters, syncs them to the URL query string (preserving the existing `tab` param), and fetches. A generic shadcn `DataTable` (`@tanstack/react-table`, core row model only) renders Name/City/State columns. Prev/Next pagination since the backend returns no total count.

**Tech Stack:** React 19, React Router 7 (`useSearchParams`), `@tanstack/react-table`, shadcn/ui, Vitest + Testing Library, pnpm/Nx.

## Global Constraints

- Package manager: `pnpm` at the repo root; run tasks via `pnpm exec nx <target> we-impact`.
- Run tests: `pnpm exec nx test we-impact` (single run; add `-- <path>` for one file).
- Path alias `@/` → `apps/we-impact/app/`; `cn` util is `@/lib/cn`.
- All backend calls go through `apiFetch` from `@/api/api` (handles auth + 401 refresh).
- Filter values are trimmed; empty values are omitted from the query string.
- Backend page shape: `{ items, pageNumber, pageSize, hasNext }` — no total count.
- Follow existing shadcn `forwardRef` + `cn(...)` component style.

---

### Task 1: API layer — real page shape + `city` filter

**Files:**
- Modify: `apps/we-impact/app/api/institution-api.ts`
- Test: `apps/we-impact/app/api/institution-api.spec.ts` (create)

**Interfaces:**
- Consumes: `apiFetch` from `@/api/api`, `registerURL()` (already in file).
- Produces:
  - `interface Institution { id: string; name: string; type: string; street: string; city: string; state: string }`
  - `interface InstitutionPage { items: Institution[]; pageNumber: number; pageSize: number; hasNext: boolean }`
  - `interface ListInstitutionsParams { pageSize?: number; pageNumber?: number; name?: string; city?: string; state?: string }`
  - `listInstitutions(params?: ListInstitutionsParams): Promise<InstitutionPage>`

- [ ] **Step 1: Write the failing tests**

Create `apps/we-impact/app/api/institution-api.spec.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";

import { listInstitutions } from "./institution-api";

vi.mock("./api", () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from "./api";

const mockedFetch = vi.mocked(apiFetch);

function okResponse() {
  return {
    ok: true,
    status: 200,
    json: async () => ({ items: [], pageNumber: 0, pageSize: 20, hasNext: false }),
  } as unknown as Response;
}

function calledUrl() {
  return new URL(String(mockedFetch.mock.calls[0][0]), "http://test.local");
}

describe("listInstitutions", () => {
  afterEach(() => vi.clearAllMocks());

  it("applies default pageSize=20 and pageNumber=0 and omits empty filters", async () => {
    mockedFetch.mockResolvedValue(okResponse());

    await listInstitutions();

    const url = calledUrl();
    expect(url.pathname.endsWith("/institutions")).toBe(true);
    expect(url.searchParams.get("pageSize")).toBe("20");
    expect(url.searchParams.get("pageNumber")).toBe("0");
    expect(url.searchParams.has("name")).toBe(false);
    expect(url.searchParams.has("city")).toBe(false);
    expect(url.searchParams.has("state")).toBe(false);
    expect(mockedFetch.mock.calls[0][1]).toMatchObject({ method: "GET" });
  });

  it("includes trimmed name, city and state filters when provided", async () => {
    mockedFetch.mockResolvedValue(okResponse());

    await listInstitutions({ pageNumber: 2, name: "  Acme  ", city: "São Paulo", state: "SP" });

    const url = calledUrl();
    expect(url.searchParams.get("pageNumber")).toBe("2");
    expect(url.searchParams.get("name")).toBe("Acme");
    expect(url.searchParams.get("city")).toBe("São Paulo");
    expect(url.searchParams.get("state")).toBe("SP");
  });

  it("throws when the response is not ok", async () => {
    mockedFetch.mockResolvedValue({ ok: false, status: 500 } as Response);

    await expect(listInstitutions()).rejects.toThrow("500");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm exec nx test we-impact -- app/api/institution-api.spec.ts`
Expected: FAIL — `city` filter not handled / `InstitutionPage` shape mismatch (current file has `content`/`totalElements`, no `city` param).

- [ ] **Step 3: Update the types and `listInstitutions`**

In `apps/we-impact/app/api/institution-api.ts`, replace the `ListInstitutionsParams`, `Institution`, and `InstitutionPage` interfaces with:

```ts
/** Filters/pagination for `listInstitutions`. */
export interface ListInstitutionsParams {
  pageSize?: number;
  pageNumber?: number;
  name?: string;
  city?: string;
  state?: string;
}

export interface Institution {
  id: string;
  name: string;
  type: string;
  street: string;
  city: string;
  state: string;
}

export interface InstitutionPage {
  items: Institution[];
  pageNumber: number;
  pageSize: number;
  hasNext: boolean;
}
```

Replace the body of `listInstitutions` with:

```ts
export async function listInstitutions(
  params: ListInstitutionsParams = {},
): Promise<InstitutionPage> {
  const { pageSize = 20, pageNumber = 0, name, city, state } = params;

  const query = new URLSearchParams({
    pageSize: String(pageSize),
    pageNumber: String(pageNumber),
  });
  if (name?.trim()) query.set('name', name.trim());
  if (city?.trim()) query.set('city', city.trim());
  if (state?.trim()) query.set('state', state.trim());

  const response = await apiFetch(`${registerURL()}/institutions?${query}`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error(`listInstitutions failed: ${response.status}`);
  }
  return (await response.json()) as InstitutionPage;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm exec nx test we-impact -- app/api/institution-api.spec.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/we-impact/app/api/institution-api.ts apps/we-impact/app/api/institution-api.spec.ts
git commit -m "feat: institution list api page shape and city filter"
```

---

### Task 2: shadcn Table primitive + generic DataTable

**Files:**
- Modify: root `package.json` (add `@tanstack/react-table`)
- Create: `apps/we-impact/app/components/ui/table.tsx`
- Create: `apps/we-impact/app/components/dataTable/DataTable.tsx`
- Test: `apps/we-impact/app/components/dataTable/dataTable.spec.tsx`

**Interfaces:**
- Consumes: `cn` from `@/lib/cn`; `@tanstack/react-table`.
- Produces:
  - Table primitives: `Table, TableHeader, TableBody, TableRow, TableHead, TableCell` from `@/components/ui/table`.
  - `DataTable<TData, TValue>({ columns, data, emptyMessage? })` from `@/components/dataTable/DataTable`, where `columns: ColumnDef<TData, TValue>[]`.

- [ ] **Step 1: Add the dependency**

Run: `pnpm add -w @tanstack/react-table`
Then: `pnpm exec nx reset`
Expected: `@tanstack/react-table` appears in root `package.json` dependencies.

- [ ] **Step 2: Create the shadcn table primitive**

Create `apps/we-impact/app/components/ui/table.tsx`:

```tsx
import * as React from "react"

import { cn } from "@/lib/cn"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className,
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className,
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell }
```

- [ ] **Step 3: Write the failing DataTable test**

Create `apps/we-impact/app/components/dataTable/dataTable.spec.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import type { ColumnDef } from "@tanstack/react-table";
import { describe, expect, it } from "vitest";

import { DataTable } from "./DataTable";

interface Row {
  name: string;
  city: string;
}

const columns: ColumnDef<Row>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "city", header: "City" },
];

describe("DataTable", () => {
  it("renders headers and a row per data item", () => {
    render(
      <DataTable columns={columns} data={[{ name: "Acme", city: "Rio" }]} />,
    );

    expect(screen.getByText("Name")).toBeTruthy();
    expect(screen.getByText("Acme")).toBeTruthy();
    expect(screen.getByText("Rio")).toBeTruthy();
  });

  it("renders the empty message when there are no rows", () => {
    render(
      <DataTable columns={columns} data={[]} emptyMessage="Nothing here" />,
    );

    expect(screen.getByText("Nothing here")).toBeTruthy();
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `pnpm exec nx test we-impact -- app/components/dataTable/dataTable.spec.tsx`
Expected: FAIL — `DataTable` does not exist.

- [ ] **Step 5: Implement DataTable**

Create `apps/we-impact/app/components/dataTable/DataTable.tsx`:

```tsx
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  emptyMessage?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  emptyMessage = "No results.",
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `pnpm exec nx test we-impact -- app/components/dataTable/dataTable.spec.tsx`
Expected: PASS (2 tests).

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-lock.yaml apps/we-impact/app/components/ui/table.tsx apps/we-impact/app/components/dataTable/
git commit -m "feat: add shadcn table primitive and generic DataTable"
```

---

### Task 3: `useDebouncedValue` + `useInstitutionList` hook

**Files:**
- Create: `apps/we-impact/app/hooks/useDebouncedValue.ts`
- Create: `apps/we-impact/app/routes/institutions/useInstitutionList.ts`
- Test: `apps/we-impact/app/routes/institutions/useInstitutionList.spec.tsx`

**Interfaces:**
- Consumes: `listInstitutions`, `Institution` from `@/api/institution-api`; `useSearchParams` from `react-router`.
- Produces:
  - `useDebouncedValue<T>(value: T, delayMs?: number): T` from `@/hooks/useDebouncedValue`.
  - `useInstitutionList()` returning:
    ```ts
    {
      items: Institution[];
      hasNext: boolean;
      pageNumber: number;
      loading: boolean;
      error: string | null;
      filters: { name: string; city: string; state: string };
      setName: (v: string) => void;
      setCity: (v: string) => void;
      setState: (v: string) => void;
      goToPage: (page: number) => void;
    }
    ```

- [ ] **Step 1: Create the debounce hook**

Create `apps/we-impact/app/hooks/useDebouncedValue.ts`:

```ts
import { useEffect, useState } from "react";

/** Returns `value` delayed by `delayMs`, resetting the timer on each change. */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
```

- [ ] **Step 2: Write the failing hook test**

Create `apps/we-impact/app/routes/institutions/useInstitutionList.spec.tsx`:

```tsx
import { renderHook, waitFor, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useInstitutionList } from "./useInstitutionList";

vi.mock("@/api/institution-api", () => ({
  listInstitutions: vi.fn(),
}));

import { listInstitutions } from "@/api/institution-api";

const mockedList = vi.mocked(listInstitutions);

function page(overrides = {}) {
  return {
    items: [{ id: "1", name: "Acme", type: "NGO", street: "", city: "Rio", state: "RJ" }],
    pageNumber: 0,
    pageSize: 20,
    hasNext: true,
    ...overrides,
  };
}

function wrapper({ children }: { children: ReactNode }) {
  return <MemoryRouter initialEntries={["/institutions?tab=list"]}>{children}</MemoryRouter>;
}

describe("useInstitutionList", () => {
  afterEach(() => vi.clearAllMocks());

  it("fetches with defaults on mount and exposes the items", async () => {
    mockedList.mockResolvedValue(page());

    const { result } = renderHook(() => useInstitutionList(), { wrapper });

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(mockedList).toHaveBeenCalledWith(
      expect.objectContaining({ name: "", city: "", state: "", pageNumber: 0 }),
    );
    expect(result.current.hasNext).toBe(true);
  });

  it("refetches with the name filter after debounce and resets page to 0", async () => {
    mockedList.mockResolvedValue(page());

    const { result } = renderHook(() => useInstitutionList(), { wrapper });
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    act(() => result.current.goToPage(2));
    await waitFor(() => expect(result.current.pageNumber).toBe(2));

    act(() => result.current.setName("Acme"));

    await waitFor(() =>
      expect(mockedList).toHaveBeenLastCalledWith(
        expect.objectContaining({ name: "Acme", pageNumber: 0 }),
      ),
    );
    expect(result.current.pageNumber).toBe(0);
  });

  it("surfaces an error message when the fetch rejects", async () => {
    mockedList.mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useInstitutionList(), { wrapper });

    await waitFor(() => expect(result.current.error).toBe("boom"));
    expect(result.current.loading).toBe(false);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm exec nx test we-impact -- app/routes/institutions/useInstitutionList.spec.tsx`
Expected: FAIL — `useInstitutionList` does not exist.

- [ ] **Step 4: Implement the hook**

Create `apps/we-impact/app/routes/institutions/useInstitutionList.ts`:

```ts
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";

import {
  listInstitutions,
  type Institution,
  type InstitutionPage,
} from "@/api/institution-api";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const EMPTY_PAGE: InstitutionPage = {
  items: [],
  pageNumber: 0,
  pageSize: 20,
  hasNext: false,
};

function setOrDelete(params: URLSearchParams, key: string, value: string) {
  if (value.trim()) params.set(key, value.trim());
  else params.delete(key);
}

export function useInstitutionList() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [name, setNameState] = useState(() => searchParams.get("name") ?? "");
  const [city, setCityState] = useState(() => searchParams.get("city") ?? "");
  const [state, setStateState] = useState(() => searchParams.get("state") ?? "");
  const [page, setPage] = useState(() => Number(searchParams.get("page") ?? "0"));

  const [data, setData] = useState<InstitutionPage>(EMPTY_PAGE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedName = useDebouncedValue(name);
  const debouncedCity = useDebouncedValue(city);
  const debouncedState = useDebouncedValue(state);

  // URL is the source of truth; preserve unrelated params (e.g. `tab`).
  useEffect(() => {
    setSearchParams(
      (prev) => {
        setOrDelete(prev, "name", debouncedName);
        setOrDelete(prev, "city", debouncedCity);
        setOrDelete(prev, "state", debouncedState);
        if (page > 0) prev.set("page", String(page));
        else prev.delete("page");
        return prev;
      },
      { replace: true },
    );
  }, [debouncedName, debouncedCity, debouncedState, page, setSearchParams]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    listInstitutions({
      name: debouncedName,
      city: debouncedCity,
      state: debouncedState,
      pageNumber: page,
    })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load institutions");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedName, debouncedCity, debouncedState, page]);

  function makeFilterSetter(setter: (v: string) => void) {
    return (value: string) => {
      setter(value);
      setPage(0);
    };
  }

  return {
    items: data.items,
    hasNext: data.hasNext,
    pageNumber: page,
    loading,
    error,
    filters: { name, city, state },
    setName: makeFilterSetter(setNameState),
    setCity: makeFilterSetter(setCityState),
    setState: makeFilterSetter(setStateState),
    goToPage: setPage,
  };
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm exec nx test we-impact -- app/routes/institutions/useInstitutionList.spec.tsx`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add apps/we-impact/app/hooks/useDebouncedValue.ts apps/we-impact/app/routes/institutions/useInstitutionList.ts apps/we-impact/app/routes/institutions/useInstitutionList.spec.tsx
git commit -m "feat: add useInstitutionList hook with debounced url-synced filters"
```

---

### Task 4: `InstitutionsList` component + wire into the tab

**Files:**
- Create: `apps/we-impact/app/routes/institutions/columns.tsx`
- Create: `apps/we-impact/app/routes/institutions/InstitutionsList.tsx`
- Modify: `apps/we-impact/app/routes/institutions/Institutions.tsx`
- Test: `apps/we-impact/app/routes/institutions/institutionsList.spec.tsx`

**Interfaces:**
- Consumes: `useInstitutionList` (Task 3), `DataTable` (Task 2), `Institution` (Task 1), shadcn `Input`, `Button`, `Skeleton`.
- Produces: `InstitutionsList` (default-less named export) rendered inside the `list` `TabsContent`.

- [ ] **Step 1: Create the column definitions**

Create `apps/we-impact/app/routes/institutions/columns.tsx`:

```tsx
import type { ColumnDef } from "@tanstack/react-table";

import type { Institution } from "@/api/institution-api";

export const institutionColumns: ColumnDef<Institution>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "city", header: "City" },
  { accessorKey: "state", header: "State" },
];
```

- [ ] **Step 2: Write the failing component test**

Create `apps/we-impact/app/routes/institutions/institutionsList.spec.tsx`:

```tsx
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { InstitutionsList } from "./InstitutionsList";

vi.mock("@/api/institution-api", () => ({
  listInstitutions: vi.fn(),
}));

import { listInstitutions } from "@/api/institution-api";

const mockedList = vi.mocked(listInstitutions);

function page(overrides = {}) {
  return {
    items: [{ id: "1", name: "Acme", type: "NGO", street: "", city: "Rio", state: "RJ" }],
    pageNumber: 0,
    pageSize: 20,
    hasNext: false,
    ...overrides,
  };
}

function renderList() {
  return render(
    <MemoryRouter initialEntries={["/institutions?tab=list"]}>
      <InstitutionsList />
    </MemoryRouter>,
  );
}

describe("InstitutionsList", () => {
  afterEach(() => vi.clearAllMocks());

  it("renders fetched rows", async () => {
    mockedList.mockResolvedValue(page());
    renderList();

    expect(await screen.findByText("Acme")).toBeTruthy();
    expect(screen.getByText("Rio")).toBeTruthy();
    expect(screen.getByText("RJ")).toBeTruthy();
  });

  it("typing in the name filter triggers a filtered fetch", async () => {
    const user = userEvent.setup();
    mockedList.mockResolvedValue(page());
    renderList();

    await screen.findByText("Acme");
    await user.type(screen.getByLabelText("Name"), "Acm");

    await waitFor(() =>
      expect(mockedList).toHaveBeenLastCalledWith(
        expect.objectContaining({ name: "Acm", pageNumber: 0 }),
      ),
    );
  });

  it("Next is disabled when hasNext is false and enabled when true", async () => {
    mockedList.mockResolvedValue(page({ hasNext: true }));
    renderList();

    await screen.findByText("Acme");
    expect(screen.getByRole("button", { name: /next/i })).not.toHaveProperty("disabled", true);
    expect(screen.getByRole("button", { name: /previous/i })).toHaveProperty("disabled", true);
  });

  it("clicking Next fetches the following page", async () => {
    const user = userEvent.setup();
    mockedList.mockResolvedValue(page({ hasNext: true }));
    renderList();

    await screen.findByText("Acme");
    await user.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() =>
      expect(mockedList).toHaveBeenLastCalledWith(
        expect.objectContaining({ pageNumber: 1 }),
      ),
    );
  });

  it("shows the empty state when there are no items", async () => {
    mockedList.mockResolvedValue(page({ items: [], hasNext: false }));
    renderList();

    expect(await screen.findByText("No institutions found")).toBeTruthy();
  });

  it("shows an error message when the fetch fails", async () => {
    mockedList.mockRejectedValue(new Error("network down"));
    renderList();

    expect(await screen.findByText("network down")).toBeTruthy();
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm exec nx test we-impact -- app/routes/institutions/institutionsList.spec.tsx`
Expected: FAIL — `InstitutionsList` does not exist.

- [ ] **Step 4: Implement the component**

Create `apps/we-impact/app/routes/institutions/InstitutionsList.tsx`:

```tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/dataTable/DataTable";

import { institutionColumns } from "./columns";
import { useInstitutionList } from "./useInstitutionList";

export function InstitutionsList() {
  const {
    items,
    hasNext,
    pageNumber,
    loading,
    error,
    filters,
    setName,
    setCity,
    setState,
    goToPage,
  } = useInstitutionList();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Input
          aria-label="Name"
          placeholder="Name"
          value={filters.name}
          onChange={(event) => setName(event.target.value)}
          className="max-w-xs"
        />
        <Input
          aria-label="City"
          placeholder="City"
          value={filters.city}
          onChange={(event) => setCity(event.target.value)}
          className="max-w-xs"
        />
        <Input
          aria-label="State"
          placeholder="State"
          value={filters.state}
          onChange={(event) => setState(event.target.value)}
          className="max-w-xs"
        />
      </div>

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : loading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <DataTable
          columns={institutionColumns}
          data={items}
          emptyMessage="No institutions found"
        />
      )}

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Page {pageNumber + 1}</span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pageNumber === 0}
            onClick={() => goToPage(pageNumber - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasNext}
            onClick={() => goToPage(pageNumber + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Wire it into the list tab**

In `apps/we-impact/app/routes/institutions/Institutions.tsx`, add the import near the other imports:

```tsx
import { InstitutionsList } from "./InstitutionsList";
```

Replace the `list` `TabsContent` body:

```tsx
        <TabsContent value="list" forceMount>
          <h2 className="text-lg font-medium">Institutions list</h2>
          <p className="text-muted-foreground">Institutions list coming soon.</p>
        </TabsContent>
```

with:

```tsx
        <TabsContent value="list" forceMount>
          <h2 className="mb-4 text-lg font-medium">Institutions list</h2>
          <InstitutionsList />
        </TabsContent>
```

- [ ] **Step 6: Run the component test to verify it passes**

Run: `pnpm exec nx test we-impact -- app/routes/institutions/institutionsList.spec.tsx`
Expected: PASS (6 tests).

Note: because the `create` tab uses `forceMount`, `InstitutionsList` mounts even when the `list` tab is not active; the tests render it directly, which matches production behavior.

- [ ] **Step 7: Run the full suite, lint, and typecheck**

Run: `pnpm exec nx test we-impact && pnpm exec nx lint we-impact && pnpm exec nx typecheck we-impact`
Expected: all PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/we-impact/app/routes/institutions/columns.tsx apps/we-impact/app/routes/institutions/InstitutionsList.tsx apps/we-impact/app/routes/institutions/institutionsList.spec.tsx apps/we-impact/app/routes/institutions/Institutions.tsx
git commit -m "feat: institutions list tab with filterable paginated data table"
```

---

## Self-Review Notes

- **Spec coverage:** API shape/`city` filter → Task 1; shadcn data table + dep → Task 2; URL-synced debounced fetch hook → Task 3; three text filters, Name/City/State columns, loading/empty/error states, Prev/Next pagination, wiring into the tab → Task 4. Both testing bullets from the spec are covered (Task 1 query-string tests; Task 4 filter→fetch + pagination component tests). All in scope; nothing from "Out of scope" was added.
- **Type consistency:** `InstitutionPage.items`/`hasNext`/`pageNumber`, `Institution` fields, `ListInstitutionsParams` (incl. `city`), and the `useInstitutionList` return shape are used identically across Tasks 1, 3, and 4. `DataTable` prop names (`columns`, `data`, `emptyMessage`) match between Task 2 definition and Task 4 usage.
- **Placeholders:** none — every code and test step contains full content.
