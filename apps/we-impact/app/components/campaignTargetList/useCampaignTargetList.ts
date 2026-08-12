import { useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { deleteCampaignTarget, listCampaignTargets } from "@/api/supporter-api";

/**
 * Fetch the paginated list of projects associated with a campaign. Page
 * state is local (not URL-backed) so it doesn't collide with the campaign
 * edit page's own state.
 */
export function useCampaignTargetList(campaignId: string) {
  const [page, setPage] = useState(0);

  const query = useQuery({
    queryKey: ["campaign-targets", campaignId, { page }],
    queryFn: () => listCampaignTargets(campaignId, { pageNumber: page }),
    enabled: Boolean(campaignId),
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

/**
 * Remove a project's association with a campaign. On success invalidates
 * the campaign's target list so the removed row disappears.
 */
export function useDeleteCampaignTarget(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) => deleteCampaignTarget(campaignId, projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-targets", campaignId] });
    },
  });
}
