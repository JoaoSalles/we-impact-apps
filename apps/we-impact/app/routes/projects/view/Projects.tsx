import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";

import { ProjectForm } from "@/components/addProjectDialog/ProjectForm";
import type { ProjectFormValues } from "@/components/addProjectDialog/schema";
import { Button } from "@/components/ui/button";
import { useProject, useUpdateProject } from "./useEditProject";

export default function ProjectView() {
  const { institutionID, projectID } = useParams();
  const { data, isPending, error } = useProject(
    institutionID ?? "",
    projectID ?? "",
  );
  const update = useUpdateProject(institutionID ?? "", projectID ?? "");

  const handleSubmit = async (values: ProjectFormValues) => {
    try {
      await update.mutateAsync(values);
      toast.success("Project updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update project",
      );
      throw error;
    }
  };

  return (
    <div className="p-4">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link to={`/institutions/${institutionID}`}>
          <ArrowLeft />
          Back to institution
        </Link>
      </Button>

      <h1 className="text-xl font-semibold">Project Overview</h1>

      {isPending && (
        <p className="mt-2 text-sm text-muted-foreground">Loading…</p>
      )}

      {error && (
        <p className="mt-2 text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load project"}
        </p>
      )}

      {data && (
        <div className="mt-4">
          <ProjectForm
            defaultValues={{
              title: data.title,
              goal: data.goal == null ? "" : String(data.goal),
              description: data.description ?? "",
              status: data.status,
            }}
            currentGoal={data.currentGoal}
            onSubmit={handleSubmit}
            clearOnSubmit={false}
            editToggle
            showStatus
          />
        </div>
      )}
    </div>
  );
}
