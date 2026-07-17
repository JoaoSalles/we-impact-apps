import { useParams } from "react-router";
import { toast } from "sonner";

import { InstitutionForm } from "@/components/institutionForm/InstitutionForm";
import type { InstitutionFormValues } from "@/components/institutionForm/schema";
import { useEditInstitution, useUpdateInstitution } from "./useEditInstitution";

export default function EditInstitutionComponent() {
  const { id } = useParams();
  const { data, isPending, error } = useEditInstitution(id ?? "");
  const update = useUpdateInstitution(id ?? "");

  const handleSubmit = async (values: InstitutionFormValues) => {
    try {
      await update.mutateAsync(values);
      toast.success("Institution updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update institution",
      );
      throw error;
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold">Edit institution</h1>

      {isPending && (
        <p className="mt-2 text-sm text-muted-foreground">Loading…</p>
      )}

      {error && (
        <p className="mt-2 text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load institution"}
        </p>
      )}

      {data && (
        <div className="mt-4">
          <InstitutionForm
            defaultValues={data}
            onSubmit={handleSubmit}
            clearOnSubmit={false}
          />
        </div>
      )}
    </div>
  );
}
