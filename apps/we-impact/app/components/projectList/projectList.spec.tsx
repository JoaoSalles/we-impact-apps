import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProjectList } from "./ProjectList";
import { listInstitutionProjects } from "@/api/institution-api";

vi.mock("@/api/institution-api", () => ({
  listInstitutionProjects: vi.fn(),
}));

const mockedList = vi.mocked(listInstitutionProjects);

function project(overrides = {}) {
  return {
    id: "p1",
    institutionId: "i1",
    title: "Clean Water",
    goal: 1000,
    description: "desc",
    status: true,
    currentGoal: 250,
    ...overrides,
  };
}

function page(overrides = {}) {
  return {
    items: [project()],
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
      <MemoryRouter>
        <ProjectList institutionId="i1" />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("ProjectList", () => {
  afterEach(() => vi.clearAllMocks());

  it("renders fetched rows with the active badge and goal progress", async () => {
    mockedList.mockResolvedValue(page());
    renderList();

    expect(await screen.findByText("Clean Water")).toBeTruthy();
    expect(screen.getByText("Active")).toBeTruthy();
    expect(screen.getByText("250 / 1,000")).toBeTruthy();
  });

  it("renders the inactive badge and a dash when goal is null", async () => {
    mockedList.mockResolvedValue(
      page({ items: [project({ status: false, goal: null })] }),
    );
    renderList();

    expect(await screen.findByText("Inactive")).toBeTruthy();
    expect(screen.getByText("250 / —")).toBeTruthy();
  });

  it("clicking Next fetches the following page", async () => {
    const user = userEvent.setup();
    mockedList.mockResolvedValue(page({ hasNext: true }));
    renderList();

    await screen.findByText("Clean Water");
    await user.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() =>
      expect(mockedList).toHaveBeenLastCalledWith("i1", { pageNumber: 1 }),
    );
  });

  it("shows the empty state when there are no projects", async () => {
    mockedList.mockResolvedValue(page({ items: [], hasNext: false }));
    renderList();

    expect(await screen.findByText("No projects found")).toBeTruthy();
  });

  it("shows an error message when the fetch fails", async () => {
    mockedList.mockRejectedValue(new Error("network down"));
    renderList();

    expect(await screen.findByText("network down")).toBeTruthy();
  });
});
