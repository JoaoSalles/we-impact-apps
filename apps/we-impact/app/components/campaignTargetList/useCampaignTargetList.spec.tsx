import { renderHook, waitFor, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useCampaignTargetList, useDeleteCampaignTarget } from "./useCampaignTargetList";
import { deleteCampaignTarget, listCampaignTargets } from "@/api/supporter-api";

vi.mock("@/api/supporter-api", () => ({
  deleteCampaignTarget: vi.fn(),
  listCampaignTargets: vi.fn(),
}));

const mockedList = vi.mocked(listCampaignTargets);
const mockedDelete = vi.mocked(deleteCampaignTarget);

function page(overrides = {}) {
  return {
    items: [
      {
        id: "t1",
        campaignId: "c1",
        projectId: "p1",
        currentAmount: 5000,
        projectTitle: "Clean Water",
        projectStatus: true,
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

describe("useCampaignTargetList", () => {
  afterEach(() => vi.clearAllMocks());

  it("fetches the first page on mount and exposes the items", async () => {
    mockedList.mockResolvedValue(page());

    const { result } = renderHook(() => useCampaignTargetList("c1"), { wrapper });

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(mockedList).toHaveBeenCalledWith("c1", { pageNumber: 0 });
    expect(result.current.hasNext).toBe(true);
  });

  it("advances the page when goToPage is called", async () => {
    mockedList.mockResolvedValue(page());

    const { result } = renderHook(() => useCampaignTargetList("c1"), { wrapper });
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    act(() => result.current.goToPage(1));

    await waitFor(() =>
      expect(mockedList).toHaveBeenLastCalledWith("c1", { pageNumber: 1 }),
    );
    expect(result.current.pageNumber).toBe(1);
  });

  it("does not fetch when the campaign id is empty", () => {
    renderHook(() => useCampaignTargetList(""), { wrapper });
    expect(mockedList).not.toHaveBeenCalled();
  });

  it("surfaces an error message when the fetch rejects", async () => {
    mockedList.mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useCampaignTargetList("c1"), { wrapper });

    await waitFor(() => expect(result.current.error).toBe("boom"));
    expect(result.current.loading).toBe(false);
  });
});

describe("useDeleteCampaignTarget", () => {
  afterEach(() => vi.clearAllMocks());

  function wrapperWith(queryClient: QueryClient) {
    return function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );
    };
  }

  it("deletes the target and invalidates the campaign's target list", async () => {
    mockedDelete.mockResolvedValue(undefined);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useDeleteCampaignTarget("c1"), {
      wrapper: wrapperWith(queryClient),
    });

    await result.current.mutateAsync("p1");

    expect(mockedDelete).toHaveBeenCalledWith("c1", "p1");
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["campaign-targets", "c1"],
    });
  });

  it("does not invalidate when the delete fails", async () => {
    mockedDelete.mockRejectedValue(new Error("boom"));
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useDeleteCampaignTarget("c1"), {
      wrapper: wrapperWith(queryClient),
    });

    await expect(result.current.mutateAsync("p1")).rejects.toThrow("boom");
    expect(invalidate).not.toHaveBeenCalled();
  });
});
