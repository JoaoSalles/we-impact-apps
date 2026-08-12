import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ConfirmDialog } from "./ConfirmDialog";

describe("ConfirmDialog", () => {
  it("opens on trigger click and shows the title and description", async () => {
    const user = userEvent.setup();
    render(
      <ConfirmDialog
        trigger={<button>Remove</button>}
        title="Remove project"
        description="Remove this project from the campaign?"
        onConfirm={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Remove" }));

    expect(screen.getByText("Remove project")).toBeTruthy();
    expect(
      screen.getByText("Remove this project from the campaign?"),
    ).toBeTruthy();
  });

  it("closes without calling onConfirm when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        trigger={<button>Remove</button>}
        title="Remove project"
        onConfirm={onConfirm}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Remove" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onConfirm).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByText("Remove project")).toBeNull());
  });

  it("calls onConfirm and closes the dialog on success", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(
      <ConfirmDialog
        trigger={<button>Remove</button>}
        title="Remove project"
        onConfirm={onConfirm}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Remove" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByText("Remove project")).toBeNull());
  });

  it("keeps the dialog open when onConfirm rejects", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockRejectedValue(new Error("boom"));
    render(
      <ConfirmDialog
        trigger={<button>Remove</button>}
        title="Remove project"
        onConfirm={onConfirm}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Remove" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalled());
    expect(screen.getByText("Remove project")).toBeTruthy();
  });
});
