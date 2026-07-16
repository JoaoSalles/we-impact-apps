import { toast } from "sonner";

import { createInstitution } from "@/api/institution-api";
import type { InstitutionFormValues } from "@/components/institutionForm/schema";

export function useInstitutions() {
  async function handleCreateInstitution(values: InstitutionFormValues) {
    try {
      await createInstitution(values);
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
