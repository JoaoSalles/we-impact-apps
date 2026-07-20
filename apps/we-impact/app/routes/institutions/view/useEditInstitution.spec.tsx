import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useEditInstitution, useUpdateInstitution } from "./useEditInstitution";
import { getInstitution, updateInstitution } from "@/api/institution-api";

vi.mock("@/api/institution-api", () => ({
  getInstitution: vi.fn(),
  updateInstitution: vi.fn(),
}));

const mockedGet = vi.mocked(getInstitution);
const mockedUpdate = vi.mocked(updateInstitution);

function detail(overrides = {}) {
  return {
    id: "abc",
    name: "Acme",
    type: "NGO",
    street: "1 Main St",
    city: "Rio",
    state: "RJ",
    postalCode: "20000-000",
    walletAccountIds: ["w1", "w2"],
    ...overrides,
  };
}

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe("useEditInstitution", () => {
  afterEach(() => vi.clearAllMocks());

  it("fetches the institution by id and exposes its details", async () => {
    mockedGet.mockResolvedValue(detail());

    const { result } = renderHook(() => useEditInstitution("abc"), { wrapper });

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(mockedGet).toHaveBeenCalledWith("abc");
    expect(result.current.data).toMatchObject({
      id: "abc",
      postalCode: "20000-000",
      walletAccountIds: ["w1", "w2"],
    });
  });

  it("does not fetch when the id is empty", () => {
    mockedGet.mockResolvedValue(detail());

    renderHook(() => useEditInstitution(""), { wrapper });

    expect(mockedGet).not.toHaveBeenCalled();
  });

  it("surfaces an error when the fetch rejects", async () => {
    mockedGet.mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useEditInstitution("abc"), { wrapper });

    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
  });
});

describe("useUpdateInstitution", () => {
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
    queryClient.setQueryData(["institution", "abc"], detail());
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateInstitution("abc"), {
      wrapper: wrapperWith(queryClient),
    });

    await result.current.mutateAsync({ name: "Acme Institute", city: "Niterói" });

    expect(mockedUpdate).toHaveBeenCalledWith("abc", {
      name: "Acme Institute",
      city: "Niterói",
    });
    // Detail cache reflects the saved values, keeping unrelated fields intact.
    expect(queryClient.getQueryData(["institution", "abc"])).toMatchObject({
      id: "abc",
      type: "NGO",
      name: "Acme Institute",
      city: "Niterói",
    });
    // The detail query is NOT invalidated (that would refetch stale data);
    // only the list is marked stale.
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["institutions"] });
    expect(invalidate).not.toHaveBeenCalledWith({
      queryKey: ["institution", "abc"],
    });
  });

  it("leaves the cache untouched and does not invalidate when the update fails", async () => {
    mockedUpdate.mockRejectedValue(new Error("boom"));
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(["institution", "abc"], detail());
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateInstitution("abc"), {
      wrapper: wrapperWith(queryClient),
    });

    await expect(
      result.current.mutateAsync({ name: "Changed" }),
    ).rejects.toThrow("boom");
    expect(invalidate).not.toHaveBeenCalled();
    expect(queryClient.getQueryData(["institution", "abc"])).toMatchObject({
      name: "Acme",
    });
  });
});
