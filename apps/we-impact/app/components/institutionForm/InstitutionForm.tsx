import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  BRAZILIAN_STATES,
  institutionFormSchema,
  toInstitutionValues,
  type InstitutionFormFields,
  type InstitutionFormValues,
} from "./schema";

export interface InstitutionFormProps {
  /** Called with the cleaned payload once the form validates. */
  onSubmit: (values: InstitutionFormValues) => void | Promise<void>;
  /** Prefill values, e.g. when editing an existing institution. */
  defaultValues?: Partial<InstitutionFormValues>;
  /**
   * After a successful submit, clear the form (create) vs keep the entered
   * values on screen (edit). Defaults to clearing.
   */
  clearOnSubmit?: boolean;
  /**
   * When true, render read-only by default with an Edit button; editing
   * reveals Cancel/Save and enables the fields. Used on the edit page.
   * Defaults to false (always editable — create flow).
   */
  editToggle?: boolean;
}

export function InstitutionForm({
  onSubmit,
  defaultValues,
  clearOnSubmit = true,
  editToggle = false,
}: InstitutionFormProps) {
  const form = useForm<InstitutionFormFields>({
    resolver: zodResolver(institutionFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      street: defaultValues?.street ?? "",
      city: defaultValues?.city ?? "",
      state: defaultValues?.state,
      postalCode: defaultValues?.postalCode ?? "",
    },
  });

  const [isEditing, setIsEditing] = useState(false);
  const editable = !editToggle || isEditing;

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

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <fieldset disabled={!editable} className="min-w-0 space-y-4 border-0 p-0">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Institution name"
                  {...field}
                  name="instituicao"
                  autoComplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="street"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Street</FormLabel>
              <FormControl>
                <Input
                  placeholder="Street"
                  {...field}
                  name="logradouro"
                  autoComplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City</FormLabel>
              <FormControl>
                <Input
                  placeholder="City"
                  {...field}
                  name="municipio"
                  autoComplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="state"
          render={({ field }) => (
            <FormItem>
              <FormLabel>State</FormLabel>
              <Select
                value={field.value || undefined}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a state" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {BRAZILIAN_STATES.map((state) => (
                    <SelectItem key={state.code} value={state.code}>
                      {state.code} — {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="postalCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Postal code</FormLabel>
              <FormControl>
                <Input
                  placeholder="00000-000"
                  {...field}
                  name="cep"
                  autoComplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        </fieldset>

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
      </form>
    </Form>
  );
}
