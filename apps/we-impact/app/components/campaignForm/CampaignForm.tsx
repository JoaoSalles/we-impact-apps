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
import { ExtraContentFields } from "@/components/extraContentFields/ExtraContentFields";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import {
  campaignFormSchema,
  toCampaignValues,
  type CampaignFormFields,
  type CampaignFormValues,
} from "./schema";

export interface CampaignFormProps {
  /** Called with the cleaned payload once the form validates. */
  onSubmit: (values: CampaignFormValues) => void | Promise<void>;
  /** Called when the user cancels (e.g. to close the dialog). Optional. */
  onCancel?: () => void;
  /** Prefill values, e.g. when editing an existing campaign. */
  defaultValues?: Partial<CampaignFormFields>;
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
  /** When true, render the Status switch. */
  showStatus?: boolean;
  /** When true, render the dynamic "Extra fields" section (edit flow only). */
  showExtraContent?: boolean;
}

export function CampaignForm({
  onSubmit,
  onCancel,
  defaultValues,
  clearOnSubmit = true,
  editToggle = false,
  showStatus = false,
  showExtraContent = false,
}: CampaignFormProps) {
  const form = useForm<CampaignFormFields>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      description: defaultValues?.description ?? "",
      status: defaultValues?.status,
      extraContent: defaultValues?.extraContent ?? [],
    },
  });

  const [isEditing, setIsEditing] = useState(false);
  const editable = !editToggle || isEditing;

  const handleSubmit = form.handleSubmit(async (fields) => {
    try {
      await onSubmit(toCampaignValues(fields));
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
                  <Input placeholder="Campaign name" {...field} />
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
          )}

          {showExtraContent && <ExtraContentFields control={form.control} />}
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
