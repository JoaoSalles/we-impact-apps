# Institution Form Edit Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an opt-in read-only/edit toggle to `InstitutionForm` so the edit page shows fields disabled by default with an Edit button, revealing Cancel/Save when editing.

**Architecture:** Add an `editToggle` prop to the shared `InstitutionForm`. When on, a local `isEditing` state gates a native `<fieldset disabled>` around the fields and swaps the button row between an Edit button (read-only) and Cancel/Save (editing). Successful save returns to read-only. The create page omits the prop and is unchanged.

**Tech Stack:** React 19, react-hook-form, zod, shadcn/ui (Button, Input, Select, Form), Vitest + Testing Library.

## Global Constraints

- Test runner: `pnpm exec nx test we-impact` (single run; watch is off). Single file: `pnpm exec nx test we-impact -- app/components/institutionForm/institutionForm.spec.tsx`.
- The create page (`app/routes/institutions/Institutions.tsx`) must remain functionally unchanged: Save visible immediately, no Edit button.
- Follow existing form patterns in `InstitutionForm.tsx` (shadcn components, `form.reset` baseline behavior).
- Save button label is "Save"; new buttons are labelled "Edit" and "Cancel".

---

### Task 1: Add `editToggle` behavior to InstitutionForm

**Files:**
- Modify: `apps/we-impact/app/components/institutionForm/InstitutionForm.tsx`
- Test: `apps/we-impact/app/components/institutionForm/institutionForm.spec.tsx`

**Interfaces:**
- Consumes: existing `InstitutionFormProps` (`onSubmit`, `defaultValues`, `clearOnSubmit`).
- Produces: `InstitutionFormProps` gains `editToggle?: boolean` (default `false`). When `true`, form starts read-only.

- [ ] **Step 1: Write the failing tests**

Add these tests to `apps/we-impact/app/components/institutionForm/institutionForm.spec.tsx` inside the existing `describe("InstitutionForm", ...)` block:

```tsx
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
    expect((screen.getByLabelText("Name") as HTMLInputElement).disabled).toBe(
      true,
    );
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

    expect((screen.getByLabelText("Name") as HTMLInputElement).disabled).toBe(
      false,
    );
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm exec nx test we-impact -- app/components/institutionForm/institutionForm.spec.tsx`
Expected: FAIL — no Edit button found (`editToggle` not implemented), fields not disabled.

- [ ] **Step 3: Implement `editToggle` in InstitutionForm**

In `apps/we-impact/app/components/institutionForm/InstitutionForm.tsx`:

Add the `useState` import at the top:

```tsx
import { useState } from "react";
```

Extend the props interface (after `clearOnSubmit`):

```tsx
  /**
   * When true, render read-only by default with an Edit button; editing
   * reveals Cancel/Save and enables the fields. Used on the edit page.
   * Defaults to false (always editable — create flow).
   */
  editToggle?: boolean;
```

Update the destructured signature:

```tsx
export function InstitutionForm({
  onSubmit,
  defaultValues,
  clearOnSubmit = true,
  editToggle = false,
}: InstitutionFormProps) {
```

Add editing state and an `editable` flag right after `useForm(...)`:

```tsx
  const [isEditing, setIsEditing] = useState(false);
  const editable = !editToggle || isEditing;
```

Update `handleSubmit` so a successful save returns to read-only when toggling:

```tsx
  const handleSubmit = form.handleSubmit(async (fields) => {
    try {
      await onSubmit(toInstitutionValues(fields));
      // Clearing resets to the (empty) defaults; otherwise keep the just-saved
      // values on screen and mark them as the new clean baseline.
      form.reset(clearOnSubmit ? undefined : fields);
      if (editToggle) setIsEditing(false);
    } catch {
      // Failure is surfaced by the caller (e.g. a toast); keep the entered
      // values so the user can fix and resubmit.
    }
  });
```

Wrap the five `FormField` blocks in a disabled-aware `<fieldset>`. Change the opening of the fields region — replace the first `<FormField` with a `<fieldset>` wrapper, and close it before the button row. The fieldset needs `min-w-0 space-y-4` so it does not add default styling/width:

```tsx
        <fieldset disabled={!editable} className="min-w-0 space-y-4 border-0 p-0">
          {/* existing five FormField blocks unchanged */}
        </fieldset>
```

Replace the single Save button at the bottom with the conditional button row:

```tsx
        <div className="flex justify-end gap-2 max-xs:flex-col">
          {editToggle && !isEditing ? (
            <Button
              type="button"
              onClick={() => setIsEditing(true)}
              className="max-xs:w-full"
            >
              Edit
            </Button>
          ) : (
            <>
              {editToggle && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.reset();
                    setIsEditing(false);
                  }}
                  className="max-xs:w-full"
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={editToggle && !form.formState.isDirty}
                className="max-xs:w-full"
              >
                Save
              </Button>
            </>
          )}
        </div>
```

Note: the original Save button used `float-end`; the new flex row replaces that layout. Ensure the `<form>` keeps `className="space-y-4"`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm exec nx test we-impact -- app/components/institutionForm/institutionForm.spec.tsx`
Expected: PASS — all existing tests plus the five new `editToggle` tests pass.

- [ ] **Step 5: Typecheck and lint**

Run: `pnpm exec nx typecheck we-impact && pnpm exec nx lint we-impact`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add apps/we-impact/app/components/institutionForm/InstitutionForm.tsx apps/we-impact/app/components/institutionForm/institutionForm.spec.tsx
git commit -m "feat: add read-only edit toggle to institution form"
```

---

### Task 2: Enable the toggle on the edit page

**Files:**
- Modify: `apps/we-impact/app/routes/institutions/edit/EditInstitution.tsx:41-45`

**Interfaces:**
- Consumes: `editToggle` prop from Task 1.
- Produces: nothing new; edit page now renders the toggle behavior.

- [ ] **Step 1: Pass `editToggle` to the form**

In `apps/we-impact/app/routes/institutions/edit/EditInstitution.tsx`, update the `InstitutionForm` usage:

```tsx
          <InstitutionForm
            defaultValues={data}
            onSubmit={handleSubmit}
            clearOnSubmit={false}
            editToggle
          />
```

- [ ] **Step 2: Verify the edit page manually**

Run the host (`pnpm exec nx dev we-impact`), open an institution's edit page. Confirm: fields load disabled, only an **Edit** button shows; clicking **Edit** enables fields and shows **Cancel** + **Save** (Save disabled until a change); **Cancel** reverts and returns to read-only; a successful **Save** shows the toast and returns to read-only.

- [ ] **Step 3: Typecheck**

Run: `pnpm exec nx typecheck we-impact`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/we-impact/app/routes/institutions/edit/EditInstitution.tsx
git commit -m "feat: enable edit toggle on institution edit page"
```
