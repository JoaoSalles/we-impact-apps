import { z } from "zod";

import {
  extraContentSchema,
  rowsToRecord,
} from "@/components/extraContentFields/schema";

export { extraContentToRows } from "@/components/extraContentFields/schema";

/**
 * Validation schema for the raw campaign form fields. Optional inputs are
 * kept as (possibly empty) strings here; empty values are stripped into
 * `undefined` when the form builds its submit payload (see
 * `toCampaignValues`).
 */
export const campaignFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().optional(),
  status: z.boolean().optional(),
  // Dynamic key/value rows, edit flow only. Aggregated into an object map in
  // `toCampaignValues`.
  extraContent: extraContentSchema,
});

/** Shape of the react-hook-form fields (before empty values are stripped). */
export type CampaignFormFields = z.infer<typeof campaignFormSchema>;

/** Cleaned payload handed to `onSubmit`: empty optional fields are omitted. */
export type CampaignFormValues = {
  name: string;
  description?: string;
  status?: boolean;
  extraContent?: Record<string, string>;
};

const emptyToUndefined = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

/** Convert validated form fields into the cleaned submit payload. */
export function toCampaignValues(fields: CampaignFormFields): CampaignFormValues {
  return {
    name: fields.name.trim(),
    description: emptyToUndefined(fields.description),
    status: fields.status,
    extraContent: rowsToRecord(fields.extraContent),
  };
}
