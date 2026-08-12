import { apiFetch } from "./api";
import type { SupporterFormValues } from "@/components/supporterForm/schema";

export interface Supporter {
  id: string;
  name: string;
  document?: string;
  website?: string;
  extraContent?: Record<string, string>;
  createdAt: string;
}

export interface SupporterPage {
  items: Supporter[];
  pageNumber: number;
  pageSize: number;
  hasNext: boolean;
}

/** Filters/pagination for `listSupporters`. */
export interface ListSupportersParams {
  pageSize?: number;
  pageNumber?: number;
  name?: string;
}

/** A campaign belonging to a supporter. */
export interface Campaign {
  id: string;
  supporterId: string;
  name: string;
  description: string | null;
  status: boolean;
  extraContent?: Record<string, string>;
}

export interface CampaignPage {
  items: Campaign[];
  pageNumber: number;
  pageSize: number;
  hasNext: boolean;
}

/** Filters/pagination for `listSupporterCampaigns`. */
export interface ListSupporterCampaignsParams {
  pageSize?: number;
  pageNumber?: number;
  name?: string;
}

/** Payload for creating a campaign under a supporter. */
export interface CreateCampaignValues {
  name: string;
  description?: string;
  extraContent?: Record<string, string>;
}

/** Payload for updating a campaign under a supporter. */
export interface UpdateCampaignValues {
  name: string;
  description?: string;
  status?: boolean;
  extraContent?: Record<string, string>;
}

/** A project associated with a campaign as a fundraising target. */
export interface CampaignTarget {
  id: string;
  campaignId: string;
  projectId: string;
  currentAmount: number;
  projectTitle: string;
  projectStatus: boolean;
}

export interface CampaignTargetPage {
  items: CampaignTarget[];
  pageNumber: number;
  pageSize: number;
  hasNext: boolean;
}

/** Pagination for `listCampaignTargets`. */
export interface ListCampaignTargetsParams {
  pageSize?: number;
  pageNumber?: number;
}

const registerURL = () => import.meta.env.VITE_REGISTER_API ?? '';

/** Create a new supporter. */
export async function createSupporter(body: SupporterFormValues): Promise<void> {
  const response = await apiFetch(`${registerURL()}/supporters`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`createSupporter failed: ${response.status}`);
  }
}

/**
 * Fetch a filtered, paginated list of supporters. `name` is an optional
 * filter; an empty value is omitted from the query string.
 */
export async function listSupporters(
  params: ListSupportersParams = {},
): Promise<SupporterPage> {
  const { pageSize = 20, pageNumber = 0, name } = params;

  const query = new URLSearchParams({
    pageSize: String(pageSize),
    pageNumber: String(pageNumber),
  });
  if (name?.trim()) query.set('name', name.trim());

  const response = await apiFetch(`${registerURL()}/supporters?${query}`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error(`listSupporters failed: ${response.status}`);
  }
  return (await response.json()) as SupporterPage;
}

/** Fetch a single supporter's full details by id. */
export async function getSupporter(id: string): Promise<Supporter> {
  const response = await apiFetch(`${registerURL()}/supporters/${id}`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error(`getSupporter failed: ${response.status}`);
  }
  return (await response.json()) as Supporter;
}

/** Update an existing supporter's details by id. */
export async function updateSupporter(
  id: string,
  body: SupporterFormValues,
): Promise<void> {
  const response = await apiFetch(`${registerURL()}/supporters/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`updateSupporter failed: ${response.status}`);
  }
}

/**
 * Fetch a filtered, paginated list of campaigns for a supporter. `name` is
 * an optional filter; an empty value is omitted from the query string.
 */
export async function listSupporterCampaigns(
  id: string,
  params: ListSupporterCampaignsParams = {},
): Promise<CampaignPage> {
  const { pageSize = 20, pageNumber = 0, name } = params;

  const query = new URLSearchParams({
    pageSize: String(pageSize),
    pageNumber: String(pageNumber),
  });
  if (name?.trim()) query.set('name', name.trim());

  const response = await apiFetch(
    `${registerURL()}/supporters/${id}/campaigns?${query}`,
    {
      method: 'GET',
      credentials: 'include',
    },
  );
  if (!response.ok) {
    throw new Error(`listSupporterCampaigns failed: ${response.status}`);
  }
  return (await response.json()) as CampaignPage;
}

/** Create a new campaign under a supporter. */
export async function createCampaign(
  id: string,
  body: CreateCampaignValues,
): Promise<void> {
  const response = await apiFetch(
    `${registerURL()}/supporters/${id}/campaigns`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    },
  );
  if (!response.ok) {
    throw new Error(`createCampaign failed: ${response.status}`);
  }
}

/** Fetch a single campaign's full details by ids. */
export async function getCampaign(
  supporterId: string,
  campaignId: string,
): Promise<Campaign> {
  const response = await apiFetch(
    `${registerURL()}/supporters/${supporterId}/campaigns/${campaignId}`,
    {
      method: 'GET',
      credentials: 'include',
    },
  );
  if (!response.ok) {
    throw new Error(`getCampaign failed: ${response.status}`);
  }
  return (await response.json()) as Campaign;
}

/** Update an existing campaign's details by ids. */
export async function updateCampaign(
  supporterId: string,
  campaignId: string,
  body: UpdateCampaignValues,
): Promise<void> {
  const response = await apiFetch(
    `${registerURL()}/supporters/${supporterId}/campaigns/${campaignId}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    },
  );
  if (!response.ok) {
    throw new Error(`updateCampaign failed: ${response.status}`);
  }
}

/** Fetch a paginated list of the projects associated with a campaign. */
export async function listCampaignTargets(
  campaignId: string,
  params: ListCampaignTargetsParams = {},
): Promise<CampaignTargetPage> {
  const { pageSize = 20, pageNumber = 0 } = params;

  const query = new URLSearchParams({
    pageSize: String(pageSize),
    pageNumber: String(pageNumber),
  });

  const response = await apiFetch(
    `${registerURL()}/campaigns/${campaignId}/targets?${query}`,
    {
      method: 'GET',
      credentials: 'include',
    },
  );
  if (!response.ok) {
    throw new Error(`listCampaignTargets failed: ${response.status}`);
  }
  return (await response.json()) as CampaignTargetPage;
}

/** Associate a project with a campaign as a fundraising target. */
export async function createCampaignTarget(
  campaignId: string,
  projectId: string,
): Promise<void> {
  const response = await apiFetch(
    `${registerURL()}/campaigns/${campaignId}/targets`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ projectId }),
    },
  );
  if (!response.ok) {
    throw new Error(`createCampaignTarget failed: ${response.status}`);
  }
}

/** Remove a project's association with a campaign. */
export async function deleteCampaignTarget(
  campaignId: string,
  projectId: string,
): Promise<void> {
  const response = await apiFetch(
    `${registerURL()}/campaigns/${campaignId}/targets/${projectId}`,
    {
      method: 'DELETE',
      credentials: 'include',
    },
  );
  if (!response.ok) {
    throw new Error(`deleteCampaignTarget failed: ${response.status}`);
  }
}
