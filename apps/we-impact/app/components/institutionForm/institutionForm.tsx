import { zodResolver } from "@hookform/resolvers/zod";
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
}

export function InstitutionForm({
  onSubmit,
  defaultValues,
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

  const handleSubmit = form.handleSubmit(async (fields) => {
    try {
      await onSubmit(toInstitutionValues(fields));
      form.reset();
    } catch {
      // Failure is surfaced by the caller (e.g. a toast); keep the entered
      // values so the user can fix and resubmit.
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-4">
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

        <Button type="submit" className="float-end max-xs:w-full max-xs:float-none">
          Save
        </Button>
      </form>
    </Form>
  );
}
