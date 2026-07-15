# Institutions Tabs — Design

Date: 2026-07-15

## Goal

Add a shadcn `tabs` component to the project and use it on the Institutions
route as a persistent layout. The first two tabs are **Creation** and **List**,
with placeholder content for now.

## Requirements

- The URL decides which tab is selected — deep-linkable and refresh-safe.
- Switching between tabs must **not** discard the other tab's state (a form
  being typed into the Creation tab should survive a trip to the List tab and
  back).
- Tab content is placeholder for this first pass (heading + stub text).

## Why not nested routes

URL-driven selection is naturally expressed as nested routes
(`/institutions/create`, `/institutions/list`). But route switching unmounts the
inactive panel, which loses its state — violating the second requirement. So the
route stays a single component and the URL is carried in a search param instead.

## Approach

Single route component, URL search param + `forceMount`.

### Component: `app/components/ui/tabs.tsx`

- Add the shadcn `tabs` component, matching the existing shadcn conventions in
  this repo: `@/lib/cn` for `cn`, `neutral` base color, `tsx`, no prefix.
- Depends on `@radix-ui/react-tabs`, which is **not** yet installed. Add it to
  the root `package.json` alongside the other `@radix-ui/*` packages and install.

### Route: `app/routes/institutions/Institutions.tsx`

- Stays a single route component (no nested routes; `routes.tsx` unchanged).
- Renders a controlled `<Tabs>`:
  - Active value is read from a `?tab=` search param via React Router's
    `useSearchParams`. This makes the URL drive selection.
  - `onValueChange` writes the param back with `{ replace: true }`, so tab
    clicks do not flood browser history.
  - Defaults to `create` when the param is missing or not one of the known
    values.
  - Both `<TabsContent>` panels are rendered with `forceMount` and hidden when
    inactive, so both stay mounted and preserve internal state across switches.
- Two tabs:
  - `create` → "Creation" — placeholder heading + stub text.
  - `list` → "List" — placeholder heading + stub text.

## Testing

`tests/routes/institutions.spec.tsx`:

- Both tab triggers ("Creation" and "List") render.
- Visiting with `?tab=list` selects the List tab.
- Clicking a trigger updates the `tab` search param.
- Both panels are mounted (forceMount) even when one is inactive.

## Out of scope

- Real creation form fields and real institutions data/list — placeholder only.
- Additional tabs beyond Creation and List.
