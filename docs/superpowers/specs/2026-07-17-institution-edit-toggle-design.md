# Institution Form — Edit Toggle

## Goal

On the edit institution page, present the form fields in a read-only state by
default and let the user opt into editing. This prevents accidental edits and
makes "view" the default posture for an existing record.

## User-facing behavior

**Read-only (default on the edit page):**

- All form fields are visible but disabled.
- A single **Edit** button is shown. Cancel and Save are hidden.

**Edit mode (after clicking Edit):**

- All fields become enabled.
- The button row shows **Cancel** (outline variant) and **Save**.
- **Save** is disabled until the user actually changes a field (the form is
  dirty). This prevents no-op saves.
- **Cancel** silently discards any unsaved changes (resets the fields to the
  last saved values) and returns to read-only. No confirmation prompt.

**On successful Save:**

- The saved values become the new clean baseline and the form returns to
  read-only (fields disabled, Edit button shown again).

**On failed Save:**

- The form stays in edit mode with the entered values intact so the user can
  fix and retry. Failure is surfaced by the caller's toast (unchanged).

## Scope / constraint

`InstitutionForm` (`app/components/institutionForm/InstitutionForm.tsx`) is
shared between:

- the **create** page (`app/routes/institutions/Institutions.tsx`), and
- the **edit** page (`app/routes/institutions/edit/EditInstitution.tsx`).

The toggle must be opt-in so the create page is completely unchanged (always
editable, immediate Save).

## Design

### New prop

Add `editToggle?: boolean` to `InstitutionFormProps`, defaulting to `false`.

- `false` (create): current behavior. Fields always enabled, Save always
  visible.
- `true` (edit): the read-only/edit toggle behavior described above. The edit
  page passes `editToggle` alongside the existing `clearOnSubmit={false}`.

### State

A local `isEditing` boolean.

- When `editToggle` is `true`, initialize `isEditing` to `false` (start
  read-only).
- When `editToggle` is `false`, the form is always editable — treat as if
  `isEditing` is always `true`.

Define an `editable = !editToggle || isEditing` flag to drive rendering.

### Disabling fields

Wrap the form fields in a native `<fieldset disabled={!editable}>`. The native
`fieldset[disabled]` disables all descendant form controls in one place —
including the Select trigger button — so no per-field `disabled` threading is
needed. The action buttons (Edit / Cancel / Save) live **outside** the fieldset
so they remain clickable while fields are disabled.

### Button row

- `editable === false` → render only the **Edit** button
  (`onClick` sets `isEditing = true`).
- `editable === true` and `editToggle === true` → render **Cancel** + **Save**.
  - Cancel: `form.reset()` (back to current baseline) then `isEditing = false`.
  - Save: `type="submit"`, `disabled={!form.formState.isDirty}`.
- `editToggle === false` (create) → render **Save** only, exactly as today.

### Submit flow

Extend the existing `handleSubmit`:

- On success: keep the existing `form.reset(fields)` baseline behavior for the
  edit path, then, when `editToggle` is on, set `isEditing = false` to return to
  read-only.
- On failure: keep the current catch (do nothing, values preserved). When
  `editToggle` is on, remain in edit mode.

## Testing

Extend `app/components/institutionForm/institutionForm.spec.tsx`.

With `editToggle`:

1. Starts read-only: fields disabled, **Edit** shown, Cancel/Save absent.
2. Clicking **Edit** enables fields and reveals **Cancel** + **Save**.
3. **Save** is disabled until a field is changed (dirty), then enabled.
4. **Cancel** discards edits (fields revert to original values) and returns to
   read-only.
5. Successful **Save** calls `onSubmit` and returns the form to read-only.

Without `editToggle` (regression guard for create):

6. Save button renders immediately and no Edit button is present.
