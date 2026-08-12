import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CampaignTargetList } from "./CampaignTargetList";
import { deleteCampaignTarget, listCampaignTargets } from "@/api/supporter-api";

vi.mock("@/api/supporter-api", () => ({
  deleteCampaignTarget: vi.fn(),
  listCampaignTargets: vi.fn(),
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

const mockedList = vi.mocked(listCampaignTargets);
const mockedDelete = vi.mocked(deleteCampaignTarget);

function target(overrides = {}) {
  return {
    id: "t1",
    campaignId: "c1",
    projectId: "p1",
    currentAmount: 5000,
    projectTitle: "Clean Water",
    projectStatus: true,
    ...overrides,
  };
}

function page(overrides = {}) {
  return {
    items: [target()],
    pageNumber: 0,
    pageSize: 20,
    hasNext: false,
    ...overrides,
  };
}

function renderList() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <CampaignTargetList campaignId="c1" />
    </QueryClientProvider>,
  );
}

describe("CampaignTargetList", () => {
  afterEach(() => vi.clearAllMocks());

  it("renders fetched rows with the active badge and current amount", async () => {
    mockedList.mockResolvedValue(page());
    renderList();

    expect(await screen.findByText("Clean Water")).toBeTruthy();
    expect(screen.getByText("Active")).toBeTruthy();
    expect(screen.getByText("50")).toBeTruthy();
  });

  it("shows the empty state when there are no associated projects", async () => {
    mockedList.mockResolvedValue(page({ items: [], hasNext: false }));
    renderList();

    expect(await screen.findByText("No projects found")).toBeTruthy();
  });

  it("shows an error message when the fetch fails", async () => {
    mockedList.mockRejectedValue(new Error("network down"));
    renderList();

    expect(await screen.findByText("network down")).toBeTruthy();
  });

  it("removes the project only after confirming, and shows a success toast", async () => {
    const user = userEvent.setup();
    mockedList.mockResolvedValue(page());
    mockedDelete.mockResolvedValue(undefined);
    renderList();

    await screen.findByText("Clean Water");
    await user.click(screen.getByRole("button", { name: "Remove project" }));
    expect(mockedDelete).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(mockedDelete).toHaveBeenCalledWith("c1", "p1"));
    expect(toastSuccess).toHaveBeenCalledWith("Project removed");
  });
});
