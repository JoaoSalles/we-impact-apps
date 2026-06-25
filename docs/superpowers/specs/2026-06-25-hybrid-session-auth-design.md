# Hybrid session auth (HttpOnly refresh cookie + in-memory Bearer access token)

Date: 2026-06-25
Status: Approved (pending written-spec review)

## Goal

After a user signs in with Google, persist a backend session and gate the UI:

- Store the session so the user stays logged in across reloads.
- Send authenticated requests to the backend with `Authorization: Bearer <accessToken>`.
- Hide the sign-in widget while logged in; show a **Sign out** control instead.

## Security model (chosen: hybrid / "model C")

The backend returns `accessToken`, `refreshToken`, and `expiresIn`. We split them by
sensitivity:

- **refreshToken** — long-lived, never touched by JS. The **backend** sets it as an
  **HttpOnly cookie** (only the server's `Set-Cookie` can do this; JS cannot set
  HttpOnly cookies). It is read by the backend on `/refresh` and cleared on `/logout`.
- **accessToken** — short-lived, kept in a **module-level variable in memory** on the
  frontend (NOT in `document.cookie`, NOT in localStorage). Sent as a `Bearer` header.

Nothing token-related is ever written to `document.cookie`. Because the access token
lives in memory, it is gone after a reload; the session is restored by calling
`/refresh`, which the browser authenticates via the HttpOnly refresh cookie.

This is the widely-recommended balance: the sensitive long-lived token is XSS-safe
(HttpOnly), while the short-lived access token enables `Bearer`-header API calls.

## Backend dependencies (must exist / be configured)

All frontend calls use `credentials: 'include'`.

| Purpose | Env var | Behavior |
|---|---|---|
| Validate Google credential | `VITE_VALIDATE_CREDENTIAL` (exists) | Verifies the Google ID token; sets HttpOnly refresh cookie via `Set-Cookie`; returns `{ accessToken, expiresIn }` in the body |
| Refresh | `VITE_REFRESH_TOKEN` (new) | Reads the HttpOnly cookie; returns `{ accessToken, expiresIn }`; responds 401 when the cookie is missing/invalid |
| Logout | `VITE_LOGOUT` (new) | Clears the HttpOnly cookie |

CORS: this is cross-origin (`localhost:4200` → `localhost:8080`), so the backend must
return `Access-Control-Allow-Credentials: true` with a specific
`Access-Control-Allow-Origin` (not `*`). `:4200` and `:8080` are same-site, so the
refresh cookie can be `SameSite=Lax`.

The new env vars are added to `apps/we-impact/.env`.

## Frontend units — `apps/we-impact/app/auth/`

Four small, independently testable units.

### 1. `session.ts` — in-memory access-token store (source of truth for "is there a token")

State: module-level `accessToken: string | null` and `expiresAt` (informational).

- `setAccessToken(token: string, expiresIn: number): void`
- `getAccessToken(): string | null`
- `clearAccessToken(): void`
- `subscribe(listener: () => void): () => void` — listeners fire on set/clear so code
  outside React (e.g. `apiFetch`) can notify the React layer that the token changed.

No cookie code at all. Depends on nothing.

### 2. `auth-api.ts` — the three backend auth calls

- `validate(credential: string): Promise<{ accessToken: string; expiresIn: number }>`
  — POST `VITE_VALIDATE_CREDENTIAL`, JSON body `{ credential }`, `credentials: 'include'`.
- `refresh(): Promise<{ accessToken: string; expiresIn: number } | null>`
  — POST `VITE_REFRESH_TOKEN`, `credentials: 'include'`; returns `null` on 401.
- `logout(): Promise<void>` — POST `VITE_LOGOUT`, `credentials: 'include'`.

Each checks `response.ok`. Depends on env vars only.

### 3. `api.ts` — authenticated fetch helper (the thing used for future backend calls)

`apiFetch(input, init?): Promise<Response>`:

1. Adds `Authorization: Bearer <getAccessToken()>` (if a token exists) and
   `credentials: 'include'` to the request.
