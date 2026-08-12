import { useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { searchProjects } from "@/api/institution-api";
import { createCampaignTarget } from "@/api/supporter-api";
import { useDebouncedValue } from "@/lib/useDebouncedValue";

/**
 * Search projects across all institutions by title/state. Filter and page
 * state are local to the dialog that owns this hook, reset each time the
 * dialog remounts.
 */
export function useSearchProjects(enabled: boolean) {
  const [title, setTitleState] = useState("");
  const [state, setStateState] = useState("");
  const [page, setPage] = useState(0);

  const debouncedTitle = useDebouncedValue(title);
  const debouncedState = useDebouncedValue(state);

  const query = useQuery({
    queryKey: [
      "project-search",
      { title: debouncedTitle, state: debouncedState, page },
    ],
    queryFn: () =>
      searchProjects({
        title: debouncedTitle,
        state: debouncedState,
        pageNumber: page,
      }),
    enabled,
    // Keep the previous page's rows visible while the next page loads.
    placeholderData: keepPreviousData,
  });

  function setTitle(value: string) {
    setTitleState(value);
    setPage(0);
  }

  function setState(value: string) {
    setStateState(value);
    setPage(0);
  }

  return {
    items: query.data?.items ?? [],
    hasNext: query.data?.hasNext ?? false,
    pageNumber: page,
    loading: query.isPending,
    error: query.error
      ? query.error instanceof Error
        ? query.error.message
        : "Failed to search projects"
      : null,
    filters: { title, state },
    setTitle,
    setState,
    goToPage: setPage,
  };
}

/**
 * Associate a project with a campaign. On success invalidates the
 * campaign's target list so the newly associated project appears.
 */
export function useCreateCampaignTarget(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) => createCampaignTarget(campaignId, projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-targets", campaignId] });
    },
  });
}
