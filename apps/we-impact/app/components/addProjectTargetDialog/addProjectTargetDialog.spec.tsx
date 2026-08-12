import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AddProjectTargetDialog } from "./AddProjectTargetDialog";
import { searchProjects } from "@/api/institution-api";
import { createCampaignTarget } from "@/api/supporter-api";

vi.mock("@/api/institution-api", () => ({
  searchProjects: vi.fn(),
}));
vi.mock("@/api/supporter-api", () => ({
  createCampaignTarget: vi.fn(),
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

const mockedSearch = vi.mocked(searchProjects);
const mockedCreate = vi.mocked(createCampaignTarget);

function searchResult(overrides = {}) {
  return {
    id: "p1",
    title: "Clean Water",
    goal: 1000,
    description: "desc",
    currentGoal: 250,
    institutionId: "i1",
    institutionName: "Acme",
    institutionState: "SP",
    ...overrides,
  };
}

function page(overrides = {}) {
  return {
    items: [searchResult()],
    pageNumber: 0,
    pageSize: 20,
    hasNext: false,
    ...overrides,
  };
}

function renderDialog() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AddProjectTargetDialog campaignId="c1" />
    </QueryClientProvider>,
  );
}

describe("AddProjectTargetDialog", () => {
  afterEach(() => vi.clearAllMocks());

  it("opens and shows search results when the Add project button is clicked", async () => {
    const user = userEvent.setup();
    mockedSearch.mockResolvedValue(page());
    renderDialog();

    await user.click(screen.getByRole("button", { name: /add project/i }));

    expect(await screen.findByText("Clean Water")).toBeTruthy();
    expect(screen.getByText("Acme (SP)")).toBeTruthy();
  });

  it("typing in the title filter triggers a filtered search", async () => {
    const user = userEvent.setup();
    mockedSearch.mockResolvedValue(page());
    renderDialog();

    await user.click(screen.getByRole("button", { name: /add project/i }));
    await screen.findByText("Clean Water");
    await user.type(screen.getByLabelText(/title/i), "Wat");

    await waitFor(() =>
      expect(mockedSearch).toHaveBeenLastCalledWith(
        expect.objectContaining({ title: "Wat", pageNumber: 0 }),
      ),
    );
  });

  it("associates the project, closes the dialog, and shows a success toast", async () => {
    const user = userEvent.setup();
    mockedSearch.mockResolvedValue(page());
    mockedCreate.mockResolvedValue(undefined);
    renderDialog();

    await user.click(screen.getByRole("button", { name: /add project/i }));
    await screen.findByText("Clean Water");
    await user.click(screen.getByRole("button", { name: /associate/i }));

    await waitFor(() => expect(mockedCreate).toHaveBeenCalledWith("c1", "p1"));
    await waitFor(() => expect(screen.queryByText("Clean Water")).toBeNull());
    expect(toastSuccess).toHaveBeenCalledWith("Project associated");
  });

  it("keeps the dialog open and shows an error toast when association fails", async () => {
    const user = userEvent.setup();
    mockedSearch.mockResolvedValue(page());
    mockedCreate.mockRejectedValue(new Error("boom"));
    renderDialog();

    await user.click(screen.getByRole("button", { name: /add project/i }));
    await screen.findByText("Clean Water");
    await user.click(screen.getByRole("button", { name: /associate/i }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith("boom"));
    expect(screen.getByText("Clean Water")).toBeTruthy();
  });
});
