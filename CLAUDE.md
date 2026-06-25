# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> A more verbose `AGENTS.md` also exists, but parts of it are stale (it describes
> SSR/full-stack rendering and omits the auth remote). Where the two disagree,
> trust this file — the app runs as an SPA and uses Module Federation.

## Commands

Tasks are inferred by Nx plugins (the `targets` in `project.json` files are
intentionally empty). Run them through Nx:

```bash
pnpm exec nx dev we-impact        # host dev server on :4200
pnpm exec nx serve auth           # auth remote dev server on :4201 (run alongside host)
pnpm exec nx build we-impact      # production build -> apps/we-impact/dist
pnpm exec nx test we-impact       # vitest (single run; watch is off in vite.config)
pnpm exec nx test auth
pnpm exec nx e2e we-impact-e2e    # Playwright e2e
pnpm exec nx lint we-impact
pnpm exec nx typecheck we-impact
```

- Run a single test file: `pnpm exec nx test we-impact -- path/to/file.spec.tsx`
- `pnpm exec nx reset` clears the Nx cache and regenerates plugin metadata (do this
  after installing dependencies or when tasks/types go stale).
- Both the host and the auth remote must be running for the sign-in widget to
  load in dev.

## Architecture

Nx 23 monorepo (`apps/*` workspaces) of two runnable apps plus an e2e project:

- **`apps/we-impact`** — the host. React Router 7 in **SPA mode**
  (`react-router.config.ts` sets `ssr: false`); it prerenders a static
  `index.html` shell and hydrates entirely on the client. Routes are declared in
  `app/routes.tsx` (`index` + `route(...)`), with route components under
  `app/routes/`.
- **`apps/auth`** — a Module Federation **remote** that exposes `./AuthApp`
  (`module-federation.config.ts`). Plain Vite/React SPA, not React Router.
- **`apps/we-impact-e2e`** — Playwright tests against the host.

### Module Federation (the load-bearing detail)

The host and remote share React via Module Federation, but the two sides use
**different MF mechanisms on purpose**:

- The **remote (auth)** uses the `@module-federation/vite` build plugin to emit
  `remoteEntry.js` + `mf-manifest.json`, exposing `./AuthApp`.
- The **host (we-impact)** does **not** use the vite plugin — it wires the
  remote at runtime via the `@module-federation/runtime` API in
  `app/mf-runtime.ts`. The vite plugin rewrites imports in a way that breaks
  React Router's route-module pipeline (routes resolve to empty components), so
  the host loads the remote purely at runtime instead.

`react`/`react-dom` are configured as **singletons** on both sides, and the host
hands its own React instance into the shared scope (`lib: () => React`). Don't
break this — separate React instances make hooks/context fail across the
boundary. The remote entry URL defaults to `http://localhost:4201/remoteEntry.js`
and can be overridden with `VITE_AUTH_REMOTE_ENTRY`.

`app/auth-widget.tsx` lazily loads `auth/AuthApp` through `loadRemoteModule`, so
the auth bundle stays out of the host's main chunk.

### Google auth security model

The Google provider (`apps/auth/src/auth/google.ts`) returns a **signed ID token
(JWT)** via `google.accounts.id` (authentication, not the OAuth access-token
flow). The token in `AuthResult.credential` is the only thing safe to trust, and
**only after a backend verifies its signature** against Google's public keys
(plus `aud`/`iss`/`exp`). `AuthResult.profile` is decoded client-side **without
signature verification** — display only, never trust it server-side. The host's
`onAuthenticated` is the integration point for POSTing the credential to a
backend (currently stubbed with a `console.log`). `VITE_GOOGLE_CLIENT_ID` is set
in `apps/auth/.env`.

### Adding a sign-in provider

Implement the `AuthProvider` interface (`apps/auth/src/auth/types.ts`) with a
`mount(container, handlers)` method and append it to the `providers` array in
`apps/auth/src/auth/providers.ts`.
