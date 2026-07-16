import { renderHook, waitFor, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useInstitutionList } from "./useInstitutionList";
import { listInstitutions } from "@/api/institution-api";

vi.mock("@/api/institution-api", () => ({
  listInstitutions: vi.fn(),
}));

const mockedList = vi.mocked(listInstitutions);

function page(overrides = {}) {
  return {
    items: [{ id: "1", name: "Acme", type: "NGO", street: "", city: "Rio", state: "RJ" }],
    pageNumber: 0,
    pageSize: 20,
    hasNext: true,
    ...overrides,
  };
}

function wrapper({ children }: { children: ReactNode }) {
  return <MemoryRouter initialEntries={["/institutions?tab=list"]}>{children}</MemoryRouter>;
}

describe("useInstitutionList", () => {
  afterEach(() => vi.clearAllMocks());

  it("fetches with defaults on mount and exposes the items", async () => {
    mockedList.mockResolvedValue(page());

    const { result } = renderHook(() => useInstitutionList(), { wrapper });

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(mockedList).toHaveBeenCalledWith(
      expect.objectContaining({ name: "", city: "", state: "", pageNumber: 0 }),
    );
    expect(result.current.hasNext).toBe(true);
  });

  it("refetches with the name filter after debounce and resets page to 0", async () => {
    mockedList.mockResolvedValue(page());

    const { result } = renderHook(() => useInstitutionList(), { wrapper });
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

    const { result } = renderHook(() => useInstitutionList(), { wrapper });

    await waitFor(() => expect(result.current.error).toBe("boom"));
    expect(result.current.loading).toBe(false);
  });
});
