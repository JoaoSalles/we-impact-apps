// The three backend auth calls. All use `credentials: 'include'` so the browser
// sends/receives the HttpOnly refresh cookie the backend manages.

import { apiFetch } from "./api";
import type { InstitutionFormValues } from "@/components/institutionForm/schema";

export interface TokenResponse {
  accessToken: string;
  expiresIn: number;
}

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

/**
 * Fetch a filtered, paginated list of institutions. `name` and `state` are
 * optional filters; empty values are omitted from the query string.
 */
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