2. **Auto-refresh on 401:** if the response is 401, call `refresh()` once. On success,
   `setAccessToken(...)` and retry the original request once. On failure,
   `clearAccessToken()` (which notifies subscribers → UI drops to anonymous) and return
   the 401 to the caller. No timers; refresh is reactive to 401 only.

Depends on `session.ts` and `auth-api.ts`.

### 4. `session-context.tsx` — React state bridge

`SessionProvider` exposes `useSession()`:

```
status: 'loading' | 'authenticated' | 'anonymous'
profile?: { sub; email?; name?; picture? }   // display only, decoded client-side
signIn(credential: string, profile?): Promise<void>
signOut(): Promise<void>
```

- **On mount:** status starts `loading`; call `refresh()`. Success →
  `setAccessToken(...)`, status `authenticated`. `null`/throw → status `anonymous`.
  This is what restores the session across reloads.
- `signIn` → `validate(credential)`, `setAccessToken(...)`, store `profile`, status
  `authenticated`.
- `signOut` → `logout()`, `clearAccessToken()`, clear `profile`, status `anonymous`.
- Subscribes to `session.subscribe(...)` so an external `clearAccessToken()` (from
  `apiFetch`'s failed refresh) drops status to `anonymous` and clears `profile`.

Depends on `session.ts` and `auth-api.ts`.

## Wiring changes

- **`root.tsx`** — wrap the app in `<SessionProvider>` inside `Layout`.
- **`auth-widget.tsx`** — remove the inline `fetch` to the validate URL. The widget now
  simply forwards the Google result up via a prop (`onAuthenticated(result)` →
  `result.credential` + `result.profile`); the `validate` call lives in `auth-api.ts`,
  invoked by `signIn`.
- **`AuthControls`** (new component, replaces `<AuthWidget/>` in `app.tsx`):
  - `loading` → minimal placeholder (or nothing).
  - `anonymous` → renders `<AuthWidget onAuthenticated={r => signIn(r.credential, r.profile)} />`.
  - `authenticated` → greeting (`profile?.name`/`email`) + **Sign out** button calling
    `signOut()`. After sign-out the widget reappears.
- **`app.tsx`** — render `<AuthControls/>` in place of `<AuthWidget/>`.

The `auth` remote is unchanged — all of this is host-side.

## Data flow

```
Sign in:   AuthWidget(Google) → onAuthenticated(credential)
           → signIn() → validate() [sets HttpOnly cookie, returns accessToken]
           → setAccessToken(memory) → status=authenticated → widget hidden

Reload:    SessionProvider mount → refresh() [browser sends HttpOnly cookie]
           → setAccessToken(memory) → authenticated  (or → anonymous on 401)

API call:  apiFetch() → Bearer accessToken
           → on 401: refresh() → retry once
           → if refresh fails: clearAccessToken() → status=anonymous

Sign out:  signOut() → logout() [backend clears HttpOnly cookie]
           → clearAccessToken() → status=anonymous → widget shown
```

## Error handling

- `validate`/`refresh`/`logout` non-OK (non-401) responses throw; `signIn`/`signOut`
  surface the error (logged + leave a sensible status). `refresh()` treats 401 as the
  normal "not logged in" path (returns `null`, not throw).
- `apiFetch` only auto-refreshes on 401, retries at most once, and never loops.

## Testing (vitest)

- `session.ts`: `set` → `get` returns token; `clear` → `get` returns `null`;
  `subscribe` listener fires on set and clear.
- `api.ts`: `apiFetch` attaches `Authorization: Bearer <token>` and
  `credentials: 'include'`; on a 401 it calls `refresh` and retries once; on failed
  refresh it clears the token and returns the 401. (`fetch` mocked.)

## Out of scope (YAGNI for now)

- Proactive timer-based refresh before expiry (covered reactively by 401 handling).
- Persisting `profile` across reload (re-derived from `/refresh` response later if the
  backend returns it; for now the greeting may be empty until the user signs in again,
  unless `/refresh` returns profile data).
</content>
</invoke>
