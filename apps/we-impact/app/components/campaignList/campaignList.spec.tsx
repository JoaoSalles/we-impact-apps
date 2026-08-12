import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CampaignList } from "./CampaignList";
import { listSupporterCampaigns } from "@/api/supporter-api";

vi.mock("@/api/supporter-api", () => ({
  listSupporterCampaigns: vi.fn(),
}));

const mockedList = vi.mocked(listSupporterCampaigns);

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

function page(overrides = {}) {
  return {
    items: [campaign()],
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
      <MemoryRouter initialEntries={["/supporters/s1"]}>
        <CampaignList supporterId="s1" />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("CampaignList", () => {
  afterEach(() => vi.clearAllMocks());

  it("renders fetched rows with the active badge", async () => {
    mockedList.mockResolvedValue(page());
    renderList();

    expect(await screen.findByText("Clean Water")).toBeTruthy();
    expect(screen.getByText("Active")).toBeTruthy();
  });

  it("typing in the name filter triggers a filtered fetch", async () => {
    const user = userEvent.setup();
    mockedList.mockResolvedValue(page());
    renderList();

    await screen.findByText("Clean Water");
    await user.type(screen.getByLabelText(/name/i), "Wat");

    await waitFor(() =>
      expect(mockedList).toHaveBeenLastCalledWith(
        "s1",
        expect.objectContaining({ name: "Wat", pageNumber: 0 }),
      ),
    );
  });

  it("shows the empty state when there are no campaigns", async () => {
    mockedList.mockResolvedValue(page({ items: [], hasNext: false }));
    renderList();

    expect(await screen.findByText("No campaigns found")).toBeTruthy();
  });

  it("shows an error message when the fetch fails", async () => {
    mockedList.mockRejectedValue(new Error("network down"));
    renderList();

    expect(await screen.findByText("network down")).toBeTruthy();
  });
});
