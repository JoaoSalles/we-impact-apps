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
import { Textarea } from "@/components/ui/textarea";

import {
  projectFormSchema,
  toProjectValues,
  type ProjectFormFields,
  type ProjectFormValues,
} from "./schema";

export interface ProjectFormProps {
  /** Called with the cleaned payload once the form validates. */
  onSubmit: (values: ProjectFormValues) => void | Promise<void>;
  /** Called when the user cancels (e.g. to close the dialog). */
  onCancel: () => void;
}

export function ProjectForm({ onSubmit, onCancel }: ProjectFormProps) {
  const form = useForm<ProjectFormFields>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: { title: "", goal: "", description: "" },
  });

  const handleSubmit = form.handleSubmit(async (fields) => {
    try {
      await onSubmit(toProjectValues(fields));
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
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Project title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="goal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Goal</FormLabel>
              <FormControl>
                <Input inputMode="numeric" placeholder="0" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 max-xs:flex-col">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="max-xs:w-full"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="max-xs:w-full"
          >
            Save
          </Button>
        </div>
      </form>
    </Form>
  );
}
