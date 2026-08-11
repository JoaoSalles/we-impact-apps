import { renderHook, waitFor, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useSupporterList } from "./useSupporterList";
import { listSupporters } from "@/api/supporter-api";

vi.mock("@/api/supporter-api", () => ({
  listSupporters: vi.fn(),
}));

const mockedList = vi.mocked(listSupporters);

function page(overrides = {}) {
  return {
    items: [{ id: "1", name: "Acme Corp", createdAt: "2026-01-01T00:00:00Z" }],
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
      <MemoryRouter initialEntries={["/supporters?tab=list"]}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe("useSupporterList", () => {
  afterEach(() => vi.clearAllMocks());

  it("fetches with defaults on mount and exposes the items", async () => {
    mockedList.mockResolvedValue(page());

    const { result } = renderHook(() => useSupporterList(), { wrapper });

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(mockedList).toHaveBeenCalledWith(
      expect.objectContaining({ name: "", pageNumber: 0 }),
    );
    expect(result.current.hasNext).toBe(true);
  });

  it("refetches with the name filter after debounce and resets page to 0", async () => {
    mockedList.mockResolvedValue(page());

    const { result } = renderHook(() => useSupporterList(), { wrapper });
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    act(() => result.current.goToPage(2));
    await waitFor(() => expect(result.current.pageNumber).toBe(2));

    act(() => result.current.setName("Acme"));

    await waitFor(() =>
      expect(mockedList).toHaveBeenLastCalledWith(
        expect.objectContaining({ name: "Acme", pageNumber: 0 }),
      ),
    );
    expect(result.current.pageNumber).toBe(0);
  });

  it("surfaces an error message when the fetch rejects", async () => {
    mockedList.mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useSupporterList(), { wrapper });

    await waitFor(() => expect(result.current.error).toBe("boom"));
    expect(result.current.loading).toBe(false);
  });
});
