// In-memory access-token store. Source of truth for "is there a token".
//
// The access token is deliberately kept ONLY in this module-level variable —
// never in document.cookie or localStorage — so it is not readable by XSS and
// is gone after a reload (the session is restored via /refresh). See
// docs/superpowers/specs/2026-06-25-hybrid-session-auth-design.md.

let accessToken: string | null = null;

const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

// expiresIn is accepted for forward-compatibility with proactive refresh, but
// nothing reads it yet — refresh is reactive to 401 (see app/auth/api.ts).
export function setAccessToken(token: string, _expiresIn: number): void {
  accessToken = token;
  notify();
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function clearAccessToken(): void {
  accessToken = null;
  notify();
}

/** Listeners fire on every set/clear so non-React code can notify the UI. */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
