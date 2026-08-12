import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/dataTable/DataTable";

import { createCampaignTargetColumns } from "./columns";
import { useCampaignTargetList, useDeleteCampaignTarget } from "./useCampaignTargetList";

export function CampaignTargetList({ campaignId }: { campaignId: string }) {
  const { items, hasNext, pageNumber, loading, error, goToPage } =
    useCampaignTargetList(campaignId);
  const deleteTarget = useDeleteCampaignTarget(campaignId);

  const handleRemove = async (projectId: string) => {
    try {
      await deleteTarget.mutateAsync(projectId);
      toast.success("Project removed");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to remove project",
      );
      throw error;
    }
  };

  const columns = createCampaignTargetColumns(handleRemove);

  return (
    <div className="space-y-4">
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : loading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <DataTable columns={columns} data={items} emptyMessage="No projects found" />
      )}

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Page {pageNumber + 1}</span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pageNumber === 0}
            onClick={() => goToPage(pageNumber - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasNext}
            onClick={() => goToPage(pageNumber + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
