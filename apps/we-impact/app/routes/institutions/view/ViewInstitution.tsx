import { useParams } from "react-router";
import { toast } from "sonner";

import { AddProjectDialog } from "@/components/addProjectDialog/AddProjectDialog";
import { InstitutionForm } from "@/components/institutionForm/InstitutionForm";
import type { InstitutionFormValues } from "@/components/institutionForm/schema";
import { ProjectList } from "@/components/projectList/ProjectList";
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
      <h1 className="text-xl font-semibold">Institution Overview</h1>

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
            editToggle
          />
        </div>
      )}
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Projects:</h1>
          <AddProjectDialog institutionId={id ?? ""} />
        </div>
        <div className="mt-4">
          <ProjectList institutionId={id ?? ""} />
        </div>
      </div>
    </div>
  );
}
