// The three backend auth calls. All use `credentials: 'include'` so the browser
// sends/receives the HttpOnly refresh cookie the backend manages.

import { apiFetch } from "./api";
import type { InstitutionFormValues } from "@/components/institutionForm/schema";

export interface TokenResponse {
  accessToken: string;
  expiresIn: number;
}

const registerURL = () => import.meta.env.VITE_REGISTER_API ?? '';

/**
 * Verify the Google credential. The backend sets the HttpOnly refresh cookie
 * via Set-Cookie and returns the in-memory access token in the body.
 */
export async function createInstitution(
  body: InstitutionFormValues,
): Promise<TokenResponse> {
  const response = await apiFetch(`${registerURL()}/institutions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`validate failed: ${response.status}`);
  return (await response.json()) as TokenResponse;
}
