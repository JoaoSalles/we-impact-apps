import { Plus, X } from "lucide-react";
import {
  type ArrayPath,
  type Control,
  type FieldArray,
  type FieldValues,
  type Path,
  useFieldArray,
} from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface ExtraContentFieldsProps<T extends FieldValues> {
  control: Control<T>;
  /** The array field name on the form. Defaults to "extraContent". */
  name?: ArrayPath<T>;
}

/**
 * Editable list of dynamic key/value rows bound to a form's `extraContent`
 * field array. The rows are aggregated into an object map on submit (see
 * `rowsToRecord`). Meant to be rendered inside a form's disabled fieldset, so
 * the inputs and buttons follow the same read-only/edit toggle as the rest.
 */
export function ExtraContentFields<T extends FieldValues>({
  control,
  name = "extraContent" as ArrayPath<T>,
}: ExtraContentFieldsProps<T>) {
  const { fields, append, remove } = useFieldArray({ control, name });

  return (
    <div className="space-y-3">
      <FormLabel>Extra fields</FormLabel>

      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground">No extra fields yet.</p>
      )}

      {fields.map((row, index) => (
        <div key={row.id} className="flex items-start gap-2">
          <FormField
            control={control}
            name={`${name}.${index}.name` as Path<T>}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input placeholder="Field name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`${name}.${index}.value` as Path<T>}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input placeholder="Value" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Remove field"
            onClick={() => remove(index)}
          >
            <X />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          append({ name: "", value: "" } as FieldArray<T, ArrayPath<T>>)
        }
      >
        <Plus />
        Add field
      </Button>
    </div>
  );
}
