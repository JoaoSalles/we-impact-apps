import { renderHook, waitFor, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useCampaignList } from "./useCampaignList";
import { listSupporterCampaigns } from "@/api/supporter-api";

vi.mock("@/api/supporter-api", () => ({
  listSupporterCampaigns: vi.fn(),
}));

const mockedList = vi.mocked(listSupporterCampaigns);

function page(overrides = {}) {
  return {
    items: [
      {
        id: "c1",
        supporterId: "s1",
        name: "Clean Water",
        description: "desc",
        status: true,
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
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/supporters/s1"]}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe("useCampaignList", () => {
  afterEach(() => vi.clearAllMocks());

  it("fetches with defaults on mount and exposes the items", async () => {
    mockedList.mockResolvedValue(page());

    const { result } = renderHook(() => useCampaignList("s1"), { wrapper });

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(mockedList).toHaveBeenCalledWith(
      "s1",
      expect.objectContaining({ name: "", pageNumber: 0 }),
    );
    expect(result.current.hasNext).toBe(true);
  });

  it("does not fetch when the supporter id is empty", () => {
    renderHook(() => useCampaignList(""), { wrapper });
    expect(mockedList).not.toHaveBeenCalled();
  });

  it("refetches with the name filter after debounce and resets page to 0", async () => {
    mockedList.mockResolvedValue(page());

    const { result } = renderHook(() => useCampaignList("s1"), { wrapper });
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    act(() => result.current.goToPage(2));
    await waitFor(() => expect(result.current.pageNumber).toBe(2));

    act(() => result.current.setName("Water"));

    await waitFor(() =>
      expect(mockedList).toHaveBeenLastCalledWith(
        "s1",
        expect.objectContaining({ name: "Water", pageNumber: 0 }),
      ),
    );
    expect(result.current.pageNumber).toBe(0);
  });

  it("surfaces an error message when the fetch rejects", async () => {
    mockedList.mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useCampaignList("s1"), { wrapper });

    await waitFor(() => expect(result.current.error).toBe("boom"));
    expect(result.current.loading).toBe(false);
  });
});
