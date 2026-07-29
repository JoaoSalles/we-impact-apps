import { z } from "zod";

/** A single editable extra-content row in a form. */
export type ExtraContentRow = { name: string; value: string };

/**
 * Reusable schema fragment for a form's dynamic key/value rows. Names are
 * required and must be unique (an object map can't hold duplicate keys); values
 * may be empty. Rows are aggregated into an object map by `rowsToRecord`.
 */
export const extraContentSchema = z
  .array(z.object({ name: z.string(), value: z.string() }))
  .superRefine((rows, ctx) => {
    const seen = new Set<string>();
    rows.forEach((row, index) => {
      const name = row.name.trim();
      if (!name) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Name is required",
          path: [index, "name"],
        });
        return;
      }
      if (seen.has(name)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Duplicate field name",
          path: [index, "name"],
        });
        return;
      }
      seen.add(name);
    });
  });

/**
 * Aggregate editable rows into an object map, dropping rows with an empty name.
 * Returns `undefined` when nothing remains so the field is omitted from the
 * payload. Names are validated (required + unique) by `extraContentSchema`.
 */
export const rowsToRecord = (
  rows: ExtraContentRow[] | undefined,
): Record<string, string> | undefined => {
  const entries = (rows ?? [])
    .map((row) => [row.name.trim(), row.value] as const)
    .filter(([name]) => name.length > 0);
  return entries.length ? Object.fromEntries(entries) : undefined;
};

/** Expand a stored object map back into editable rows for form defaults. */
export function extraContentToRows(
  extra: Record<string, string> | undefined,
): ExtraContentRow[] {
  return extra
    ? Object.entries(extra).map(([name, value]) => ({
        name,
        value: value == null ? "" : String(value),
      }))
    : [];
}
