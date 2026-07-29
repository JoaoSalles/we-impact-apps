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
      description: undefined,
      numBeneficiary: undefined,
      website: undefined,
      extraContent: undefined,
    });
  });

  describe("extra fields", () => {
    it("aggregates added rows into the extraContent object", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<InstitutionForm onSubmit={onSubmit} />);

      await user.type(screen.getByLabelText("Name"), "Acme");
      await user.click(screen.getByRole("button", { name: /add field/i }));

      await user.type(screen.getAllByPlaceholderText("Field name")[0], "cnpj");
      await user.type(
        screen.getAllByPlaceholderText("Value")[0],
        "12.345.678/0001-90",
      );
      await user.click(screen.getByRole("button", { name: /save/i }));

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Acme",
          extraContent: { cnpj: "12.345.678/0001-90" },
        }),
      );
    });

    it("blocks submit when a row name is empty", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<InstitutionForm onSubmit={onSubmit} />);

      await user.type(screen.getByLabelText("Name"), "Acme");
      await user.click(screen.getByRole("button", { name: /add field/i }));
      await user.type(screen.getAllByPlaceholderText("Value")[0], "some value");
      await user.click(screen.getByRole("button", { name: /save/i }));

      expect(screen.queryByText("Name is required")).not.toBeNull();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("blocks submit on duplicate row names", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<InstitutionForm onSubmit={onSubmit} />);

      await user.type(screen.getByLabelText("Name"), "Acme");
      await user.click(screen.getByRole("button", { name: /add field/i }));
      await user.click(screen.getByRole("button", { name: /add field/i }));

      const names = screen.getAllByPlaceholderText("Field name");
      await user.type(names[0], "cnpj");
      await user.type(names[1], "cnpj");
      await user.click(screen.getByRole("button", { name: /save/i }));

      expect(screen.queryByText(/duplicate field name/i)).not.toBeNull();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("removes a row when its remove button is clicked", async () => {
      const user = userEvent.setup();
      render(<InstitutionForm onSubmit={vi.fn()} />);

      await user.click(screen.getByRole("button", { name: /add field/i }));
      expect(screen.getAllByPlaceholderText("Field name")).toHaveLength(1);

      await user.click(screen.getByRole("button", { name: /remove field/i }));
      expect(screen.queryByPlaceholderText("Field name")).toBeNull();
    });

    it("prefills rows from an existing extraContent object", () => {
      render(
        <InstitutionForm
          onSubmit={vi.fn()}
          defaultValues={{
            name: "Acme",
            extraContent: { cnpj: "123", foundedYear: "1998" },
          }}
        />,
      );

      expect(screen.getByDisplayValue("cnpj")).toBeTruthy();
      expect(screen.getByDisplayValue("123")).toBeTruthy();
      expect(screen.getByDisplayValue("foundedYear")).toBeTruthy();
      expect(screen.getByDisplayValue("1998")).toBeTruthy();
    });
  });

  it("submits the new optional fields when filled", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<InstitutionForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Name"), "Acme Institute");
    await user.type(
      screen.getByLabelText(/number of beneficiaries/i),
      "120",
    );
    await user.type(
      screen.getByLabelText(/website/i),
      "https://acme.org",
    );
    await user.type(
      screen.getByLabelText(/description/i),
      "A helpful institution",
    );
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Acme Institute",
        numBeneficiary: 120,
        website: "https://acme.org",
        description: "A helpful institution",
      }),
    );
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

  describe("editToggle", () => {
    it("starts read-only with only an Edit button", () => {
      render(
        <InstitutionForm
          onSubmit={vi.fn()}
          editToggle
          clearOnSubmit={false}
          defaultValues={{ name: "Acme" }}
        />,
      );

      expect(screen.getByRole("button", { name: /edit/i })).toBeTruthy();
      expect(screen.queryByRole("button", { name: /save/i })).toBeNull();
      expect(screen.queryByRole("button", { name: /cancel/i })).toBeNull();
      expect(screen.getByLabelText("Name").matches(":disabled")).toBe(true);
    });

    it("enables fields and shows Cancel/Save when Edit is clicked", async () => {
      const user = userEvent.setup();
      render(
        <InstitutionForm
          onSubmit={vi.fn()}
          editToggle
          clearOnSubmit={false}
          defaultValues={{ name: "Acme" }}
        />,
      );

      await user.click(screen.getByRole("button", { name: /edit/i }));

      expect(screen.getByLabelText("Name").matches(":disabled")).toBe(false);
      expect(screen.getByRole("button", { name: /cancel/i })).toBeTruthy();
      expect(screen.getByRole("button", { name: /save/i })).toBeTruthy();
      expect(screen.queryByRole("button", { name: /edit/i })).toBeNull();
    });

    it("keeps Save disabled until a field changes", async () => {
      const user = userEvent.setup();
      render(
        <InstitutionForm
          onSubmit={vi.fn()}
          editToggle
          clearOnSubmit={false}
          defaultValues={{ name: "Acme" }}
        />,
      );

      await user.click(screen.getByRole("button", { name: /edit/i }));
      expect(
        (screen.getByRole("button", { name: /save/i }) as HTMLButtonElement)
          .disabled,
      ).toBe(true);

      await user.type(screen.getByLabelText("Name"), " Institute");
      expect(
        (screen.getByRole("button", { name: /save/i }) as HTMLButtonElement)
          .disabled,
      ).toBe(false);
    });

    it("discards edits and returns to read-only on Cancel", async () => {
      const user = userEvent.setup();
      render(
        <InstitutionForm
          onSubmit={vi.fn()}
          editToggle
          clearOnSubmit={false}
          defaultValues={{ name: "Acme" }}
        />,
      );

      await user.click(screen.getByRole("button", { name: /edit/i }));
      await user.type(screen.getByLabelText("Name"), " Institute");
      await user.click(screen.getByRole("button", { name: /cancel/i }));

      expect(screen.getByDisplayValue("Acme")).toBeTruthy();
      expect(screen.queryByDisplayValue("Acme Institute")).toBeNull();
      expect(screen.getByRole("button", { name: /edit/i })).toBeTruthy();
    });

    it("returns to read-only after a successful save", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(
        <InstitutionForm
          onSubmit={onSubmit}
          editToggle
          clearOnSubmit={false}
          defaultValues={{ name: "Acme" }}
        />,
      );

      await user.click(screen.getByRole("button", { name: /edit/i }));
      await user.type(screen.getByLabelText("Name"), " Institute");
      await user.click(screen.getByRole("button", { name: /save/i }));

      await waitFor(() =>
        expect(screen.getByRole("button", { name: /edit/i })).toBeTruthy(),
      );
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole("button", { name: /save/i })).toBeNull();
    });
  });
});
