import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { CampaignForm } from "./CampaignForm";

// Radix Switch measures its thumb via ResizeObserver, which jsdom lacks.
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

describe("CampaignForm", () => {
  it("blocks submit and shows an error when the name is empty", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<CampaignForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(screen.queryByText("Name is required")).not.toBeNull();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits a cleaned payload with empty optionals omitted", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<CampaignForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText("Name"), "  Clean Water  ");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      name: "Clean Water",
      description: undefined,
    });
  });

  it("prefills from defaultValues and is read-only until Edit is clicked", async () => {
    const user = userEvent.setup();
    render(
      <CampaignForm
        onSubmit={vi.fn()}
        defaultValues={{ name: "Clean Water", description: "desc" }}
        editToggle
        clearOnSubmit={false}
      />,
    );

    const name = screen.getByLabelText("Name") as HTMLInputElement;
    const fieldset = name.closest("fieldset") as HTMLFieldSetElement;
    expect(name.value).toBe("Clean Water");
    expect(fieldset.disabled).toBe(true);
    expect(screen.queryByRole("button", { name: /save/i })).toBeNull();

    await user.click(screen.getByRole("button", { name: /edit/i }));

    expect(fieldset.disabled).toBe(false);
    expect(screen.queryByRole("button", { name: /save/i })).not.toBeNull();
  });

  it("submits an updated payload including the toggled status", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <CampaignForm
        onSubmit={onSubmit}
        defaultValues={{ name: "Clean Water", status: true }}
        editToggle
        showStatus
        clearOnSubmit={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: /edit/i }));
    await user.click(screen.getByRole("switch"));
    await user.type(screen.getByLabelText("Name"), "!");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      name: "Clean Water!",
      description: undefined,
      status: false,
    });
  });
});
