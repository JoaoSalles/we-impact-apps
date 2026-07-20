import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { listInstitutions } from "@/api/institution-api";
import { useDebouncedValue } from "@/lib/useDebouncedValue";

function setOrDelete(params: URLSearchParams, key: string, value: string) {
  if (value.trim()) params.set(key, value.trim());
  else params.delete(key);
}

export function useInstitutionList() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [name, setNameState] = useState(() => searchParams.get("name") ?? "");
  const [city, setCityState] = useState(() => searchParams.get("city") ?? "");
  const [state, setStateState] = useState(() => searchParams.get("state") ?? "");
  const [page, setPage] = useState(() => Number(searchParams.get("page") ?? "0"));

  const debouncedName = useDebouncedValue(name);
  const debouncedCity = useDebouncedValue(city);
  const debouncedState = useDebouncedValue(state);

  // URL is the source of truth; preserve unrelated params (e.g. `tab`).
  useEffect(() => {
    setSearchParams(
      (prev) => {
        setOrDelete(prev, "name", debouncedName);
        setOrDelete(prev, "city", debouncedCity);
        setOrDelete(prev, "state", debouncedState);
        if (page > 0) prev.set("page", String(page));
        else prev.delete("page");
        return prev;
      },
      { replace: true },
    );
  }, [debouncedName, debouncedCity, debouncedState, page, setSearchParams]);

  const query = useQuery({
    queryKey: [
      "institutions",
      { name: debouncedName, city: debouncedCity, state: debouncedState, page },
    ],
    queryFn: () =>
      listInstitutions({
        name: debouncedName,
        city: debouncedCity,
        state: debouncedState,
        pageNumber: page,
      }),
    // Keep the previous page's rows visible while the next page loads.
    placeholderData: keepPreviousData,
  });

  function makeFilterSetter(setter: (v: string) => void) {
    return (value: string) => {
      setter(value);
      setPage(0);
    };
  }

  return {
    items: query.data?.items ?? [],
    hasNext: query.data?.hasNext ?? false,
    pageNumber: page,
    loading: query.isPending,
    error: query.error
      ? query.error instanceof Error
        ? query.error.message
        : "Failed to load institutions"
      : null,
    filters: { name, city, state },
    setName: makeFilterSetter(setNameState),
    setCity: makeFilterSetter(setCityState),
    setState: makeFilterSetter(setStateState),
    goToPage: setPage,
  };
}
