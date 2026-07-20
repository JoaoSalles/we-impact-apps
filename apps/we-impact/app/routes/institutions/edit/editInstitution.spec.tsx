import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import EditInstitution from "./EditInstitution";
import {
  getInstitution,
  listInstitutionProjects,
  updateInstitution,
} from "@/api/institution-api";

vi.mock("@/api/institution-api", () => ({
  getInstitution: vi.fn(),
  updateInstitution: vi.fn(),
  listInstitutionProjects: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockedGet = vi.mocked(getInstitution);
const mockedUpdate = vi.mocked(updateInstitution);
const mockedProjects = vi.mocked(listInstitutionProjects);

function detail(overrides = {}) {
  return {
    id: "abc",
    name: "Acme",
    type: "NGO",
    street: "1 Main St",
    city: "Rio",
    state: "RJ",
    postalCode: "20000-000",
    walletAccountIds: ["w1", "w2"],
    ...overrides,
  };
}

function renderAt(id: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/institutions/${id}/edit`]}>
        <Routes>
          <Route path="/institutions/:id/edit" element={<EditInstitution />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("EditInstitution", () => {
  beforeEach(() =>
    mockedProjects.mockResolvedValue({
      items: [],
      pageNumber: 0,
      pageSize: 20,
      hasNext: false,
    }),
  );
  afterEach(() => vi.clearAllMocks());

  it("fetches the institution by the route id and prefills the form", async () => {
    mockedGet.mockResolvedValue(detail());

    renderAt("abc");

    expect(await screen.findByDisplayValue("Acme")).toBeTruthy();
    expect(mockedGet).toHaveBeenCalledWith("abc");
    expect(screen.getByDisplayValue("1 Main St")).toBeTruthy();
    expect(screen.getByDisplayValue("Rio")).toBeTruthy();
    expect(screen.getByDisplayValue("20000-000")).toBeTruthy();
  });

  it("shows an error message when the fetch fails", async () => {
    mockedGet.mockRejectedValue(new Error("boom"));

    renderAt("abc");

    expect(await screen.findByText("boom")).toBeTruthy();
  });

  it("saves the edited values through updateInstitution with the route id", async () => {
    mockedGet.mockResolvedValue(detail());
    mockedUpdate.mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderAt("abc");

    const name = await screen.findByDisplayValue("Acme");
    // The form starts read-only behind an Edit toggle; enter edit mode first.
    await user.click(screen.getByRole("button", { name: /edit/i }));
    await user.clear(name);
    await user.type(name, "Acme Institute");
    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() =>
      expect(mockedUpdate).toHaveBeenCalledWith(
        "abc",
        expect.objectContaining({ name: "Acme Institute", city: "Rio" }),
      ),
    );
    // The saved values stay on screen instead of reverting to the old ones.
    expect(screen.getByDisplayValue("Acme Institute")).toBeTruthy();
  });
});
