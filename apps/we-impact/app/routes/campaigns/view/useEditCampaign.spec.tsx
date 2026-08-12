import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useCampaign, useUpdateCampaign } from "./useEditCampaign";
import { getCampaign, updateCampaign } from "@/api/supporter-api";

vi.mock("@/api/supporter-api", () => ({
  getCampaign: vi.fn(),
  updateCampaign: vi.fn(),
}));

const mockedGet = vi.mocked(getCampaign);
const mockedUpdate = vi.mocked(updateCampaign);

function campaign(overrides = {}) {
  return {
    id: "c1",
    supporterId: "s1",
    name: "Clean Water",
    description: "desc",
    status: true,
    ...overrides,
  };
}

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe("useCampaign", () => {
  afterEach(() => vi.clearAllMocks());

  it("fetches the campaign by ids and exposes it", async () => {
    mockedGet.mockResolvedValue(campaign());

    const { result } = renderHook(() => useCampaign("s1", "c1"), { wrapper });

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(mockedGet).toHaveBeenCalledWith("s1", "c1");
    expect(result.current.data).toMatchObject({ id: "c1", name: "Clean Water" });
  });

  it("does not fetch when an id is empty", () => {
    mockedGet.mockResolvedValue(campaign());

    renderHook(() => useCampaign("s1", ""), { wrapper });

    expect(mockedGet).not.toHaveBeenCalled();
  });
});

describe("useUpdateCampaign", () => {
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
    queryClient.setQueryData(["supporter-campaign", "s1", "c1"], campaign());
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateCampaign("s1", "c1"), {
      wrapper: wrapperWith(queryClient),
    });

    await result.current.mutateAsync({ name: "Fresh Water", status: false });

    expect(mockedUpdate).toHaveBeenCalledWith("s1", "c1", {
      name: "Fresh Water",
      status: false,
    });
    expect(
      queryClient.getQueryData(["supporter-campaign", "s1", "c1"]),
    ).toMatchObject({
      id: "c1",
      name: "Fresh Water",
      status: false,
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["supporter-campaigns", "s1"],
    });
    expect(invalidate).not.toHaveBeenCalledWith({
      queryKey: ["supporter-campaign", "s1", "c1"],
    });
  });

  it("does not invalidate when the update fails", async () => {
    mockedUpdate.mockRejectedValue(new Error("boom"));
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(["supporter-campaign", "s1", "c1"], campaign());
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateCampaign("s1", "c1"), {
      wrapper: wrapperWith(queryClient),
    });

    await expect(
      result.current.mutateAsync({ name: "Changed" }),
    ).rejects.toThrow("boom");
    expect(invalidate).not.toHaveBeenCalled();
  });
});
