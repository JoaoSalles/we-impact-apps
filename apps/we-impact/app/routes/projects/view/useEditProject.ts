import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getProject,
  updateProject,
  type Project,
  type UpdateProjectValues,
} from "@/api/institution-api";

/** Fetch the current project's details (skips when either id is empty). */
export function useProject(institutionId: string, projectId: string) {
  return useQuery({
    queryKey: ["institution-project", institutionId, projectId],
    queryFn: () => getProject(institutionId, projectId),
    enabled: Boolean(institutionId) && Boolean(projectId),
  });
}

/**
 * Update the project by ids. On success it writes the saved values straight
 * into the detail cache (an immediate GET can race the backend write) and marks
 * the institution's projects list stale so it refetches later.
 */
export function useUpdateProject(institutionId: string, projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: UpdateProjectValues) =>
      updateProject(institutionId, projectId, values),
    onSuccess: (_result, values) => {
      queryClient.setQueryData<Project>(
        ["institution-project", institutionId, projectId],
        (old) =>
          old
            ? {
                ...old,
                title: values.title,
                goal: values.goal ?? null,
                description: values.description ?? null,
                status: values.status ?? old.status,
                extraContent: values.extraContent,
              }
            : old,
      );
      queryClient.invalidateQueries({
        queryKey: ["institution-projects", institutionId],
      });
    },
  });
}
