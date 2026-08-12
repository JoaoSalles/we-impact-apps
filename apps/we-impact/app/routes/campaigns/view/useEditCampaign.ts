import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getCampaign,
  updateCampaign,
  type Campaign,
  type UpdateCampaignValues,
} from "@/api/supporter-api";

/** Fetch the current campaign's details (skips when either id is empty). */
export function useCampaign(supporterId: string, campaignId: string) {
  return useQuery({
    queryKey: ["supporter-campaign", supporterId, campaignId],
    queryFn: () => getCampaign(supporterId, campaignId),
    enabled: Boolean(supporterId) && Boolean(campaignId),
  });
}

/**
 * Update the campaign; write authoritative values into the detail cache and
 * mark the campaigns list stale.
 */
export function useUpdateCampaign(supporterId: string, campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: UpdateCampaignValues) =>
      updateCampaign(supporterId, campaignId, values),
    onSuccess: (_result, values) => {
      queryClient.setQueryData<Campaign>(
        ["supporter-campaign", supporterId, campaignId],
        (old) =>
          old
            ? {
                ...old,
                name: values.name,
                description: values.description ?? null,
                status: values.status ?? old.status,
                extraContent: values.extraContent,
              }
            : old,
      );
      queryClient.invalidateQueries({
        queryKey: ["supporter-campaigns", supporterId],
      });
    },
  });
}
