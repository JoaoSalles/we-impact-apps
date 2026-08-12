import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ViewSupporter from "./ViewSupporter";
import {
  getSupporter,
  listSupporterCampaigns,
  updateSupporter,
} from "@/api/supporter-api";

vi.mock("@/api/supporter-api", () => ({
  getSupporter: vi.fn(),
  updateSupporter: vi.fn(),
  listSupporterCampaigns: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockedGet = vi.mocked(getSupporter);
const mockedUpdate = vi.mocked(updateSupporter);
const mockedCampaigns = vi.mocked(listSupporterCampaigns);

function supporter(overrides = {}) {
  return {
    id: "abc",
    name: "Acme Corp",
    document: "12.345.678/0001-90",
    createdAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function renderAt(id: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/supporters/${id}`]}>
        <Routes>
          <Route path="/supporters/:id" element={<ViewSupporter />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("ViewSupporter", () => {
  beforeEach(() =>
    mockedCampaigns.mockResolvedValue({
      items: [],
      pageNumber: 0,
      pageSize: 20,
      hasNext: false,
    }),
  );
  afterEach(() => vi.clearAllMocks());

  it("fetches the supporter by the route id and prefills the form", async () => {
    mockedGet.mockResolvedValue(supporter());

    renderAt("abc");

    expect(await screen.findByDisplayValue("Acme Corp")).toBeTruthy();
    expect(mockedGet).toHaveBeenCalledWith("abc");
    expect(screen.getByDisplayValue("12.345.678/0001-90")).toBeTruthy();
  });

  it("shows an error message when the fetch fails", async () => {
    mockedGet.mockRejectedValue(new Error("boom"));

    renderAt("abc");

    expect(await screen.findByText("boom")).toBeTruthy();
  });

  it("saves the edited values through updateSupporter with the route id", async () => {
    mockedGet.mockResolvedValue(supporter());
    mockedUpdate.mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderAt("abc");

    const name = await screen.findByDisplayValue("Acme Corp");
    // The form starts read-only behind an Edit toggle; enter edit mode first.
    await user.click(screen.getByRole("button", { name: /edit/i }));
    await user.clear(name);
    await user.type(name, "Acme Corp Updated");
    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() =>
      expect(mockedUpdate).toHaveBeenCalledWith(
        "abc",
        expect.objectContaining({ name: "Acme Corp Updated" }),
      ),
    );
    expect(screen.getByDisplayValue("Acme Corp Updated")).toBeTruthy();
  });

  it("fetches this supporter's campaigns", async () => {
    mockedGet.mockResolvedValue(supporter());

    renderAt("abc");

    await waitFor(() => expect(mockedCampaigns).toHaveBeenCalledWith(
      "abc",
      expect.objectContaining({ pageNumber: 0 }),
    ));
  });
});
