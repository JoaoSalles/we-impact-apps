import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useEditSupporter, useUpdateSupporter } from "./useEditSupporter";
import { getSupporter, updateSupporter } from "@/api/supporter-api";

vi.mock("@/api/supporter-api", () => ({
  getSupporter: vi.fn(),
  updateSupporter: vi.fn(),
}));

const mockedGet = vi.mocked(getSupporter);
const mockedUpdate = vi.mocked(updateSupporter);

function supporter(overrides = {}) {
  return {
    id: "abc",
    name: "Acme Corp",
    document: "12.345.678/0001-90",
    createdAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe("useEditSupporter", () => {
  afterEach(() => vi.clearAllMocks());

  it("fetches the supporter by id and exposes its details", async () => {
    mockedGet.mockResolvedValue(supporter());

    const { result } = renderHook(() => useEditSupporter("abc"), { wrapper });

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(mockedGet).toHaveBeenCalledWith("abc");
    expect(result.current.data).toMatchObject({ id: "abc", name: "Acme Corp" });
  });

  it("does not fetch when the id is empty", () => {
    mockedGet.mockResolvedValue(supporter());

    renderHook(() => useEditSupporter(""), { wrapper });

    expect(mockedGet).not.toHaveBeenCalled();
  });

  it("surfaces an error when the fetch rejects", async () => {
    mockedGet.mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useEditSupporter("abc"), { wrapper });

    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
  });
});

describe("useUpdateSupporter", () => {
  afterEach(() => vi.clearAllMocks());

  function wrapperWith(queryClient: QueryClient) {
    return function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );
    };
  }

  it("writes the saved values into the detail cache without refetching it", async () => {
    mockedUpdate.mockResolvedValue(undefined);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(["supporter", "abc"], supporter());
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateSupporter("abc"), {
      wrapper: wrapperWith(queryClient),
    });

    await result.current.mutateAsync({
      name: "Acme Corp Updated",
      document: "12.345.678/0001-90",
    });

    expect(mockedUpdate).toHaveBeenCalledWith("abc", {
      name: "Acme Corp Updated",
      document: "12.345.678/0001-90",
    });
    expect(queryClient.getQueryData(["supporter", "abc"])).toMatchObject({
      id: "abc",
      document: "12.345.678/0001-90",
      name: "Acme Corp Updated",
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["supporters"] });
    expect(invalidate).not.toHaveBeenCalledWith({ queryKey: ["supporter", "abc"] });
  });

  it("leaves the cache untouched and does not invalidate when the update fails", async () => {
    mockedUpdate.mockRejectedValue(new Error("boom"));
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(["supporter", "abc"], supporter());
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateSupporter("abc"), {
      wrapper: wrapperWith(queryClient),
    });

    await expect(result.current.mutateAsync({ name: "Changed" })).rejects.toThrow("boom");
    expect(invalidate).not.toHaveBeenCalled();
    expect(queryClient.getQueryData(["supporter", "abc"])).toMatchObject({
      name: "Acme Corp",
    });
  });
});
