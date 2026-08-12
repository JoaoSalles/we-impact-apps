import type { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";

import type { CampaignTarget } from "@/api/supporter-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirmDialog/ConfirmDialog";

/** Builds the target table's columns, wiring the Remove action to `onRemove`. */
export function createCampaignTargetColumns(
  onRemove: (projectId: string) => void | Promise<void>,
): ColumnDef<CampaignTarget>[] {
  return [
    { accessorKey: "projectTitle", header: "Title" },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) =>
        row.original.projectStatus ? (
          <Badge>Active</Badge>
        ) : (
          <Badge variant="secondary">Inactive</Badge>
        ),
    },
    {
      id: "currentAmount",
      header: "Current amount",
      cell: ({ row }) => (row.original.currentAmount / 100).toLocaleString(),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="text-right">
          <ConfirmDialog
            trigger={
              <Button variant="ghost" size="icon" aria-label="Remove project">
                <Trash2 />
              </Button>
            }
            title="Remove project"
            description={`Remove "${row.original.projectTitle}" from this campaign?`}
            onConfirm={() => onRemove(row.original.projectId)}
          />
        </div>
      ),
    },
  ];
}
