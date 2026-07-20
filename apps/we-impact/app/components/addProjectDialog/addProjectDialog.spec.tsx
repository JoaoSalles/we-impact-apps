import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AddProjectDialog } from "./AddProjectDialog";
import { createProject } from "@/api/institution-api";

vi.mock("@/api/institution-api", () => ({
  createProject: vi.fn(),
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

const mockedCreate = vi.mocked(createProject);

function renderDialog() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AddProjectDialog institutionId="i1" />
    </QueryClientProvider>,
  );
}

describe("AddProjectDialog", () => {
  afterEach(() => vi.clearAllMocks());

  it("opens the form when the Add project button is clicked", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: /add project/i }));

    expect(screen.getByLabelText("Title")).toBeTruthy();
  });

  it("creates the project, closes the dialog, and shows a success toast", async () => {
    const user = userEvent.setup();
    mockedCreate.mockResolvedValue(undefined);
    renderDialog();

    await user.click(screen.getByRole("button", { name: /add project/i }));
    await user.type(screen.getByLabelText("Title"), "Clean Water");
    await user.type(screen.getByLabelText("Goal"), "1000");
    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() =>
      expect(mockedCreate).toHaveBeenCalledWith("i1", {
        title: "Clean Water",
        goal: 1000,
        description: undefined,
      }),
    );
    await waitFor(() =>
      expect(screen.queryByLabelText("Title")).toBeNull(),
    );
    expect(toastSuccess).toHaveBeenCalledWith("Project created");
  });

  it("keeps the dialog open and shows an error toast when creation fails", async () => {
    const user = userEvent.setup();
    mockedCreate.mockRejectedValue(new Error("boom"));
    renderDialog();

    await user.click(screen.getByRole("button", { name: /add project/i }));
    await user.type(screen.getByLabelText("Title"), "Clean Water");
    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith("boom"));
    expect(screen.getByLabelText("Title")).toBeTruthy();
  });
});
