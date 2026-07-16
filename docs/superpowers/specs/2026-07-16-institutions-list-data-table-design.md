# Institutions list with shadcn data table

## Goal

Replace the "coming soon" placeholder in the Institutions `list` tab with a
filterable, paginated table of institutions backed by the `listInstitutions`
API call.

## Backend contract

`GET {registerURL()}/institutions` returns a page object:

```
{
  items: Institution[],
  pageNumber: number,
  pageSize: number,
  hasNext: boolean
}
```

`Institution` (T):

```
{ id, name, type, street, city, state }   // all strings
```

Query parameters:

- `pageSize` — default 20
- `pageNumber` — default 0
- `name` — optional filter
- `city` — optional filter
- `state` — optional filter

Empty/whitespace filter values are omitted from the query string. There is **no
total count** in the response, so pagination is Prev/Next only (no page-number
jump).

## Components

### 1. API layer — `app/api/institution-api.ts`

Fix the existing types to match the real contract and add the `city` filter:

- `Institution` interface: `id, name, type, street, city, state`.
- `InstitutionPage` interface: `items, pageNumber, pageSize, hasNext`
  (replacing the current Spring-`Page`-style guess).
- `ListInstitutionsParams`: add `city?`.
- `listInstitutions` appends `name` / `city` / `state` only when non-empty
  (trimmed), keeps `pageSize`/`pageNumber` defaults (20 / 0). GET via `apiFetch`.

### 2. shadcn data table

- Add `@tanstack/react-table` to the root `package.json` dependencies.
- Add the shadcn `app/components/ui/table.tsx` primitive (Table, TableHeader,
  TableBody, TableRow, TableHead, TableCell).
- Add a generic `DataTable<TData, TValue>` component
  (`app/components/dataTable/DataTable.tsx`) using `useReactTable` with
  `getCoreRowModel` **only** — filtering and pagination are server-side, so
  react-table just renders columns. Renders an empty-state row when there are
  no rows.

### 3. Fetch hook — `app/routes/institutions/useInstitutionList.ts`

Separate from the existing `useInstitutions` (create) hook.

- URL `searchParams` are the source of truth for filters + page
  (`name`, `city`, `state`, `page`), consistent with the existing tab pattern.
- Fetches via `useState` + `useEffect`, re-running when the derived query
  changes. Exposes `{ items, hasNext, pageNumber, loading, error }`.
- Text filters are debounced ~300ms via a small inline `useDebouncedValue`
  hook (no new dependency) so we don't fire a request per keystroke.
- Guards against out-of-order responses (ignore stale results when a newer
  request has started).

### 4. UI — `app/routes/institutions/InstitutionsList.tsx`

Replaces the placeholder inside the `list` `TabsContent` in `Institutions.tsx`.

- Filter row: three `Input`s — Name, City, State — controlled locally and
  written (debounced) to the URL; resetting page to 0 on filter change.
- `DataTable` with columns **Name, City, State**.
- States: loading → skeleton rows; empty → "No institutions found"; error →
  inline error message.
- Pagination footer: Prev / Next buttons. Next disabled when `!hasNext`, Prev
  disabled when `pageNumber === 0`. Shows current page number.

## Testing

- Unit test `listInstitutions`: builds correct query string, omits empty
  filters, applies defaults (pageSize 20, pageNumber 0), throws on non-ok.
- Component test `InstitutionsList`: typing a filter triggers a (debounced)
  fetch with the right params; Next/Prev change the page; empty and error
  states render. API mocked.

## Out of scope

- Row actions (edit/delete), row selection, column sorting, per-page size
  selector, and total-count / page-number pagination (backend gives no total).
