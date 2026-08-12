import { renderHook, waitFor, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useCreateCampaignTarget, useSearchProjects } from "./useSearchProjects";
import { searchProjects } from "@/api/institution-api";
import { createCampaignTarget } from "@/api/supporter-api";

vi.mock("@/api/institution-api", () => ({
  searchProjects: vi.fn(),
}));
vi.mock("@/api/supporter-api", () => ({
  createCampaignTarget: vi.fn(),
}));

const mockedSearch = vi.mocked(searchProjects);
const mockedCreate = vi.mocked(createCampaignTarget);

function page(overrides = {}) {
  return {
    items: [
      {
        id: "p1",
        title: "Clean Water",
        goal: 1000,
        description: "desc",
        currentGoal: 250,
        institutionId: "i1",
        institutionName: "Acme",
        institutionState: "SP",
      },
    ],
    pageNumber: 0,
    pageSize: 20,
    hasNext: true,
    ...overrides,
  };
}

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useSearchProjects", () => {
  afterEach(() => vi.clearAllMocks());

  it("fetches with empty filters on mount and exposes the items", async () => {
    mockedSearch.mockResolvedValue(page());

    const { result } = renderHook(() => useSearchProjects(true), { wrapper });

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(mockedSearch).toHaveBeenCalledWith(
      expect.objectContaining({ title: "", state: "", pageNumber: 0 }),
    );
    expect(result.current.hasNext).toBe(true);
  });

  it("refetches with the title filter after debounce and resets page to 0", async () => {
    mockedSearch.mockResolvedValue(page());

    const { result } = renderHook(() => useSearchProjects(true), { wrapper });
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    act(() => result.current.goToPage(2));
    await waitFor(() => expect(result.current.pageNumber).toBe(2));

    act(() => result.current.setTitle("Water"));

    await waitFor(() =>
      expect(mockedSearch).toHaveBeenLastCalledWith(
        expect.objectContaining({ title: "Water", pageNumber: 0 }),
      ),
    );
    expect(result.current.pageNumber).toBe(0);
  });

  it("surfaces an error message when the search rejects", async () => {
    mockedSearch.mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useSearchProjects(true), { wrapper });

    await waitFor(() => expect(result.current.error).toBe("boom"));
    expect(result.current.loading).toBe(false);
  });
});

describe("useCreateCampaignTarget", () => {
  afterEach(() => vi.clearAllMocks());

  function wrapperWith(queryClient: QueryClient) {
    return function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );
    };
  }

  it("creates the target and invalidates the campaign's target list", async () => {
    mockedCreate.mockResolvedValue(undefined);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreateCampaignTarget("c1"), {
      wrapper: wrapperWith(queryClient),
    });

    await result.current.mutateAsync("p1");

    expect(mockedCreate).toHaveBeenCalledWith("c1", "p1");
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["campaign-targets", "c1"],
    });
  });

  it("does not invalidate when the create fails", async () => {
    mockedCreate.mockRejectedValue(new Error("boom"));
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreateCampaignTarget("c1"), {
      wrapper: wrapperWith(queryClient),
    });

    await expect(result.current.mutateAsync("p1")).rejects.toThrow("boom");
    expect(invalidate).not.toHaveBeenCalled();
  });
});
