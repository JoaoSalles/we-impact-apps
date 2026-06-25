// Authenticated fetch helper — use this for all backend calls.
//
// Attaches `Authorization: Bearer <accessToken>` (when present) and
// `credentials: 'include'`. On a 401 it refreshes once and retries the original
// request once; if the refresh fails it clears the token (dropping the UI to
// anonymous) and returns the 401. No timers — refresh is reactive to 401 only.

import { getAccessToken, setAccessToken, clearAccessToken } from './session';
import { refresh } from './auth-api';

function withAuth(init: RequestInit): RequestInit {
  const headers = new Headers(init.headers);
  const token = getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return { ...init, headers, credentials: 'include' };
}

export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const response = await fetch(input, withAuth(init));
  if (response.status !== 401) return response;

  const refreshed = await refresh();
  if (!refreshed) {
    clearAccessToken();
    return response;
  }

  setAccessToken(refreshed.accessToken, refreshed.expiresIn);
  return fetch(input, withAuth(init));
}
