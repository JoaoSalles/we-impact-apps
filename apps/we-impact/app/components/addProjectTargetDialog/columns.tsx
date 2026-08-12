import type { ColumnDef } from "@tanstack/react-table";

import type { ProjectSearchResult } from "@/api/institution-api";
import { Button } from "@/components/ui/button";

/** Builds the search-results columns, wiring the Associate action to `onAssociate`. */
export function createProjectSearchColumns(
  onAssociate: (projectId: string) => void | Promise<void>,
): ColumnDef<ProjectSearchResult>[] {
  return [
    { accessorKey: "title", header: "Title" },
    {
      id: "institution",
      header: "Institution",
      cell: ({ row }) => {
        const { institutionName, institutionState } = row.original;
        return institutionState
          ? `${institutionName} (${institutionState})`
          : institutionName;
      },
    },
    {
      id: "goal",
      header: "Goal",
      cell: ({ row }) => {
        const { currentGoal, goal } = row.original;
        const target = goal === null ? "—" : goal.toLocaleString();
        return `${(currentGoal / 100).toLocaleString()} / ${target}`;
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="text-right">
          <Button size="sm" onClick={() => onAssociate(row.original.id)}>
            Associate
          </Button>
        </div>
      ),
    },
  ];
}
