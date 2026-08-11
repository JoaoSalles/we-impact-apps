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

import { ExtraContentFields } from "@/components/extraContentFields/ExtraContentFields";
import {
  extraContentToRows,
  supporterFormSchema,
  toSupporterValues,
  type SupporterFormFields,
  type SupporterFormValues,
} from "./schema";

export interface SupporterFormProps {
  /** Called with the cleaned payload once the form validates. */
  onSubmit: (values: SupporterFormValues) => void | Promise<void>;
  /** Prefill values. */
  defaultValues?: Partial<SupporterFormValues>;
  /** After a successful submit, clear the form. Defaults to clearing. */
  clearOnSubmit?: boolean;
}

export function SupporterForm({
  onSubmit,
  defaultValues,
  clearOnSubmit = true,
}: SupporterFormProps) {
  const form = useForm<SupporterFormFields>({
    resolver: zodResolver(supporterFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      document: defaultValues?.document ?? "",
      website: defaultValues?.website ?? "",
      extraContent: extraContentToRows(defaultValues?.extraContent),
    },
  });

  const handleSubmit = form.handleSubmit(async (fields) => {
    try {
      await onSubmit(toSupporterValues(fields));
      form.reset(clearOnSubmit ? undefined : fields);
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
                  placeholder="Supporter name"
                  {...field}
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
          name="document"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Document</FormLabel>
              <FormControl>
                <Input
                  placeholder="CPF/CNPJ"
                  {...field}
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
          name="website"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://example.org"
                  {...field}
                  autoComplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <ExtraContentFields control={form.control} />

        <div className="flex justify-end gap-2 max-xs:flex-col">
          <Button type="submit" className="max-xs:w-full">
            Save
          </Button>
        </div>
      </form>
    </Form>
  );
}
