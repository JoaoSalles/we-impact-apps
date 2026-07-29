import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createProject } from "@/api/institution-api";
import type { ProjectFormValues } from "./schema";

/**
 * Create a project under an institution. On success it invalidates that
 * institution's projects list so the new row appears.
 */
export function useCreateProject(institutionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: ProjectFormValues) =>
      createProject(institutionId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["institution-projects", institutionId],
      });
    },
  });
}
