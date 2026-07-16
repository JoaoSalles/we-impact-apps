import { QueryClient } from "@tanstack/react-query";

/**
 * App-wide React Query client. `staleTime` keeps recently fetched data fresh so
 * revisiting the same query (e.g. a page/filter combination) serves from cache
 * instead of refetching immediately.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
    },
  },
});
