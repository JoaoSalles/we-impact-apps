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

/** A single institution's full details, including fields omitted from the list. */
export interface InstitutionDetail extends Institution {
  postalCode: string;
  walletAccountIds: string[];
}

/** A project belonging to an institution. */
export interface Project {
  id: string;
  institutionId: string;
  title: string;
  goal: number | null;
  description: string | null;
  status: boolean;
  currentGoal: number;
}

export interface ProjectPage {
  items: Project[];
  pageNumber: number;
  pageSize: number;
  hasNext: boolean;
}

/** Filters/pagination for `listInstitutionProjects`. */
export interface ListInstitutionProjectsParams {
  pageSize?: number;
  pageNumber?: number;
}

/** Payload for creating a project under an institution. */
export interface CreateProjectValues {
  title: string;
  goal?: number;
  description?: string;
}

/** Payload for updating a project under an institution. */
export interface UpdateProjectValues {
  title: string;
  goal?: number;
  description?: string;
  status?: boolean;
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

/** Fetch a single institution's full details by id. */
export async function getInstitution(id: string): Promise<InstitutionDetail> {
  const response = await apiFetch(`${registerURL()}/institutions/${id}`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error(`getInstitution failed: ${response.status}`);
  }
  return (await response.json()) as InstitutionDetail;
}

/** Fetch a paginated list of the projects belonging to an institution. */
export async function listInstitutionProjects(
  id: string,
  params: ListInstitutionProjectsParams = {},
): Promise<ProjectPage> {
  const { pageSize = 20, pageNumber = 0 } = params;

  const query = new URLSearchParams({
    pageSize: String(pageSize),
    pageNumber: String(pageNumber),
  });

  const response = await apiFetch(
    `${registerURL()}/institutions/${id}/projects?${query}`,
    {
      method: 'GET',
      credentials: 'include',
    },
  );
  if (!response.ok) {
    throw new Error(`listInstitutionProjects failed: ${response.status}`);
  }
  return (await response.json()) as ProjectPage;
}

/** Update an existing institution's details by id. */
export async function updateInstitution(
  id: string,
  body: InstitutionFormValues,
): Promise<void> {
  const response = await apiFetch(`${registerURL()}/institutions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`updateInstitution failed: ${response.status}`);
  }
}

/** Create a new project under an institution. */
export async function createProject(
  id: string,
  body: CreateProjectValues,
): Promise<void> {
  const response = await apiFetch(
    `${registerURL()}/institutions/${id}/projects`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    },
  );
  if (!response.ok) {
    throw new Error(`createProject failed: ${response.status}`);
  }
}

/** Fetch a single project's full details by ids. */
export async function getProject(
  institutionId: string,
  projectId: string,
): Promise<Project> {
  const response = await apiFetch(
    `${registerURL()}/institutions/${institutionId}/projects/${projectId}`,
    {
      method: 'GET',
      credentials: 'include',
    },
  );
  if (!response.ok) {
    throw new Error(`getProject failed: ${response.status}`);
  }
  return (await response.json()) as Project;
}

/** Update an existing project's details by ids. */
export async function updateProject(
  institutionId: string,
  projectId: string,
  body: UpdateProjectValues,
): Promise<void> {
  const response = await apiFetch(
    `${registerURL()}/institutions/${institutionId}/projects/${projectId}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    },
  );
  if (!response.ok) {
    throw new Error(`updateProject failed: ${response.status}`);
  }
}
