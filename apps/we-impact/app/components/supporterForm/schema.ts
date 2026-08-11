import { z } from "zod";

import {
  extraContentSchema,
  extraContentToRows,
  rowsToRecord,
} from "@/components/extraContentFields/schema";

export { extraContentToRows };

/**
 * Validation schema for the raw form fields. Optional inputs are kept as
 * (possibly empty) strings here; empty values are stripped into `undefined`
 * when the form builds its submit payload (see `toSupporterValues`).
 */
export const supporterFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  document: z.string().trim().optional(),
  website: z.string().trim().optional(),
  extraContent: extraContentSchema,
});

/** Shape of the react-hook-form fields (before empty values are stripped). */
export type SupporterFormFields = z.infer<typeof supporterFormSchema>;

/** Cleaned payload handed to `onSubmit`: empty optional fields are omitted. */
export type SupporterFormValues = {
  name: string;
  document?: string;
  website?: string;
  extraContent?: Record<string, string>;
};

const emptyToUndefined = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

/** Convert validated form fields into the cleaned submit payload. */
export function toSupporterValues(fields: SupporterFormFields): SupporterFormValues {
  return {
    name: fields.name.trim(),
    document: emptyToUndefined(fields.document),
    website: emptyToUndefined(fields.website),
    extraContent: rowsToRecord(fields.extraContent),
  };
}
