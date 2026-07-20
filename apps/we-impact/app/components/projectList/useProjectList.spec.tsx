import { renderHook, waitFor, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useProjectList } from "./useProjectList";
import { listInstitutionProjects } from "@/api/institution-api";

vi.mock("@/api/institution-api", () => ({
  listInstitutionProjects: vi.fn(),
}));

const mockedList = vi.mocked(listInstitutionProjects);

function page(overrides = {}) {
  return {
    items: [
      {
        id: "p1",
        institutionId: "i1",
        title: "Clean Water",
        goal: 1000,
        description: "desc",
        status: true,
        currentGoal: 250,
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

describe("useProjectList", () => {
  afterEach(() => vi.clearAllMocks());

  it("fetches the first page on mount and exposes the items", async () => {
    mockedList.mockResolvedValue(page());

    const { result } = renderHook(() => useProjectList("i1"), { wrapper });

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(mockedList).toHaveBeenCalledWith("i1", { pageNumber: 0 });
    expect(result.current.hasNext).toBe(true);
  });

  it("advances the page when goToPage is called", async () => {
    mockedList.mockResolvedValue(page());

    const { result } = renderHook(() => useProjectList("i1"), { wrapper });
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    act(() => result.current.goToPage(1));

    await waitFor(() =>
      expect(mockedList).toHaveBeenLastCalledWith("i1", { pageNumber: 1 }),
    );
    expect(result.current.pageNumber).toBe(1);
  });

  it("does not fetch when the institution id is empty", () => {
    renderHook(() => useProjectList(""), { wrapper });
    expect(mockedList).not.toHaveBeenCalled();
  });

  it("surfaces an error message when the fetch rejects", async () => {
    mockedList.mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useProjectList("i1"), { wrapper });

    await waitFor(() => expect(result.current.error).toBe("boom"));
    expect(result.current.loading).toBe(false);
  });
});
