import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { listSupporters } from "@/api/supporter-api";
import { useDebouncedValue } from "@/lib/useDebouncedValue";

function setOrDelete(params: URLSearchParams, key: string, value: string) {
  if (value.trim()) params.set(key, value.trim());
  else params.delete(key);
}

export function useSupporterList() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [name, setNameState] = useState(() => searchParams.get("name") ?? "");
  const [page, setPage] = useState(() => Number(searchParams.get("page") ?? "0"));

  const debouncedName = useDebouncedValue(name);

  // URL is the source of truth; preserve unrelated params (e.g. `tab`).
  useEffect(() => {
    setSearchParams(
      (prev) => {
        setOrDelete(prev, "name", debouncedName);
        if (page > 0) prev.set("page", String(page));
        else prev.delete("page");
        return prev;
      },
      { replace: true },
    );
  }, [debouncedName, page, setSearchParams]);

  const query = useQuery({
    queryKey: ["supporters", { name: debouncedName, page }],
    queryFn: () => listSupporters({ name: debouncedName, pageNumber: page }),
    // Keep the previous page's rows visible while the next page loads.
    placeholderData: keepPreviousData,
  });

  function setName(value: string) {
    setNameState(value);
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
        : "Failed to load supporters"
      : null,
    filters: { name },
    setName,
    goToPage: setPage,
  };
}
