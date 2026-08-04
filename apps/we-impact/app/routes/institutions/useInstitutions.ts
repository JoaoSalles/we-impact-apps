import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createInstitution } from "@/api/institution-api";
import type { InstitutionFormValues } from "@/components/institutionForm/schema";

export function useInstitutions() {
  const queryClient = useQueryClient();

  async function handleCreateInstitution(values: InstitutionFormValues) {
    try {
      await createInstitution(values);
      await queryClient.invalidateQueries({ queryKey: ["institutions"] });
      toast.success("Institution created");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create institution",
      );
      throw error;
    }
  }

  return { handleCreateInstitution };
}
