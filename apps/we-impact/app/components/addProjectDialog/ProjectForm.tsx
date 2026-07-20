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
import { Switch } from "@/components/ui/switch";
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
  /** Called when the user cancels (e.g. to close the dialog). Optional. */
  onCancel?: () => void;
  /** Prefill values, e.g. when editing an existing project. */
  defaultValues?: Partial<ProjectFormFields>;
  /**
   * After a successful submit, clear the form (create) vs keep the entered
   * values on screen (edit). Defaults to clearing.
   */
  clearOnSubmit?: boolean;
  /**
   * When true, render read-only by default with an Edit button; editing
   * reveals Cancel/Save and enables the fields. Used on the view page.
   * Defaults to false (always editable — create flow).
   */
  editToggle?: boolean;
  /** When true, render the Status switch and the read-only current goal. */
  showStatus?: boolean;
  /** Read-only raised amount shown alongside the status switch. */
  currentGoal?: number;
}

export function ProjectForm({
  onSubmit,
  onCancel,
  defaultValues,
  clearOnSubmit = true,
  editToggle = false,
  showStatus = false,
  currentGoal,
}: ProjectFormProps) {
  const form = useForm<ProjectFormFields>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      goal: defaultValues?.goal ?? "",
      description: defaultValues?.description ?? "",
      status: defaultValues?.status,
    },
  });

  const [isEditing, setIsEditing] = useState(false);
  const editable = !editToggle || isEditing;

  const handleSubmit = form.handleSubmit(async (fields) => {
    try {
      await onSubmit(toProjectValues(fields));
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

          {showStatus && (
            <>
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <Switch
                        checked={Boolean(field.value)}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Current goal</p>
                <p className="text-sm text-muted-foreground">
                  {(currentGoal ?? 0).toLocaleString()}
                </p>
              </div>
            </>
          )}
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
              {(editToggle || onCancel) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (editToggle) {
                      form.reset();
                      setIsEditing(false);
                    } else {
                      onCancel?.();
                    }
                  }}
                  className="max-xs:w-full"
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={
                  form.formState.isSubmitting ||
                  (editToggle && !form.formState.isDirty)
                }
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
