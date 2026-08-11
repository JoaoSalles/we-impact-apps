import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SupporterList } from "./SupporterList";
import { listSupporters } from "@/api/supporter-api";

vi.mock("@/api/supporter-api", () => ({
  listSupporters: vi.fn(),
}));

const mockedList = vi.mocked(listSupporters);

function page(overrides = {}) {
  return {
    items: [{ id: "1", name: "Acme Corp", document: "12.345.678/0001-90", createdAt: "2026-01-01T00:00:00Z" }],
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
      <MemoryRouter initialEntries={["/supporters?tab=list"]}>
        <SupporterList />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("SupporterList", () => {
  afterEach(() => vi.clearAllMocks());

  it("renders fetched rows", async () => {
    mockedList.mockResolvedValue(page());
    renderList();

    expect(await screen.findByText("Acme Corp")).toBeTruthy();
    expect(screen.getByText("12.345.678/0001-90")).toBeTruthy();
  });

  it("typing in the name filter triggers a filtered fetch", async () => {
    const user = userEvent.setup();
    mockedList.mockResolvedValue(page());
    renderList();

    await screen.findByText("Acme Corp");
    await user.type(screen.getByLabelText(/name/i), "Acm");

    await waitFor(() =>
      expect(mockedList).toHaveBeenLastCalledWith(
        expect.objectContaining({ name: "Acm", pageNumber: 0 }),
      ),
    );
  });

  it("Next is disabled when hasNext is false", async () => {
    mockedList.mockResolvedValue(page({ hasNext: false }));
    renderList();

    await screen.findByText("Acme Corp");
    expect(screen.getByRole("button", { name: /next/i })).toHaveProperty("disabled", true);
  });

  it("shows the empty state when there are no items", async () => {
    mockedList.mockResolvedValue(page({ items: [], hasNext: false }));
    renderList();

    expect(await screen.findByText("No supporters found")).toBeTruthy();
  });

  it("shows an error message when the fetch fails", async () => {
    mockedList.mockRejectedValue(new Error("network down"));
    renderList();

    expect(await screen.findByText("network down")).toBeTruthy();
  });
});
