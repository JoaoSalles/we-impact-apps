import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getSupporter,
  updateSupporter,
  type Supporter,
} from "@/api/supporter-api";
import type { SupporterFormValues } from "@/components/supporterForm/schema";

/** Fetch the current supporter's full details by id (skips empty ids). */
export function useEditSupporter(id: string) {
  return useQuery({
    queryKey: ["supporter", id],
    queryFn: () => getSupporter(id),
    enabled: Boolean(id),
  });
}

/**
 * Update the supporter by id. On success it writes the saved values straight
 * into the detail cache (an immediate refetch can race the backend's write
 * and read back stale values) and marks the supporters list stale.
 */
export function useUpdateSupporter(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: SupporterFormValues) => updateSupporter(id, values),
    onSuccess: (_result, values) => {
      queryClient.setQueryData<Supporter>(["supporter", id], (old) =>
        old
          ? {
              ...old,
              name: values.name,
              document: values.document,
              website: values.website,
              extraContent: values.extraContent,
            }
          : old,
      );
      queryClient.invalidateQueries({ queryKey: ["supporters"] });
    },
  });
}
