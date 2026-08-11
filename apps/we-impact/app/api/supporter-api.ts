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
