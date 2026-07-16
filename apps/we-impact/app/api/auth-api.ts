// The three backend auth calls. All use `credentials: 'include'` so the browser
// sends/receives the HttpOnly refresh cookie the backend manages.

import { apiFetch } from "./api";

export interface TokenResponse {
  accessToken: string;
  expiresIn: number;
}

const authURL = () => import.meta.env.VITE_AUTH_API ?? '';

/**
 * Verify the Google credential. The backend sets the HttpOnly refresh cookie
 * via Set-Cookie and returns the in-memory access token in the body.
 */
export async function validate(
  credential: string,
  provider?: string,
): Promise<TokenResponse> {
  const response = await fetch(`${authURL()}/validate/oauth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ credential, ...(provider ? { provider } : {}) }),
  });
  if (!response.ok) throw new Error(`validate failed: ${response.status}`);
  return (await response.json()) as TokenResponse;
}

/**
 * Fetch the user's profile information. The backend sets the HttpOnly refresh cookie
 * via Set-Cookie and returns the in-memory access token in the body.
 */
export async function userMe(): Promise<TokenResponse> {
  const response = await apiFetch(`${authURL()}/me`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!response.ok) throw new Error(`userMe failed: ${response.status}`);
  return (await response.json()) as TokenResponse;
}

/**
 * Exchange the HttpOnly refresh cookie for a fresh access token. Returns null
 * when the cookie is missing/invalid (401) — the normal "not logged in" path.
 */
export async function refresh(): Promise<TokenResponse | null> {
  const response = await fetch(`${authURL()}/refresh`, {
    method: 'POST',
    credentials: 'include',
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error(`refresh failed: ${response.status}`);
  return (await response.json()) as TokenResponse;
}

/** Ask the backend to clear the HttpOnly refresh cookie. */
export async function logout(): Promise<void> {
  const response = await fetch(`${authURL()}/logout`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!response.ok) throw new Error(`logout failed: ${response.status}`);
}
