import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { InstitutionForm } from "./InstitutionForm";

describe("InstitutionForm", () => {
  it("blocks submit and shows an error when name is empty", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<InstitutionForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(screen.queryByText("Name is required")).not.toBeNull();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits a cleaned payload with empty optionals omitted", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<InstitutionForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Name"), "  Acme Institute  ");
    await user.type(screen.getByLabelText("City"), "São Paulo");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      name: "Acme Institute",
      city: "São Paulo",
      street: undefined,
      state: undefined,
      postalCode: undefined,
    });
  });

  it("clears the fields after a successful submit by default", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<InstitutionForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Name"), "Acme");
    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() =>
      expect(screen.queryByDisplayValue("Acme")).toBeNull(),
    );
  });

  it("keeps the submitted values when clearOnSubmit is false", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <InstitutionForm
        onSubmit={onSubmit}
        clearOnSubmit={false}
        defaultValues={{ name: "Acme" }}
      />,
    );

    const name = screen.getByLabelText("Name");
    await user.clear(name);
    await user.type(name, "Acme Institute");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.getByDisplayValue("Acme Institute")).toBeTruthy(),
    );
  });

  it("rejects an invalid postal code", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<InstitutionForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Name"), "Acme");
    await user.type(screen.getByLabelText(/postal code/i), "123");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(screen.queryByText(/invalid postal code/i)).not.toBeNull();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
