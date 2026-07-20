import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { ProjectForm } from "./ProjectForm";
import type { ProjectFormValues } from "./schema";
import { useCreateProject } from "./useCreateProject";

export function AddProjectDialog({ institutionId }: { institutionId: string }) {
  const [open, setOpen] = useState(false);
  const create = useCreateProject(institutionId);

  const handleSubmit = async (values: ProjectFormValues) => {
    try {
      await create.mutateAsync(values);
      toast.success("Project created");
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create project",
      );
      // Re-throw so the form keeps the entered values for correction.
      throw error;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Add project</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add project</DialogTitle>
        </DialogHeader>
        <ProjectForm onSubmit={handleSubmit} onCancel={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
