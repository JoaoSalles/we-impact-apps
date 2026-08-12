import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createCampaign } from "@/api/supporter-api";
import type { CampaignFormValues } from "./schema";

/**
 * Create a campaign under a supporter. On success it invalidates that
 * supporter's campaigns list so the new row appears.
 */
export function useCreateCampaign(supporterId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: CampaignFormValues) =>
      createCampaign(supporterId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["supporter-campaigns", supporterId],
      });
    },
  });
}
