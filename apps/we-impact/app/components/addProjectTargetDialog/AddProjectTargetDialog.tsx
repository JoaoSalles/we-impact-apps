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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/dataTable/DataTable";

import { createProjectSearchColumns } from "./columns";
import { useCreateCampaignTarget, useSearchProjects } from "./useSearchProjects";

export function AddProjectTargetDialog({ campaignId }: { campaignId: string }) {
  const [open, setOpen] = useState(false);
  const { items, hasNext, pageNumber, loading, error, filters, setTitle, setState, goToPage } =
    useSearchProjects(open);
  const create = useCreateCampaignTarget(campaignId);

  const handleAssociate = async (projectId: string) => {
    try {
      await create.mutateAsync(projectId);
      toast.success("Project associated");
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to associate project",
      );
    }
  };

  const columns = createProjectSearchColumns(handleAssociate);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Add project</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add project</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="filter-project-title">Title:</Label>
            <Input
              id="filter-project-title"
              placeholder="Title"
              value={filters.title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filter-project-state">State:</Label>
            <Input
              id="filter-project-state"
              placeholder="State"
              value={filters.state}
              onChange={(event) => setState(event.target.value)}
            />
          </div>
        </div>

        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : loading ? (
          <div className="space-y-2">
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
      </DialogContent>
    </Dialog>
  );
}
