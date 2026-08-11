import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createSupporter } from "@/api/supporter-api";
import type { SupporterFormValues } from "@/components/supporterForm/schema";

export function useSupporters() {
  const queryClient = useQueryClient();

  async function handleCreateSupporter(values: SupporterFormValues) {
    try {
      await createSupporter(values);
      await queryClient.invalidateQueries({ queryKey: ["supporters"] });
      toast.success("Supporter created");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create supporter",
      );
      // Re-thrown so SupporterForm keeps the entered values instead of resetting.
      throw error;
    }
  }

  return { handleCreateSupporter };
}
