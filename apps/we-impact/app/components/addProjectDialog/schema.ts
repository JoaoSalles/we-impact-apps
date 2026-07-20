import { z } from "zod";

/**
 * Validation schema for the raw project form fields. `goal` stays a (possibly
 * empty) string here; it's parsed to a number and empty optionals are stripped
 * when the form builds its submit payload (see `toProjectValues`).
 */
export const projectFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  goal: z
    .string()
    .trim()
    .refine((value) => value.length === 0 || /^\d+$/.test(value), {
      message: "Goal must be a whole number",
    })
    .optional(),
  description: z.string().trim().optional(),
  status: z.boolean().optional(),
});

/** Shape of the react-hook-form fields (before empty values are stripped). */
export type ProjectFormFields = z.infer<typeof projectFormSchema>;

/** Cleaned payload handed to `onSubmit`: goal parsed, empty optionals omitted. */
export type ProjectFormValues = {
  title: string;
  goal?: number;
  description?: string;
  status?: boolean;
};

const emptyToUndefined = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

/** Convert validated form fields into the cleaned submit payload. */
export function toProjectValues(fields: ProjectFormFields): ProjectFormValues {
  const goal = emptyToUndefined(fields.goal);
  return {
    title: fields.title.trim(),
    goal: goal ? Number(goal) : undefined,
    description: emptyToUndefined(fields.description),
    status: fields.status,
  };
}
