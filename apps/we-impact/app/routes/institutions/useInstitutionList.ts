import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";

import {
  listInstitutions,
  type InstitutionPage,
} from "@/api/institution-api";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const EMPTY_PAGE: InstitutionPage = {
  items: [],
  pageNumber: 0,
  pageSize: 20,
  hasNext: false,
};

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

  const [data, setData] = useState<InstitutionPage>(EMPTY_PAGE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    listInstitutions({
      name: debouncedName,
      city: debouncedCity,
      state: debouncedState,
      pageNumber: page,
    })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load institutions");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedName, debouncedCity, debouncedState, page]);

  function makeFilterSetter(setter: (v: string) => void) {
    return (value: string) => {
      setter(value);
      setPage(0);
    };
  }

  return {
    items: data.items,
    hasNext: data.hasNext,
    pageNumber: page,
    loading,
    error,
    filters: { name, city, state },
    setName: makeFilterSetter(setNameState),
    setCity: makeFilterSetter(setCityState),
    setState: makeFilterSetter(setStateState),
    goToPage: setPage,
  };
}
