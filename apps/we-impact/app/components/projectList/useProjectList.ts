import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { listInstitutionProjects } from "@/api/institution-api";

/**
 * Fetch the paginated list of projects for an institution. Page state is local
 * (not URL-backed) so it doesn't collide with the edit page's own state.
 */
export function useProjectList(institutionId: string) {
  const [page, setPage] = useState(0);

  const query = useQuery({
    queryKey: ["institution-projects", institutionId, { page }],
    queryFn: () =>
      listInstitutionProjects(institutionId, { pageNumber: page }),
    enabled: Boolean(institutionId),
    // Keep the previous page's rows visible while the next page loads.
    placeholderData: keepPreviousData,
  });

  return {
    items: query.data?.items ?? [],
    hasNext: query.data?.hasNext ?? false,
    pageNumber: page,
    loading: query.isPending,
    error: query.error
      ? query.error instanceof Error
        ? query.error.message
        : "Failed to load projects"
      : null,
    goToPage: setPage,
  };
}
