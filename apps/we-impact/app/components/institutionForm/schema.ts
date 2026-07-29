import { z } from "zod";

import {
  extraContentSchema,
  extraContentToRows,
  rowsToRecord,
} from "@/components/extraContentFields/schema";

export { extraContentToRows };

/** Brazilian postal code (CEP), e.g. 01310-100 or 01310100. */
const CEP_REGEX = /^\d{5}-?\d{3}$/;

/**
 * The 27 Brazilian federative units. `code` is the UF stored as the field
 * value; `name` is the human-readable label shown in the select.
 */
export const BRAZILIAN_STATES = [
  { code: "AC", name: "Acre" },
  { code: "AL", name: "Alagoas" },
  { code: "AP", name: "Amapá" },
  { code: "AM", name: "Amazonas" },
  { code: "BA", name: "Bahia" },
  { code: "CE", name: "Ceará" },
  { code: "DF", name: "Distrito Federal" },
  { code: "ES", name: "Espírito Santo" },
  { code: "GO", name: "Goiás" },
  { code: "MA", name: "Maranhão" },
  { code: "MT", name: "Mato Grosso" },
  { code: "MS", name: "Mato Grosso do Sul" },
  { code: "MG", name: "Minas Gerais" },
  { code: "PA", name: "Pará" },
  { code: "PB", name: "Paraíba" },
  { code: "PR", name: "Paraná" },
  { code: "PE", name: "Pernambuco" },
  { code: "PI", name: "Piauí" },
  { code: "RJ", name: "Rio de Janeiro" },
  { code: "RN", name: "Rio Grande do Norte" },
  { code: "RS", name: "Rio Grande do Sul" },
  { code: "RO", name: "Rondônia" },
  { code: "RR", name: "Roraima" },
  { code: "SC", name: "Santa Catarina" },
  { code: "SP", name: "São Paulo" },
  { code: "SE", name: "Sergipe" },
  { code: "TO", name: "Tocantins" },
] as const;

/**
 * Validation schema for the raw form fields. Optional inputs are kept as
 * (possibly empty) strings here; empty values are stripped into `undefined`
 * when the form builds its submit payload (see `toInstitutionValues`).
 */
export const institutionFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  street: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().optional(),
  postalCode: z
    .string()
    .trim()
    .refine((value) => value.length === 0 || CEP_REGEX.test(value), {
      message: "Invalid postal code (use 00000-000)",
    })
    .optional(),
  description: z.string().trim().optional(),
  numBeneficiary: z
    .string()
    .trim()
    .refine((value) => value.length === 0 || /^\d+$/.test(value), {
      message: "Must be a whole number",
    })
    .optional(),
  website: z.string().trim().optional(),
  // Dynamic key/value rows. Edited as an array here (react-hook-form field
  // array) and aggregated into an object map in `toInstitutionValues`.
  extraContent: extraContentSchema,
});

/** Shape of the react-hook-form fields (before empty values are stripped). */
export type InstitutionFormFields = z.infer<typeof institutionFormSchema>;

/** Cleaned payload handed to `onSubmit`: empty optional fields are omitted. */
export type InstitutionFormValues = {
  name: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  description?: string;
  numBeneficiary?: number;
  website?: string;
  extraContent?: Record<string, string>;
};

const emptyToUndefined = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const emptyToUndefinedNumber = (
  value: string | undefined,
): number | undefined => {
  const trimmed = value?.trim();
  return trimmed ? Number(trimmed) : undefined;
};

/** Convert validated form fields into the cleaned submit payload. */
export function toInstitutionValues(
  fields: InstitutionFormFields,
): InstitutionFormValues {
  return {
    name: fields.name.trim(),
    street: emptyToUndefined(fields.street),
    city: emptyToUndefined(fields.city),
    state: emptyToUndefined(fields.state),
    postalCode: emptyToUndefined(fields.postalCode),
    description: emptyToUndefined(fields.description),
    numBeneficiary: emptyToUndefinedNumber(fields.numBeneficiary),
    website: emptyToUndefined(fields.website),
    extraContent: rowsToRecord(fields.extraContent),
  };
}
