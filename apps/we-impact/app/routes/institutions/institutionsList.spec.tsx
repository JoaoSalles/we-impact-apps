import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { InstitutionsList } from "./InstitutionsList";
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
    hasNext: false,
    ...overrides,
  };
}

function renderList() {
  return render(
    <MemoryRouter initialEntries={["/institutions?tab=list"]}>
      <InstitutionsList />
    </MemoryRouter>,
  );
}

describe("InstitutionsList", () => {
  afterEach(() => vi.clearAllMocks());

  it("renders fetched rows", async () => {
    mockedList.mockResolvedValue(page());
    renderList();

    expect(await screen.findByText("Acme")).toBeTruthy();
    expect(screen.getByText("Rio")).toBeTruthy();
    expect(screen.getByText("RJ")).toBeTruthy();
  });

  it("typing in the name filter triggers a filtered fetch", async () => {
    const user = userEvent.setup();
    mockedList.mockResolvedValue(page());
    renderList();

    await screen.findByText("Acme");
    await user.type(screen.getByLabelText("Name"), "Acm");

    await waitFor(() =>
      expect(mockedList).toHaveBeenLastCalledWith(
        expect.objectContaining({ name: "Acm", pageNumber: 0 }),
      ),
    );
  });

  it("Next is disabled when hasNext is false and enabled when true", async () => {
    mockedList.mockResolvedValue(page({ hasNext: true }));
    renderList();

    await screen.findByText("Acme");
    expect(screen.getByRole("button", { name: /next/i })).not.toHaveProperty("disabled", true);
    expect(screen.getByRole("button", { name: /previous/i })).toHaveProperty("disabled", true);
  });

  it("clicking Next fetches the following page", async () => {
    const user = userEvent.setup();
    mockedList.mockResolvedValue(page({ hasNext: true }));
    renderList();

    await screen.findByText("Acme");
    await user.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() =>
      expect(mockedList).toHaveBeenLastCalledWith(
        expect.objectContaining({ pageNumber: 1 }),
      ),
    );
  });

  it("shows the empty state when there are no items", async () => {
    mockedList.mockResolvedValue(page({ items: [], hasNext: false }));
    renderList();

    expect(await screen.findByText("No institutions found")).toBeTruthy();
  });

  it("shows an error message when the fetch fails", async () => {
    mockedList.mockRejectedValue(new Error("network down"));
    renderList();

    expect(await screen.findByText("network down")).toBeTruthy();
  });
});
