import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import CampaignView from "./Campaigns";
import { getCampaign, listCampaignTargets } from "@/api/supporter-api";
import { searchProjects } from "@/api/institution-api";

// Radix Switch (rendered by CampaignForm's status field) measures its thumb
// via ResizeObserver, which jsdom lacks.
class ResizeObserverStub {
  observe(): void {
    return undefined;
  }
  unobserve(): void {
    return undefined;
  }
  disconnect(): void {
    return undefined;
  }
}

beforeAll(() => {
  globalThis.ResizeObserver ??=
    ResizeObserverStub as unknown as typeof ResizeObserver;
});

vi.mock("@/api/supporter-api", () => ({
  getCampaign: vi.fn(),
  updateCampaign: vi.fn(),
  listCampaignTargets: vi.fn(),
  createCampaignTarget: vi.fn(),
  deleteCampaignTarget: vi.fn(),
}));
vi.mock("@/api/institution-api", () => ({
  searchProjects: vi.fn(),
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockedGet = vi.mocked(getCampaign);
const mockedTargets = vi.mocked(listCampaignTargets);
const mockedSearch = vi.mocked(searchProjects);

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

function renderAt(supporterId: string, campaignId: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/supporters/${supporterId}/campaigns/${campaignId}`]}>
        <Routes>
          <Route
            path="/supporters/:supporterID/campaigns/:campaignID"
            element={<CampaignView />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("CampaignView — associated projects", () => {
  beforeEach(() => {
    mockedTargets.mockResolvedValue({
      items: [
        {
          id: "t1",
          campaignId: "c1",
          projectId: "p1",
          currentAmount: 5000,
          projectTitle: "Reforestation",
          projectStatus: true,
        },
      ],
      pageNumber: 0,
      pageSize: 20,
      hasNext: false,
    });
    mockedSearch.mockResolvedValue({
      items: [],
      pageNumber: 0,
      pageSize: 20,
      hasNext: false,
    });
  });
  afterEach(() => vi.clearAllMocks());

  it("renders the campaign's associated projects", async () => {
    mockedGet.mockResolvedValue(campaign());

    renderAt("s1", "c1");

    expect(await screen.findByText("Reforestation")).toBeTruthy();
    expect(mockedTargets).toHaveBeenCalledWith("c1", { pageNumber: 0 });
  });

  it("opens the Add project dialog to search for a project to associate", async () => {
    const user = userEvent.setup();
    mockedGet.mockResolvedValue(campaign());
    renderAt("s1", "c1");

    await screen.findByText("Reforestation");
    await user.click(screen.getByRole("button", { name: /add project/i }));

    expect(screen.getByLabelText(/title/i)).toBeTruthy();
  });
});
