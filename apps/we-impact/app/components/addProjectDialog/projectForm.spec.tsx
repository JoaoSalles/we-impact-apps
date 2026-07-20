import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ProjectForm } from "./ProjectForm";

describe("ProjectForm", () => {
  it("blocks submit and shows an error when the title is empty", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ProjectForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(screen.queryByText("Title is required")).not.toBeNull();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects a non-numeric goal", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ProjectForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText("Title"), "Clean Water");
    await user.type(screen.getByLabelText("Goal"), "abc");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(screen.queryByText(/whole number/i)).not.toBeNull();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits a cleaned payload with goal as a number and empty optionals omitted", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ProjectForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText("Title"), "  Clean Water  ");
    await user.type(screen.getByLabelText("Goal"), "1000");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      title: "Clean Water",
      goal: 1000,
      description: undefined,
    });
  });

  it("calls onCancel when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<ProjectForm onSubmit={vi.fn()} onCancel={onCancel} />);

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
