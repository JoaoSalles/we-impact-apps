import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getInstitution,
  updateInstitution,
  type InstitutionDetail,
} from "@/api/institution-api";
import type { InstitutionFormValues } from "@/components/institutionForm/schema";

/** Fetch the current institution's full details by id (skips empty ids). */
export function useEditInstitution(id: string) {
  return useQuery({
    queryKey: ["institution", id],
    queryFn: () => getInstitution(id),
    enabled: Boolean(id),
  });
}

/**
 * Update the institution by id. On success it invalidates this institution's
 * detail cache and the institutions list so both refetch fresh data.
 */
export function useUpdateInstitution(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: InstitutionFormValues) => updateInstitution(id, values),
    onSuccess: (_result, values) => {
      // The PUT succeeded, so the values we sent are authoritative. Write them
      // straight into the detail cache instead of refetching — an immediate GET
      // can race the backend's write and read back the pre-update values.
      queryClient.setQueryData<InstitutionDetail>(["institution", id], (old) =>
        old
          ? {
              ...old,
              name: values.name,
              street: values.street ?? "",
              city: values.city ?? "",
              state: values.state ?? "",
              postalCode: values.postalCode ?? "",
            }
          : old,
      );
      // The list isn't mounted here, so this just marks it stale; it refetches
      // later once the backend is consistent.
      queryClient.invalidateQueries({ queryKey: ["institutions"] });
    },
  });
}
