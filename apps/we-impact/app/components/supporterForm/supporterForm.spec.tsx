import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SupporterForm } from "./SupporterForm";

describe("SupporterForm", () => {
  it("blocks submit and shows an error when name is empty", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SupporterForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(screen.queryByText("Name is required")).not.toBeNull();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits a cleaned payload with empty optionals omitted", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SupporterForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Name"), "  Acme Corp  ");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      name: "Acme Corp",
      document: undefined,
      website: undefined,
      extraContent: undefined,
    });
  });

  it("submits the optional fields when filled", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SupporterForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Name"), "Acme Corp");
    await user.type(screen.getByLabelText(/document/i), "12.345.678/0001-90");
    await user.type(screen.getByLabelText(/website/i), "https://acme.example");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Acme Corp",
        document: "12.345.678/0001-90",
        website: "https://acme.example",
      }),
    );
  });

  it("aggregates added extra-content rows into the payload", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SupporterForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Name"), "Acme Corp");
    await user.click(screen.getByRole("button", { name: /add field/i }));
    await user.type(screen.getAllByPlaceholderText("Field name")[0], "segment");
    await user.type(screen.getAllByPlaceholderText("Value")[0], "logistics");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Acme Corp",
        extraContent: { segment: "logistics" },
      }),
    );
  });

  it("blocks submit on duplicate extra-content row names", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SupporterForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Name"), "Acme Corp");
    await user.click(screen.getByRole("button", { name: /add field/i }));
    await user.click(screen.getByRole("button", { name: /add field/i }));
    const names = screen.getAllByPlaceholderText("Field name");
    await user.type(names[0], "segment");
    await user.type(names[1], "segment");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(screen.queryByText(/duplicate field name/i)).not.toBeNull();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("clears the fields after a successful submit by default", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SupporterForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Name"), "Acme Corp");
    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => expect(screen.queryByDisplayValue("Acme Corp")).toBeNull());
  });

  it("keeps the submitted values when clearOnSubmit is false", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SupporterForm onSubmit={onSubmit} clearOnSubmit={false} />);

    await user.type(screen.getByLabelText("Name"), "Acme Corp");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.getByDisplayValue("Acme Corp")).toBeTruthy());
  });

  it("prefills from defaultValues and is read-only until Edit is clicked", async () => {
    const user = userEvent.setup();
    render(
      <SupporterForm
        onSubmit={vi.fn()}
        defaultValues={{ name: "Acme Corp", document: "12.345.678/0001-90" }}
        editToggle
        clearOnSubmit={false}
      />,
    );

    const name = screen.getByLabelText("Name") as HTMLInputElement;
    const fieldset = name.closest("fieldset") as HTMLFieldSetElement;
    expect(name.value).toBe("Acme Corp");
    expect(fieldset.disabled).toBe(true);
    expect(screen.queryByRole("button", { name: /save/i })).toBeNull();

    await user.click(screen.getByRole("button", { name: /edit/i }));

    expect(fieldset.disabled).toBe(false);
    expect(screen.queryByRole("button", { name: /save/i })).not.toBeNull();
  });

  it("keeps Save disabled until the form is dirty, and Cancel resets it", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <SupporterForm
        onSubmit={onSubmit}
        defaultValues={{ name: "Acme Corp" }}
        editToggle
        clearOnSubmit={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: /edit/i }));
    expect(screen.getByRole("button", { name: /save/i })).toHaveProperty("disabled", true);

    const name = screen.getByLabelText("Name") as HTMLInputElement;
    await user.type(name, "!");
    expect(screen.getByRole("button", { name: /save/i })).toHaveProperty("disabled", false);

    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(name.value).toBe("Acme Corp");
    expect(screen.queryByRole("button", { name: /save/i })).toBeNull();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
