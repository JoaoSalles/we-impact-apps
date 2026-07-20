import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useProject, useUpdateProject } from "./useEditProject";
import { getProject, updateProject } from "@/api/institution-api";

vi.mock("@/api/institution-api", () => ({
  getProject: vi.fn(),
  updateProject: vi.fn(),
}));

const mockedGet = vi.mocked(getProject);
const mockedUpdate = vi.mocked(updateProject);

function project(overrides = {}) {
  return {
    id: "p1",
    institutionId: "abc",
    title: "Clean Water",
    goal: 1000,
    description: "desc",
    status: true,
    currentGoal: 250,
    ...overrides,
  };
}

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe("useProject", () => {
  afterEach(() => vi.clearAllMocks());

  it("fetches the project by ids and exposes it", async () => {
    mockedGet.mockResolvedValue(project());

    const { result } = renderHook(() => useProject("abc", "p1"), { wrapper });

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(mockedGet).toHaveBeenCalledWith("abc", "p1");
    expect(result.current.data).toMatchObject({ id: "p1", title: "Clean Water" });
  });

  it("does not fetch when an id is empty", () => {
    mockedGet.mockResolvedValue(project());

    renderHook(() => useProject("abc", ""), { wrapper });

    expect(mockedGet).not.toHaveBeenCalled();
  });
});

describe("useUpdateProject", () => {
  afterEach(() => vi.clearAllMocks());

  function wrapperWith(queryClient: QueryClient) {
    return function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );
    };
  }

  it("writes the saved values into the detail cache and marks the list stale", async () => {
    mockedUpdate.mockResolvedValue(undefined);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(["institution-project", "abc", "p1"], project());
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateProject("abc", "p1"), {
      wrapper: wrapperWith(queryClient),
    });

    await result.current.mutateAsync({ title: "Fresh Water", goal: 2000, status: false });

    expect(mockedUpdate).toHaveBeenCalledWith("abc", "p1", {
      title: "Fresh Water",
      goal: 2000,
      status: false,
    });
    expect(
      queryClient.getQueryData(["institution-project", "abc", "p1"]),
    ).toMatchObject({
      id: "p1",
      title: "Fresh Water",
      goal: 2000,
      status: false,
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["institution-projects", "abc"],
    });
    expect(invalidate).not.toHaveBeenCalledWith({
      queryKey: ["institution-project", "abc", "p1"],
    });
  });

  it("does not invalidate when the update fails", async () => {
    mockedUpdate.mockRejectedValue(new Error("boom"));
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(["institution-project", "abc", "p1"], project());
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateProject("abc", "p1"), {
      wrapper: wrapperWith(queryClient),
    });

    await expect(
      result.current.mutateAsync({ title: "Changed" }),
    ).rejects.toThrow("boom");
    expect(invalidate).not.toHaveBeenCalled();
  });
});
